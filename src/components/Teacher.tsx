"use client";
import { useState, useRef } from "react";
import {
  GraduationCap,
  Users,
  SlidersHorizontal,
  QrCode,
  HardDrive,
  Download,
  Upload,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Eye,
  Check,
  Search,
  ShieldCheck,
  ArrowLeft,
  Flag,
  BookOpen,
  ScanLine,
  Database,
} from "lucide-react";
import { useGame } from "@/lib/store";
import {
  newPlayer,
  saveSchema,
  WORLDS,
  MISSIONS,
  cardKind,
  cardSymbol,
  type Save,
  type Player,
  type Settings,
} from "@/lib/game";
import { Avatar, Modal, Empty } from "./UI";
import QRGenerator from "./QRGenerator";
function exportFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function csvValue(x: unknown) {
  let v = String(x);
  if (/^[=+@\-\t\r]/.test(v)) v = "'" + v;
  return '"' + v.replaceAll('"', '""') + '"';
}
function Rules() {
  const { save, setSettings, notify } = useGame();
  const [s, setS] = useState<Settings>({ ...save.settings });
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setS((old) => ({ ...old, [k]: v }));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSettings(s);
        notify("Aturan belajar berhasil disimpan.");
      }}
    >
      <div className="panel-title">
        <span className="tool-bubble amber">
          <SlidersHorizontal />
        </span>
        <div>
          <h2>Aturan Belajar</h2>
          <p>Sesuaikan tantangan dengan kemampuan siswa.</p>
        </div>
      </div>
      <div className="form-grid">
        <label className="field">
          Tingkat kesulitan
          <select
            value={s.difficulty}
            onChange={(e) =>
              set("difficulty", e.target.value as Settings["difficulty"])
            }
          >
            <option value="mudah">Mudah · langkah awal</option>
            <option value="sedang">Sedang · mulai mandiri</option>
            <option value="menantang">Menantang · angka tersembunyi</option>
          </select>
        </label>
        <label className="field">
          Batas bilangan
          <select
            value={s.maxNumber}
            onChange={(e) => set("maxNumber", +e.target.value)}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                0 sampai {n}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Bentuk jawaban
          <select
            value={s.answerMode}
            onChange={(e) =>
              set("answerMode", e.target.value as Settings["answerMode"])
            }
          >
            <option value="pilihan">Tiga pilihan jawaban</option>
            <option value="langsung">Jawaban langsung</option>
          </select>
        </label>
        <label className="field">
          Timer pendamping
          <select
            value={s.timer}
            onChange={(e) => set("timer", +e.target.value)}
          >
            {[0, 30, 60, 90, 120].map((n) => (
              <option key={n} value={n}>
                {n ? n + " detik · tanpa hukuman" : "Nonaktif (bawaan)"}
              </option>
            ))}
          </select>
        </label>
      </div>
      <h3 className="group-label">Materi dunia campuran</h3>
      <div className="check-pills">
        {(["+", "−", "×", "÷", "banding"] as const).map((op) => (
          <label key={op}>
            <input
              type="checkbox"
              checked={s.mixed.includes(op)}
              onChange={(e) => {
                const a = e.target.checked
                  ? [...s.mixed, op]
                  : s.mixed.filter((x) => x !== op);
                if (a.length) set("mixed", a);
              }}
            />
            {op === "banding" ? "Perbandingan" : op}
          </label>
        ))}
      </div>
      <h3 className="group-label">Hadiah poin</h3>
      <div className="form-grid four">
        {(
          [
            { key: "correctPoints", label: "Jawaban benar", max: 100 },
            { key: "starPoints", label: "Energy Star", max: 50 },
            { key: "missionPoints", label: "Misi selesai", max: 200 },
            { key: "levelPoints", label: "Dunia selesai", max: 500 },
          ] as const
        ).map((r) => (
          <label className="field" key={r.key}>
            {r.label}
            <input
              type="number"
              min="0"
              max={r.max}
              required
              value={s[r.key]}
              onChange={(e) => set(r.key, Number(e.target.value))}
            />
          </label>
        ))}
      </div>
      <label className="field">
        Efek kartu Zonk
        <select
          value={s.zonk}
          onChange={(e) => set("zonk", e.target.value as Settings["zonk"])}
        >
          <option value="aman">Kejutan lucu · tanpa pengurangan poin</option>
          <option value="ulang">Ambil kartu baru, ulangi tantangan</option>
          <option value="giliran">Tunda satu giliran</option>
          <option value="pesan">Pesan khusus dari guru</option>
        </select>
      </label>
      {s.zonk === "pesan" && (
        <label className="field">
          Instruksi yang ramah
          <input
            maxLength={120}
            required
            value={s.zonkMessage}
            onChange={(e) => set("zonkMessage", e.target.value)}
          />
        </label>
      )}
      <div className="info-box">
        <ShieldCheck size={18} />
        Bonus Bintang tetap tiga kesempatan per pemain untuk seluruh dunia.
        Jawaban salah tidak mengurangi poin.
      </div>
      <button className="btn primary" type="submit">
        <Check size={17} />
        Simpan Aturan
      </button>
    </form>
  );
}
export default function Teacher({ onExit }: { onExit: () => void }) {
  const { save, change, notify, sync } = useGame();
  const [tab, setTab] = useState("Siswa"),
    [search, setSearch] = useState(""),
    [edit, setEdit] = useState<string | null>(null),
    [name, setName] = useState(""),
    [confirm, setConfirm] = useState<{
      kind: "reset" | "delete";
      p: Player;
    } | null>(null),
    [detail, setDetail] = useState<string | null>(null),
    [hist, setHist] = useState("Progres"),
    [restore, setRestore] = useState<Save | null>(null),
    [error, setError] = useState("");
  const upload = useRef<HTMLInputElement>(null);
  const chosen = save.players.find((p) => p.id === detail);
  const exportCsv = () => {
    const rows = [
      [
        "Nama panggilan",
        "Total poin",
        "Energy Stars",
        "Koin",
        "Misi selesai",
        "Jawaban benar",
        "Jawaban salah",
        "Kartu dipindai QR",
        "Input manual",
        "Sisa bonus Bintang",
        ...WORLDS.map((w) => w.name),
      ],
      ...save.players.map((p) => [
        p.name,
        p.points,
        p.stars,
        p.coins,
        p.completed.length,
        p.correct,
        p.wrong,
        p.scans.filter((c) => c.source === "QR").length,
        p.scans.filter((c) => c.source === "manual").length,
        p.bonuses,
        ...WORLDS.map(
          (_, i) => p.completed.filter((m) => Math.floor(m / 10) === i).length,
        ),
      ]),
    ];
    exportFile(
      "laporan-number-jump.csv",
      "\uFEFF" + rows.map((r) => r.map(csvValue).join(",")).join("\r\n"),
      "text/csv;charset=utf-8",
    );
    notify("Laporan kelas berhasil diekspor.");
  };
  return (
    <div className="page-content teacher-page">
      <div className="page-heading split">
        <div>
          <span className="overline">
            <GraduationCap size={15} /> AREA PENDAMPING
          </span>
          <h1>Ruang Guru</h1>
          <p>Kelola pemain, kartu fisik, dan perjalanan belajar kelasmu.</p>
        </div>
        <button className="btn light" onClick={onExit}>
          <ArrowLeft size={16} />
          Kembali bermain
        </button>
      </div>
      <div className="teacher-tabs">
        {[
          { v: "Siswa", I: Users },
          { v: "Aturan Belajar", I: SlidersHorizontal },
          { v: "Generator QR", I: QrCode },
          { v: "Cadangan", I: HardDrive },
        ].map(({ v, I }) => (
          <button
            key={v}
            className={tab === v ? "active" : ""}
            onClick={() => setTab(v)}
          >
            <I size={17} />
            {v}
          </button>
        ))}
      </div>
      <div className="teacher-panel">
        {tab === "Siswa" ? (
          <>
            <div className="teacher-metrics">
              {[
                ["Pemain", save.players.length],
                [
                  "Total poin kelas",
                  save.players.reduce((s, p) => s + p.points, 0),
                ],
                [
                  "Jawaban benar",
                  save.players.reduce((s, p) => s + p.correct, 0),
                ],
                [
                  "Misi diselesaikan",
                  save.players.reduce((s, p) => s + p.completed.length, 0),
                ],
              ].map(([v, n]) => (
                <div key={v}>
                  <span>{v}</span>
                  <b>{n}</b>
                </div>
              ))}
            </div>
            <div className="split section-heading">
              <h2>Daftar Siswa</h2>
              <div className="action-row">
                <button className="btn light small-btn" onClick={exportCsv}>
                  <Download size={15} />
                  Ekspor CSV
                </button>
                <button
                  className="btn primary small-btn"
                  onClick={() => {
                    setEdit("new");
                    setName("");
                  }}
                >
                  <Plus size={15} />
                  Tambah Siswa
                </button>
              </div>
            </div>
            <label className="search teacher-search">
              <Search size={16} />
              <input
                placeholder="Cari nama siswa…"
                aria-label="Cari nama siswa"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Pemain</th>
                    <th>Total poin</th>
                    <th>Misi</th>
                    <th>Benar / salah</th>
                    <th>Kelola</th>
                  </tr>
                </thead>
                <tbody>
                  {save.players
                    .filter((p) =>
                      p.name.toLowerCase().includes(search.toLowerCase()),
                    )
                    .map((p) => (
                      <tr key={p.id}>
                        <td>
                          <span className="table-name">
                            <Avatar size={33} variant={p.avatar} />
                            {p.name}
                          </span>
                        </td>
                        <td>{p.points}</td>
                        <td>{p.completed.length}/50</td>
                        <td>
                          {p.correct} / {p.wrong}
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              title="Lihat hasil belajar"
                              aria-label={"Lihat progres " + p.name}
                              onClick={() => {
                                setDetail(p.id);
                                setHist("Progres");
                              }}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              aria-label={"Edit " + p.name}
                              onClick={() => {
                                setEdit(p.id);
                                setName(p.name);
                              }}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              aria-label={"Reset " + p.name}
                              onClick={() => setConfirm({ kind: "reset", p })}
                            >
                              <RotateCcw size={15} />
                            </button>
                            <button
                              aria-label={"Hapus " + p.name}
                              onClick={() => setConfirm({ kind: "delete", p })}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {!save.players.some((p) =>
              p.name.toLowerCase().includes(search.toLowerCase()),
            ) && <Empty>Tidak ada pemain dengan nama itu.</Empty>}
            <p className="fineprint">
              <ShieldCheck size={14} />
              Cukup gunakan nama panggilan. Data siswa tidak ditampilkan ke
              perangkat lain.
            </p>
          </>
        ) : tab === "Aturan Belajar" ? (
          <Rules />
        ) : tab === "Generator QR" ? (
          <QRGenerator />
        ) : (
          <>
            <div className="panel-title">
              <span className="tool-bubble mint">
                <Database />
              </span>
              <div>
                <h2>Cadangan Kelas</h2>
                <p>
                  Simpan salinan progres atau pindahkan kelas ke perangkat lain.
                </p>
              </div>
            </div>
            <div className="backup-status">
              <ShieldCheck size={23} />
              <div>
                <b>{sync}</b>
                <small>
                  {save.players.length} profil · Bonus, kartu, riwayat soal, dan
                  aturan belajar
                </small>
              </div>
            </div>
            <div className="action-row">
              <button
                className="btn primary"
                onClick={() => {
                  exportFile(
                    "number-jump-cadangan.json",
                    JSON.stringify(save, null, 2),
                    "application/json",
                  );
                  notify("Cadangan kelas siap diunduh.");
                }}
              >
                <Download size={17} />
                Unduh cadangan
              </button>
              <button
                className="btn light"
                onClick={() => upload.current?.click()}
              >
                <Upload size={17} />
                Pulihkan cadangan
              </button>
            </div>
            <input
              type="file"
              hidden
              ref={upload}
              accept="application/json,.json"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  if (f.size > 4500000) throw Error();
                  const p = saveSchema.parse(JSON.parse(await f.text()));
                  setRestore(p);
                  setError("");
                } catch {
                  setError(
                    "Berkas tidak cocok. Pilih cadangan JSON Number Jump yang valid.",
                  );
                }
                e.target.value = "";
              }}
            />
            {error && <div className="info-box warning">{error}</div>}
            <div className="info-box">
              <HardDrive size={18} />
              Data utama tersimpan di browser ini. Saat terhubung, salinan
              perangkat juga disimpan di server. Unduh cadangan sebelum
              membersihkan data browser.
            </div>
          </>
        )}
      </div>
      {edit && (
        <Modal
          title={edit === "new" ? "Tambah Siswa" : "Edit Profil"}
          eyebrow="PROFIL PEMAIN"
          onClose={() => setEdit(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              change((s) => ({
                ...s,
                players:
                  edit === "new"
                    ? [...s.players, newPlayer(name)]
                    : s.players.map((p) =>
                        p.id === edit ? { ...p, name: name.trim() } : p,
                      ),
              }));
              setEdit(null);
              notify("Profil siswa tersimpan.");
            }}
          >
            <label className="field">
              Nama panggilan
              <input
                required
                maxLength={30}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama siswa"
              />
            </label>
            <button className="btn primary full" type="submit">
              <Check size={16} />
              Simpan Profil
            </button>
          </form>
        </Modal>
      )}
      {confirm && (
        <Modal
          title={
            confirm.kind === "reset"
              ? "Reset progres pemain?"
              : "Hapus profil pemain?"
          }
          eyebrow="KONFIRMASI GURU"
          onClose={() => setConfirm(null)}
        >
          <p className="modal-lead">
            {confirm.kind === "reset"
              ? `Poin, misi, dan riwayat ${confirm.p.name} akan kembali ke awal. Tiga bonus Bintang dipulihkan.`
              : `Profil ${confirm.p.name} beserta seluruh riwayatnya akan dihapus.`}{" "}
            Unduh cadangan terlebih dahulu jika diperlukan.
          </p>
          <div className="action-row">
            <button className="btn light" onClick={() => setConfirm(null)}>
              Batal
            </button>
            <button
              className="btn danger"
              onClick={() => {
                change((s) => {
                  let players =
                    confirm.kind === "reset"
                      ? s.players.map((p) =>
                          p.id === confirm.p.id
                            ? newPlayer(p.name, p.id, p.avatar)
                            : p,
                        )
                      : s.players.filter((p) => p.id !== confirm.p.id);
                  if (!players.length) players = [newPlayer("Penjelajah")];
                  return {
                    ...s,
                    players,
                    active: players.some((p) => p.id === s.active)
                      ? s.active
                      : players[0].id,
                  };
                });
                setConfirm(null);
                notify("Perubahan profil tersimpan.");
              }}
            >
              {confirm.kind === "reset"
                ? "Ya, reset progres"
                : "Ya, hapus profil"}
            </button>
          </div>
        </Modal>
      )}
      {chosen && (
        <Modal
          title={chosen.name}
          eyebrow="HASIL BELAJAR SISWA"
          wide
          onClose={() => setDetail(null)}
        >
          <div className="student-overview">
            <Avatar size={55} variant={chosen.avatar} />
            <div>
              <h3>{chosen.points} poin petualangan</h3>
              <p>
                {chosen.stars} Energy Stars · {chosen.bonuses}/3 bonus tersisa ·{" "}
                {chosen.scans.length} input kartu
              </p>
            </div>
          </div>
          <div className="tabs history-tabs">
            {["Progres", "Riwayat Misi", "Riwayat Kartu", "Riwayat Soal"].map(
              (t) => (
                <button
                  key={t}
                  className={hist === t ? "active" : ""}
                  onClick={() => setHist(t)}
                >
                  {t}
                </button>
              ),
            )}
          </div>
          {hist === "Progres" ? (
            <>
              {WORLDS.map((w, i) => (
                <div className="student-world" key={w.name}>
                  <img src={`/art/world-${i}.webp`} alt="" />
                  <div>
                    <b>{w.name}</b>
                    <small>
                      {chosen.completed
                        .filter((m) => Math.floor(m / 10) === i)
                        .map((m) => MISSIONS[m].name)
                        .join(", ") || "Belum ada misi selesai"}
                    </small>
                  </div>
                  <span>
                    {
                      chosen.completed.filter((m) => Math.floor(m / 10) === i)
                        .length
                    }
                    /10
                  </span>
                </div>
              ))}
            </>
          ) : hist === "Riwayat Misi" ? (
            <div className="history-list">
              {chosen.sessions.length ? (
                [...chosen.sessions].reverse().map((r) => (
                  <div key={r.id}>
                    <Flag size={16} />
                    <span>
                      <b>{MISSIONS[r.mission].name}</b>
                      <small>
                        {r.replay ? "Pengulangan" : "Pertama selesai"} · +
                        {r.points} poin · {r.stars} bintang · {r.correct}{" "}
                        jawaban benar
                        <br />
                        {new Date(r.endedAt).toLocaleString("id-ID")}
                      </small>
                    </span>
                  </div>
                ))
              ) : (
                <Empty>Belum ada sesi misi yang selesai.</Empty>
              )}
            </div>
          ) : hist === "Riwayat Kartu" ? (
            <div className="history-list">
              {chosen.scans.length ? (
                [...chosen.scans].reverse().map((c) => (
                  <div key={c.id}>
                    <ScanLine size={16} />
                    <span>
                      <b>
                        {cardKind(c.card)}{" "}
                        {c.card.type !== "special" && cardSymbol(c.card)}
                      </b>
                      <small>
                        {c.card.card_id} · {c.source} ·{" "}
                        {new Date(c.at).toLocaleString("id-ID")}
                      </small>
                    </span>
                  </div>
                ))
              ) : (
                <Empty>Belum ada kartu yang dimasukkan.</Empty>
              )}
            </div>
          ) : (
            <div className="history-list">
              {chosen.answers.length ? (
                [...chosen.answers].reverse().map((a, i) => (
                  <div key={a.id + i}>
                    <BookOpen size={16} />
                    <span>
                      <b>{a.prompt}</b>
                      <small>
                        {a.ok ? "✓ Benar" : "↻ Perlu latihan"} · Jawaban:{" "}
                        {a.given} · Kunci: {a.answer}
                        <br />
                        Misi {a.mission + 1} · {a.cards.join(", ")} ·{" "}
                        {new Date(a.at).toLocaleString("id-ID")}
                      </small>
                    </span>
                  </div>
                ))
              ) : (
                <Empty>Belum ada soal yang dijawab.</Empty>
              )}
            </div>
          )}
        </Modal>
      )}
      {restore && (
        <Modal
          title="Pulihkan cadangan ini?"
          eyebrow="CADANGAN KELAS"
          onClose={() => setRestore(null)}
        >
          <p className="modal-lead">
            Cadangan berisi {restore.players.length} pemain. Semua data kelas di
            perangkat ini akan diganti.
          </p>
          <div className="action-row">
            <button className="btn light" onClick={() => setRestore(null)}>
              Batal
            </button>
            <button
              className="btn primary"
              onClick={() => {
                change(() => restore);
                setRestore(null);
                notify("Cadangan berhasil dipulihkan.");
              }}
            >
              <Check size={16} />
              Pulihkan data
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
