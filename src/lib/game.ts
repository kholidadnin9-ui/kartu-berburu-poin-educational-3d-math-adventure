import { z } from "zod";

export type Card = {
  type: "number" | "operator" | "special";
  value: number | string;
  card_id: string;
};
const operators = [
  ["+", "ADD"],
  ["−", "SUB"],
  ["×", "MUL"],
  ["<", "LT"],
  [">", "GT"],
  ["=", "EQ"],
];
export const CARDS: Card[] = [
  ...Array.from({ length: 51 }, (_, n) => ({
    type: "number" as const,
    value: n,
    card_id: `N${String(n).padStart(3, "0")}`,
  })),
  ...operators.map(([value, id]) => ({
    type: "operator" as const,
    value,
    card_id: `OP_${id}`,
  })),
  { type: "special", value: "star", card_id: "SP_STAR" },
  { type: "special", value: "zonk", card_id: "SP_ZONK" },
];
export const cardSymbol = (c: Card) =>
  c.value === "star" ? "★" : c.value === "zonk" ? "Z!" : String(c.value);
export const cardKind = (c: Card) =>
  c.type === "number"
    ? "Kartu Angka"
    : c.type === "operator"
      ? ["<", ">", "="].includes(String(c.value))
        ? "Kartu Banding"
        : "Kartu Operasi"
      : c.value === "star"
        ? "Kartu Bintang"
        : "Kartu Zonk";
export function parseCard(raw: string): Card | null {
  try {
    const data = JSON.parse(raw);
    return (
      CARDS.find(
        (c) =>
          c.type === data?.type &&
          c.value === data.value &&
          c.card_id === data.card_id,
      ) ?? null
    );
  } catch {
    return null;
  }
}
export const WORLDS = [
  {
    name: "Sunny Number Island",
    subject: "Penjumlahan",
    color: "#28824d",
    tint: "#e9f5df",
    symbol: "+",
    story:
      "Jembatan angka di pulau cerah kehilangan energi. Ayo bantu Number Bot menyalakannya kembali!",
    short: "Pulau Cerah",
  },
  {
    name: "Subtraction Forest",
    subject: "Pengurangan",
    color: "#337b5c",
    tint: "#e5f2e5",
    symbol: "−",
    story:
      "Ikuti cahaya kunang-kunang dan temukan bintang yang tersesat di antara jamur raksasa.",
    short: "Hutan Angka",
  },
  {
    name: "Multiplication Mountain",
    subject: "Perkalian",
    color: "#8252b0",
    tint: "#f0e6fa",
    symbol: "×",
    story:
      "Kristal gunung akan bersinar jika kamu menyusun kelompok angka yang tepat.",
    short: "Gunung Kristal",
  },
  {
    name: "Division Waterfall",
    subject: "Pembagian",
    color: "#2088a6",
    tint: "#dff3fa",
    symbol: "÷",
    story:
      "Bagikan bintang dengan adil untuk membangun jembatan di atas air terjun pelangi.",
    short: "Air Terjun",
  },
  {
    name: "Ultimate Number Sky",
    subject: "Operasi Campuran",
    color: "#b76a24",
    tint: "#fff0d6",
    symbol: "±",
    story:
      "Sky Crystal menantimu! Gabungkan semua keahlianmu untuk menyalakan istana langit.",
    short: "Istana Langit",
  },
];
const missionNames = [
  [
    "Langkah Pertama",
    "Jembatan Koin",
    "Taman Bintang",
    "Lintasan Pelangi",
    "Piknik Number Bot",
    "Pulau Puluhan",
    "Bintang yang Hilang",
    "Lompatan Seratus",
    "Rahasia Jembatan",
    "Portal Matahari",
  ],
  [
    "Jejak di Hutan",
    "Jamur yang Hilang",
    "Sungai Kecil",
    "Keranjang Apel",
    "Lompatan Daun",
    "Hitung Kunang-kunang",
    "Rahasia Pohon Tua",
    "Bekal Penjelajah",
    "Jalur Rimbun",
    "Gerbang Rimba",
  ],
  [
    "Pasangan Kristal",
    "Tiga Kelompok",
    "Batu Berbaris",
    "Kebun Permata",
    "Jembatan Lima",
    "Tambang Enam",
    "Keranjang Kristal",
    "Tangga Perkalian",
    "Kunci Puncak",
    "Portal Ametis",
  ],
  [
    "Berbagi Bintang",
    "Dua Keranjang",
    "Pulau Kembar",
    "Piknik Bersama",
    "Air Terjun Tiga",
    "Koin untuk Teman",
    "Kelompok Pelangi",
    "Taman yang Rata",
    "Rahasia Sungai",
    "Portal Samudra",
  ],
  [
    "Salam dari Langit",
    "Tangga Awan",
    "Bandingkan Bintang",
    "Jembatan Ajaib",
    "Kebun Langit",
    "Istana Angka",
    "Mana Lebih Besar?",
    "Misi Empat Operasi",
    "Cahaya Sky Crystal",
    "Pahlawan Lima Dunia",
  ],
];
export const MISSIONS = Array.from({ length: 50 }, (_, id) => ({
  id,
  world: Math.floor(id / 10),
  number: (id % 10) + 1,
  name: missionNames[Math.floor(id / 10)][id % 10],
  platforms: 8 + (id % 3),
  target: (id % 3) + 1,
  goal: `Kumpulkan ${(id % 3) + 1} Energy Star, jawab tantangan kartu, lalu capai portal.`,
  terrain: [
    "Lintasan pulau",
    "Jembatan kayu",
    "Platform bergerak",
    "Jalur berkelok",
    "Lompatan kristal",
  ][id % 5],
}));
const integer = z.number().int().nonnegative();
const cardSchema = z
  .object({
    type: z.enum(["number", "operator", "special"]),
    value: z.union([z.number(), z.string()]),
    card_id: z.string().max(18),
  })
  .refine(
    (c) =>
      !!CARDS.find(
        (x) =>
          x.card_id === c.card_id && x.type === c.type && x.value === c.value,
      ),
  );
const settingsSchema = z.object({
  difficulty: z.enum(["mudah", "sedang", "menantang"]),
  maxNumber: z.number().int().min(10).max(100),
  timer: z.number().int().min(0).max(180),
  answerMode: z.enum(["pilihan", "langsung"]),
  zonk: z.enum(["aman", "ulang", "giliran", "pesan"]),
  zonkMessage: z.string().max(120),
  correctPoints: integer.max(100),
  missionPoints: integer.max(200),
  starPoints: integer.max(50),
  levelPoints: integer.max(500),
  volume: integer.max(100),
  music: z.boolean(),
  effects: z.boolean(),
  mute: z.boolean(),
  reduceMotion: z.boolean(),
  doubleJump: z.boolean(),
  quality: z.enum(["hemat", "tinggi"]),
  camera: integer.max(100),
  multiplayer: z.boolean(),
  mixed: z
    .array(z.enum(["+", "−", "×", "÷", "banding"]))
    .min(1)
    .max(5),
});
export type Settings = z.infer<typeof settingsSchema>;
export const DEFAULTS: Settings = {
  difficulty: "mudah",
  maxNumber: 100,
  timer: 0,
  answerMode: "pilihan",
  zonk: "aman",
  zonkMessage: "Tepuk tangan tiga kali, lalu ambil kartu lagi!",
  correctPoints: 10,
  missionPoints: 20,
  starPoints: 5,
  levelPoints: 50,
  volume: 45,
  music: false,
  effects: true,
  mute: false,
  reduceMotion: false,
  doubleJump: true,
  quality: "tinggi",
  camera: 55,
  multiplayer: false,
  mixed: ["+", "−", "×", "÷", "banding"],
};
const runSchema = z.object({
  id: z.string(),
  mission: integer.max(49),
  checkpoint: integer.max(10),
  solved: z.boolean(),
  collected: z.array(z.string()).max(50),
  pointsAtStart: integer,
  starsAtStart: integer,
  correctAtStart: integer,
  finished: z.boolean(),
  startedAt: integer.optional(),
});
const profileSchema = z.object({
  id: z.string().max(80),
  name: z.string().min(1).max(30),
  avatar: integer.max(2),
  points: integer,
  stars: integer,
  coins: integer,
  bonuses: integer.max(3),
  correct: integer,
  wrong: integer,
  completed: z.array(integer.max(49)).max(50),
  hand: z.array(cardSchema).max(3),
  safeSteps: integer.max(6),
  special: z
    .object({ value: z.enum(["star", "zonk"]), id: z.string() })
    .nullable(),
  scans: z
    .array(
      z.object({
        id: z.string(),
        card: cardSchema,
        at: integer,
        source: z.enum(["QR", "manual"]),
      }),
    )
    .max(10000),
  answers: z
    .array(
      z.object({
        id: z.string(),
        session: z.string().optional(),
        prompt: z.string().max(600),
        given: z.string().max(30),
        answer: z.string().max(30),
        ok: z.boolean(),
        at: integer,
        mission: integer.max(49),
        cards: z.array(z.string()).max(3),
      }),
    )
    .max(10000),
  run: runSchema.nullable(),
  sessions: z
    .array(
      z.object({
        id: z.string(),
        mission: integer.max(49),
        endedAt: integer,
        points: integer,
        stars: integer,
        correct: integer,
        replay: z.boolean(),
      }),
    )
    .max(1000)
    .default([]),
});
export type Player = z.infer<typeof profileSchema>;
export const saveSchema = z
  .object({
    version: z.literal(1),
    active: z.string(),
    players: z.array(profileSchema).min(1).max(100),
    settings: settingsSchema,
    updatedAt: integer,
  })
  .refine(
    (s) =>
      s.players.some((p) => p.id === s.active) &&
      new Set(s.players.map((p) => p.id)).size === s.players.length,
  );
export type Save = z.infer<typeof saveSchema>;
export const uid = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function newPlayer(name: string, id = uid(), avatar = 0): Player {
  return {
    id,
    name: name.trim().slice(0, 30) || "Penjelajah",
    avatar,
    points: 0,
    stars: 0,
    coins: 0,
    bonuses: 3,
    correct: 0,
    wrong: 0,
    completed: [],
    hand: [],
    safeSteps: 0,
    special: null,
    scans: [],
    answers: [],
    sessions: [],
    run: null,
  };
}
export const newSave = (): Save => ({
  version: 1,
  active: "penjelajah",
  players: [newPlayer("Penjelajah", "penjelajah")],
  settings: { ...DEFAULTS },
  updatedAt: 0,
});
export const isOpen = (p: Player, id: number) =>
  id === 0 || p.completed.includes(id - 1) || p.completed.includes(id);
export const nextMission = (p: Player) =>
  Math.min(49, MISSIONS.find((m) => !p.completed.includes(m.id))?.id ?? 49);
export const startRun = (p: Player, mission: number): Player =>
  p.run?.mission === mission && !p.run.finished
    ? p
    : {
        ...p,
        run: {
          id: uid(),
          startedAt: Date.now(),
          mission,
          checkpoint: 0,
          solved: false,
          collected: [],
          pointsAtStart: p.points,
          starsAtStart: p.stars,
          correctAtStart: p.correct,
          finished: false,
        },
      };
export function collect(
  p: Player,
  id: string,
  star: boolean,
  s: Settings,
): Player {
  if (!p.run || p.run.finished || p.run.collected.includes(id)) return p;
  return {
    ...p,
    stars: p.stars + Number(star),
    coins: p.coins + Number(!star),
    points: p.points + (star ? s.starPoints : 1),
    run: { ...p.run, collected: [...p.run.collected, id] },
  };
}
export function complete(p: Player, s: Settings): Player {
  if (
    !p.run ||
    p.run.finished ||
    !p.run.solved ||
    p.run.collected.filter((v) => v.startsWith("star")).length <
      MISSIONS[p.run.mission].target
  )
    return p;
  const id = p.run.mission;
  const fresh = !p.completed.includes(id);
  const completed = fresh ? [...p.completed, id] : p.completed;
  const levelDone =
    fresh &&
    MISSIONS.filter((m) => m.world === Math.floor(id / 10)).every((m) =>
      completed.includes(m.id),
    );
  const points =
    p.points + (fresh ? s.missionPoints : 0) + (levelDone ? s.levelPoints : 0);
  return {
    ...p,
    completed,
    points,
    sessions: [
      ...p.sessions,
      {
        id: p.run.id,
        mission: id,
        endedAt: Date.now(),
        points: points - p.run.pointsAtStart,
        stars: p.stars - p.run.starsAtStart,
        correct: p.correct - p.run.correctAtStart,
        replay: !fresh,
      },
    ].slice(-1000),
    run: { ...p.run, finished: true },
  };
}
export function useBonus(
  p: Player,
  kind: "points" | "steps" | "shuffle",
): Player {
  if (p.special?.value !== "star") return p;
  const available = p.bonuses > 0;
  const use = available ? kind : "shuffle";
  return {
    ...p,
    special: null,
    bonuses: Math.max(0, p.bonuses - 1),
    points: p.points + (use === "points" ? 10 : 0),
    safeSteps: use === "steps" ? 6 : p.safeSteps,
    hand: use === "shuffle" ? [] : p.hand,
  };
}
export type Question = {
  id: string;
  prompt: string;
  equation: string;
  answer: string;
  choices: string[];
  hint: string;
  cards: Card[];
  companion: number | null;
};
const shuffle = <T>(a: T[]) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};
export function generateQuestion(
  cards: Card[],
  mission: number,
  s: Settings,
  history: string[],
  allowCompanion = false,
): Question {
  const nums = cards
    .filter((c) => c.type === "number")
    .map((c) => Number(c.value));
  if (!nums.length || (!allowCompanion && nums.length < 2))
    throw Error(
      "Ambil dua kartu angka dari tumpukan fisikmu, lalu masukkan nilainya.",
    );
  if (nums.length > 2)
    throw Error(
      "Gunakan dua kartu angka saja. Simpan satu kartu untuk giliran berikutnya.",
    );
  const w = Math.floor(mission / 10),
    n = mission % 10,
    opCard = cards.find((c) => c.type === "operator");
  const limit = Math.min(
    s.maxNumber,
    n < 3 && s.difficulty === "mudah"
      ? 20
      : n < 6 && s.difficulty !== "menantang"
        ? 50
        : 100,
  );
  const isCompare = !!opCard && ["<", ">", "="].includes(String(opCard.value));
  let op = ["+", "−", "×", "÷", "+"][w];
  if (w === 4)
    op = opCard
      ? isCompare
        ? "banding"
        : String(opCard.value)
      : s.mixed[(n + history.length) % s.mixed.length];
  if (
    opCard &&
    ((w !== 4 && opCard.value !== op) ||
      (w === 4 && !s.mixed.includes(op as Settings["mixed"][number])))
  )
    throw Error(
      "Kartu operasi ini belum cocok dengan materi dunia ini. Ambil kartu operasi yang sesuai, atau gunakan dua kartu angka saja.",
    );
  const a = nums[0];
  let b = nums[1];
  let companion: number | null = null;
  if (b === undefined) {
    const max = Math.max(1, Math.min(10, limit - a));
    b =
      op === "÷"
        ? (Array.from({ length: Math.max(1, a) }, (_, i) => i + 1).filter(
            (x) => a % x === 0,
          )[0] ?? 1)
        : 1 + Math.floor(Math.random() * max);
    companion = b;
  }
  if (Math.max(a, b) > limit)
    throw Error(
      `Di misi ini angkanya sampai ${limit}. Simpan kartu yang lebih besar dan ambil kartu fisik lain.`,
    );
  const hi = Math.max(a, b),
    lo = Math.min(a, b);
  let result = 0;
  let hint = "Gunakan koin atau jarimu untuk menghitung pelan-pelan.";
  const forms: { equation: string; prompt: string; answer: string }[] = [];
  const add = (equation: string, prompt: string, answer: number | string) =>
    forms.push({ equation, prompt, answer: String(answer) });
  if (op === "+") {
    if (a + b <= limit) {
      result = a + b;
      add(`${a} + ${b} = ?`, "Berapa jumlah kedua kartu ini?", result);
      add(
        `${b} + ${a} = ?`,
        `Number Bot punya ${b} koin dan menemukan ${a} lagi. Berapa jumlahnya?`,
        result,
      );
    }
    add(
      `${lo} + □ = ${hi}`,
      "Berapa angka yang mengisi kotak kosong?",
      hi - lo,
    );
    hint = `Mulai dari ${lo}, lalu hitung maju satu per satu.`;
  } else if (op === "−") {
    add(
      `${hi} − ${lo} = ?`,
      `Ada ${hi} bintang. Sebanyak ${lo} bintang diberikan kepada teman. Berapa sisanya?`,
      hi - lo,
    );
    add(`${hi} − □ = ${lo}`, "Berapa bintang yang harus diambil?", hi - lo);
    add(`${hi} − ${lo} = ?`, "Hitung selisih kedua kartu angkamu.", hi - lo);
    hint = `Mulai dari ${hi}. Coba hitung mundur.`;
  } else if (op === "×") {
    if (
      a > 10 ||
      b > 10 ||
      a * b > limit ||
      (s.difficulty === "mudah" && n < 3 && Math.max(a, b) > 5)
    )
      throw Error(
        "Ambil dua kartu 1–5 untuk perkalian awal. Hasilnya harus berada dalam rentang misi.",
      );
    add(
      `${a} × ${b} = ?`,
      `Ada ${a} keranjang. Setiap keranjang berisi ${b} bintang. Berapa semuanya?`,
      a * b,
    );
    add(
      `${b} × ${a} = ?`,
      "Hitung jumlah bintang dalam kelompok yang sama banyak.",
      a * b,
    );
    if (a > 0)
      add(`${a} × □ = ${a * b}`, "Berapa bintang di setiap kelompok?", b);
    hint = `Coba buat ${a} kelompok berisi ${b} benda.`;
  } else if (op === "÷") {
    if (lo === 0 || hi % lo !== 0)
      throw Error(
        "Coba dua kartu yang bisa dibagi rata, misalnya 12 dan 3. Pembaginya tidak boleh nol.",
      );
    add(
      `${hi} ÷ ${lo} = ?`,
      `${hi} koin dibagikan rata kepada ${lo} teman. Berapa koin untuk setiap teman?`,
      hi / lo,
    );
    add(`${hi} ÷ □ = ${hi / lo}`, "Berapa kelompok yang sama banyak?", lo);
    hint = `Susun ${hi} benda menjadi ${lo} kelompok yang sama banyak.`;
  } else {
    const symbol = a < b ? "<" : a > b ? ">" : "=";
    if (isCompare && opCard?.value !== symbol)
      throw Error(
        "Coba balik urutan dua kartu angka atau ambil kartu perbandingan yang cocok.",
      );
    add(`${a}  □  ${b}`, "Pilih tanda perbandingan yang tepat.", symbol);
    hint = "Mulut tanda selalu menghadap bilangan yang lebih besar.";
  }
  const possible = forms.filter(
    (f) => !history.includes(f.prompt + " " + f.equation),
  );
  if (!possible.length)
    throw Error(
      "Hebat, kombinasi ini sudah kamu pecahkan! Ambil satu kartu angka fisik yang berbeda.",
    );
  const f =
    s.difficulty === "menantang"
      ? possible[possible.length - 1]
      : possible[n % possible.length];
  let choices: string[];
  if (op === "banding") choices = ["<", "=", ">"];
  else {
    const v = Number(f.answer);
    const pool = [v - 1, v + 1, v + 2, v - 2, v + 3].filter(
      (x) => x >= 0 && x !== v && x <= limit,
    );
    choices = shuffle([
      f.answer,
      ...shuffle([...new Set(pool)])
        .slice(0, 2)
        .map(String),
    ]);
  }
  return { ...f, id: uid(), choices, hint, cards: [...cards], companion };
}
export function recordAnswer(
  p: Player,
  q: Question,
  given: string,
  s: Settings,
  mission: number,
): Player {
  if (p.answers.some((a) => a.id === q.id && a.ok)) return p;
  const ok = given.trim() === q.answer;
  return {
    ...p,
    correct: p.correct + Number(ok),
    wrong: p.wrong + Number(!ok),
    points: p.points + (ok ? s.correctPoints : 0),
    hand: ok ? [] : p.hand,
    answers: [
      ...p.answers,
      {
        id: q.id,
        session: p.run && !p.run.finished ? p.run.id : "latihan",
        prompt: q.prompt + " " + q.equation,
        given: given.slice(0, 30),
        answer: q.answer,
        ok,
        at: Date.now(),
        mission,
        cards: q.cards.map((c) => c.card_id),
      },
    ].slice(-10000),
    run:
      p.run && p.run.mission === mission && ok
        ? { ...p.run, solved: true }
        : p.run,
  };
}
