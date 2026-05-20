"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { ChevronLeft, ChevronRight, Gem, Medal, Play, RotateCcw, Trophy } from "lucide-react";
import { getSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

type GameState = "start" | "playing" | "gameOver" | "complete";
type Row = { index: number; lanes: number[] };
type Obstacle = { row: number; lane: number; shift: number; speed: number };
type GemItem = { row: number; lane: number; id: string };
type Level = {
  id: number;
  length: number;
  rows: Row[];
  obstacles: Obstacle[];
  gems: GemItem[];
  speed: number;
};
type LeaderboardRow = {
  id: string;
  nickname: string;
  score: number;
  gems: number;
  level: number;
  created_at: string;
};

const LANES = [-1, 0, 1];
const TILE_SIZE = 4;
const LANE_WIDTH = 3.2;
const BALL_Y = 1.1;

function makeLevel(id: number): Level {
  const length = 74 + id * 10;
  const rows: Row[] = [];
  const obstacles: Obstacle[] = [];
  const gems: GemItem[] = [];

  for (let index = 0; index <= length; index += 1) {
    const lanes = [...LANES];
    if (index > 8 && index < length - 5 && index % (7 - Math.min(id, 3)) === 0) {
      const holeLane = LANES[(index + id) % LANES.length];
      lanes.splice(lanes.indexOf(holeLane), 1);
    }
    if (index > 14 && index % 11 === 3) {
      obstacles.push({
        row: index,
        lane: LANES[(index + 1) % LANES.length],
        shift: index * 0.6,
        speed: 1.1 + id * 0.15,
      });
    }
    if (index > 5 && index < length - 4 && index % 5 === 1) {
      const lane = lanes[(index + id) % lanes.length];
      gems.push({ row: index, lane, id: `${id}-${index}-${lane}` });
    }
    rows.push({ index, lanes });
  }

  return { id, length, rows, obstacles, gems, speed: 13 + id * 1.4 };
}

function laneToX(lane: number) {
  return lane * LANE_WIDTH;
}

function rowToZ(row: number) {
  return -row * TILE_SIZE;
}

function nicknameIsValid(value: string) {
  return /^[a-zA-Z0-9 _-]{2,16}$/.test(value.trim());
}

function scoreIsValid(value: number) {
  return Number.isInteger(value) && value > 0;
}

export function NeonRunnerGame() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    ball: THREE.Mesh;
    obstacleMeshes: THREE.Mesh[];
    gemMeshes: Map<string, THREE.Mesh>;
    frame: number;
    lastTime: number;
  } | null>(null);
  const runtimeRef = useRef({
    state: "start" as GameState,
    lane: 0,
    targetLane: 0,
    progress: 0,
    gems: new Set<string>(),
    score: 0,
    levelId: 1,
  });
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const [gameState, setGameState] = useState<GameState>("start");
  const [levelId, setLevelId] = useState(1);
  const [progress, setProgress] = useState(0);
  const [gemsCollected, setGemsCollected] = useState(0);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [nickname, setNickname] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  const level = useMemo(() => makeLevel(levelId), [levelId]);
  const gemIds = useMemo(() => new Set(level.gems.map((gem) => gem.id)), [level.gems]);

  const syncState = useCallback((next: GameState) => {
    runtimeRef.current.state = next;
    setGameState(next);
  }, []);

  const moveLane = useCallback((direction: -1 | 1) => {
    const runtime = runtimeRef.current;
    if (runtime.state !== "playing") return;
    runtime.targetLane = Math.max(-1, Math.min(1, runtime.targetLane + direction));
  }, []);

  const resetRun = useCallback(
    (nextLevel = levelId) => {
      runtimeRef.current = {
        state: "playing",
        lane: 0,
        targetLane: 0,
        progress: 0,
        gems: new Set<string>(),
        score: 0,
        levelId: nextLevel,
      };
      setLevelId(nextLevel);
      setProgress(0);
      setGemsCollected(0);
      setScore(0);
      setSaveStatus("");
      setTimeout(() => syncState("playing"), 0);
    },
    [levelId, syncState],
  );

  const fetchLeaderboard = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data } = await supabase
      .from("leaderboard")
      .select("id,nickname,score,gems,level,created_at")
      .order("score", { ascending: false })
      .limit(10);
    setLeaderboard((data ?? []) as LeaderboardRow[]);
  }, []);

  const saveScore = useCallback(async () => {
    const cleanName = nickname.trim();
    if (!nicknameIsValid(cleanName)) {
      setSaveStatus("Nickname must be 2-16 letters, numbers, spaces, _ or -.");
      return;
    }
    if (!scoreIsValid(score)) {
      setSaveStatus("Finish a run with a positive score first.");
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setSaveStatus("Leaderboard is disabled until NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are added.");
      return;
    }
    setSaveStatus("Saving...");
    const { error } = await supabase.from("leaderboard").insert({
      nickname: cleanName,
      score,
      gems: gemsCollected,
      level: levelId,
    });
    if (error) {
      setSaveStatus(error.message);
      return;
    }
    setSaveStatus("Saved to leaderboard.");
    await fetchLeaderboard();
  }, [fetchLeaderboard, gemsCollected, levelId, nickname, score]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchLeaderboard();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchLeaderboard]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#05060d");
    scene.fog = new THREE.Fog("#05060d", 18, 120);

    const camera = new THREE.PerspectiveCamera(58, mount.clientWidth / mount.clientHeight, 0.1, 400);
    camera.position.set(0, 12, 15);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight("#d8f7ff", 1.1);
    const key = new THREE.DirectionalLight("#ffffff", 2.2);
    key.position.set(8, 18, 10);
    scene.add(ambient, key);

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.78, 32, 32),
      new THREE.MeshStandardMaterial({ color: "#c7ff37", emissive: "#5f7f05", metalness: 0.25, roughness: 0.25 }),
    );
    ball.position.set(0, BALL_Y, 0);
    scene.add(ball);

    const finish = new THREE.Mesh(
      new THREE.BoxGeometry(12, 0.28, 0.8),
      new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#37f3ff", emissiveIntensity: 1.6 }),
    );
    finish.position.set(0, 0.08, rowToZ(level.length + 1));
    scene.add(finish);

    const tileMaterial = new THREE.MeshStandardMaterial({
      color: "#10192f",
      emissive: "#07324c",
      roughness: 0.55,
      metalness: 0.18,
    });
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: "#25e7ff",
      emissive: "#11bfe0",
      emissiveIntensity: 0.75,
    });
    level.rows.forEach((row) => {
      row.lanes.forEach((lane) => {
        const tile = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.3, 3.7), tileMaterial);
        tile.position.set(laneToX(lane), 0, rowToZ(row.index));
        scene.add(tile);
        const strip = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.04, 0.1), edgeMaterial);
        strip.position.set(laneToX(lane), 0.18, rowToZ(row.index) + 1.78);
        scene.add(strip);
      });
    });

    const obstacleMeshes = level.obstacles.map((obstacle) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.45, 1.45, 1.45),
        new THREE.MeshStandardMaterial({ color: "#ff3864", emissive: "#9e1030", emissiveIntensity: 0.9 }),
      );
      mesh.position.set(laneToX(obstacle.lane), 0.95, rowToZ(obstacle.row));
      scene.add(mesh);
      return mesh;
    });

    const gemMeshes = new Map<string, THREE.Mesh>();
    level.gems.forEach((gem) => {
      const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.48),
        new THREE.MeshStandardMaterial({ color: "#66ffd9", emissive: "#1edeb8", emissiveIntensity: 1.2 }),
      );
      mesh.position.set(laneToX(gem.lane), 1.1, rowToZ(gem.row));
      scene.add(mesh);
      gemMeshes.set(gem.id, mesh);
    });

    sceneRef.current = { renderer, scene, camera, ball, obstacleMeshes, gemMeshes, frame: 0, lastTime: performance.now() };

    const handleResize = () => {
      if (!mount || !sceneRef.current) return;
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      sceneRef.current.camera.aspect = width / height;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    const animate = (time: number) => {
      const active = sceneRef.current;
      if (!active) return;
      const runtime = runtimeRef.current;
      const delta = Math.min((time - active.lastTime) / 1000, 0.04);
      active.lastTime = time;

      if (runtime.state === "playing") {
        runtime.progress += level.speed * delta;
        runtime.lane += (runtime.targetLane - runtime.lane) * Math.min(1, delta * 11);
        const currentRow = Math.round(runtime.progress / TILE_SIZE);
        const row = level.rows[currentRow];
        const lane = Math.round(runtime.lane);

        if (row && !row.lanes.includes(lane)) {
          syncState("gameOver");
        }

        level.gems.forEach((gem) => {
          if (!runtime.gems.has(gem.id) && Math.abs(runtime.progress + rowToZ(gem.row)) < 1.25 && Math.abs(runtime.lane - gem.lane) < 0.45) {
            runtime.gems.add(gem.id);
            active.gemMeshes.get(gem.id)?.scale.setScalar(0.001);
          }
        });

        level.obstacles.forEach((obstacle) => {
          const movingLane = obstacle.lane + Math.sin(time * 0.001 * obstacle.speed + obstacle.shift) * 0.7;
          if (Math.abs(runtime.progress + rowToZ(obstacle.row)) < 1.3 && Math.abs(runtime.lane - movingLane) < 0.55) {
            syncState("gameOver");
          }
        });

        const distanceScore = Math.max(0, Math.floor(runtime.progress * 10));
        runtime.score = distanceScore + runtime.gems.size * 150;
        if (runtime.progress >= level.length * TILE_SIZE) {
          runtime.score += 1000 + level.id * 250;
          syncState("complete");
        }

        setProgress(runtime.progress);
        setGemsCollected(runtime.gems.size);
        setScore(runtime.score);
      }

      active.ball.position.set(laneToX(runtime.lane), BALL_Y, -runtime.progress);
      active.ball.rotation.x -= delta * 7;
      active.camera.position.x += (active.ball.position.x * 0.25 - active.camera.position.x) * 0.06;
      active.camera.position.z += (active.ball.position.z + 15 - active.camera.position.z) * 0.08;
      active.camera.lookAt(active.ball.position.x, 0.5, active.ball.position.z - 12);

      level.obstacles.forEach((obstacle, index) => {
        const mesh = active.obstacleMeshes[index];
        mesh.position.x = laneToX(obstacle.lane + Math.sin(time * 0.001 * obstacle.speed + obstacle.shift) * 0.7);
        mesh.rotation.y += delta * 2.5;
      });
      active.gemMeshes.forEach((mesh, id) => {
        if (!runtime.gems.has(id) && gemIds.has(id)) {
          mesh.rotation.y += delta * 2.8;
          mesh.position.y = 1.1 + Math.sin(time * 0.004) * 0.12;
        }
      });

      active.renderer.render(active.scene, active.camera);
      active.frame = requestAnimationFrame(animate);
    };
    sceneRef.current.frame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      const active = sceneRef.current;
      if (!active) return;
      cancelAnimationFrame(active.frame);
      active.renderer.dispose();
      mount.removeChild(active.renderer.domElement);
      sceneRef.current = null;
    };
  }, [gemIds, level, syncState]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") moveLane(-1);
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") moveLane(1);
      if (event.key === "Enter" && runtimeRef.current.state !== "playing") resetRun(levelId);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [levelId, moveLane, resetRun]);

  const progressPercent = Math.min(100, Math.floor((progress / (level.length * TILE_SIZE)) * 100));
  const canSave = gameState === "complete" || gameState === "gameOver";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05060d] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(38,231,255,0.2),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(199,255,55,0.15),transparent_28%)]" />
      <div ref={mountRef} className="absolute inset-0" aria-label="3D neon tile runner game" />

      <section className="pointer-events-none relative z-10 flex min-h-screen flex-col justify-between p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-normal sm:text-4xl">Skyline Dash</h1>
            <p className="mt-1 text-sm text-cyan-100/75">Level {levelId} · avoid gaps, dodge blocks, collect gems</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <Metric label="Score" value={score} />
            <Metric label="Gems" value={gemsCollected} />
            <Metric label="Run" value={`${progressPercent}%`} />
          </div>
        </div>

        <div className="pointer-events-auto mx-auto mb-5 flex w-full max-w-5xl items-end justify-between gap-3">
          <TouchButton label="Move left" onClick={() => moveLane(-1)}>
            <ChevronLeft size={32} />
          </TouchButton>
          <div className="hidden rounded-md border border-white/10 bg-black/35 px-4 py-3 text-center text-xs text-cyan-100/75 shadow-2xl backdrop-blur sm:block">
            A / Left Arrow · D / Right Arrow
          </div>
          <TouchButton label="Move right" onClick={() => moveLane(1)}>
            <ChevronRight size={32} />
          </TouchButton>
        </div>
      </section>

      <div
        className="absolute inset-0 z-20 sm:hidden"
        onClick={(event) => {
          if (gameState !== "playing") return;
          moveLane(event.clientX < window.innerWidth / 2 ? -1 : 1);
        }}
        onTouchStart={(event) => {
          const touch = event.touches[0];
          touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={(event) => {
          const start = touchStartRef.current;
          const touch = event.changedTouches[0];
          if (!start) return;
          const dx = touch.clientX - start.x;
          if (Math.abs(dx) > 32) moveLane(dx > 0 ? 1 : -1);
          touchStartRef.current = null;
        }}
      />

      {gameState !== "playing" && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-black/58 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-md border border-cyan-300/25 bg-[#080b17]/92 p-5 shadow-[0_0_45px_rgba(37,231,255,0.18)]">
            <div className="mb-4 flex items-center gap-3">
              {gameState === "complete" ? <Trophy className="text-lime-300" /> : <Medal className="text-cyan-300" />}
              <div>
                <h2 className="text-xl font-black">
                  {gameState === "start" && "Ready to roll"}
                  {gameState === "gameOver" && "Run ended"}
                  {gameState === "complete" && "Level complete"}
                </h2>
                <p className="text-sm text-white/65">
                  {gameState === "start" ? "Move between three lanes and stay on the glowing path." : `Score ${score} · ${gemsCollected} gems`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-300 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-200"
                onClick={() => resetRun(gameState === "complete" ? levelId + 1 : levelId)}
              >
                {gameState === "complete" ? <ChevronRight size={18} /> : <Play size={18} />}
                {gameState === "complete" ? "Next level" : "Start"}
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-md border border-white/15 px-4 py-3 font-bold text-white transition hover:bg-white/10"
                onClick={() => resetRun(1)}
              >
                <RotateCcw size={18} />
                Restart
              </button>
            </div>

            <div className="mt-5 border-t border-white/10 pt-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold">
                <Gem size={16} className="text-lime-300" />
                Leaderboard
              </div>
              {!hasSupabaseConfig && (
                <p className="mb-3 text-sm text-amber-200/85">
                  Leaderboard is offline locally. Add Supabase env vars to enable online scores.
                </p>
              )}
              <div className="space-y-2">
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-white/55">No saved scores yet.</p>
                ) : (
                  leaderboard.map((entry, index) => (
                    <div key={entry.id} className="flex items-center justify-between rounded-md bg-white/6 px-3 py-2 text-sm">
                      <span className="truncate">{index + 1}. {entry.nickname}</span>
                      <span className="font-mono text-cyan-100">{entry.score}</span>
                    </div>
                  ))
                )}
              </div>

              {canSave && (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input
                    className="min-w-0 flex-1 rounded-md border border-white/15 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
                    maxLength={16}
                    placeholder="Nickname"
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                  />
                  <button
                    className="rounded-md bg-lime-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!hasSupabaseConfig}
                    onClick={saveScore}
                  >
                    Save score
                  </button>
                </div>
              )}
              {saveStatus && <p className="mt-2 text-xs text-cyan-100/75">{saveStatus}</p>}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="min-w-20 rounded-md border border-white/10 bg-black/35 px-3 py-2 shadow-2xl backdrop-blur">
      <div className="text-[10px] uppercase text-cyan-100/60">{label}</div>
      <div className="font-mono text-lg font-black text-white">{value}</div>
    </div>
  );
}

function TouchButton({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      aria-label={label}
      className="grid h-16 w-16 place-items-center rounded-md border border-cyan-300/25 bg-black/35 text-cyan-100 shadow-2xl backdrop-blur transition hover:bg-cyan-300/15 active:scale-95"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
