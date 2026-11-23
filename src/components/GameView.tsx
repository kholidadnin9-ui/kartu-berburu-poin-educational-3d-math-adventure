"use client";
import { useEffect, useRef, useState } from "react";
import {
  Pause,
  Play,
  ScanLine,
  ArrowUp,
  Flag,
  MapPin,
  ChevronRight,
  DoorOpen,
  Settings as Cog,
  Home,
  RotateCcw,
  Star,
  Keyboard,
  ArrowRight,
  Hand,
  Footprints,
  Check,
  Gamepad2,
  ShieldCheck,
} from "lucide-react";
import { useGame } from "@/lib/store";
import {
  MISSIONS,
  WORLDS,
  collect,
  complete,
  startRun,
  nextMission,
} from "@/lib/game";
import { sound } from "@/lib/audio";
import { AdventureSim, type Inputs } from "@/game/simulation";
import { fallbackRenderer } from "@/game/render2d";
import { Avatar, GameArt, Modal } from "./UI";
import CardStation from "./CardStation";
import Settings from "./Settings";
export default function GameView({
  onExit,
  suspended = false,
}: {
  onExit: () => void;
  suspended?: boolean;
}) {
  const store = useGame(),
    { player, save, updatePlayer, change, notify } = store;
  const run = player.run;
  const latest = useRef(store);
  latest.current = store;
  const host = useRef<HTMLDivElement>(null),
    sim = useRef<AdventureSim | null>(null),
    keys = useRef(new Set<string>()),
    stick = useRef({ x: 0, z: 0 }),
    actions = useRef({ jump: false, interact: false }),
    pausedRef = useRef(false);
  const [pause, setPause] = useState(false),
    [scan, setScan] = useState(false),
    [settings, setSettings] = useState(false),
    [ready, setReady] = useState(false),
    [fallback, setFallback] = useState(false),
    [step, setStep] = useState(0),
    [hint, setHint] = useState(
      "Ikuti arah panah. Lompat ke pulau bintang pertama!",
    ),
    [stickPos, setStickPos] = useState({ x: 0, z: 0 });
  const activeModal = suspended || pause || scan || settings || !!run?.finished;
  pausedRef.current = activeModal;
  const mission = MISSIONS[run?.mission ?? 0],
    world = WORLDS[mission.world];
  useEffect(() => {
    if (!run) {
      onExit();
      return;
    }
    let killed = false,
      frame = 0;
    let engine: { render: () => void; dispose: () => void } | null = null;
    const h = host.current;
    if (!h) return;
    setReady(false);
    setFallback(false);
    setPause(false);
    setScan(false);
    setHint("Ikuti arah panah. Lompat ke pulau bintang pertama!");
    const model = new AdventureSim(run, latest.current.save.settings, {
      collect: (id, star) =>
        latest.current.updatePlayer((p) =>
          collect(p, id, star, latest.current.save.settings),
        ),
      checkpoint: (i) =>
        latest.current.updatePlayer((p) =>
          p.run ? { ...p, run: { ...p.run, checkpoint: i } } : p,
        ),
      challenge: () => {
        keys.current.clear();
        setScan(true);
      },
      finish: () => {
        latest.current.updatePlayer((p) =>
          complete(p, latest.current.save.settings),
        );
        sound("victory");
      },
      message: setHint,
      progress: (i) => setStep(i),
      sound,
    });
    sim.current = model;
    (async () => {
      try {
        const lib = await import("@/game/render3d");
        if (killed) return;
        engine = lib.renderer3d(h, model, latest.current.player.avatar);
      } catch {
        if (killed) return;
        engine = fallbackRenderer(h, model);
        setFallback(true);
      }
      if (killed) {
        engine.dispose();
        return;
      }
      setReady(true);
      let last = performance.now();
      const draw = (time: number) => {
        if (killed) return;
        const dt = (time - last) / 1000;
        last = time;
        model.paused = pausedRef.current || document.hidden;
        const k = keys.current;
        const input: Inputs = {
          x:
            (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0) -
            (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0) +
            stick.current.x,
          z:
            (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0) -
            (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) +
            stick.current.z,
          run:
            k.has("ShiftLeft") ||
            k.has("ShiftRight") ||
            Math.hypot(stick.current.x, stick.current.z) > 0.9,
          ...actions.current,
        };
        actions.current.jump = false;
        actions.current.interact = false;
        model.step(dt, input);
        engine?.render();
        if (h) {
          h.dataset.motion = model.motion;
          h.dataset.position = [model.x, model.y, model.z]
            .map((n) => n.toFixed(2))
            .join(",");
        }
        frame = requestAnimationFrame(draw);
      };
      frame = requestAnimationFrame(draw);
    })();
    const down = (e: KeyboardEvent) => {
      if (pausedRef.current) return;
      if (
        [
          "Space",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
          "KeyE",
          "ShiftLeft",
          "ShiftRight",
          "Escape",
        ].includes(e.code)
      ) {
        e.preventDefault();
        if (!e.repeat && e.code === "Space") actions.current.jump = true;
        if (!e.repeat && e.code === "KeyE") actions.current.interact = true;
        if (e.code === "Escape") {
          keys.current.clear();
          setPause(true);
        }
        keys.current.add(e.code);
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const blur = () => {
      keys.current.clear();
      stick.current = { x: 0, z: 0 };
      setStickPos({ x: 0, z: 0 });
      if (!pausedRef.current) setPause(true);
    };
    const vis = () => {
      if (document.hidden) blur();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", vis);
    return () => {
      killed = true;
      cancelAnimationFrame(frame);
      engine?.dispose();
      sim.current = null;
      keys.current.clear();
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", vis);
    };
    // A renderer is owned by one run, never by a points update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.id]);
  useEffect(() => {
    if (sim.current && run) {
      sim.current.setSolved(run.solved);
      sim.current.settings = save.settings;
      sim.current.pose = scan
        ? "scan"
        : run.finished
          ? "victory"
          : pause
            ? "think"
            : null;
    }
    if (activeModal) {
      keys.current.clear();
      stick.current = { x: 0, z: 0 };
    }
  }, [run, save.settings, scan, pause, activeModal, ready]);
  useEffect(() => {
    if (ready && sim.current && player.safeSteps > 0) {
      sim.current.safeAdvance();
      updatePlayer((p) => ({ ...p, safeSteps: 0 }));
    }
  }, [ready, player.safeSteps, updatePlayer]);
  if (!run) return null;
  const joystick = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    let x = (e.clientX - r.left - r.width / 2) / (r.width * 0.38),
      z = (e.clientY - r.top - r.height / 2) / (r.height * 0.38);
    const l = Math.hypot(x, z);
    if (l > 1) {
      x /= l;
      z /= l;
    }
    stick.current = { x, z };
    setStickPos({ x, z });
  };
  const next = () => {
    if (save.settings.multiplayer && save.players.length > 1) {
      change((s) => {
        const p =
          s.players[
            (s.players.findIndex((p) => p.id === s.active) + 1) %
              s.players.length
          ];
        return {
          ...s,
          active: p.id,
          players: s.players.map((x) =>
            x.id === p.id ? startRun(p, nextMission(p)) : x,
          ),
        };
      });
      notify("Giliran pemain berikutnya!");
    } else if (mission.id < 49)
      updatePlayer((p) => startRun(p, mission.id + 1));
    else onExit();
  };
  return (
    <div className="game-page">
      <div className="game-title">
        <div>
          <span className="overline">
            <MapPin size={13} />
            DUNIA 0{mission.world + 1} <ChevronRight size={12} />
            {world.name.toUpperCase()}
          </span>
          <h1>{mission.name}</h1>
        </div>
        <button className="btn light" onClick={() => setPause(true)}>
          <Pause size={16} />
          Jeda
        </button>
      </div>
      <div className="game-arena">
        <div className="game-hud">
          <span className="hud-player">
            <Avatar size={30} variant={player.avatar} />
            {player.name}
          </span>
          <span>
            <GameArt kind="coin" size={23} />
            {player.points}
          </span>
          <span>
            <GameArt kind="star" size={23} />
            {player.stars}
          </span>
          <span>
            <GameArt kind="bonus" size={23} />
            {player.bonuses}/3
          </span>
          <span className="hud-mission">
            <Flag size={15} />
            Misi {mission.number}/10
          </span>
        </div>
        <div className="render-host" ref={host} />
        {!ready && (
          <div className="game-loading">
            <Avatar size={72} />
            <h3>Menyiapkan pulau…</h3>
            <span className="loader-line" />
          </div>
        )}
        {fallback && (
          <span className="fallback-label">Mode ringan · isometrik</span>
        )}
        <div className="game-controls">
          <div
            className="joystick"
            role="group"
            aria-label="Joystick gerak"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              joystick(e);
            }}
            onPointerMove={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) joystick(e);
            }}
            onPointerUp={(e) => {
              e.currentTarget.releasePointerCapture(e.pointerId);
              stick.current = { x: 0, z: 0 };
              setStickPos({ x: 0, z: 0 });
            }}
            onPointerCancel={() => {
              stick.current = { x: 0, z: 0 };
              setStickPos({ x: 0, z: 0 });
            }}
          >
            <i
              style={{
                transform: `translate(${stickPos.x * 25}px,${stickPos.z * 25}px)`,
              }}
            />
            <span>✣</span>
          </div>
          <div className="touch-actions">
            <button
              className="jump-control"
              aria-label="Lompat"
              onPointerDown={(e) => {
                e.preventDefault();
                actions.current.jump = true;
              }}
            >
              <ArrowUp size={24} />
              <small>Lompat</small>
            </button>
            <button
              className="interact-control"
              aria-label="Interaksi"
              onClick={() => {
                actions.current.interact = true;
              }}
            >
              <Hand size={18} />
            </button>
          </div>
        </div>
        <button className="arena-scan" onClick={() => setScan(true)}>
          <ScanLine size={17} />
          Scan Kartu
        </button>
      </div>
      <div className="mission-status">
        <div className="objective">
          <span className="tool-bubble amber">
            <Flag size={21} />
          </span>
          <div>
            <span className="overline">TUJUAN MISI</span>
            <p>{mission.goal}</p>
          </div>
        </div>
        <div className="target-pills">
          <span>
            <Star size={14} />
            {run.collected.filter((x) => x.startsWith("star")).length}/
            {mission.target}
          </span>
          <span>
            {run.solved ? <Check size={14} /> : <ScanLine size={14} />}{" "}
            {run.solved ? "Gerbang aktif" : "Kunci kartu"}
          </span>
        </div>
        <div className="progress-track">
          <i style={{ width: (step / (mission.platforms - 1)) * 100 + "%" }} />
        </div>
      </div>
      <div className="game-hint" role="status">
        <Avatar size={27} />
        {hint}
      </div>
      <div className="keyboard-guide">
        <Keyboard size={18} />
        <span>
          <kbd>W A S D</kbd> Bergerak
        </span>
        <span>
          <kbd>Spasi</kbd> Lompat
        </span>
        <span>
          <kbd>Shift</kbd> Berlari
        </span>
        <span>
          <kbd>E</kbd> Interaksi
        </span>
        <span>
          <kbd>Esc</kbd> Jeda
        </span>
      </div>
      {scan && (
        <CardStation
          mission={mission.id}
          onClose={() => setScan(false)}
          onSolved={() => sim.current?.setSolved(true)}
          onPose={(pose) => {
            if (sim.current) sim.current.pose = pose;
          }}
        />
      )}
      {pause && !settings && !scan && !run.finished && (
        <Modal
          title="Istirahat sebentar"
          eyebrow="PETUALANGAN DIJEDA"
          onClose={() => setPause(false)}
        >
          <div className="pause-avatar">
            <Avatar size={84} />
            <p>Number Bot menunggumu. Checkpoint dan poin sudah tersimpan.</p>
          </div>
          <div className="stack-actions">
            <button className="btn primary" onClick={() => setPause(false)}>
              <Play size={16} fill="currentColor" />
              Lanjutkan Bermain
            </button>
            <button className="btn light" onClick={() => setSettings(true)}>
              <Cog size={16} />
              Pengaturan
            </button>
            <button
              className="btn light"
              onClick={() => {
                sim.current?.teleport(run.checkpoint);
                setPause(false);
              }}
            >
              <Footprints size={16} />
              Kembali ke checkpoint
            </button>
            <button className="text-button" onClick={onExit}>
              <Home size={16} />
              Kembali ke Beranda
            </button>
          </div>
        </Modal>
      )}
      {settings && (
        <Modal
          title="Pengaturan"
          eyebrow="PERALATAN PENJELAJAH"
          onClose={() => setSettings(false)}
        >
          <Settings onDone={() => setSettings(false)} />
        </Modal>
      )}
      {run.finished && (
        <Modal
          title="Misi Selesai!"
          eyebrow="BINTANG PRESTASI"
          onClose={onExit}
        >
          <div className="result-panel">
            <div className="result-medal">
              <GameArt kind="star" size={88} />
            </div>
            <h3>Hebat, {player.name}!</h3>
            <p>
              {mission.name} telah selesai. Satu langkah lebih dekat ke Sky
              Portal.
            </p>
            <div className="result-stats">
              <div>
                <b>+{player.points - run.pointsAtStart}</b>
                <span>Poin misi ini</span>
              </div>
              <div>
                <b>{player.correct - run.correctAtStart}</b>
                <span>Jawaban benar</span>
              </div>
              <div>
                <b>{player.stars - run.starsAtStart}</b>
                <span>Energy Stars</span>
              </div>
            </div>
            <p className="fineprint">
              <ShieldCheck size={14} />
              Total {player.points} poin · Progres tersimpan
            </p>
            <button className="btn primary full" onClick={next}>
              {save.settings.multiplayer ? "Giliran Berikutnya" : "Lanjutkan"}
              <ArrowRight size={16} />
            </button>
            <div className="action-row equal">
              <button
                className="btn light"
                onClick={() =>
                  updatePlayer((p) => startRun({ ...p, run: null }, mission.id))
                }
              >
                <RotateCcw size={15} />
                Ulangi
              </button>
              <button className="btn light" onClick={onExit}>
                <DoorOpen size={15} />
                Beranda
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
