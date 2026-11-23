"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import {
  Download,
  Printer,
  QrCode,
  Layers3,
  Check,
  Plus,
  Trash2,
} from "lucide-react";
import { CARDS, cardKind, cardSymbol, type Card } from "@/lib/game";
import { useGame } from "@/lib/store";
type PrintCard = { card: Card; url: string };
const qr = (c: Card) =>
  QRCode.toDataURL(JSON.stringify(c), {
    width: 360,
    margin: 4,
    errorCorrectionLevel: "M",
    color: { dark: "#172834", light: "#ffffff" },
  });
function PrintedCard({ item }: { item: PrintCard }) {
  return (
    <div className={"print-card print-" + item.card.type}>
      <span>KARTU BERBURU POIN</span>
      <strong>{cardSymbol(item.card)}</strong>
      <b>{cardKind(item.card)}</b>
      <img src={item.url} alt={"QR " + item.card.card_id} />
      <small>{item.card.card_id}</small>
    </div>
  );
}
export default function QRGenerator() {
  const [category, setCategory] = useState("number"),
    [id, setId] = useState("N009"),
    [url, setUrl] = useState(""),
    [sheet, setSheet] = useState<Card[]>([]),
    [print, setPrint] = useState<PrintCard[]>([]),
    [busy, setBusy] = useState(false);
  const { notify } = useGame();
  const card = CARDS.find((c) => c.card_id === id)!;
  useEffect(() => {
    let ok = true;
    qr(card)
      .then((u) => {
        if (ok) setUrl(u);
      })
      .catch(() => notify("QR belum dibuat. Silakan pilih kartu lagi."));
    return () => {
      ok = false;
    };
  }, [card, notify]);
  async function download() {
    if (!url) return;
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 840;
    const c = canvas.getContext("2d")!;
    c.fillStyle = "#fffaf0";
    c.fillRect(0, 0, 600, 840);
    c.strokeStyle = "#e9b651";
    c.lineWidth = 12;
    c.strokeRect(14, 14, 572, 812);
    c.textAlign = "center";
    c.fillStyle = "#51432b";
    c.font = "bold 25px sans-serif";
    c.fillText("KARTU BERBURU POIN", 300, 66);
    c.fillStyle = "#d8971c";
    c.font = "bold 120px sans-serif";
    c.fillText(cardSymbol(card), 300, 208);
    c.fillStyle = "#273644";
    c.font = "bold 27px sans-serif";
    c.fillText(cardKind(card), 300, 261);
    const image = new Image();
    image.src = url;
    await image.decode();
    c.imageSmoothingEnabled = false;
    c.drawImage(image, 74, 285, 452, 452);
    c.font = "bold 23px monospace";
    c.fillText(card.card_id, 300, 777);
    const a = document.createElement("a");
    a.download = `Kartu-${card.card_id}.png`;
    a.href = canvas.toDataURL();
    a.click();
    notify("Kartu PNG siap diunduh.");
  }
  async function printCards() {
    setBusy(true);
    try {
      const cards = sheet.length ? sheet : [card];
      const items = await Promise.all(
        cards.map(async (card) => ({ card, url: await qr(card) })),
      );
      setPrint(items);
      await new Promise((r) => setTimeout(r, 120));
      await Promise.all(
        Array.from(
          document.querySelectorAll<HTMLImageElement>(".print-sheet img"),
        ).map((i) => i.decode().catch(() => {})),
      );
      window.print();
    } catch {
      notify("Cetak belum tersedia. Unduh kartu sebagai PNG.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="generator">
      <div className="panel-title">
        <span className="tool-bubble purple">
          <QrCode />
        </span>
        <div>
          <h2>QR Card Generator</h2>
          <p>Buat kartu fisik dengan nilai tetap dan QR yang siap dipindai.</p>
        </div>
      </div>
      <div className="generator-layout">
        <div>
          <label className="field">
            Jenis kartu
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setId(CARDS.find((c) => c.type === e.target.value)!.card_id);
              }}
            >
              <option value="number">Angka 0–50</option>
              <option value="operator">Operasi & perbandingan</option>
              <option value="special">Bintang & Zonk</option>
            </select>
          </label>
          <label className="field">
            Nilai kartu
            <select value={id} onChange={(e) => setId(e.target.value)}>
              {CARDS.filter((c) => c.type === category).map((c) => (
                <option key={c.card_id} value={c.card_id}>
                  {c.type === "special" ? cardKind(c) : cardSymbol(c)} ·{" "}
                  {c.card_id}
                </option>
              ))}
            </select>
          </label>
          <div className="payload">
            <small>PAYLOAD QR</small>
            <code>{JSON.stringify(card)}</code>
          </div>
          <div className="action-row">
            <button
              className="btn primary"
              onClick={() => void download()}
              disabled={!url}
            >
              <Download size={16} />
              Unduh PNG
            </button>
            <button
              className="btn light"
              onClick={() => {
                setSheet((old) =>
                  old.some((c) => c.card_id === id) ? old : [...old, card],
                );
                notify("Kartu ditambahkan ke lembar cetak.");
              }}
            >
              <Plus size={16} />
              Ke lembar cetak
            </button>
          </div>
        </div>
        <div className="qr-preview">
          {url && <PrintedCard item={{ card, url }} />}
          <span>
            <Check size={13} />
            Pratinjau kartu fisik
          </span>
        </div>
      </div>
      <section className="print-queue">
        <div className="split">
          <h3>
            <Layers3 size={18} /> Lembar cetak A4
          </h3>
          <span className="pill">{sheet.length} kartu</span>
        </div>
        <p>
          9 kartu per halaman, dengan margin aman. Jika lembar kosong, kartu
          pratinjau yang dicetak.
        </p>
        {sheet.length > 0 && (
          <div className="queue-chips">
            {sheet.map((c) => (
              <button
                onClick={() =>
                  setSheet((s) => s.filter((x) => x.card_id !== c.card_id))
                }
                key={c.card_id}
                title="Hapus dari lembar"
              >
                {c.card_id} ×
              </button>
            ))}
          </div>
        )}
        <div className="action-row">
          <button className="btn light" onClick={() => setSheet([...CARDS])}>
            <Layers3 size={16} />
            Paket lengkap · 59 kartu
          </button>
          <button
            className="btn dark"
            disabled={busy}
            onClick={() => void printCards()}
          >
            <Printer size={16} />
            {busy ? "Menyiapkan…" : "Cetak kartu"}
          </button>
          {sheet.length > 0 && (
            <button
              className="icon-btn"
              aria-label="Kosongkan lembar cetak"
              onClick={() => setSheet([])}
            >
              <Trash2 size={17} />
            </button>
          )}
        </div>
      </section>
      {print.length > 0 &&
        createPortal(
          <div className="print-sheet">
            {Array.from({ length: Math.ceil(print.length / 9) }, (_, i) => (
              <div className="print-page" key={i}>
                {print.slice(i * 9, i * 9 + 9).map((item) => (
                  <PrintedCard key={item.card.card_id} item={item} />
                ))}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
