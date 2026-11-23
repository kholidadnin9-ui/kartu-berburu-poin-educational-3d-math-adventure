"use client";
import { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import {
  Camera,
  ScanLine,
  Keyboard,
  Plus,
  X,
  Check,
  ArrowRight,
  RefreshCw,
  ImagePlus,
  Sparkles,
  Coins,
  Footprints,
  Shuffle,
  Info,
  Lightbulb,
  Clock,
  Star,
  Layers3,
} from "lucide-react";
import { useGame } from "@/lib/store";
import {
  CARDS,
  parseCard,
  cardKind,
  cardSymbol,
  generateQuestion,
  recordAnswer,
  useBonus,
  uid,
  WORLDS,
  MISSIONS,
  type Card,
  type Question,
} from "@/lib/game";
import { Modal, CardFace, GameArt, Avatar } from "./UI";
import { sound } from "@/lib/audio";
export default function CardStation({
  mission,
  onClose,
  onSolved,
  onPose,
  initialManual = false,
}: {
  mission: number;
  onClose: () => void;
  onSolved?: () => void;
  onPose?: (pose: "scan" | "think" | "surprised" | "celebrate") => void;
  initialManual?: boolean;
}) {
  const { player, save, updatePlayer, notify, change } = useGame();
  const [tab, setTab] = useState<"qr" | "manual">(
      initialManual ? "manual" : "qr",
    ),
    [kind, setKind] = useState("number"),
    [id, setId] = useState("N009"),
    [cameraOn, setCameraOn] = useState(true),
    [camError, setCamError] = useState(""),
    [ready, setReady] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [companion, setCompanion] = useState(false),
    [q, setQ] = useState<Question | null>(null),
    [selected, setSelected] = useState(""),
    [feedback, setFeedback] = useState<"" | "wrong" | "right">(""),
    [seconds, setSeconds] = useState(save.settings.timer);
  const video = useRef<HTMLVideoElement>(null),
    file = useRef<HTMLInputElement>(null),
    last = useRef(""),
    seen = useRef(0),
    answerLock = useRef(false),
    specialLock = useRef(false),
    callback = useRef<(c: Card, src: "manual" | "QR") => void>(() => {});
  const w = WORLDS[Math.floor(mission / 10)];
  const choices = CARDS.filter((c) => c.type === kind);
  const chosen = CARDS.find((c) => c.card_id === id) ?? choices[0];
  function addCard(c: Card, source: "QR" | "manual") {
    setError("");
    const hand = player.hand;
    if (
      c.type !== "special" &&
      ((c.type === "number" &&
        hand.filter((v) => v.type === "number").length >= 2) ||
        (c.type === "operator" && hand.some((v) => v.type === "operator")))
    ) {
      setError(
        "Kombinasimu sudah berisi kartu jenis ini. Hapus satu kartu untuk menggantinya.",
      );
      return;
    }
    const entry = { id: uid(), card: c, at: Date.now(), source };
    specialLock.current = false;
    updatePlayer((p) => {
      const next = { ...p, scans: [...p.scans, entry].slice(-10000) };
      if (c.type === "special") {
        const n = {
          ...next,
          special: { value: c.value as "star" | "zonk", id: entry.id },
        };
        return c.value === "star" && p.bonuses === 0
          ? useBonus(n, "shuffle")
          : n;
      }
      return { ...next, hand: [...p.hand, c].slice(0, 3) };
    });
    sound(c.value === "zonk" ? "zonk" : c.value === "star" ? "star" : "scan");
    setMessage(
      `${cardKind(c)} ${c.type === "special" ? "" : cardSymbol(c)} ditambahkan.`,
    );
    if (source === "QR" || c.type === "special") setCameraOn(false);
    if (c.value === "star" && !player.bonuses) {
      setMessage(
        "Tiga bonus sudah digunakan. Acak tumpukan fisik satu kali, lalu ambil kartu baru.",
      );
      notify("Bintang ditemukan! Acak tumpukan kartu fisik satu kali.");
    }
  }
  callback.current = addCard;
  useEffect(() => {
    if (tab !== "qr" || !cameraOn || q || player.special) return;
    let stopped = false,
      stream: MediaStream | null = null,
      interval: ReturnType<typeof setInterval> | null = null;
    setCamError("");
    setReady(false);
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia)
          throw Error(
            "Kamera membutuhkan HTTPS atau localhost. Gunakan input manual atau foto QR.",
          );
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const v = video.current;
        if (!v) return;
        v.srcObject = stream;
        await v.play();
        if (stopped) return;
        setReady(true);
        const c = document.createElement("canvas"),
          ctx = c.getContext("2d", { willReadFrequently: true });
        interval = setInterval(() => {
          if (stopped || !ctx || v.readyState < 2 || !v.videoWidth) return;
          c.width = 480;
          c.height = Math.round((480 * v.videoHeight) / v.videoWidth);
          ctx.drawImage(v, 0, 0, c.width, c.height);
          const data = ctx.getImageData(0, 0, c.width, c.height),
            result = jsQR(data.data, c.width, c.height, {
              inversionAttempts: "dontInvert",
            });
          if (!result) {
            if (Date.now() - seen.current > 750) last.current = "";
            return;
          }
          seen.current = Date.now();
          if (result.data === last.current) return;
          last.current = result.data;
          const card = parseCard(result.data);
          if (!card) {
            setError(
              "QR ini tidak dikenal. Gunakan kartu Kartu Berburu Poin dari guru.",
            );
            return;
          }
          callback.current(card, "QR");
        }, 200);
      } catch (e) {
        if (!stopped) {
          const name = (e as Error).name;
          setCamError(
            name === "NotAllowedError"
              ? "Izin kamera belum diberikan. Izinkan kamera pada pengaturan situs atau gunakan input manual."
              : name === "NotFoundError"
                ? "Kamera tidak ditemukan. Kamu tetap bisa bermain dengan kartu fisik dan input manual."
                : (e as Error).message.includes("HTTPS")
                  ? (e as Error).message
                  : "Kamera belum tersedia. Coba lagi, pilih foto QR, atau gunakan input manual.",
          );
          setReady(false);
        }
        stream?.getTracks().forEach((t) => t.stop());
      }
    }
    void start();
    return () => {
      stopped = true;
      if (interval) clearInterval(interval);
      stream?.getTracks().forEach((t) => t.stop());
      if (video.current) video.current.srcObject = null;
    };
  }, [tab, cameraOn, q, player.special]);
  useEffect(() => {
    if (!q || !save.settings.timer || feedback === "right") return;
    const id = setInterval(() => setSeconds((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [q, feedback, save.settings.timer]);
  async function readPhoto(f?: File) {
    if (!f) return;
    setError("");
    try {
      if (f.size > 12000000)
        throw Error("Pilih foto QR yang berukuran kurang dari 12 MB.");
      const bitmap = await createImageBitmap(f);
      const ratio = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
      const c = document.createElement("canvas");
      c.width = bitmap.width * ratio;
      c.height = bitmap.height * ratio;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0, c.width, c.height);
      bitmap.close();
      const px = ctx.getImageData(0, 0, c.width, c.height);
      const qr = jsQR(px.data, c.width, c.height);
      const card = qr && parseCard(qr.data);
      if (!card)
        throw Error(
          "QR kartu belum terbaca. Gunakan foto yang terang dan tidak terpotong.",
        );
      addCard(card, "QR");
    } catch (e) {
      setError((e as Error).message);
    }
    if (file.current) file.current.value = "";
  }
  function make() {
    try {
      const question = generateQuestion(
        player.hand,
        mission,
        save.settings,
        player.answers
          .filter(
            (a) =>
              a.ok &&
              a.mission === mission &&
              a.session ===
                (player.run && !player.run.finished
                  ? player.run.id
                  : "latihan"),
          )
          .map((a) => a.prompt),
        companion,
      );
      setQ(question);
      setCameraOn(false);
      setFeedback("");
      setSelected("");
      setSeconds(save.settings.timer);
      setError("");
      answerLock.current = false;
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function answer() {
    if (!q || !selected.trim() || answerLock.current) return;
    answerLock.current = true;
    const good = selected.trim() === q.answer;
    updatePlayer((p) => recordAnswer(p, q, selected, save.settings, mission));
    setFeedback(good ? "right" : "wrong");
    sound(good ? "right" : "wrong");
    if (good) onSolved?.();
  }
  function bonus(kind: "points" | "steps" | "shuffle") {
    if (specialLock.current) return;
    specialLock.current = true;
    updatePlayer((p) => useBonus(p, kind));
    const text =
      kind === "points"
        ? "Bonus +10 poin tersimpan!"
        : kind === "steps"
          ? "Enam langkah aman siap! Gerbang soal tetap menjadi checkpoint."
          : "Acak tumpukan kartu fisik satu kali, lalu ambil kartu baru.";
    setMessage(text);
    notify(text);
    sound("star");
  }
  const special = player.special;
  useEffect(() => {
    onPose?.(
      special?.value === "zonk"
        ? "surprised"
        : feedback === "right"
          ? "celebrate"
          : q
            ? "think"
            : "scan",
    );
  }, [q, feedback, special, onPose]);
  return (
    <Modal
      title={
        special
          ? special.value === "star"
            ? "Kartu Bintang!"
            : "Kejutan Zonk!"
          : q
            ? "Tantangan Matematika"
            : "Scan Kartu"
      }
      eyebrow={
        special
          ? "KARTU SPESIAL"
          : q
            ? `DUNIA 0${Math.floor(mission / 10) + 1} · MISI ${MISSIONS[mission].number}`
            : "STASIUN KARTU FISIK"
      }
      onClose={onClose}
      className="card-station"
    >
      {special ? (
        <div className="special-panel">
          <GameArt
            kind={special.value === "star" ? "star" : "bonus"}
            size={82}
          />
          {special.value === "star" ? (
            <>
              <h3>Pilih satu hadiahmu</h3>
              <p>
                Kamu punya <b>{player.bonuses} kesempatan</b> Bintang. Gunakan
                satu sekarang.
              </p>
              <div className="bonus-options">
                {(
                  [
                    {
                      k: "points",
                      Icon: Coins,
                      label: "Bonus +10 poin",
                      desc: "Tambahkan ke total poinmu.",
                    },
                    {
                      k: "steps",
                      Icon: Footprints,
                      label: "Maju 6 langkah",
                      desc: "Mendarat di platform aman terdekat.",
                    },
                    {
                      k: "shuffle",
                      Icon: Shuffle,
                      label: "Acak kartu sekali",
                      desc: "Kocok lagi tumpukan kartu fisik.",
                    },
                  ] as const
                ).map(({ k, Icon, label, desc }) => (
                  <button key={k} onClick={() => bonus(k)}>
                    <Icon />
                    <span>
                      <b>{label}</b>
                      <small>{desc}</small>
                    </span>
                    <Chevron />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <h3>Ups, kejutan kecil!</h3>
              <p>
                {save.settings.zonk === "ulang"
                  ? "Ambil kartu baru dan ulangi tantangan. Poinmu tetap aman."
                  : save.settings.zonk === "giliran"
                    ? "Istirahat satu giliran. Berikan kesempatan kepada temanmu, lalu bermain lagi."
                    : save.settings.zonk === "pesan"
                      ? save.settings.zonkMessage
                      : "Number Bot berputar lucu! Tidak ada poin yang hilang. Yuk, lanjutkan petualangan."}
              </p>
              <button
                className="btn primary full"
                onClick={() => {
                  if (specialLock.current) return;
                  specialLock.current = true;
                  change((s) => {
                    const players = s.players.map((p) =>
                      p.id === s.active
                        ? {
                            ...p,
                            special: null,
                            hand: s.settings.zonk === "ulang" ? [] : p.hand,
                          }
                        : p,
                    );
                    const active =
                      s.settings.zonk === "giliran" && s.settings.multiplayer
                        ? players[
                            (players.findIndex((p) => p.id === s.active) + 1) %
                              players.length
                          ].id
                        : s.active;
                    return { ...s, players, active };
                  });
                  if (save.settings.zonk === "giliran") onClose();
                  else setMessage("Zonk selesai. Ambil kartu berikutnya.");
                }}
              >
                {save.settings.zonk === "giliran"
                  ? "Akhiri giliran"
                  : "Lanjutkan"}
                <ArrowRight size={16} />
              </button>
            </>
          )}
        </div>
      ) : q ? (
        <div className="challenge">
          <div className="challenge-meta">
            <span
              className="subject"
              style={{ background: w.tint, color: w.color }}
            >
              {w.subject}
            </span>
            {save.settings.timer > 0 && (
              <span className="timer">
                <Clock size={14} />
                {seconds} detik
              </span>
            )}
          </div>
          <div className="used-cards">
            {q.cards.map((c, i) => (
              <CardFace card={c} small key={i} />
            ))}
          </div>
          {q.companion !== null && (
            <small>Angka pendamping: {q.companion}</small>
          )}
          <p className="question-prompt">{q.prompt}</p>
          <h3 className="equation">{q.equation}</h3>
          {feedback === "right" ? (
            <div className="answer-success" role="status">
              <Avatar size={58} />
              <h3>
                <Check size={21} />
                Benar! Hebat sekali!
              </h3>
              <p>
                +{save.settings.correctPoints} poin untukmu.{" "}
                {player.run && !player.run.finished
                  ? "Jembatan angka sekarang aktif."
                  : "Kartu dan jawabanmu sudah tersimpan."}
              </p>
              <button className="btn primary full" onClick={onClose}>
                Lanjutkan Petualangan
                <ArrowRight size={17} />
              </button>
            </div>
          ) : (
            <>
              <div className="answer-options">
                {save.settings.answerMode === "pilihan" ? (
                  q.choices.map((v, i) => (
                    <button
                      className={selected === v ? "chosen" : ""}
                      key={v}
                      onClick={() => {
                        setSelected(v);
                        setFeedback("");
                        answerLock.current = false;
                      }}
                    >
                      <small>{"ABC"[i]}</small>
                      {v}
                    </button>
                  ))
                ) : (
                  <label className="field full">
                    Jawabanmu
                    <input
                      inputMode={q.answer.match(/^\d+$/) ? "numeric" : "text"}
                      maxLength={12}
                      value={selected}
                      onChange={(e) => {
                        setSelected(e.target.value);
                        setFeedback("");
                        answerLock.current = false;
                      }}
                      placeholder="Ketik jawaban di sini"
                    />
                  </label>
                )}
              </div>
              {(feedback === "wrong" ||
                (save.settings.timer > 0 && seconds === 0)) && (
                <div className="info-box warning" role="status">
                  <Lightbulb size={20} />
                  <span>
                    <b>
                      {feedback === "wrong"
                        ? "Belum tepat. Yuk, coba lagi!"
                        : "Tidak apa-apa, lanjutkan pelan-pelan."}
                    </b>
                    <br />
                    {q.hint}
                  </span>
                </div>
              )}
              <button
                className="btn primary full"
                disabled={!selected.trim() || feedback === "wrong"}
                onClick={answer}
              >
                <Check size={18} />
                Periksa Jawaban
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <p className="modal-lead">
            Ambil kartu dari tumpukan fisikmu, lalu masukkan satu per satu.
          </p>
          <div className="segment">
            <button
              className={tab === "qr" ? "active" : ""}
              onClick={() => {
                setTab("qr");
                setCameraOn(true);
                setError("");
              }}
            >
              <ScanLine size={17} />
              Scan QR Code
            </button>
            <button
              className={tab === "manual" ? "active" : ""}
              onClick={() => {
                setTab("manual");
                setError("");
              }}
            >
              <Keyboard size={17} />
              Input Manual
            </button>
          </div>
          {tab === "qr" ? (
            <>
              <div
                className={"camera-view " + (ready && cameraOn ? "live" : "")}
              >
                <video
                  ref={video}
                  autoPlay
                  playsInline
                  muted
                  aria-label="Tampilan kamera pemindai QR"
                />
                {!camError && cameraOn && (
                  <div className="scan-frame">
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                )}
                {!ready || !cameraOn ? (
                  <div className="camera-placeholder">
                    <Camera size={28} />
                    <strong>
                      {camError
                        ? "Kamera belum tersedia"
                        : !cameraOn
                          ? "Kartu berhasil dibaca"
                          : "Menyiapkan kamera…"}
                    </strong>
                    <small>
                      {camError ||
                        (!cameraOn
                          ? "Singkirkan kartu tadi sebelum scan berikutnya."
                          : "Izinkan akses kamera pada browsermu.")}
                    </small>
                  </div>
                ) : (
                  <span className="scan-instruction">
                    Arahkan kamera ke QR Code kartu
                  </span>
                )}
              </div>
              <div className="scan-tools">
                <button
                  className="btn light small-btn"
                  onClick={() => {
                    setCamError("");
                    setCameraOn(false);
                    setTimeout(() => setCameraOn(true), 60);
                  }}
                >
                  <RefreshCw size={14} />
                  {cameraOn ? "Scan ulang" : "Scan berikutnya"}
                </button>
                <button
                  className="btn light small-btn"
                  onClick={() => file.current?.click()}
                >
                  <ImagePlus size={15} />
                  Foto QR
                </button>
                <input
                  hidden
                  ref={file}
                  type="file"
                  accept="image/*"
                  onChange={(e) => void readPhoto(e.target.files?.[0])}
                />
              </div>
              {camError && (
                <button
                  className="text-button"
                  onClick={() => setTab("manual")}
                >
                  Gunakan input kartu manual <ArrowRight size={14} />
                </button>
              )}
            </>
          ) : (
            <div className="manual-entry">
              <CardFace card={chosen} small />
              <div className="manual-fields">
                <label className="field">
                  Jenis kartu
                  <select
                    aria-label="Jenis kartu"
                    value={kind}
                    onChange={(e) => {
                      setKind(e.target.value);
                      setId(
                        CARDS.find((c) => c.type === e.target.value)!.card_id,
                      );
                    }}
                  >
                    <option value="number">Kartu angka</option>
                    <option value="operator">Operasi & perbandingan</option>
                    <option value="special">Kartu spesial</option>
                  </select>
                </label>
                <label className="field">
                  Nilai pada kartu fisik
                  <select
                    aria-label="Nilai pada kartu fisik"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                  >
                    {choices.map((c) => (
                      <option key={c.card_id} value={c.card_id}>
                        {c.type === "special" ? cardKind(c) : cardSymbol(c)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="btn light small-btn"
                  onClick={() => addCard(chosen, "manual")}
                >
                  <Plus size={15} />
                  Tambahkan Kartu
                </button>
              </div>
            </div>
          )}
          <div className="hand-heading">
            <h3>
              <Layers3 size={17} />
              Kombinasi kartumu
            </h3>
            <span>{player.hand.length}/3 kartu</span>
          </div>
          <div className="hand-zone">
            {player.hand.length ? (
              player.hand.map((c, i) => (
                <div className="hand-card" key={i}>
                  <CardFace card={c} small />
                  <button
                    className="remove-card"
                    aria-label={`Hapus kartu ${cardSymbol(c)}`}
                    onClick={() => {
                      updatePlayer((p) => ({
                        ...p,
                        hand: p.hand.filter((_, n) => n !== i),
                      }));
                      setError("");
                      setMessage("Kartu dihapus dari kombinasi.");
                    }}
                  >
                    <X size={11} />
                  </button>
                </div>
              ))
            ) : (
              <>
                <ScanLine size={21} />
                <span>Dua kartu angka, satu petualangan baru.</span>
              </>
            )}
          </div>
          {player.hand.filter((c) => c.type === "number").length === 1 && (
            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={companion}
                onChange={(e) => setCompanion(e.target.checked)}
              />{" "}
              Gunakan satu angka pendamping otomatis
            </label>
          )}
          {message && !error && (
            <p className="inline-success" role="status">
              <Check size={14} />
              {message}
            </p>
          )}
          {error && (
            <div className="info-box warning" role="alert">
              <Info size={17} />
              {error}
            </div>
          )}
          <button className="btn primary full" onClick={make}>
            <Sparkles size={17} />
            Konfirmasi & Buat Soal
          </button>
          <span className="station-foot">
            <Star size={12} />
            {w.subject} · {player.name}
          </span>
        </>
      )}
    </Modal>
  );
}
function Chevron() {
  return <ArrowRight size={16} />;
}
