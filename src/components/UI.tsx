"use client";
import { useEffect, useRef, useId, type ReactNode } from "react";
import { X, Star } from "lucide-react";
import { cardKind, cardSymbol, type Card } from "@/lib/game";
export function GameArt({
  kind,
  size = 48,
}: {
  kind: "coin" | "star" | "flag" | "bonus" | "compass" | "logo";
  size?: number;
}) {
  const id = useId().replace(/:/g, "");
  const fill = (n: string) => `url(#${id}${n})`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={"game-art art-" + kind}
    >
      <defs>
        <linearGradient id={id + "g"} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff593" />
          <stop offset=".36" stopColor="#ffcf3e" />
          <stop offset=".7" stopColor="#ffab16" />
          <stop offset="1" stopColor="#e17e0a" />
        </linearGradient>
        <linearGradient id={id + "p"} x2=".8" y2="1">
          <stop stopColor="#cc9bff" />
          <stop offset="1" stopColor="#8750d5" />
        </linearGradient>
        <linearGradient id={id + "b"} x2=".8" y2="1">
          <stop stopColor="#69d3fe" />
          <stop offset="1" stopColor="#2287d7" />
        </linearGradient>
      </defs>
      {kind === "coin" && (
        <g transform="rotate(-14 32 32)">
          <ellipse cx="33" cy="35" rx="22" ry="25" fill="#c07c08" />
          <ellipse
            cx="30"
            cy="31"
            rx="22"
            ry="25"
            fill={fill("g")}
            stroke="#e7a321"
            strokeWidth="1.5"
          />
          <ellipse
            cx="30"
            cy="31"
            rx="16.5"
            ry="19.3"
            stroke="#fff18d"
            strokeWidth="3"
          />
          <ellipse
            cx="30"
            cy="32"
            rx="14.8"
            ry="17.3"
            stroke="#e79917"
            strokeWidth="1.6"
          />
          <path
            d="m30 18 4 8 8 2-6 6 1 9-8-4-7 3 2-9-5-6 8-1Z"
            fill="#df8c13"
          />
          <path
            d="m29 16 4 8 8 2-6 6 1 9-8-4-7 3 2-9-5-6 8-1Z"
            fill="#fff078"
          />
        </g>
      )}
      {kind === "star" && (
        <g transform="rotate(9 32 32)">
          <path
            d="m29 7 8 15 17 3q5 1 2 6L44 43l2 15q0 5-5 2l-12-7-14 6q-6 2-5-4l3-15L2 28q-3-4 3-5l16-2 6-14q1-5 2 0"
            transform="translate(3 0) scale(.96)"
            fill="#d68308"
          />
          <path
            d="m32 5 8 16 17 3q4 1 1 5L45 41l2 16q0 3-4 1l-13-8-14 7q-4 1-3-4l3-15L4 26q-3-4 2-4l17-2 7-15q1-3 2 0Z"
            fill={fill("g")}
            stroke="#e9a726"
            strokeWidth="1.5"
          />
          <path d="m30 12-5 12-13 2 12 3 6-7Z" fill="#fff7aa" />
          <path d="m33 29 10 10 2 13-12-11Z" fill="#f0a524" />
        </g>
      )}
      {kind === "flag" && (
        <g transform="rotate(7 32 32)">
          <ellipse cx="26" cy="57" rx="15" ry="3.5" fill="#b1d9eb" />
          <path
            d="m20 55 4-46"
            stroke="#697d8f"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M25 10C35 1 43 20 57 9l-4 24C40 43 34 23 22 34Z"
            fill={fill("b")}
            stroke="#2982bc"
            strokeWidth="1.5"
          />
          <path d="M26 13q9-6 17 1l-2 17q-8-7-16-2Z" fill="#65c4f8" />
          <circle cx="24" cy="8" r="4" fill="#ffc248" />
        </g>
      )}
      {kind === "bonus" && (
        <g transform="rotate(-9 32 32)">
          <rect
            x="24"
            y="9"
            width="30"
            height="43"
            rx="5"
            fill="#8f60cf"
            stroke="#7147ad"
            strokeWidth="2"
            transform="rotate(18 38 31)"
          />
          <rect
            x="11"
            y="10"
            width="32"
            height="45"
            rx="5"
            fill={fill("p")}
            stroke="#8252b9"
            strokeWidth="2"
          />
          <rect
            x="14.5"
            y="13.5"
            width="25"
            height="38"
            rx="3"
            stroke="#e8ceff"
            strokeWidth="1.6"
          />
          <path
            d="m27 20 3.8 8 8 1-6.5 6 1 9-7-5-7 4 1.5-8-5-6 8-1Z"
            fill="#fff19b"
            stroke="#b57b24"
            strokeWidth="1"
          />
        </g>
      )}
      {kind === "compass" && (
        <g transform="rotate(11 32 32)">
          <circle cx="32" cy="8" r="4" stroke="#cd9e50" strokeWidth="3" />
          <circle cx="32" cy="35" r="24" fill="#b8894a" />
          <circle
            cx="32"
            cy="32"
            r="24"
            fill="#f3cf82"
            stroke="#bd8b42"
            strokeWidth="1.7"
          />
          <circle
            cx="32"
            cy="32"
            r="19"
            fill="#fff9e8"
            stroke="#c5b38e"
            strokeWidth="1.7"
          />
          <path d="m16 32 32 0M32 15v34" stroke="#c4bda9" strokeWidth="2" />
          <path d="m41 16-5 22-13 12 5-23Z" fill="#4c949d" />
          <path d="m41 16-5 22-8-11Z" fill="#e4734c" />
          <circle cx="32" cy="32" r="3.2" fill="#f5d082" />
        </g>
      )}
      {kind === "logo" && (
        <g>
          <rect
            x="6"
            y="12"
            width="34"
            height="43"
            rx="6"
            transform="rotate(-16 23 32)"
            fill="#ffbc32"
            stroke="#bf7519"
            strokeWidth="2.6"
          />
          <path d="m13 23 9-2m-5-4 1 8" stroke="#fff4c4" strokeWidth="3" />
          <rect
            x="22"
            y="9"
            width="34"
            height="45"
            rx="6"
            transform="rotate(9 38 32)"
            fill="#ff9c24"
            stroke="#a85d21"
            strokeWidth="2.6"
          />
          <rect
            x="25.5"
            y="12.5"
            width="27"
            height="38"
            rx="4"
            transform="rotate(9 38 32)"
            stroke="#ffd884"
            strokeWidth="2"
          />
          <path
            d="m40 17-14 18 10-1-4 14 16-23-10 3Z"
            fill="#fff7d2"
            stroke="#bd7628"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </g>
      )}
    </svg>
  );
}
export function Brand() {
  return (
    <span className="brand">
      <GameArt kind="logo" size={48} />
      <span>
        KARTU<span>BERBURU POIN</span>
      </span>
    </span>
  );
}
export function Avatar({
  name = "Number Bot",
  variant = 0,
  size = 38,
}: {
  name?: string;
  variant?: number;
  size?: number;
}) {
  return (
    <img
      className={"avatar avatar-" + variant}
      width={size}
      height={size}
      src="/art/number-bot.webp"
      alt={name}
      style={{ width: size, height: size }}
    />
  );
}
export function CardFace({
  card,
  small = false,
}: {
  card: Card;
  small?: boolean;
}) {
  return (
    <div
      className={`physical-card type-${card.type} value-${card.value} ${small ? "small" : ""}`}
    >
      <span className="card-corner">{cardSymbol(card)}</span>
      <b>{cardSymbol(card)}</b>
      <span className="card-type">{cardKind(card)}</span>
    </div>
  );
}
export function Modal({
  title,
  eyebrow,
  children,
  onClose,
  wide = false,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const id = useId();
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    root.current?.focus();
    const key = (e: KeyboardEvent) => {
      const dialogs = document.querySelectorAll('[role="dialog"]');
      if (dialogs[dialogs.length - 1] !== root.current) return;
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close.current();
      }
      if (e.key === "Tab") {
        const items = root.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),select,textarea,[tabindex="0"]',
        );
        if (!items?.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === root.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
      before?.focus();
    };
  }, []);
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={root}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className={`modal ${wide ? "wide" : ""} ${className}`}
      >
        <div className="modal-heading">
          <div>
            {eyebrow && <span className="overline">{eyebrow}</span>}
            <h2 id={id}>{title}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Tutup">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="toggle-row">
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch" aria-hidden="true" />
    </label>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="empty">
      <Star size={25} />
      <p>{children}</p>
    </div>
  );
}
