import type { AdventureSim } from "./simulation";
// Low-power isometric renderer uses the same 3D collision and checkpoint simulation.
export function fallbackRenderer(host: HTMLElement, sim: AdventureSim) {
  const c = document.createElement("canvas");
  host.appendChild(c);
  const ctx = c.getContext("2d")!;
  const avatar = new Image();
  avatar.src = "/art/number-bot.webp";
  let camX = sim.x,
    camZ = sim.z;
  return {
    render() {
      const w = host.clientWidth,
        h = host.clientHeight;
      if (c.width !== w || c.height !== h) {
        c.width = w;
        c.height = h;
      }
      camX += (sim.x - camX) * 0.08;
      camZ += (sim.z - camZ) * 0.08;
      const u = Math.max(15, Math.min(w / 20, h / 13));
      const map = (x: number, y: number, z: number) => ({
        x: w * 0.5 + (x - camX) * u + (z - camZ) * u * 0.32,
        y: h * 0.66 + (z - camZ) * u * 0.72 - y * u,
      });
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#58b9ef");
      grad.addColorStop(1, "#e5f9fa");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#fff2af";
      ctx.beginPath();
      ctx.arc(w * 0.81, h * 0.18, u * 1.25, 0, 7);
      ctx.fill();
      for (let i = 0; i < 7; i++) {
        const cx = ((i * 193 + sim.time * 3) % (w + 160)) - 60,
          cy = 50 + (i % 4) * 41;
        for (let k = 0; k < 3; k++) {
          ctx.fillStyle = "#ffffffc9";
          ctx.beginPath();
          ctx.ellipse(
            cx + k * 21,
            cy - (k % 2) * 7,
            28,
            12 + (k % 2) * 7,
            0,
            0,
            7,
          );
          ctx.fill();
        }
      }
      const poly = (pts: { x: number; y: number }[], color: string) => {
        ctx.beginPath();
        pts.forEach((p, i) =>
          i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y),
        );
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      };
      for (const p of [...sim.platforms].reverse()) {
        const a = map(p.x - p.w / 2, p.y, p.z - p.d / 2),
          b = map(p.x + p.w / 2, p.y, p.z - p.d / 2),
          d = map(p.x - p.w / 2, p.y, p.z + p.d / 2),
          e = map(p.x + p.w / 2, p.y, p.z + p.d / 2);
        if (d.y < -u * 3 || a.y > h + u * 3) continue;
        poly(
          [d, e, { x: e.x - 10, y: e.y + 30 }, { x: d.x + 14, y: d.y + 39 }],
          "#b88550",
        );
        poly(
          [e, b, { x: b.x - 8, y: b.y + 30 }, { x: e.x - 10, y: e.y + 30 }],
          "#956d4d",
        );
        poly(
          [a, b, e, d],
          ["#92d465", "#59b983", "#aa91d0", "#5bcac1", "#c6d984"][
            Math.floor(sim.mission / 10)
          ],
        );
        const q = map(p.x, p.y, p.z);
        ctx.fillStyle = "#ffffffb0";
        ctx.font = `900 ${u * 0.82}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(String(p.id + 1), q.x, q.y + 8);
        for (const o of sim.pickups.filter(
          (o) => o.platform === p.id && !sim.taken.has(o.id),
        )) {
          const t = map(p.x + o.offset, p.y + 1.1, p.z);
          ctx.fillStyle = "#ffce42";
          ctx.strokeStyle = "#c6840e";
          ctx.lineWidth = 2;
          ctx.font = `bold ${u * 1.3}px sans-serif`;
          ctx.strokeText(o.star ? "★" : "●", t.x, t.y);
          ctx.fillText(o.star ? "★" : "●", t.x, t.y);
        }
        if (p.id === 3 && !sim.solved) {
          ctx.fillStyle = "#fff";
          ctx.fillRect(q.x - 13, q.y - 42, 26, 30);
          ctx.fillStyle = "#7950ae";
          ctx.font = "bold 22px sans-serif";
          ctx.fillText("?", q.x, q.y - 19);
        }
        if (p.id === sim.last) {
          ctx.strokeStyle = "#fff29c";
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.ellipse(q.x, q.y - u, 1.1 * u, 1.6 * u, 0, 0, 7);
          ctx.stroke();
        }
      }
      const pos = map(sim.x, sim.y + 0.5, sim.z);
      ctx.fillStyle = "#273b3b35";
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y + u * 0.4, u * 0.6, u * 0.23, 0, 0, 7);
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(pos.x - u * 0.57, pos.y - u * 1.3, u * 1.14, u * 1.45, 12);
      ctx.clip();
      if (avatar.complete)
        ctx.drawImage(
          avatar,
          pos.x - u * 0.72,
          pos.y - u * 1.4,
          u * 1.44,
          u * 1.64,
        );
      ctx.restore();
    },
    dispose() {
      c.remove();
    },
  };
}
