import { chromium } from "@playwright/test";
import { strict as assert } from "node:assert";
import QRCode from "qrcode";
import fs from "node:fs/promises";
const base = process.env.TEST_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 1,
});
const errors = [];
const page = await context.newPage();
page.setDefaultTimeout(20000);
page.on("pageerror", (e) => errors.push(e.message));
await fs.mkdir(".artifacts", { recursive: true });
// Controlled QR video frames exercise the real camera reader without a physical camera.
await context.addInitScript(() => {
  window.__testTracks = [];
  navigator.mediaDevices.getUserMedia = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    let image = null,
      prev = "";
    const draw = () => {
      if (prev !== window.__testQr) {
        prev = window.__testQr;
        image = new Image();
        if (prev) image.src = prev;
      }
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, 480, 360);
      if (image?.complete && image.naturalWidth)
        ctx.drawImage(image, 110, 50, 260, 260);
    };
    draw();
    const stream = canvas.captureStream(10);
    const track = stream.getVideoTracks()[0];
    window.__testTracks.push(track);
    const tick = setInterval(() => {
      if (track.readyState === "ended") clearInterval(tick);
      else draw();
    }, 90);
    return stream;
  };
});
const getSave = () =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem("number-jump.classroom.v1")),
  );
const player = async () => {
  const s = await getSave();
  return s.players.find((p) => p.id === s.active);
};
const home = () =>
  page.getByRole("button", { name: "Kartu Berburu Poin, Beranda" }).click();
const teacher = async () => {
  await page.getByRole("button", { name: "Ruang Guru", exact: true }).click();
  await page
    .getByRole("button", { name: "Masuk Ruang Guru", exact: true })
    .click();
};
const manual = async (id, kind = "number") => {
  await page.getByRole("button", { name: "Input Manual", exact: true }).click();
  await page.getByLabel(/^Jenis kartu/).selectOption(kind);
  await page.getByLabel("Nilai pada kartu fisik").selectOption(id);
  await page.getByRole("button", { name: "Tambahkan Kartu" }).click();
};
const choose = async (value, correct) => {
  const values = await page.locator(".answer-options>button").allTextContents();
  const index = values.findIndex(
    (x) => (x.slice(1).trim() === String(value)) === correct,
  );
  assert(index >= 0, JSON.stringify(values));
  await page.locator(".answer-options>button").nth(index).click();
  await page.getByRole("button", { name: "Periksa Jawaban" }).click();
};
const qrImage = async (c) => {
  const u = await QRCode.toDataURL(JSON.stringify(c), {
    width: 360,
    margin: 4,
  });
  await page.evaluate((url) => (window.__testQr = url), u);
};
try {
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator(".world-card").count(), 5);
  await page.screenshot({
    path: ".artifacts/desktop-1280.png",
    fullPage: true,
  });
  console.log("PASS main menu and five illustrated worlds");
  await teacher();
  await page.getByRole("button", { name: "Tambah Siswa", exact: true }).click();
  await page.getByLabel("Nama panggilan", { exact: true }).fill("Ayu Uji");
  await page.getByRole("button", { name: "Simpan Profil" }).click();
  await page.getByRole("button", { name: "Lihat progres Ayu Uji" }).click();
  assert.equal(await page.locator(".student-world").count(), 5);
  await page.getByRole("button", { name: "Tutup", exact: true }).click();
  const csv = page.waitForEvent("download");
  await page.getByRole("button", { name: "Ekspor CSV" }).click();
  assert.equal((await csv).suggestedFilename(), "laporan-number-jump.csv");
  await page.getByRole("button", { name: "Generator QR", exact: true }).click();
  await page.locator(".qr-preview img").waitFor();
  const png = page.waitForEvent("download");
  await page.getByRole("button", { name: "Unduh PNG" }).click();
  assert.equal((await png).suggestedFilename(), "Kartu-N009.png");
  await page.getByRole("button", { name: "Paket lengkap · 59 kartu" }).click();
  assert.equal(await page.locator(".queue-chips button").count(), 59);
  await page.evaluate(
    () => (window.print = () => (window.__printChecked = true)),
  );
  await page.getByRole("button", { name: "Cetak kartu", exact: true }).click();
  await page.waitForFunction(() => window.__printChecked);
  assert.equal(await page.locator(".print-page").count(), 7);
  assert.equal(await page.locator(".print-sheet .print-card").count(), 59);
  await page.screenshot({ path: ".artifacts/teacher-qr.png" });
  console.log(
    "PASS classroom profiles, progress, CSV, QR PNG and complete A4 sheets",
  );
  await home();
  await page.getByRole("button", { name: /Pilih pemain:/ }).click();
  await page
    .getByLabel("Profil tersimpan")
    .selectOption({ label: "Ayu Uji · 0 poin" });
  await page.getByRole("button", { name: "Gunakan Pemain" }).click();
  assert.equal((await player()).name, "Ayu Uji");
  await qrImage({ type: "number", value: 9, card_id: "N009" });
  await page
    .locator(".hero-actions")
    .getByRole("button", { name: "Scan Kartu" })
    .click();
  await page.waitForFunction(
    () => document.querySelectorAll(".hand-card").length === 1,
  );
  await page.waitForFunction(() =>
    window.__testTracks.every((t) => t.readyState === "ended"),
  );
  await page.getByRole("button", { name: "Scan berikutnya" }).click();
  await page.waitForTimeout(1000);
  assert.equal(await page.locator(".hand-card").count(), 1);
  await qrImage({ type: "operator", value: "+", card_id: "OP_ADD" });
  await page.waitForFunction(
    () => document.querySelectorAll(".hand-card").length === 2,
  );
  await manual("N015");
  await page.getByRole("button", { name: "Konfirmasi & Buat Soal" }).click();
  assert.equal(await page.locator(".equation").textContent(), "9 + □ = 15");
  await choose(6, false);
  assert(await page.getByText("Belum tepat. Yuk, coba lagi!").isVisible());
  assert.equal((await player()).points, 0);
  await choose(6, true);
  await page.getByRole("button", { name: "Lanjutkan Petualangan" }).click();
  assert.equal((await player()).points, 10);
  assert.equal((await player()).wrong, 1);
  assert.equal(
    (await player()).scans.filter((s) => s.source === "QR").length,
    2,
  );
  console.log(
    "PASS actual camera decode, duplicate guard, stream cleanup, manual combination, wrong/correct response",
  );
  await page
    .locator(".hero-actions")
    .getByRole("button", { name: "Scan Kartu" })
    .click();
  await manual("SP_STAR", "special");
  await page.getByRole("button", { name: /Bonus \+10 poin/ }).click();
  assert.equal((await player()).points, 20);
  assert.equal((await player()).bonuses, 2);
  await manual("SP_ZONK", "special");
  await page.getByRole("button", { name: "Lanjutkan", exact: true }).click();
  assert.equal((await player()).points, 20);
  await page.getByRole("button", { name: "Tutup", exact: true }).click();
  await page.reload({ waitUntil: "networkidle" });
  assert.equal((await player()).points, 20);
  assert.equal((await player()).bonuses, 2);
  const backup = await page.evaluate(async () => {
    const key = localStorage.getItem("number-jump.classroom.v1.key");
    return (
      await fetch("/api/progress", {
        headers: { Authorization: "Bearer " + key },
      })
    ).json();
  });
  assert(
    backup.state.players.some((p) => p.name === "Ayu Uji" && p.points === 20),
  );
  console.log(
    "PASS star, safe zonk, profile isolation, refresh and PostgreSQL synchronization",
  );
  await page
    .getByRole("button", { name: "Mulai Petualangan", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Mulai Bermain", exact: true })
    .click();
  await page.locator(".render-host canvas").waitFor({ timeout: 40000 });
  await page.waitForFunction(
    () => document.querySelector(".render-host")?.dataset.position,
  );
  await page.screenshot({ path: ".artifacts/game-start.png" });
  assert.equal(
    await page.locator(".fallback-label").count(),
    0,
    "WebGL should render on SwiftShader",
  );
  await page.keyboard.down("d");
  await page.waitForFunction(
    () =>
      Number(
        document.querySelector(".render-host").dataset.position.split(",")[0],
      ) > 0.2,
  );
  await page.keyboard.up("d");
  await page.keyboard.down("Shift");
  await page.keyboard.down("a");
  await page.waitForFunction(
    () => document.querySelector(".render-host").dataset.motion === "run",
  );
  await page.keyboard.up("a");
  await page.keyboard.up("Shift");
  await page.keyboard.press("Space");
  await page.waitForFunction(
    () =>
      Number(
        document.querySelector(".render-host").dataset.position.split(",")[1],
      ) > 0.1,
  );
  await page.keyboard.press("Space");
  await page.waitForFunction(
    () => document.querySelector(".render-host").dataset.motion === "double",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Kembali ke checkpoint" }).click();
  console.log(
    "PASS WebGL rendering, movement, running, jump, double jump, pause and checkpoint",
  );
  // Drive using only player controls and rendered position, never changing game state.
  await page.evaluate(() => {
    let last = -1;
    window.__walk = setInterval(() => {
      if (document.querySelector('[role="dialog"]')) {
        window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyW" }));
        return;
      }
      const h = document.querySelector(".render-host");
      if (!h) return;
      const [x, y, z] = h.dataset.position.split(",").map(Number);
      const dist = -z,
        platform = Math.floor((dist + 2.6) / 5.5),
        offset = dist - platform * 5.5;
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyW" }));
      if (offset > 1.35 && offset < 2.65 && last !== platform) {
        last = platform;
        window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space" }));
        window.dispatchEvent(new KeyboardEvent("keyup", { code: "Space" }));
      }
    }, 25);
  });
  await page
    .getByRole("dialog", { name: "Scan Kartu" })
    .waitFor({ timeout: 90000 });
  assert((await player()).stars > 0);
  assert((await player()).run.checkpoint >= 2);
  await manual("N002");
  await manual("N003");
  await page.getByRole("button", { name: "Konfirmasi & Buat Soal" }).click();
  await choose(5, true);
  await page.getByRole("button", { name: "Lanjutkan Petualangan" }).click();
  await page
    .getByRole("dialog", { name: "Misi Selesai!" })
    .waitFor({ timeout: 90000 });
  await page.evaluate(() => clearInterval(window.__walk));
  assert((await player()).completed.includes(0));
  await page.screenshot({ path: ".artifacts/mission-complete.png" });
  console.log(
    "PASS platform traversal, stars, checkpoint, physical card gate, portal and mission result",
  );
  await page
    .getByRole("button", { name: "Beranda", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "Pilih Level", exact: true }).click();
  assert.equal(await page.locator(".mission-tile.available").count(), 2);
  await page
    .getByRole("button", { name: "Koleksi Kartu", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Ditemukan", exact: true }).click();
  assert((await page.locator(".collection-item").count()) >= 6);
  await page.locator(".collection-item").first().click();
  assert(
    await page.getByRole("button", { name: "Pindai kartu fisik" }).isVisible(),
  );
  await page.getByRole("button", { name: "Tutup", exact: true }).click();
  console.log("PASS level progression and physical card collection");
  await home();
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page
    .getByRole("button", { name: "Mulai Petualangan", exact: true })
    .waitFor();
  assert.equal((await player()).completed.length, 1);
  await context.setOffline(false);
  console.log("PASS offline reload, saved mission and player progress");
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  const phone = await mobile.newPage();
  phone.on("pageerror", (e) => errors.push(e.message));
  await phone.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type.includes("webgl")) return null;
      return orig.call(this, type, ...args);
    };
  });
  await phone.goto(base, { waitUntil: "networkidle" });
  await phone.screenshot({ path: ".artifacts/phone.png", fullPage: true });
  assert.equal(
    await phone.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await phone.getByRole("button", { name: "Menu navigasi" }).click();
  await phone
    .locator(".mobile-nav")
    .getByRole("button", { name: "Peta Dunia" })
    .click();
  await phone
    .getByRole("button", { name: "Kartu Berburu Poin, Beranda" })
    .click();
  await phone
    .getByRole("button", { name: "Mulai Petualangan", exact: true })
    .click();
  await phone
    .getByRole("button", { name: "Mulai Bermain", exact: true })
    .click();
  await phone.locator(".fallback-label").waitFor();
  assert(
    await phone
      .getByRole("button", { name: "Lompat", exact: true })
      .isVisible(),
  );
  await phone.getByRole("button", { name: "Lompat", exact: true }).tap();
  await phone.waitForFunction(
    () =>
      +document.querySelector(".render-host").dataset.position.split(",")[1] >
      0.1,
  );
  await phone.screenshot({ path: ".artifacts/phone-game.png" });
  await mobile.close();
  console.log(
    "PASS mobile layout, touch controls, navigation and playable WebGL fallback",
  );
  assert.deepEqual(errors, []);
  console.log("ALL BROWSER TESTS PASSED");
} catch (error) {
  console.error("TEST FAILURE", error);
  console.log("Location:", page.url(), "Errors:", errors);
  console.log("Player:", JSON.stringify(await player()).slice(-1800));
  await page
    .screenshot({ path: ".artifacts/test-failure.png" })
    .catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
