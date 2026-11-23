import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CARDS,
  WORLDS,
  MISSIONS,
  parseCard,
  newPlayer,
  startRun,
  DEFAULTS,
  generateQuestion,
  recordAnswer,
  collect,
  complete,
  useBonus,
  saveSchema,
  newSave,
} from "../src/lib/game";
import {
  AdventureSim,
  type Callbacks,
  type Inputs,
} from "../src/game/simulation";
import QRCode from "qrcode";
import jsQR from "jsqr";
const nums = (a: number, b: number) => [CARDS[a], CARDS[b]];
test("Exactly 5 worlds, 50 distinct missions and 59 immutable physical card payloads", () => {
  assert.equal(WORLDS.length, 5);
  assert.equal(MISSIONS.length, 50);
  assert.equal(new Set(MISSIONS.map((m) => m.name)).size, 50);
  assert.equal(new Set(CARDS.map((c) => c.card_id)).size, 59);
  assert.equal(
    parseCard('{"type":"number","value":15,"card_id":"N009"}'),
    null,
  );
  assert.equal(parseCard("not a QR payload"), null);
});
test("All numeric, operator, comparison, star and zonk QR codes round-trip through jsQR", () => {
  for (const card of CARDS) {
    const qr = QRCode.create(JSON.stringify(card), {
      errorCorrectionLevel: "M",
    });
    const scale = 5,
      side = (qr.modules.size + 8) * scale,
      rgba = new Uint8ClampedArray(side * side * 4).fill(255);
    for (let y = 0; y < qr.modules.size; y++)
      for (let x = 0; x < qr.modules.size; x++)
        if (qr.modules.get(y, x))
          for (let j = 0; j < scale; j++)
            for (let i = 0; i < scale; i++) {
              const p =
                (((y + 4) * scale + j) * side + (x + 4) * scale + i) * 4;
              rgba[p] = rgba[p + 1] = rgba[p + 2] = 0;
            }
    const decoded = jsQR(rgba, side, side, { inversionAttempts: "dontInvert" });
    assert.deepEqual(parseCard(decoded!.data), card);
  }
});
test("Generator produces mathematically correct, bounded challenges and three unique choices", () => {
  let generated = 0;
  for (let w = 0; w < 5; w++)
    for (let a = 0; a <= 15; a++)
      for (let b = 0; b <= 15; b++) {
        try {
          const q = generateQuestion(
            nums(a, b),
            w * 10,
            { ...DEFAULTS, mixed: ["+"] },
            [],
          );
          assert.equal(q.choices.length, 3);
          assert.equal(new Set(q.choices).size, 3);
          assert(q.choices.includes(q.answer));
          const eq = q.equation.replace("□", q.answer).replace("?", q.answer);
          const m = eq.match(/^(\d+) ([+−×÷]) (\d+) = (\d+)$/);
          assert(m, eq);
          const x = +m[1],
            y = +m[3];
          const expected =
            m[2] === "+"
              ? x + y
              : m[2] === "−"
                ? x - y
                : m[2] === "×"
                  ? x * y
                  : x / y;
          assert.equal(expected, +m[4]);
          assert(Number.isInteger(expected) && expected >= 0 && expected <= 20);
          generated++;
        } catch (e) {
          if (e instanceof assert.AssertionError) throw e;
        }
      }
  assert(generated > 800);
  const q = generateQuestion(nums(9, 15), 0, DEFAULTS, []);
  assert.equal(q.equation, "9 + □ = 15");
  assert.equal(q.answer, "6");
  assert.throws(() => generateQuestion(nums(8, 3), 30, DEFAULTS, []));
  assert.throws(() => generateQuestion(nums(10, 0), 30, DEFAULTS, []));
  assert.throws(() => generateQuestion([CARDS[3]], 0, DEFAULTS, []));
  assert.notEqual(
    generateQuestion([CARDS[3]], 0, DEFAULTS, [], true).companion,
    null,
  );
});
test("No repeated question, mismatched operator or invalid comparison", () => {
  const q = generateQuestion(nums(9, 15), 0, DEFAULTS, []);
  assert.throws(() =>
    generateQuestion(nums(9, 15), 0, DEFAULTS, [q.prompt + " " + q.equation]),
  );
  assert.throws(() =>
    generateQuestion(
      [...nums(2, 3), CARDS.find((c) => c.value === "×")!],
      0,
      DEFAULTS,
      [],
    ),
  );
  const c = generateQuestion(
    [...nums(2, 3), CARDS.find((c) => c.value === "<")!],
    40,
    DEFAULTS,
    [],
  );
  assert.equal(c.answer, "<");
});
test("Wrong answer gives zero, correct answer and collected star are rewarded once", () => {
  let p = startRun(newPlayer("Bima"), 0),
    q = generateQuestion(nums(5, 7), 0, DEFAULTS, []);
  p = recordAnswer(p, q, "0", DEFAULTS, 0);
  assert.equal(p.wrong, 1);
  assert.equal(p.points, 0);
  p = recordAnswer(p, q, q.answer, DEFAULTS, 0);
  p = recordAnswer(p, q, q.answer, DEFAULTS, 0);
  assert.equal(p.correct, 1);
  assert.equal(p.points, 10);
  p = collect(p, "star-1", true, DEFAULTS);
  p = collect(p, "star-1", true, DEFAULTS);
  assert.equal(p.points, 15);
  assert.equal(p.stars, 1);
  p = complete(p, DEFAULTS);
  p = complete(p, DEFAULTS);
  assert.equal(p.points, 35);
  assert.deepEqual(p.completed, [0]);
  assert.equal(p.sessions.length, 1);
  assert.equal(p.sessions[0].points, 35);
  assert.equal(p.sessions[0].replay, false);
});
test("Three star bonuses are personal, persistent, and never reset on world change", () => {
  let p = newPlayer("Ayu");
  for (let i = 0; i < 3; i++) {
    p = useBonus({ ...p, special: { value: "star", id: String(i) } }, "points");
    p = useBonus(p, "points");
  }
  assert.equal(p.points, 30);
  assert.equal(p.bonuses, 0);
  p = startRun(p, 10);
  assert.equal(p.bonuses, 0);
  p = useBonus(
    { ...p, hand: nums(2, 3), special: { id: "4", value: "star" } },
    "points",
  );
  assert.equal(p.points, 30);
  assert.deepEqual(p.hand, []);
  assert.equal(newPlayer("Bima").bonuses, 3);
});
test("World completion and replay cannot duplicate a mission or level reward", () => {
  let p = startRun(newPlayer("Ayu"), 9);
  p.completed = Array.from({ length: 9 }, (_, i) => i);
  p.run!.solved = true;
  p.run!.collected = ["star-1"];
  p = complete(p, DEFAULTS);
  assert.equal(p.points, 70);
  p = startRun(p, 9);
  p.run!.solved = true;
  p.run!.collected = ["star-1"];
  p = complete(p, DEFAULTS);
  assert.equal(p.points, 70);
  assert.equal(p.completed.length, 10);
});
test("Simulation: walk, run, jump, double jump, pickups, checkpoint, gate, safe advance and fall recovery", () => {
  let picked = 0,
    cp = 0,
    asked = 0;
  const cb: Callbacks = {
    collect: () => picked++,
    checkpoint: (i) => (cp = i),
    challenge: () => asked++,
    finish: () => {},
    message: () => {},
    progress: () => {},
    sound: () => {},
  };
  const m = new AdventureSim(startRun(newPlayer("Nia"), 0).run!, DEFAULTS, cb);
  const input: Inputs = {
    x: 0,
    z: -1,
    run: false,
    jump: false,
    interact: false,
  };
  m.step(0.02, input);
  const walk = -m.z;
  assert(walk > 0);
  m.teleport(0, false);
  m.step(0.02, { ...input, run: true });
  assert(-m.z > walk);
  m.step(0.02, { ...input, jump: true });
  assert(m.y > 0 && m.motion === "jump");
  m.step(0.02, { ...input, jump: true });
  assert.equal(m.jumps, 2);
  m.teleport(1, false);
  m.step(0.02, { ...input, z: 0 });
  assert(picked > 0);
  m.teleport(2, false);
  m.at = 1;
  m.step(0.02, { ...input, z: 0 });
  assert.equal(cp, 2);
  m.teleport(3, false);
  m.step(0.02, { ...input, z: 0 });
  assert(asked > 0);
  m.teleport(0, false);
  m.safeAdvance();
  assert.equal(m.at, 3);
  m.setSolved(true);
  m.teleport(0, false);
  m.safeAdvance();
  assert.equal(m.at, 6);
  m.y = -6;
  m.step(0.02, input);
  assert.equal(m.at, m.checkpoint);
  assert(m.y > -1);
});
test("Save and restore validates profiles and rejects malformed data", () => {
  const s = newSave();
  s.players[0].name = "Nisa";
  s.players[0].bonuses = 1;
  s.players[0] = startRun(s.players[0], 0);
  assert.deepEqual(saveSchema.parse(JSON.parse(JSON.stringify(s))), s);
  assert.equal(
    saveSchema.safeParse({ ...s, active: "missing" }).success,
    false,
  );
  assert.equal(
    saveSchema.safeParse({ ...s, players: [{ name: "broken" }] }).success,
    false,
  );
});
