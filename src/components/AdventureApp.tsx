"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  House,
  Map,
  Layers3,
  GraduationCap,
  Settings as Cog,
  ChevronDown,
  Check,
  ShieldCheck,
  WifiOff,
  BookOpen,
  ArrowRight,
  Gamepad2,
  Menu,
  X,
} from "lucide-react";
import { GameProvider, useGame } from "@/lib/store";
import { nextMission } from "@/lib/game";
import { audioSettings, sound } from "@/lib/audio";
import { Brand, Avatar, Modal } from "./UI";
import { Lobby, WorldMap, Help } from "./Lobby";
import PlayerPanel from "./PlayerPanel";
import Collection from "./Collection";
import Settings from "./Settings";
const CardStation = dynamic(() => import("./CardStation"));
const Teacher = dynamic(() => import("./Teacher"));
const GameView = dynamic(() => import("./GameView"));

type Page = "home" | "worlds" | "cards" | "teacher" | "game";
type Dialog =
  | "start"
  | "profile"
  | "scan"
  | "settings"
  | "help"
  | "teacher"
  | null;
const hashes: Record<Page, string> = {
  home: "beranda",
  worlds: "peta-dunia",
  cards: "koleksi-kartu",
  teacher: "ruang-guru",
  game: "bermain",
};
function Shell() {
  const { save, player, notice, sync, ready } = useGame();
  const [page, setPage] = useState<Page>("home"),
    [dialog, setDialog] = useState<Dialog>(null),
    [world, setWorld] = useState(0),
    [mission, setMission] = useState<number | undefined>(),
    [menu, setMenu] = useState(false),
    [online, setOnline] = useState(true);
  const go = (p: Page) => {
    setPage(p);
    setDialog(null);
    setMenu(false);
    if (typeof window !== "undefined") {
      location.hash = hashes[p];
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };
  useEffect(() => {
    if (!ready) return;
    const route = () => {
      const h = location.hash.slice(1);
      const p =
        (Object.keys(hashes) as Page[]).find((k) => hashes[k] === h) ?? "home";
      setPage(p === "game" && !player.run ? "home" : p);
      setDialog(null);
      setMenu(false);
    };
    route();
    window.addEventListener("hashchange", route);
    return () => window.removeEventListener("hashchange", route);
  }, [ready, !!player.run]);
  useEffect(() => {
    audioSettings(save.settings);
    document.documentElement.classList.toggle(
      "reduce-motion",
      save.settings.reduceMotion,
    );
  }, [save.settings]);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const click = (e: MouseEvent) => {
      if ((e.target as Element)?.closest("button")) sound("click");
    };
    document.addEventListener("click", click);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      document.removeEventListener("click", click);
    };
  }, []);
  const start = (m?: number) => {
    setMission(m);
    setDialog("start");
  };
  const showWorld = (i: number) => {
    setWorld(i);
    go("worlds");
  };
  const nav = [
    { p: "home", label: "Beranda", I: House },
    { p: "worlds", label: "Peta Dunia", I: Map },
    { p: "cards", label: "Koleksi Kartu", I: Layers3 },
  ] as const;
  return (
    <div className={"app-shell " + (page === "game" ? "playing" : "")}>
      <header className="topbar">
        <div className="header-inner">
          <button
            className="brand-button"
            onClick={() => go("home")}
            aria-label="Kartu Berburu Poin, Beranda"
          >
            <Brand />
          </button>
          <nav className="desktop-nav" aria-label="Menu utama">
            {nav.map(({ p, label, I }) => (
              <button
                key={p}
                className={page === p ? "active" : ""}
                onClick={() => go(p)}
              >
                <I size={17} strokeWidth={2.2} />
                {label}
              </button>
            ))}
          </nav>
          <div className="header-utilities">
            <button
              className={
                "teacher-button " + (page === "teacher" ? "selected" : "")
              }
              onClick={() =>
                page === "teacher" ? go("home") : setDialog("teacher")
              }
            >
              <GraduationCap size={19} />
              <span>{page === "teacher" ? "Mode Pemain" : "Ruang Guru"}</span>
            </button>
            <span className="header-divider" />
            <button
              className="header-settings"
              aria-label="Pengaturan aplikasi"
              onClick={() => setDialog("settings")}
            >
              <Cog size={19} />
            </button>
            <button
              className="profile-button"
              onClick={() => {
                setDialog("profile");
              }}
              aria-label={"Pilih pemain: " + player.name}
            >
              <span>
                <Avatar size={35} variant={player.avatar} />
                <i />
              </span>
              <ChevronDown size={13} />
            </button>
            <button
              className="mobile-menu icon-btn"
              onClick={() => setMenu(!menu)}
              aria-label="Menu navigasi"
            >
              {menu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {menu && (
          <nav className="mobile-nav">
            {nav.map(({ p, I, label }) => (
              <button key={p} onClick={() => go(p)}>
                <I size={17} />
                {label}
              </button>
            ))}
            <button
              onClick={() => {
                setMenu(false);
                setDialog("help");
              }}
            >
              <BookOpen size={17} />
              Cara Bermain
            </button>
          </nav>
        )}
      </header>
      <main className="main-wrap">
        {!online && (
          <div className="offline-note">
            <WifiOff size={15} />
            Mode offline · progres tetap tersimpan di perangkat.
          </div>
        )}
        {page === "home" ? (
          <Lobby
            onStart={() => start()}
            onScan={() => setDialog("scan")}
            onWorld={showWorld}
            onMap={() => go("worlds")}
            onCollection={() => go("cards")}
            onSettings={() => setDialog("settings")}
            onHelp={() => setDialog("help")}
          />
        ) : page === "worlds" ? (
          <WorldMap world={world} setWorld={setWorld} onStart={start} />
        ) : page === "cards" ? (
          <Collection onScan={() => setDialog("scan")} />
        ) : page === "teacher" ? (
          <Teacher onExit={() => go("home")} />
        ) : (
          <GameView suspended={!!dialog} onExit={() => go("home")} />
        )}
      </main>
      <footer className="footer">
        <div>
          <span className="footer-brand">
            <Gamepad2 size={17} />
            Number Jump Adventure
          </span>
          <span className="footer-sep" />
          Created by: <b>Widodo Guru SD</b>
        </div>
        <span className="save-status">
          <i />
          {sync}
        </span>
      </footer>
      {(dialog === "start" || dialog === "profile") && (
        <Modal
          title={dialog === "start" ? "Siap bertualang?" : "Pilih Pemain"}
          eyebrow="IDENTITAS PENJELAJAH"
          onClose={() => setDialog(null)}
        >
          <PlayerPanel
            mission={mission}
            play={dialog === "start"}
            onDone={() =>
              dialog === "start"
                ? go("game")
                : page === "game"
                  ? go("home")
                  : setDialog(null)
            }
          />
        </Modal>
      )}
      {dialog === "scan" && (
        <CardStation
          mission={nextMission(player)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "settings" && (
        <Modal
          title="Pengaturan"
          eyebrow="PREFERENSI PENJELAJAH"
          onClose={() => setDialog(null)}
        >
          <Settings onDone={() => setDialog(null)} />
        </Modal>
      )}
      {dialog === "help" && (
        <Modal
          title="Cara Bermain"
          eyebrow="BUKU PANDUAN"
          onClose={() => setDialog(null)}
        >
          <Help />
        </Modal>
      )}
      {dialog === "teacher" && (
        <Modal
          title="Selamat datang, Guru!"
          eyebrow="RUANG PENDAMPING"
          onClose={() => setDialog(null)}
        >
          <div className="teacher-welcome">
            <span>
              <GraduationCap size={36} />
            </span>
            <p>
              Area khusus guru untuk melihat hasil belajar siswa, mengatur
              tantangan, dan mencetak kartu QR.
            </p>
          </div>
          <div className="info-box">
            <ShieldCheck size={18} />
            Mode kelas tanpa login. Gunakan area ini bersama guru atau
            pendamping.
          </div>
          <button className="btn primary full" onClick={() => go("teacher")}>
            Masuk Ruang Guru <ArrowRight size={17} />
          </button>
        </Modal>
      )}
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
        </div>
      )}
    </div>
  );
}
export default function AdventureApp() {
  return (
    <GameProvider>
      <Shell />
    </GameProvider>
  );
}
