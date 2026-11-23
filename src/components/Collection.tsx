"use client";
import { useState } from "react";
import { Layers3, Search, ScanLine, Check, Bookmark, Hash } from "lucide-react";
import { CARDS, cardKind, cardSymbol, type Card } from "@/lib/game";
import { useGame } from "@/lib/store";
import { CardFace, Modal, Empty } from "./UI";
export default function Collection({ onScan }: { onScan: () => void }) {
  const { player } = useGame(),
    [filter, setFilter] = useState("Semua"),
    [query, setQuery] = useState(""),
    [detail, setDetail] = useState<Card | null>(null);
  const found = new Set(player.scans.map((s) => s.card.card_id));
  const cards = CARDS.filter(
    (c) =>
      (filter === "Semua" ||
        (filter === "Angka" && c.type === "number") ||
        (filter === "Operasi" && c.type === "operator") ||
        (filter === "Spesial" && c.type === "special") ||
        (filter === "Ditemukan" && found.has(c.card_id))) &&
      (c.card_id + " " + cardKind(c) + " " + cardSymbol(c))
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <section className="page-content">
      <div className="page-heading split">
        <div>
          <span className="overline">
            <Layers3 size={14} /> BUKU PENJELAJAH
          </span>
          <h1>Koleksi Kartu</h1>
          <p>Kenali 59 kartu fisik dan temukan kekuatan setiap kartu.</p>
        </div>
        <button className="btn primary" onClick={onScan}>
          <ScanLine size={18} />
          Scan Kartu
        </button>
      </div>
      <div className="collection-bar">
        <span>
          <Bookmark size={19} />
          <b>{found.size} / 59</b> kartu ditemukan
        </span>
        <div className="progress-track">
          <i style={{ width: (found.size / 59) * 100 + "%" }} />
        </div>
      </div>
      <div className="filter-row">
        <div className="tabs">
          {["Semua", "Angka", "Operasi", "Spesial", "Ditemukan"].map((f) => (
            <button
              key={f}
              className={filter === f ? "active" : ""}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <label className="search">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari kartu…"
            aria-label="Cari kartu"
          />
        </label>
      </div>
      <div className="collection-grid">
        {cards.map((c) => (
          <button
            className="collection-item"
            key={c.card_id}
            onClick={() => setDetail(c)}
          >
            <CardFace card={c} />
            <span>
              {c.type === "number"
                ? "Angka " + c.value
                : cardKind(c) + " " + (c.type === "operator" ? c.value : "")}
            </span>
            <small>
              {found.has(c.card_id) ? (
                <>
                  <Check size={12} />
                  Ditemukan
                </>
              ) : (
                c.card_id
              )}
            </small>
          </button>
        ))}
      </div>
      {!cards.length && (
        <Empty>
          Belum ada kartu yang cocok. Pindai kartu fisik atau ubah pencarian.
        </Empty>
      )}
      {detail && (
        <Modal
          title={cardKind(detail)}
          eyebrow="CATATAN KARTU"
          onClose={() => setDetail(null)}
        >
          <div className="card-detail">
            <CardFace card={detail} />
            <h3>
              {detail.type === "number"
                ? "Angka " + detail.value
                : cardKind(detail) +
                  " " +
                  (detail.type === "operator" ? detail.value : "")}
            </h3>
            <span className="id-label">
              <Hash size={13} />
              {detail.card_id}
            </span>
            <p>
              {detail.type === "number"
                ? "Pasangkan dengan kartu angka lain untuk membuat tantangan matematika."
                : detail.value === "star"
                  ? "Pilih +10 poin, maju 6 platform aman, atau acak kartu. Kamu punya 3 kesempatan untuk seluruh petualangan."
                  : detail.value === "zonk"
                    ? "Kejutan seru tanpa kehilangan poin. Efek kartu mengikuti pengaturan guru."
                    : "Letakkan bersama dua kartu angka pada dunia dengan materi yang sesuai."}
            </p>
            <button
              className="btn primary full"
              onClick={() => {
                setDetail(null);
                onScan();
              }}
            >
              <ScanLine size={17} />
              Pindai kartu fisik
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
