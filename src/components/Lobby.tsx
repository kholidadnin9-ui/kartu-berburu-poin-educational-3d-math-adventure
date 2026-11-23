"use client";
import {
  Play,
  ScanLine,
  ArrowRight,
  LockKeyhole,
  Flag,
  ChevronRight,
  Layers3,
  Settings,
  BookOpen,
  Check,
  MapPin,
  Volume2,
  VolumeX,
  Sparkles,
  Map,
  Users,
  Keyboard,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";
import { useGame } from "@/lib/store";
import { WORLDS, MISSIONS, isOpen, type Player } from "@/lib/game";
import { GameArt } from "./UI";
export function WorldCards({
  player,
  onWorld,
  selected,
}: {
  player: Player;
  onWorld: (id: number) => void;
  selected?: number;
}) {
  return (
    <div className="world-grid">
      {WORLDS.map((w, i) => {
        const open = isOpen(player, i * 10),
          count = player.completed.filter(
            (m) => Math.floor(m / 10) === i,
          ).length;
        return (
          <button
            key={w.name}
            onClick={() => onWorld(i)}
            className={`world-card ${open ? "unlocked" : ""} ${selected === i ? "selected" : ""}`}
            aria-label={`Dunia ${i + 1}: ${w.name}, ${open ? "terbuka" : "terkunci"}`}
          >
            <div className="world-picture">
              <img src={`/art/world-${i}.webp`} alt={"Pulau " + w.short} />
              <span className="world-number">DUNIA 0{i + 1}</span>
              {!open ? (
                <span className="lock-badge">
                  <LockKeyhole size={14} strokeWidth={2.7} />
                </span>
              ) : (
                <span className="open-badge">
                  <i /> Terbuka
                </span>
              )}
            </div>
            <div className="world-copy">
              <h3>{w.name}</h3>
              <span
                className="subject"
                style={{ background: w.tint, color: w.color }}
              >
                <b>{w.symbol}</b>
                {w.subject}
              </span>
              <div className="world-progress">
                <span className="progress-track">
                  <i style={{ width: count * 10 + "%", background: w.color }} />
                </span>
                <span>{count}/10 misi</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
export function Stats({ player: p }: { player: Player }) {
  return (
    <div className="stats">
      {(
        [
          {
            kind: "coin",
            label: "Total Poin",
            value: p.points,
            unit: "poin",
            color: "gold",
          },
          {
            kind: "star",
            label: "Energy Stars",
            value: p.stars,
            unit: "bintang",
            color: "sun",
          },
          {
            kind: "flag",
            label: "Misi Selesai",
            value: p.completed.length,
            unit: "/ 50",
            color: "sky",
          },
          {
            kind: "bonus",
            label: "Bonus Bintang",
            value: p.bonuses,
            unit: "/ 3",
            color: "lilac",
          },
        ] as const
      ).map((s) => (
        <div className="stat-card" key={s.kind}>
          <div className={"stat-art " + s.color}>
            <GameArt kind={s.kind} size={45} />
          </div>
          <div>
            <span className="stat-label">{s.label}</span>
            <div className="stat-value" key={s.value}>
              {s.value} <small>{s.unit}</small>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
export function Lobby({
  onStart,
  onScan,
  onWorld,
  onMap,
  onCollection,
  onSettings,
  onHelp,
}: {
  onStart: () => void;
  onScan: () => void;
  onWorld: (i: number) => void;
  onMap: () => void;
  onCollection: () => void;
  onSettings: () => void;
  onHelp: () => void;
}) {
  const { player, save, setSettings } = useGame();
  return (
    <>
      <section className="hero" aria-label="Number Jump Adventure">
        <img
          className="hero-scene"
          src="/art/adventure-hero.webp"
          alt="Number Bot putih-emas melompat di antara pulau terapung dan bintang energi"
          fetchPriority="high"
        />
        <div className="hero-shade" />
        <div className="hero-content">
          <span className="hero-kicker">
            <Sparkles size={13} fill="currentColor" /> GAME EDUKASI <i /> KELAS
            2 SD
          </span>
          <h1>
            <span>NUMBER JUMP</span>
            <strong>ADVENTURE</strong>
          </h1>
          <p>
            Ambil Kartunya, Pecahkan Soalnya,
            <br />
            Lompat Menuju Kemenangan!
          </p>
          <div className="hero-actions">
            <button className="btn primary play-btn" onClick={onStart}>
              <Play size={18} fill="currentColor" />
              Mulai Petualangan
            </button>
            <button className="btn hero-secondary" onClick={onScan}>
              <ScanLine size={19} />
              Scan Kartu
            </button>
          </div>
        </div>
        <button
          className="hero-sound"
          onClick={() => setSettings({ mute: !save.settings.mute })}
          aria-label={save.settings.mute ? "Nyalakan suara" : "Matikan suara"}
        >
          {save.settings.mute ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>
        <span className="hero-location">
          <MapPin size={13} fill="white" /> Sunny Number Island
        </span>
      </section>
      <Stats player={player} />
      <section className="world-section">
        <div className="section-heading">
          <div className="heading-with-art">
            <GameArt kind="compass" size={44} />
            <div>
              <span className="overline">JELAJAHI DUNIA</span>
              <h2>Peta Petualangan</h2>
            </div>
          </div>
          <button className="subtle-btn" onClick={onMap}>
            Pilih Level <ArrowRight size={16} />
          </button>
        </div>
        <WorldCards player={player} onWorld={onWorld} />
      </section>
      <section className="tools-section">
        <div className="section-heading small-heading">
          <h2>Peralatan Penjelajah</h2>
          <span className="heading-rule" />
        </div>
        <div className="quick-grid">
          {[
            {
              title: "Scan Kartu",
              desc: "Pindai kartu fisikmu",
              Icon: ScanLine,
              color: "mint",
              action: onScan,
            },
            {
              title: "Koleksi Kartu",
              desc: "Kenali semua kartumu",
              Icon: Layers3,
              color: "purple",
              action: onCollection,
            },
            {
              title: "Cara Bermain",
              desc: "Panduan petualangan",
              Icon: BookOpen,
              color: "amber",
              action: onHelp,
            },
            {
              title: "Pengaturan",
              desc: "Atur pengalaman bermain",
              Icon: Settings,
              color: "blue",
              action: onSettings,
            },
          ].map(({ title, desc, Icon, color, action }) => (
            <button
              className={"quick-card " + color}
              onClick={action}
              key={title}
            >
              <span className="quick-icon">
                <Icon size={23} strokeWidth={2.2} />
              </span>
              <span>
                <strong>{title}</strong>
                <small>{desc}</small>
              </span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
export function WorldMap({
  world,
  setWorld,
  onStart,
}: {
  world: number;
  setWorld: (i: number) => void;
  onStart: (mission: number) => void;
}) {
  const { player, save } = useGame();
  const w = WORLDS[world];
  return (
    <div className="page-content">
      <div className="page-heading">
        <span className="overline">
          <Map size={14} /> ATLAS PENJELAJAH
        </span>
        <h1>Peta Dunia</h1>
        <p>Lima pulau terapung. Lima puluh misi. Satu petualangan hebat!</p>
      </div>
      <WorldCards player={player} onWorld={setWorld} selected={world} />
      <section className="mission-panel">
        <div className="mission-intro">
          <img src={`/art/world-${world}.webp`} alt="" />
          <div>
            <span className="overline">
              DUNIA 0{world + 1} · {w.subject.toUpperCase()}
            </span>
            <h2>{w.name}</h2>
            <p>{w.story}</p>
          </div>
        </div>
        {!isOpen(player, world * 10) && (
          <div className="info-box">
            <LockKeyhole size={18} />
            Selesaikan 10 misi di {WORLDS[world - 1].name} untuk membuka dunia
            ini.
          </div>
        )}
        <div className="mission-grid">
          {MISSIONS.filter((m) => m.world === world).map((m) => {
            const open = isOpen(player, m.id);
            return (
              <button
                disabled={!open}
                key={m.id}
                className={"mission-tile " + (open ? "available" : "")}
                onClick={() => onStart(m.id)}
              >
                <span className="mission-index">
                  {player.completed.includes(m.id) ? (
                    <Check size={18} />
                  ) : open ? (
                    <Flag size={17} />
                  ) : (
                    <LockKeyhole size={15} />
                  )}
                  MISI {String(m.number).padStart(2, "0")}
                </span>
                <strong>{m.name}</strong>
                <small>
                  {m.terrain} · {m.target} ★
                </small>
                <span className="mission-reward">
                  {player.completed.includes(m.id)
                    ? "Sudah selesai"
                    : open
                      ? `+${save.settings.missionPoints} poin misi`
                      : "Belum terbuka"}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
export function Help() {
  return (
    <div className="help-content">
      <div className="story-panel">
        <img src="/art/number-bot.webp" alt="Number Bot" />
        <p>
          “Halo, Penjelajah! Bintang energi di lima pulau menghilang. Bantu aku
          mengumpulkannya dan nyalakan kembali Sky Portal!”
          <strong>— Number Bot</strong>
        </p>
      </div>
      {[
        {
          Icon: Users,
          title: "Pilih penjelajahmu",
          body: "Pakai nama panggilan. Setiap pemain punya poin, misi, dan tiga bonus Bintang sendiri.",
        },
        {
          Icon: Keyboard,
          title: "Jelajahi pulau",
          body: "WASD atau panah untuk bergerak. Spasi untuk melompat, Shift untuk berlari, dan E untuk berinteraksi. Di HP, gunakan joystick dan tombol lompat.",
        },
        {
          Icon: ScanLine,
          title: "Ambil kartu fisik",
          body: "Ambil dua kartu angka. Pindai QR satu per satu atau masukkan nilainya secara manual. Kartu operasi boleh ditambahkan.",
        },
        {
          Icon: Flag,
          title: "Pecahkan soal, buka portal",
          body: "Jawab tantangan di gerbang. Kumpulkan bintang sesuai target, lalu masuk ke portal. Jika jatuh, kamu kembali ke checkpoint tanpa kehilangan poin.",
        },
      ].map(({ Icon, title, body }, i) => (
        <div className="help-step" key={title}>
          <span>
            <Icon size={20} />
          </span>
          <div>
            <h3>
              {i + 1}. {title}
            </h3>
            <p>{body}</p>
          </div>
        </div>
      ))}
      <div className="info-box">
        <ShieldCheck size={20} />
        Tanpa iklan, tanpa login. Progres disimpan otomatis.
      </div>
      <p className="fineprint">
        <GraduationCap size={15} /> Guru dapat mencetak kartu melalui Ruang Guru
        → Generator QR.
      </p>
      {typeof window !== "undefined" && "speechSynthesis" in window && (
        <button
          className="btn light full"
          onClick={() => {
            if ("speechSynthesis" in window) {
              speechSynthesis.cancel();
              const u = new SpeechSynthesisUtterance(
                "Halo penjelajah. Ambil dua kartu angka dari tumpukan fisik. Pindai kartumu, lalu jawab soalnya. Gunakan tombol lompat untuk menyeberang ke pulau berikutnya. Kumpulkan bintang dan capai portal.",
              );
              u.lang = "id-ID";
              speechSynthesis.speak(u);
            }
          }}
        >
          <Volume2 size={17} />
          Dengarkan panduan
        </button>
      )}
    </div>
  );
}
