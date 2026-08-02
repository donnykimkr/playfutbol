const port = Number(process.env.CDP_PORT ?? "9225");
const targets = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json());
const target = targets.find((item) => item.type === "page" && item.url.includes(process.argv[2] ?? "localhost:3100"));
if (!target) throw new Error("No matching browser target");
const socket = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});
const result = await new Promise((resolve, reject) => {
  const requestId = ++id;
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id !== requestId) return;
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result.result.value);
  });
  socket.send(JSON.stringify({
    id: requestId,
    method: "Runtime.evaluate",
    params: {
      expression: "Object.fromEntries(Object.entries(document.querySelector('canvas')?.dataset ?? {}).filter(([key]) => /(trajectory|header|passInput|tackleTest)/i.test(key)))",
      returnByValue: true,
    },
  }));
});
console.log(JSON.stringify(result, null, 2));
socket.close();
