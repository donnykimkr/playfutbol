const [url, waitSeconds = "8", mode = "diagnostics"] = process.argv.slice(2);
const port = Number(process.env.CDP_PORT ?? "9225");
if (!url) throw new Error("Usage: node scripts/cdp-gameplay-test.mjs <url> [waitSeconds] [mode]");

const target = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: "PUT" }).then((response) => response.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
let nextId = 1;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id) return;
  const callback = pending.get(message.id);
  if (!callback) return;
  pending.delete(message.id);
  if (message.error) callback.reject(new Error(message.error.message));
  else callback.resolve(message.result);
});
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = nextId++;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  return result.result?.value;
};
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const dispatchKey = (type, key, code) => send("Input.dispatchKeyEvent", { type, key, code, windowsVirtualKeyCode: key.startsWith("Arrow") ? { ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40 }[key] : key.charCodeAt(0) });

await send("Runtime.enable");
await send("Page.enable");
await send("Page.bringToFront");
await sleep(850);
await evaluate(`(() => {
  const kickoff = [...document.querySelectorAll('button')].find((button) => button.textContent?.trim().toLowerCase() === 'kickoff');
  if (kickoff) kickoff.click();
  return Boolean(kickoff);
})()`);
await sleep(1800);

const manualSamples = [];
if (mode === "manual") {
  for (const key of ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]) {
    await dispatchKey("keyDown", key, key);
    await sleep(700);
    manualSamples.push(await evaluate(`(() => {
      const canvas = document.querySelector('canvas');
      return { key: ${JSON.stringify(key)}, id: canvas?.dataset.controlledPlayerId, x: canvas?.dataset.controlledPlayerX, z: canvas?.dataset.controlledPlayerZ, vx: canvas?.dataset.controlledVelocityX, vz: canvas?.dataset.controlledVelocityZ, aiRole: canvas?.dataset.manualControlledHasAiRole };
    })()`));
    await dispatchKey("keyUp", key, key);
    await sleep(180);
  }
}

await sleep(Math.max(0, Number(waitSeconds) * 1000 - 1800));
const diagnostics = await evaluate(`(() => {
  const canvas = document.querySelector('canvas');
  if (!canvas) return { error: 'no canvas' };
  const keys = [
    'phase','ballState','ballOwner','ballX','ballY','ballZ','fps','rafLoops','sceneNodes','playerCount','colliderCount',
    'aerialReceptionTestsRequested','aerialReceptionTestsRemaining','aerialReceptionTestsPassed','aerialReceptionTestsFailed',
    'aerialFirstTouches','lastAerialFirstTouchType','lastAerialFirstTouchDistance','lastFirstTouchProbeType','lastFirstTouchProbeDistance','lastFirstTouchProbeRadius','aerialReceiverId','aerialReceiverX','aerialReceiverZ','aerialArrivalTime','aerialTouchPlan','aerialLandingX','aerialLandingZ',
    'defensiveDangerPhase','defendersInsideTwelve','outfieldInsideTwentyEight','nearCarrierDefenders','closeCarrierDefenders',
    'primaryPresserId','secondaryCoverId','deepestThreatId','deepestMarkerId','deepestMarkerDistance','deepestMarkerGoalSide',
    'dangerousUnmarkedCount','duplicateMarkCount','unassignedDefenderCount','laneBlockerCount','defensiveRoles','manualControlledHasAiRole',
    'collisionResolutionsThisFrame','maxCollisionCorrection','maxDefenderFrameDisplacement','abnormalMovementClamps','maxDefenderSpeed',
    'tackleTestsRequested','tackleTestsPassed','tackleTestsFailed','possessionClaims','lastReceived'
  ];
  return Object.fromEntries(keys.map((key) => [key, canvas.dataset[key] ?? null]));
})()`);
console.log(JSON.stringify({ url, mode, manualSamples, diagnostics }, null, 2));
await send("Page.close");
socket.close();
process.exit(0);
