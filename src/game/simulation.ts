import { MISSIONS, type Player, type Settings } from "@/lib/game";
export type Platform = {
  id: number;
  x: number;
  baseX: number;
  y: number;
  z: number;
  w: number;
  d: number;
  moving: boolean;
};
export type Pickup = {
  id: string;
  platform: number;
  star: boolean;
  offset: number;
};
export type Inputs = {
  x: number;
  z: number;
  run: boolean;
  jump: boolean;
  interact: boolean;
};
export type Motion =
  | "idle"
  | "walk"
  | "run"
  | "jump"
  | "double"
  | "fall"
  | "land"
  | "celebrate"
  | "surprised"
  | "scan"
  | "think"
  | "victory";
export type Callbacks = {
  collect: (id: string, star: boolean) => void;
  checkpoint: (i: number) => void;
  challenge: () => void;
  finish: () => void;
  message: (t: string) => void;
  progress: (i: number, total: number) => void;
  sound: (s: "jump" | "coin" | "star" | "portal") => void;
};
export class AdventureSim {
  platforms: Platform[] = [];
  pickups: Pickup[] = [];
  taken: Set<string>;
  x = 0;
  y = 0;
  z = 0;
  vy = 0;
  heading = 0;
  ground = 0;
  at = 0;
  checkpoint = 0;
  time = 0;
  jumps = 0;
  motion: Motion = "idle";
  motionUntil = 0;
  solved = false;
  ended = false;
  gateAsked = false;
  paused = false;
  pose: Motion | null = null;
  lastBump = 0;
  mission: number;
  target: number;
  last = 0;
  settings: Settings;
  cb: Callbacks;
  constructor(
    run: NonNullable<Player["run"]>,
    settings: Settings,
    cb: Callbacks,
  ) {
    this.mission = run.mission;
    this.settings = settings;
    this.cb = cb;
    this.target = MISSIONS[this.mission].target;
    this.solved = run.solved;
    this.taken = new Set(run.collected);
    this.checkpoint = run.checkpoint;
    const n = MISSIONS[this.mission].platforms;
    this.last = n - 1;
    for (let i = 0; i < n; i++) {
      const x =
        i === 0
          ? 0
          : Math.sin(i * 0.8 + this.mission * 0.5) *
            (1 + (this.mission % 4) * 0.3);
      this.platforms.push({
        id: i,
        x,
        baseX: x,
        y: i === 0 ? 0 : Math.sin(i * 1.2) * 0.22,
        z: -i * 5.5,
        w: i === 0 || i === n - 1 ? 6.8 : 5.5,
        d: 4.65,
        moving: (i === 4 || i === 6) && this.mission % 3 !== 0,
      });
      if (i > 0 && i < n - 1) {
        const star = i === 1 || i === 2 || i === 5;
        this.pickups.push({
          id: (star ? "star" : "coin") + "-" + i,
          platform: i,
          star,
          offset: 0,
        });
        if (i % 2 === 0)
          this.pickups.push({
            id: "coin-edge-" + i,
            platform: i,
            star: false,
            offset: 1.5,
          });
      }
    }
    this.teleport(this.checkpoint, false);
  }
  teleport(i: number, announce = true) {
    const p = this.platforms[Math.max(0, Math.min(this.last, i))];
    this.x = p.x;
    this.y = p.y;
    this.z = p.z;
    this.vy = 0;
    this.jumps = 0;
    this.ground = p.id;
    this.at = p.id;
    this.cb.progress(p.id, this.last);
    if (announce) this.cb.message("Kembali ke checkpoint. Semua poinmu aman!");
  }
  safeAdvance() {
    const requested = this.at + 6;
    const dest = Math.min(requested, this.solved ? this.last : 3);
    this.teleport(dest, false);
    this.checkpoint = dest;
    this.cb.checkpoint(dest);
    this.cb.message(
      dest < requested
        ? "Mendarat di jalur aman terdekat. Periksa gerbang dan bintangmu."
        : "Enam langkah aman berhasil!",
    );
  }
  setSolved(value: boolean) {
    if (value && !this.solved) {
      this.motion = "celebrate";
      this.motionUntil = this.time + 1.3;
      this.cb.sound("portal");
    }
    this.solved = value;
  }
  step(dt: number, input: Inputs) {
    if (this.paused || this.ended) return;
    dt = Math.min(0.04, Math.max(0.001, dt));
    this.time += dt;
    const oldY = this.y,
      oldZ = this.z;
    const oldGround = this.ground;
    for (const p of this.platforms) {
      if (p.moving) {
        const old = p.x;
        p.x = p.baseX + Math.sin(this.time * 0.65 + p.id) * 0.85;
        if (this.ground === p.id) this.x += p.x - old;
      }
    }
    let dx = input.x,
      dz = input.z;
    const len = Math.hypot(dx, dz);
    if (len > 1) {
      dx /= len;
      dz /= len;
    }
    const speed = input.run ? 7.7 : 4.9;
    if (
      input.jump &&
      (this.ground >= 0 || (this.settings.doubleJump && this.jumps < 2))
    ) {
      this.vy = this.jumps ? 6.3 : 7.3;
      this.jumps++;
      this.ground = -1;
      this.cb.sound("jump");
    }
    this.x += dx * dt * speed;
    this.z += dz * dt * speed;
    this.vy -= 18.8 * dt;
    this.y += this.vy * dt;
    if (len > 0.06) this.heading = Math.atan2(dx, dz);
    if (!this.solved && this.z < this.platforms[3].z - 1.5)
      this.z = this.platforms[3].z - 1.5;
    this.ground = -1;
    if (this.vy <= 0) {
      for (const p of this.platforms) {
        if (
          Math.abs(this.x - p.x) <= p.w / 2 + 0.12 &&
          Math.abs(this.z - p.z) <= p.d / 2 + 0.12 &&
          oldY >= p.y - 0.095 &&
          this.y <= p.y + 0.03
        ) {
          this.y = p.y;
          this.vy = 0;
          this.ground = p.id;
          this.jumps = 0;
          break;
        }
      }
      // A real walkable bridge appears after solving the physical-card gate.
      if (
        this.solved &&
        this.ground < 0 &&
        this.z < this.platforms[3].z &&
        this.z > this.platforms[4].z &&
        Math.abs(this.x - (this.platforms[3].x + this.platforms[4].x) / 2) <
          1.5 &&
        oldY >= -0.34 &&
        this.y <= -0.23
      ) {
        this.y = -0.23;
        this.vy = 0;
        this.ground = 3;
        this.jumps = 0;
      }
    }
    if (this.ground >= 0 && oldGround < 0) {
      this.motion = "land";
      this.motionUntil = this.time + 0.12;
    }
    if (this.ground >= 0 && this.at !== this.ground) {
      this.at = this.ground;
      this.cb.progress(this.at, this.last);
      if (
        this.at % 2 === 0 &&
        this.at > this.checkpoint &&
        this.at < this.last
      ) {
        this.checkpoint = this.at;
        this.cb.checkpoint(this.at);
        this.cb.message("Checkpoint aktif! Progresmu tersimpan.");
      }
    }
    if (
      this.at === 3 &&
      this.ground === 3 &&
      !this.solved &&
      !this.gateAsked &&
      Math.abs(this.z - this.platforms[3].z) < 1.45
    ) {
      this.gateAsked = true;
      this.cb.challenge();
    }
    for (const obj of this.pickups) {
      if (this.taken.has(obj.id)) continue;
      const p = this.platforms[obj.platform];
      if (
        Math.hypot(this.x - p.x - obj.offset, this.z - p.z) < 1.2 &&
        Math.abs(this.y - p.y) < 2.25
      ) {
        this.taken.add(obj.id);
        this.cb.collect(obj.id, obj.star);
        this.cb.sound(obj.star ? "star" : "coin");
      }
    }
    // A soft bumper is off the central path. Jump over it or walk around it.
    if (this.mission % 2 && this.at === 4 && this.ground === 4) {
      const p = this.platforms[4];
      if (
        Math.hypot(this.x - p.x - 1.55, this.z - p.z - 0.3) < 0.72 &&
        this.time - this.lastBump > 1.2
      ) {
        this.lastBump = this.time;
        this.x -= 0.7;
        this.z = oldZ + 0.25;
        this.motion = "surprised";
        this.motionUntil = this.time + 0.5;
        this.cb.message("Hop! Lewati batu dari samping atau dengan melompat.");
      }
    }
    if (this.y < -5) {
      this.teleport(this.checkpoint);
      this.motion = "surprised";
      this.motionUntil = this.time + 0.6;
      return;
    }
    if (
      this.at === this.last &&
      this.ground === this.last &&
      Math.abs(this.z - this.platforms[this.last].z) < 1.4
    ) {
      if (
        this.solved &&
        [...this.taken].filter((x) => x.startsWith("star")).length >=
          this.target
      ) {
        this.ended = true;
        this.motion = "victory";
        this.cb.finish();
      } else if (input.interact || this.time - this.lastBump > 4) {
        this.lastBump = this.time;
        this.cb.message(
          "Cari Energy Star yang masih tertinggal sebelum masuk portal.",
        );
      }
    }
    if (input.interact && !this.ended) {
      if (!this.solved) {
        this.gateAsked = true;
        this.cb.challenge();
      } else
        this.cb.message("Gerbang sudah terbuka. Ikuti bintang menuju portal!");
    }
    if (this.time > this.motionUntil && !this.ended)
      this.motion =
        this.ground < 0
          ? this.vy < 0
            ? "fall"
            : this.jumps > 1
              ? "double"
              : "jump"
          : len > 0.06
            ? input.run
              ? "run"
              : "walk"
            : "idle";
  }
}
