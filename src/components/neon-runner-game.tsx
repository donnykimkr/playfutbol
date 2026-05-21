"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import type { User } from "@supabase/supabase-js";
import { ChevronLeft, ChevronRight, Gem, LogOut, Medal, Play, RotateCcw, Trophy, UserCircle } from "lucide-react";
import { getSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

type GameState = "start" | "playing" | "gameOver" | "complete";
type TileKind = "normal" | "falling" | "jump";
type Row = { index: number; lanes: number[]; falling: number[]; jumps: number[] };
type Obstacle = { row: number; lane: number; shift: number; speed: number; range: number };
type GemItem = { row: number; lane: number; id: string };
type Theme = {
  name: string;
  background: string;
  fog: string;
  tile: string;
  tileGlow: string;
  edge: string;
  jump: string;
  jumpGlow: string;
  falling: string;
  fallingGlow: string;
  obstacle: string;
  obstacleGlow: string;
  gem: string;
  gemGlow: string;
  ball: string;
  ballGlow: string;
  overlayA: string;
  overlayB: string;
};
type Level = {
  id: number;
  title: string;
  rows: Row[];
  obstacles: Obstacle[];
  gems: GemItem[];
  speed: number;
  theme: Theme;
};
type LeaderboardRow = {
  id: string;
  nickname: string;
  score: number;
  gems: number;
  level: number;
  created_at: string;
};
type TileMesh = {
  mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  edge: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  row: number;
  lane: number;
  kind: TileKind;
  baseX: number;
  baseY: number;
};

const LANES = [-2, -1, 0, 1, 2];
const MIN_LANE = LANES[0];
const MAX_LANE = LANES[LANES.length - 1];
const TILE_SIZE = 4;
const LANE_WIDTH = 2.8;
const BALL_RADIUS = 0.78;
const BALL_Y = 1.1;
const JUMP_DURATION = 0.86;
const JUMP_HEIGHT = 2.8;
const FALL_DELAY = 0.34;

const THEMES: Theme[] = [
  {
    name: "Aurora Grid",
    background: "#030712",
    fog: "#05101f",
    tile: "#0b1830",
    tileGlow: "#063752",
    edge: "#22d3ee",
    jump: "#143a52",
    jumpGlow: "#38bdf8",
    falling: "#321a2c",
    fallingGlow: "#fb7185",
    obstacle: "#fb3867",
    obstacleGlow: "#9f1239",
    gem: "#a3ff12",
    gemGlow: "#5f7f05",
    ball: "#d9ff4f",
    ballGlow: "#6b8d05",
    overlayA: "rgba(34,211,238,0.20)",
    overlayB: "rgba(163,255,18,0.14)",
  },
  {
    name: "Solar Drift",
    background: "#09050f",
    fog: "#150915",
    tile: "#1d1029",
    tileGlow: "#6d255e",
    edge: "#f59e0b",
    jump: "#32235f",
    jumpGlow: "#a78bfa",
    falling: "#3a140d",
    fallingGlow: "#f97316",
    obstacle: "#34d399",
    obstacleGlow: "#047857",
    gem: "#67e8f9",
    gemGlow: "#0891b2",
    ball: "#ffd166",
    ballGlow: "#b45309",
    overlayA: "rgba(245,158,11,0.18)",
    overlayB: "rgba(167,139,250,0.16)",
  },
  {
    name: "Ion Night",
    background: "#03030a",
    fog: "#080816",
    tile: "#121624",
    tileGlow: "#3730a3",
    edge: "#e879f9",
    jump: "#073b3a",
    jumpGlow: "#2dd4bf",
    falling: "#3a1029",
    fallingGlow: "#f43f5e",
    obstacle: "#facc15",
    obstacleGlow: "#a16207",
    gem: "#60a5fa",
    gemGlow: "#1d4ed8",
    ball: "#f0abfc",
    ballGlow: "#a21caf",
    overlayA: "rgba(232,121,249,0.18)",
    overlayB: "rgba(45,212,191,0.14)",
  },
];

const LEVEL_PATTERNS = [
  [
    ".....", ".....", ".....", ".....", ".....", "..G..", ".....", ".G.G.", ".....", " .G. ",
    ".....", "..J..", "     ", "..G..", ".....", "F...F", ".....", ".G.G.", ".....", ".. ..",
    ".....", ".F.F.", ".....", "G...G", ".....", " . . ", ".....", "..J..", "     ", ".G.G.",
    ".....", "F.F.F", ".....", ".G.G.", ".....", ".. ..", ".....", ".F.F.", ".....", "..J..",
    "     ", "G...G", ".....", " .G. ", ".....", "F...F", ".....", ".G.G.", ".....", ".....",
    ".....", ".....",
  ],
  [
    ".....", ".....", ".....", "..G..", ".....", ". . .", ".....", "F.G.F", ".....", "..J..",
    "     ", " .G. ", ".....", "F...F", ".G.G.", ".....", " .. .", ".....", ".F.F.", "G...G",
    ".....", "..J..", "     ", "G...G", ".....", "F.F.F", ".....", ".G.G.", " . . ", ".....",
    ".F.F.", ".....", "..G..", "F...F", ".....", "..J..", "     ", ".G.G.", ".....", "F.F.F",
    ".....", "G...G", ". . .", ".....", ".F.F.", "..G..", ".....", "..J..", "     ", "G...G",
    ".....", "F.F.F", ".....", ".G.G.", ".....", ".....",
  ],
  [
    ".....", ".....", "..G..", ".....", ".F.F.", " .. .", ".....", "G.F.G", ".....", "..J..",
    "     ", ".G.G.", "F...F", ".....", " . . ", "G...G", ".F.F.", ".....", "..J..", "     ",
    "..G..", "F.F.F", ".....", ". . .", ".....", "G.F.G", ".....", "..J..", "     ", "G...G",
    ".F.F.", ".....", " .. .", ".G.G.", "F...F", ".....", "..J..", "     ", "..G..", "F.F.F",
    ".....", "G...G", " . . ", ".....", ".F.F.", "G.F.G", ".....", "..J..", "     ", ".G.G.",
    "F...F", ".....", " . . ", "G...G", ".F.F.", ".....", ".....", ".....",
  ],
];

const OBSTACLES: Obstacle[][] = [
  [
    { row: 18, lane: 0, shift: 0.4, speed: 1.1, range: 0.75 },
    { row: 34, lane: 1, shift: 1.8, speed: 1.2, range: 0.7 },
    { row: 47, lane: -1, shift: 2.6, speed: 1.25, range: 0.8 },
  ],
  [
    { row: 12, lane: 0, shift: 0.2, speed: 1.25, range: 0.9 },
    { row: 24, lane: -1, shift: 1.7, speed: 1.35, range: 0.95 },
    { row: 37, lane: 1, shift: 2.8, speed: 1.45, range: 1.0 },
    { row: 50, lane: 0, shift: 3.4, speed: 1.55, range: 1.05 },
  ],
  [
    { row: 9, lane: 0, shift: 0.6, speed: 1.45, range: 1.05 },
    { row: 17, lane: -1, shift: 1.2, speed: 1.55, range: 1.1 },
    { row: 27, lane: 1, shift: 2.1, speed: 1.65, range: 1.12 },
    { row: 39, lane: 0, shift: 2.9, speed: 1.75, range: 1.18 },
    { row: 51, lane: -1, shift: 3.5, speed: 1.85, range: 1.2 },
  ],
];

function buildLevel(id: number): Level {
  const pattern = LEVEL_PATTERNS[id - 1] ?? LEVEL_PATTERNS[LEVEL_PATTERNS.length - 1];
  const rows: Row[] = [];
  const gems: GemItem[] = [];

  pattern.forEach((line, index) => {
    const lanes: number[] = [];
    const falling: number[] = [];
    const jumps: number[] = [];

    [...line.padEnd(5, " ").slice(0, 5)].forEach((cell, cellIndex) => {
      if (cell === " ") return;
      const lane = LANES[cellIndex];
      lanes.push(lane);
      if (cell === "F") falling.push(lane);
      if (cell === "J") jumps.push(lane);
      if (cell === "G") gems.push({ row: index, lane, id: `${id}-${index}-${lane}` });
    });

    rows.push({ index, lanes, falling, jumps });
  });

  return {
    id,
    title: THEMES[id - 1]?.name ?? THEMES[THEMES.length - 1].name,
    rows,
    gems,
    obstacles: OBSTACLES[id - 1] ?? OBSTACLES[OBSTACLES.length - 1],
    speed: 11.7 + id * 1.25,
    theme: THEMES[id - 1] ?? THEMES[THEMES.length - 1],
  };
}

const LEVEL_COUNT = LEVEL_PATTERNS.length;

function laneToX(lane: number) {
  return lane * LANE_WIDTH;
}

function rowToZ(row: number) {
  return -row * TILE_SIZE;
}

function tileKey(row: number, lane: number) {
  return `${row}:${lane}`;
}

function nicknameIsValid(value: string) {
  return /^[a-zA-Z0-9 _-]{2,16}$/.test(value.trim());
}

function scoreIsValid(value: number) {
  return Number.isInteger(value) && value > 0;
}

function makeMaterial(color: string, emissive: string, emissiveIntensity = 0.7) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity,
    roughness: 0.52,
    metalness: 0.18,
  });
}

export function NeonRunnerGame() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    ball: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;
    obstacleMeshes: THREE.Mesh[];
    gemMeshes: Map<string, THREE.Mesh>;
    tileMeshes: Map<string, TileMesh>;
    frame: number;
    lastTime: number;
  } | null>(null);
  const runtimeRef = useRef({
    state: "start" as GameState,
    lane: 0,
    targetLane: 0,
    progress: 0,
    gems: new Set<string>(),
    jumped: new Set<string>(),
    fallingStarted: new Map<string, number>(),
    fallen: new Set<string>(),
    score: 0,
    levelId: 1,
    jumpStart: -1,
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
  const [user, setUser] = useState<User | null>(null);
  const [authStatus, setAuthStatus] = useState("");

  const level = useMemo(() => buildLevel(levelId), [levelId]);
  const gemIds = useMemo(() => new Set(level.gems.map((gem) => gem.id)), [level.gems]);

  const syncState = useCallback((next: GameState) => {
    runtimeRef.current.state = next;
    setGameState(next);
  }, []);

  const moveLane = useCallback((direction: -1 | 1) => {
    const runtime = runtimeRef.current;
    if (runtime.state !== "playing") return;
    runtime.targetLane = Math.max(MIN_LANE, Math.min(MAX_LANE, runtime.targetLane + direction));
  }, []);

  const resetRun = useCallback(
    (nextLevel = levelId) => {
      const boundedLevel = Math.max(1, Math.min(LEVEL_COUNT, nextLevel));
      runtimeRef.current = {
        state: "playing",
        lane: 0,
        targetLane: 0,
        progress: 0,
        gems: new Set<string>(),
        jumped: new Set<string>(),
        fallingStarted: new Map<string, number>(),
        fallen: new Set<string>(),
        score: 0,
        levelId: boundedLevel,
        jumpStart: -1,
      };
      setLevelId(boundedLevel);
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

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase || typeof window === "undefined") {
      setAuthStatus("Google sign-in needs Supabase env vars.");
      return;
    }
    setAuthStatus("Opening Google sign-in...");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setAuthStatus(error.message);
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSaveStatus("");
    setAuthStatus("Signed out. Playing as Guest.");
  }, []);

  const saveScore = useCallback(async () => {
    if (!user) {
      setSaveStatus("Sign in with Google to upload scores. Guest runs stay local.");
      return;
    }
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
      user_id: user.id,
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
  }, [fetchLeaderboard, gemsCollected, levelId, nickname, score, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchLeaderboard();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchLeaderboard]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return undefined;

    const timer = window.setTimeout(() => {
      void supabase.auth.getSession().then(({ data }) => {
        const sessionUser = data.session?.user ?? null;
        setUser(sessionUser);
        if (sessionUser) {
          const fallbackName = sessionUser.user_metadata?.full_name || sessionUser.email || "Player";
          setNickname((current) => current || String(fallbackName).slice(0, 16));
        }
      });
    }, 0);

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        const fallbackName = sessionUser.user_metadata?.full_name || sessionUser.email || "Player";
        setNickname((current) => current || String(fallbackName).slice(0, 16));
        setAuthStatus("");
      }
    });

    return () => {
      window.clearTimeout(timer);
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(level.theme.background);
    scene.fog = new THREE.Fog(level.theme.fog, 18, 128);

    const camera = new THREE.PerspectiveCamera(58, mount.clientWidth / mount.clientHeight, 0.1, 420);
    camera.position.set(0, 12, 15);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight("#d8f7ff", 1.05);
    const key = new THREE.DirectionalLight("#ffffff", 2.25);
    key.position.set(8, 18, 10);
    scene.add(ambient, key);

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(BALL_RADIUS, 36, 36),
      new THREE.MeshStandardMaterial({
        color: level.theme.ball,
        emissive: level.theme.ballGlow,
        emissiveIntensity: 0.9,
        metalness: 0.25,
        roughness: 0.25,
      }),
    );
    ball.position.set(0, BALL_Y, 0);
    scene.add(ball);

    const finish = new THREE.Mesh(
      new THREE.BoxGeometry(15.5, 0.28, 0.8),
      makeMaterial("#ffffff", level.theme.edge, 1.55),
    );
    finish.position.set(0, 0.08, rowToZ(level.rows.length + 1));
    scene.add(finish);

    const tileMeshes = new Map<string, TileMesh>();
    level.rows.forEach((row) => {
      row.lanes.forEach((lane) => {
        const kind: TileKind = row.jumps.includes(lane) ? "jump" : row.falling.includes(lane) ? "falling" : "normal";
        const material =
          kind === "jump"
            ? makeMaterial(level.theme.jump, level.theme.jumpGlow, 1.25)
            : kind === "falling"
              ? makeMaterial(level.theme.falling, level.theme.fallingGlow, 0.95)
              : makeMaterial(level.theme.tile, level.theme.tileGlow, 0.68);
        const tile = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.3, 3.65), material);
        tile.position.set(laneToX(lane), 0, rowToZ(row.index));
        scene.add(tile);

        const edge = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.04, 0.1), makeMaterial(level.theme.edge, level.theme.edge, 0.9));
        edge.position.set(laneToX(lane), 0.18, rowToZ(row.index) + 1.78);
        scene.add(edge);

        if (kind === "jump") {
          const ramp = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.16, 1.05), makeMaterial(level.theme.jumpGlow, level.theme.jumpGlow, 1.2));
          ramp.position.set(laneToX(lane), 0.34, rowToZ(row.index) - 0.35);
          ramp.rotation.x = -0.22;
          scene.add(ramp);
        }

        tileMeshes.set(tileKey(row.index, lane), {
          mesh: tile,
          edge,
          row: row.index,
          lane,
          kind,
          baseX: laneToX(lane),
          baseY: 0,
        });
      });
    });

    const obstacleMeshes = level.obstacles.map((obstacle) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.35, 1.35, 1.35),
        makeMaterial(level.theme.obstacle, level.theme.obstacleGlow, 1),
      );
      mesh.position.set(laneToX(obstacle.lane), 0.95, rowToZ(obstacle.row));
      scene.add(mesh);
      return mesh;
    });

    const gemMeshes = new Map<string, THREE.Mesh>();
    level.gems.forEach((gem) => {
      const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.48),
        makeMaterial(level.theme.gem, level.theme.gemGlow, 1.25),
      );
      mesh.position.set(laneToX(gem.lane), 1.1, rowToZ(gem.row));
      scene.add(mesh);
      gemMeshes.set(gem.id, mesh);
    });

    sceneRef.current = { renderer, scene, camera, ball, obstacleMeshes, gemMeshes, tileMeshes, frame: 0, lastTime: performance.now() };

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

      const jumpElapsed = runtime.jumpStart > 0 ? (time - runtime.jumpStart) / 1000 : Number.POSITIVE_INFINITY;
      const airborne = jumpElapsed < JUMP_DURATION;
      const jumpLift = airborne ? Math.sin((jumpElapsed / JUMP_DURATION) * Math.PI) * JUMP_HEIGHT : 0;
      if (!airborne) runtime.jumpStart = -1;

      if (runtime.state === "playing") {
        runtime.progress += level.speed * delta;
        runtime.lane += (runtime.targetLane - runtime.lane) * Math.min(1, delta * 12);
        const currentRow = Math.round(runtime.progress / TILE_SIZE);
        const row = level.rows[currentRow];
        const lane = Math.round(runtime.lane);

        if (row) {
          const currentKey = tileKey(row.index, lane);
          if (row.jumps.includes(lane) && !runtime.jumped.has(currentKey) && !airborne) {
            runtime.jumped.add(currentKey);
            runtime.jumpStart = time;
          }
          if (row.falling.includes(lane) && !runtime.fallingStarted.has(currentKey)) {
            runtime.fallingStarted.set(currentKey, time);
          }
          if (!airborne && (!row.lanes.includes(lane) || runtime.fallen.has(currentKey))) {
            syncState("gameOver");
          }
        } else if (!airborne) {
          syncState("gameOver");
        }

        runtime.fallingStarted.forEach((startedAt, key) => {
          if (time - startedAt > FALL_DELAY * 1000) runtime.fallen.add(key);
        });

        level.gems.forEach((gem) => {
          if (!runtime.gems.has(gem.id) && Math.abs(runtime.progress + rowToZ(gem.row)) < 1.25 && Math.abs(runtime.lane - gem.lane) < 0.45) {
            runtime.gems.add(gem.id);
            active.gemMeshes.get(gem.id)?.scale.setScalar(0.001);
          }
        });

        level.obstacles.forEach((obstacle) => {
          const movingLane = obstacle.lane + Math.sin(time * 0.001 * obstacle.speed + obstacle.shift) * obstacle.range;
          if (!airborne && Math.abs(runtime.progress + rowToZ(obstacle.row)) < 1.25 && Math.abs(runtime.lane - movingLane) < 0.55) {
            syncState("gameOver");
          }
        });

        const distanceScore = Math.max(0, Math.floor(runtime.progress * 10));
        runtime.score = distanceScore + runtime.gems.size * 150;
        if (runtime.progress >= (level.rows.length - 1) * TILE_SIZE) {
          runtime.score += 1000 + level.id * 300;
          syncState("complete");
        }

        setProgress(runtime.progress);
        setGemsCollected(runtime.gems.size);
        setScore(runtime.score);
      }

      active.ball.position.set(laneToX(runtime.lane), BALL_Y + jumpLift, -runtime.progress);
      active.ball.rotation.x -= (level.speed * delta) / BALL_RADIUS;
      active.ball.rotation.z += (runtime.targetLane - runtime.lane) * delta * 2.6;
      active.camera.position.x += (active.ball.position.x * 0.23 - active.camera.position.x) * 0.06;
      active.camera.position.z += (active.ball.position.z + 15 - active.camera.position.z) * 0.08;
      active.camera.lookAt(active.ball.position.x, 0.65, active.ball.position.z - 12);

      level.obstacles.forEach((obstacle, index) => {
        const mesh = active.obstacleMeshes[index];
        mesh.position.x = laneToX(obstacle.lane + Math.sin(time * 0.001 * obstacle.speed + obstacle.shift) * obstacle.range);
        mesh.rotation.y += delta * 2.5;
        mesh.rotation.x += delta * 1.2;
      });
      active.gemMeshes.forEach((mesh, id) => {
        if (!runtime.gems.has(id) && gemIds.has(id)) {
          mesh.rotation.y += delta * 2.8;
          mesh.position.y = 1.1 + Math.sin(time * 0.004) * 0.12;
        }
      });
      active.tileMeshes.forEach((tile, key) => {
        const startedAt = runtime.fallingStarted.get(key);
        const isFallen = runtime.fallen.has(key);
        if (tile.kind === "falling" && startedAt && !isFallen) {
          const shake = Math.sin(time * 0.08) * 0.08;
          tile.mesh.position.x = tile.baseX + shake;
          tile.edge.position.x = tile.baseX + shake;
          tile.mesh.material.color.set(level.theme.obstacle);
          tile.mesh.material.emissive.set(level.theme.fallingGlow);
        } else {
          tile.mesh.position.x += (tile.baseX - tile.mesh.position.x) * 0.18;
          tile.edge.position.x += (tile.baseX - tile.edge.position.x) * 0.18;
        }
        if (isFallen) {
          tile.mesh.position.y -= delta * 10;
          tile.edge.position.y -= delta * 10;
          tile.mesh.rotation.z += delta * 2.4;
          tile.edge.visible = false;
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
      active.scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const material = object.material;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else material.dispose();
      });
      active.renderer.dispose();
      mount.removeChild(active.renderer.domElement);
      sceneRef.current = null;
    };
  }, [gemIds, level, syncState]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const code = event.code;
      if (key === "arrowleft" || key === "a" || code === "KeyA") {
        event.preventDefault();
        moveLane(-1);
      }
      if (key === "arrowright" || key === "d" || code === "KeyD") {
        event.preventDefault();
        moveLane(1);
      }
      if (event.key === "Enter" && runtimeRef.current.state !== "playing") resetRun(levelId);
    };
    window.addEventListener("keydown", onKeyDown, { passive: false, capture: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true });
    };
  }, [levelId, moveLane, resetRun]);

  const progressPercent = Math.min(100, Math.floor((progress / ((level.rows.length - 1) * TILE_SIZE)) * 100));
  const canSave = gameState === "complete" || gameState === "gameOver";
  const playerLabel = user?.user_metadata?.full_name || user?.email || "Guest";
  const nextLevel = Math.min(levelId + 1, LEVEL_COUNT);
  const finishedFinalLevel = gameState === "complete" && levelId === LEVEL_COUNT;

  return (
    <main className="relative min-h-screen overflow-hidden text-white" style={{ backgroundColor: level.theme.background }}>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 20% 10%, ${level.theme.overlayA}, transparent 32%), radial-gradient(circle at 80% 0%, ${level.theme.overlayB}, transparent 28%)`,
        }}
      />
      <div ref={mountRef} className="absolute inset-0" aria-label="3D neon five-lane tile runner game" />

      <section className="pointer-events-none relative z-10 flex min-h-screen flex-col justify-between p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-normal sm:text-4xl">Skyline Dash</h1>
            <p className="mt-1 text-sm text-cyan-100/75">
              Level {levelId} · {level.title} · 5 lanes
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <Metric label="Score" value={score} />
              <Metric label="Gems" value={gemsCollected} />
              <Metric label="Run" value={`${progressPercent}%`} />
            </div>
            <div className="pointer-events-auto flex min-w-48 max-w-full items-center gap-2 rounded-md border border-white/10 bg-black/35 px-3 py-2 shadow-2xl backdrop-blur">
              <UserCircle size={18} className="shrink-0 text-cyan-200" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-white">{playerLabel}</div>
                <div className="text-[10px] uppercase text-cyan-100/55">{user ? "Signed in" : "Guest mode"}</div>
              </div>
              {user ? (
                <button
                  aria-label="Sign out"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/10 text-cyan-100 transition hover:bg-white/10"
                  onClick={signOut}
                >
                  <LogOut size={15} />
                </button>
              ) : (
                <button
                  className="shrink-0 rounded-md bg-white px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!hasSupabaseConfig}
                  onClick={signInWithGoogle}
                >
                  Sign in with Google
                </button>
              )}
            </div>
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
                  {gameState === "complete" && (finishedFinalLevel ? "Final level clear" : "Level complete")}
                </h2>
                <p className="text-sm text-white/65">
                  {gameState === "start"
                    ? "Move across five lanes, hit jump blocks, and watch for falling tiles."
                    : `Score ${score} · ${gemsCollected} gems`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-300 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-200"
                onClick={() => resetRun(gameState === "complete" ? nextLevel : levelId)}
              >
                {gameState === "complete" && !finishedFinalLevel ? <ChevronRight size={18} /> : <Play size={18} />}
                {gameState === "complete" && !finishedFinalLevel ? "Next level" : "Start"}
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
              {hasSupabaseConfig && !user && (
                <p className="mb-3 text-sm text-cyan-100/75">Playing as Guest. Sign in with Google to upload leaderboard scores.</p>
              )}
              {authStatus && <p className="mb-3 text-sm text-cyan-100/75">{authStatus}</p>}
              <div className="space-y-2">
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-white/55">No saved scores yet.</p>
                ) : (
                  leaderboard.map((entry, index) => (
                    <div key={entry.id} className="flex items-center justify-between rounded-md bg-white/6 px-3 py-2 text-sm">
                      <span className="truncate">
                        {index + 1}. {entry.nickname}
                      </span>
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
                    disabled={!hasSupabaseConfig || !user}
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
