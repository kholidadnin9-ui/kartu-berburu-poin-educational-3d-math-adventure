import * as T from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { AdventureSim, Motion } from "./simulation";
export function renderer3d(
  host: HTMLElement,
  sim: AdventureSim,
  avatar: number,
) {
  const render = new T.WebGLRenderer({
    antialias: sim.settings.quality === "tinggi",
    alpha: false,
    powerPreference: "low-power",
  });
  render.setPixelRatio(
    Math.min(
      window.devicePixelRatio,
      sim.settings.quality === "tinggi" ? 1.6 : 1,
    ),
  );
  render.shadowMap.enabled = sim.settings.quality === "tinggi";
  render.shadowMap.type = T.PCFSoftShadowMap;
  render.outputColorSpace = T.SRGBColorSpace;
  render.toneMapping = T.ACESFilmicToneMapping;
  render.toneMappingExposure = 1.04;
  host.appendChild(render.domElement);
  render.domElement.setAttribute(
    "aria-label",
    "Arena platformer 3D Number Bot",
  );
  const scene = new T.Scene(),
    camera = new T.PerspectiveCamera(49, 1, 0.12, 160);
  const world = Math.floor(sim.mission / 10);
  const sky = ["#79ccf3", "#8bcecf", "#b8a5ea", "#70cced", "#fac4ae"][world],
    grass = ["#78c03a", "#3fa34f", "#9774ba", "#45b38a", "#8fbf59"][world];
  scene.background = new T.Color(sky);
  scene.fog = new T.Fog(sky, 35, 115);
  const hemi = new T.HemisphereLight(0xfffae6, 0x92afbd, 1.55);
  scene.add(hemi);
  const sun = new T.DirectionalLight(0xffefcf, 2.7);
  sun.position.set(-14, 30, 9);
  sun.castShadow = render.shadowMap.enabled;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -25,
    right: 25,
    top: 35,
    bottom: -35,
    near: 0.2,
    far: 100,
  });
  sun.shadow.normalBias = 0.035;
  sun.target.position.set(0, 0, -20);
  scene.add(sun, sun.target);
  const materials = new Map<string, T.MeshStandardMaterial>(),
    geos = new Map<string, T.BufferGeometry>();
  const mat = (color: string, metal = 0, rough = 0.65) => {
    const key = color + metal + rough;
    if (!materials.has(key))
      materials.set(
        key,
        new T.MeshStandardMaterial({
          color,
          metalness: metal,
          roughness: rough,
        }),
      );
    return materials.get(key)!;
  };
  const mesh = (
    parent: T.Object3D,
    geo: T.BufferGeometry,
    m: T.Material,
    x = 0,
    y = 0,
    z = 0,
  ) => {
    const o = new T.Mesh(geo, m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  };
  function geo(key: string, fn: () => T.BufferGeometry) {
    if (!geos.has(key)) geos.set(key, fn());
    return geos.get(key)!;
  }
  const box = (
    p: T.Object3D,
    w: number,
    h: number,
    d: number,
    m: T.Material,
    x = 0,
    y = 0,
    z = 0,
    r = 0.1,
  ) =>
    mesh(
      p,
      geo(
        `b${w},${h},${d},${r}`,
        () =>
          new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 3, h / 3, d / 3)),
      ),
      m,
      x,
      y,
      z,
    );
  const sphere = (
    p: T.Object3D,
    r: number,
    m: T.Material,
    x = 0,
    y = 0,
    z = 0,
  ) =>
    mesh(
      p,
      geo("s" + r, () => new T.SphereGeometry(r, 12, 10)),
      m,
      x,
      y,
      z,
    );
  const rock = (p: T.Object3D, r: number, m: T.Material, x = 0, y = 0, z = 0) =>
    mesh(
      p,
      geo("r" + r, () => new T.IcosahedronGeometry(r, 0)),
      m,
      x,
      y,
      z,
    );
  const cylinder = (
    p: T.Object3D,
    a: number,
    b: number,
    h: number,
    m: T.Material,
    x = 0,
    y = 0,
    z = 0,
    segs = 12,
  ) =>
    mesh(
      p,
      geo(
        `c${a},${b},${h},${segs}`,
        () => new T.CylinderGeometry(a, b, h, segs),
      ),
      m,
      x,
      y,
      z,
    );
  const group = (p: T.Object3D, x = 0, y = 0, z = 0) => {
    const g = new T.Group();
    p.add(g);
    g.position.set(x, y, z);
    return g;
  };
  const blockers: T.Object3D[] = [];
  const textures: T.Texture[] = [];
  const backdrop = new T.TextureLoader().load("/art/sky-panorama.webp");
  backdrop.colorSpace = T.SRGBColorSpace;
  scene.background = backdrop;
  textures.push(backdrop);
  const envCanvas = document.createElement("canvas");
  envCanvas.width = 128;
  envCanvas.height = 64;
  const ec = envCanvas.getContext("2d")!;
  const eg = ec.createLinearGradient(0, 0, 0, 64);
  eg.addColorStop(0, "#87c2e9");
  eg.addColorStop(0.44, "#f2f8ff");
  eg.addColorStop(0.5, "#ffe7a9");
  eg.addColorStop(1, "#bdc999");
  ec.fillStyle = eg;
  ec.fillRect(0, 0, 128, 64);
  ec.fillStyle = "#ffffff";
  ec.fillRect(16, 9, 25, 19);
  ec.fillRect(77, 15, 15, 9);
  const env = new T.CanvasTexture(envCanvas);
  env.mapping = T.EquirectangularReflectionMapping;
  env.colorSpace = T.SRGBColorSpace;
  scene.environment = env;
  scene.environmentIntensity = 0.45;
  textures.push(env);
  const white = mat("#fffaf1", 0.14, 0.28),
    gold = mat(
      ["#eeb331", "#30b7b8", "#b38be3"][avatar] || "#eeb331",
      0.48,
      0.27,
    ),
    black = mat("#26313e", 0.34, 0.3),
    visor = mat("#142333", 0.42, 0.16),
    bark = mat("#987150"),
    leaf = mat(world === 1 ? "#348b52" : "#71b63c"),
    leaf2 = mat("#a2cd4e"),
    stone = mat("#b79877"),
    cream = mat("#edf0d9"),
    sunGold = mat("#ffc32c", 0.36, 0.26);
  const glow = new T.MeshStandardMaterial({
    color: "#ffe575",
    emissive: "#ffbb2b",
    emissiveIntensity: 0.7,
    roughness: 0.3,
  });
  function tree(p: T.Object3D, x: number, z: number, k = 1) {
    const g = group(p, x, 0, z);
    g.scale.setScalar(k);
    cylinder(g, 0.13, 0.22, 1.15, bark, 0, 0.55, 0);
    const t = sphere(g, 0.77, leaf, 0, 1.55, 0);
    t.scale.y = 1.18;
    blockers.push(t);
    sphere(g, 0.51, leaf2, -0.38, 1.45, 0.09);
    sphere(g, 0.48, leaf, 0.39, 1.4, -0.11);
  }
  function flower(p: T.Object3D, x: number, z: number, col: string) {
    cylinder(p, 0.025, 0.025, 0.22, leaf, x, 0.12, z, 5);
    const f = sphere(p, 0.12, mat(col), x, 0.27, z);
    f.scale.y = 0.46;
    sphere(p, 0.055, sunGold, x, 0.315, z);
  }
  const platforms: T.Group[] = [],
    items: { id: string; mesh: T.Object3D; star: boolean; phase: number }[] =
      [];
  const starShape = new T.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5,
      r = i % 2 ? 0.25 : 0.52;
    if (!i) starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  starShape.closePath();
  const starGeo = new T.ExtrudeGeometry(starShape, {
    depth: 0.15,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.052,
    bevelThickness: 0.045,
  });
  starGeo.center();
  function label(
    p: T.Object3D,
    text: string,
    x: number,
    y: number,
    z: number,
    color = "#fff5bf",
    size = 1.6,
  ) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 160px sans-serif";
    ctx.fillText(text, 128, 137);
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    textures.push(tex);
    const m = new T.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
    });
    const q = mesh(p, new T.PlaneGeometry(size, size), m, x, y, z);
    q.rotation.x = -Math.PI / 2;
    q.castShadow = false;
  }
  for (const p of sim.platforms) {
    const g = group(scene, p.x, p.y, p.z);
    platforms.push(g);
    const islandRock = rock(
      g,
      2.5,
      world === 2 ? mat("#8879a9") : stone,
      0,
      -1.9,
      0,
    );
    islandRock.scale.set(p.w / 4.05, 0.7, p.d / 4.4);
    islandRock.rotation.y = p.id * 0.7;
    box(
      g,
      p.w,
      0.65,
      p.d,
      mat(world === 2 ? "#8b7ca8" : "#ad8557"),
      0,
      -0.42,
      0,
      0.28,
    );
    box(g, p.w + 0.07, 0.34, p.d + 0.07, mat(grass), 0, -0.135, 0, 0.18);
    box(
      g,
      p.w * 0.56,
      0.045,
      p.d * 0.9,
      mat(world === 2 ? "#c9b2e6" : "#d6bb85"),
      0,
      0.03,
      0,
      0.18,
    );
    label(g, String(p.id + 1), 0, 0.066, 1.2, "#fff6d9", 1.08);
    label(g, "↑", 0, 0.067, -1.1, "#fffcdb", 1.08);
    const side = p.id % 2 ? 1 : -1;
    if (world === 2) {
      for (let a = 0; a < 3; a++) {
        const r = rock(
          g,
          0.69,
          mat(["#a982df", "#8263c2", "#ca9be5"][a], 0.2, 0.24),
          side * (p.w / 2 - 0.35 + a * 0.1),
          0.65,
          -1 + a * 0.34,
        );
        r.scale.set(0.6, 1.45 + a * 0.25, 0.7);
      }
    } else if (world === 4 && p.id % 2 === 0) {
      const t = cylinder(
        g,
        0.39,
        0.51,
        1.3,
        cream,
        side * (p.w / 2 - 0.62),
        0.67,
        -0.7,
      );
      blockers.push(t);
      mesh(
        g,
        new T.ConeGeometry(0.66, 1.12, 6),
        mat("#b97cbc"),
        side * (p.w / 2 - 0.62),
        1.86,
        -0.7,
      );
    } else {
      tree(g, side * (p.w / 2 - 0.64), -1.02, 0.77 + (p.id % 3) * 0.14);
      if (world === 1) {
        cylinder(g, 0.09, 0.15, 0.36, cream, -side * 1.9, 0.18, -0.5);
        const cap = sphere(g, 0.45, mat("#e26f57"), -side * 1.9, 0.44, -0.5);
        cap.scale.y = 0.53;
      }
    }
    for (let j = 0; j < 3; j++)
      flower(
        g,
        side * (p.w / 2 - 0.35 - j * 0.17),
        0.3 + j * 0.4,
        ["#fff3bb", "#f3ac9a", "#fff5df"][j],
      );
    if ((world === 3 || p.id % 3 === 1) && p.id !== 3) {
      for (let j = 0; j < 3; j++) {
        const waterfall = box(
          g,
          0.24,
          3.0 + j * 0.32,
          0.18,
          mat(["#8bdde9", "#b9edf3", "#7ccce3"][j]),
          -side * 0.35 + j * 0.18,
          -1.65 - j * 0.16,
          p.d / 2 - 0.02,
        );
        waterfall.rotation.x = -0.03;
      }
    }
    if (p.id % 2 === 0 && p.id > 0 && p.id < sim.last) {
      cylinder(g, 0.045, 0.065, 1.65, cream, -1.85, 0.83, 0.7);
      const flag = box(
        g,
        0.66,
        0.4,
        0.06,
        mat("#41ac86"),
        -1.55,
        1.48,
        0.7,
        0.03,
      );
      flag.rotation.y = 0.12;
    }
    if (sim.mission % 2 && p.id === 4) {
      rock(g, 0.6, mat("#d58b66"), 1.55, 0.28, 0.3);
    }
    if (p.id === 0) {
      const sign = group(g, -2, 0.05, 0.4);
      box(sign, 0.15, 1.3, 0.14, bark, 0, 0.6, 0);
      box(sign, 1.17, 0.62, 0.15, mat("#f6cb69"), 0, 1.15, 0);
      const arrow = box(sign, 0.65, 0.08, 0.05, mat("#9c6b2c"), 0, 1.15, 0.1);
      arrow.rotation.z = 0.3;
    }
  }
  for (const p of sim.pickups) {
    const parent = platforms[p.platform];
    const g = group(parent, p.offset, 1.18, 0);
    if (p.star) mesh(g, starGeo, sunGold);
    else {
      const coin = cylinder(g, 0.33, 0.33, 0.13, sunGold);
      coin.rotation.x = Math.PI / 2;
      const ring = mesh(
        g,
        new T.TorusGeometry(0.22, 0.025, 6, 18),
        glow,
        0,
        0,
        0.08,
      );
      ring.rotation.z = 0.2;
    }
    items.push({ id: p.id, mesh: g, star: p.star, phase: p.platform });
  }
  const gate = group(platforms[3], 0, 0, -1.52);
  for (const x of [-1.65, 1.65]) {
    box(gate, 0.58, 2.5, 0.64, cream, x, 1.15, 0, 0.11);
    box(gate, 0.74, 0.2, 0.78, sunGold, x, 2.43, 0);
    sphere(gate, 0.21, glow, x, 2.69, 0);
  }
  box(gate, 3.9, 0.44, 0.68, cream, 0, 2.62, 0);
  const barrierMat = new T.MeshStandardMaterial({
    color: "#a9ddff",
    transparent: true,
    opacity: 0.48,
    emissive: "#6fc9fc",
    emissiveIntensity: 0.4,
  });
  const barrier = box(gate, 3.05, 2.45, 0.06, barrierMat, 0, 1.16, 0, 0.01);
  const bridge = group(
    scene,
    (sim.platforms[3].x + sim.platforms[4].x) / 2,
    -0.19,
    (sim.platforms[3].z + sim.platforms[4].z) / 2,
  );
  for (let i = 0; i < 8; i++)
    box(
      bridge,
      2.6,
      0.15,
      0.34,
      mat(
        (world === 3
          ? ["#ec9381", "#ecba74", "#b8d26c", "#82cbcf", "#ab93cd"]
          : ["#edb46e", "#d4995b", "#e6bd79"])[i % (world === 3 ? 5 : 3)],
      ),
      0,
      0,
      1.4 - i * 0.4,
      0.04,
    );
  const exit = group(platforms[sim.last], 0, 0.2, -0.55);
  const portalMat = new T.MeshStandardMaterial({
    color: "#b0f8ff",
    emissive: "#5addec",
    emissiveIntensity: 0.8,
    side: T.DoubleSide,
    transparent: true,
    opacity: 0.65,
  });
  const portal = mesh(
    exit,
    new T.TorusGeometry(1.2, 0.19, 8, 32),
    mat("#f6cb66", 0.35, 0.35),
    0,
    1.45,
    0,
  );
  mesh(exit, new T.CircleGeometry(1.09, 36), portalMat, 0, 1.45, 0);
  rock(exit, 0.42, glow, 0, 3.02, 0);
  for (const a of [-1, 1]) box(exit, 0.75, 0.4, 0.9, cream, a, 0.11, 0);
  // Original articulated white-and-gold Number Bot model.
  const bot = group(scene),
    body = group(bot),
    head = group(body, 0, 1.66, 0);
  box(head, 1.22, 1.0, 1.03, white, 0, 0, 0, 0.33);
  box(head, 1.08, 0.71, 0.22, gold, 0, -0.015, 0.426, 0.17);
  box(head, 1.0, 0.62, 0.19, visor, 0, -0.01, 0.493, 0.16);
  for (const sign of [-1, 1]) {
    const pts = [
      new T.Vector3(sign * 0.22 - 0.09, -0.018, 0.595),
      new T.Vector3(sign * 0.22, 0.054, 0.601),
      new T.Vector3(sign * 0.22 + 0.09, -0.018, 0.595),
    ];
    mesh(
      head,
      new T.TubeGeometry(new T.CatmullRomCurve3(pts), 8, 0.034, 6, false),
      glow,
    );
    const ear = cylinder(head, 0.245, 0.245, 0.14, gold, sign * 0.61, 0.0, 0);
    ear.rotation.z = Math.PI / 2;
    const fin = mesh(
      head,
      new T.ConeGeometry(0.15, 0.57, 4),
      gold,
      sign * 0.49,
      0.48,
      -0.07,
    );
    fin.rotation.z = -sign * 0.33;
  }
  const crest = mesh(
    head,
    new T.ConeGeometry(0.235, 0.72, 4),
    gold,
    0,
    0.55,
    0,
  );
  crest.scale.z = 1.3;
  crest.rotation.x = -0.33;
  box(body, 0.86, 0.7, 0.65, white, 0, 0.91, 0, 0.23);
  box(body, 0.8, 0.17, 0.65, gold, 0, 0.66, 0, 0.06);
  box(body, 0.48, 0.19, 0.45, black, 0, 0.5, 0, 0.08);
  const chest = mesh(body, new T.OctahedronGeometry(0.24), gold, 0, 1.02, 0.34);
  chest.scale.set(1, 0.92, 0.42);
  sphere(body, 0.1, glow, 0, 1.04, 0.425);
  box(body, 0.53, 0.55, 0.3, gold, 0, 0.95, -0.38, 0.09);
  const arms: T.Group[] = [],
    legs: T.Group[] = [];
  for (const sign of [-1, 1]) {
    const a = group(body, sign * 0.51, 1.18, 0);
    arms.push(a);
    sphere(a, 0.23, gold);
    sphere(a, 0.195, white, sign * 0.025, 0.035, 0.015);
    cylinder(a, 0.126, 0.126, 0.3, black, 0, -0.21, 0);
    box(a, 0.32, 0.34, 0.31, white, 0, -0.39, 0, 0.1);
    box(a, 0.32, 0.092, 0.31, gold, 0, -0.49, 0, 0.03);
    sphere(a, 0.159, black, 0, -0.6, 0.03);
    const l = group(body, sign * 0.252, 0.55, 0);
    legs.push(l);
    sphere(l, 0.142, black);
    box(l, 0.29, 0.31, 0.3, white, 0, -0.19, 0, 0.08);
    sphere(l, 0.123, gold, 0, -0.22, 0.095);
    box(l, 0.39, 0.27, 0.5, white, 0, -0.42, 0.07, 0.09);
    box(l, 0.42, 0.105, 0.54, gold, 0, -0.5, 0.085, 0.04);
  }
  const shadowMat = new T.MeshBasicMaterial({
    color: "#364839",
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });
  const shadow = mesh(scene, new T.CircleGeometry(0.66, 22), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.castShadow = false;
  shadow.receiveShadow = false;
  const clouds: T.Group[] = [];
  for (let i = 0; i < 18; i++) {
    const g = group(
      scene,
      (i % 2 ? -1 : 1) * (9 + ((i * 7) % 27)),
      -2.5 + (i % 4) * 1.9,
      -i * 4 + 15,
    );
    g.scale.setScalar(1.25 + (i % 3) * 0.37);
    for (let k = 0; k < 3; k++) {
      const b = sphere(
        g,
        1.08 + (k % 2) * 0.31,
        mat("#ffffff"),
        k * 1.1 - 0.9,
        (k % 2) * 0.36,
        0,
      );
      b.scale.set(1.3, 0.74, 0.95);
      b.castShadow = false;
    }
    clouds.push(g);
  }
  for (let i = 0; i < 8; i++) {
    const g = group(
      scene,
      (i % 2 ? 1 : -1) * (15 + (i % 3) * 7),
      -2 + (i % 3) * 1.4,
      -i * 8,
    );
    const base = rock(g, 3.0, mat("#b6ad91"), 0, -1.75, 0);
    base.scale.y = 0.9;
    const top = sphere(g, 2.6, mat(grass));
    top.scale.y = 0.26;
    tree(g, 0.6, -0.1, 1.15);
    tree(g, -1.15, -0.4, 0.72);
  }
  const sunOrb = sphere(scene, 2.1, mat("#fff0ac"), -23, 8.2, -67);
  sunOrb.castShadow = false;
  const scanProp = box(body, 0.36, 0.47, 0.045, gold, 0.29, 1.14, 0.51, 0.03);
  scanProp.rotation.z = -0.14;
  const target = new T.Vector3(),
    desired = new T.Vector3(),
    ray = new T.Raycaster(),
    direction = new T.Vector3();
  camera.position.set(sim.x + 1.3, sim.y + 5.9, sim.z + 8);
  let lastW = 0,
    lastH = 0,
    prev = performance.now();
  let smoothHeading = 0;
  return {
    render() {
      const width = host.clientWidth,
        height = host.clientHeight;
      if (width !== lastW || height !== lastH) {
        render.setSize(width, height);
        camera.aspect = width / Math.max(1, height);
        camera.updateProjectionMatrix();
        lastW = width;
        lastH = height;
      }
      const now = performance.now() / 1000,
        dt = Math.min(0.045, now - prev / 1000);
      prev = now * 1000;
      const t = sim.settings.reduceMotion ? sim.time : now;
      const motion: Motion = sim.pose ?? sim.motion;
      scanProp.visible = motion === "scan";
      body.rotation.z = motion === "double" ? Math.sin(t * 8) * 0.27 : 0;
      const walk = motion === "walk" || motion === "run";
      const wave = Math.sin(t * (motion === "run" ? 14 : 9));
      bot.position.set(sim.x, sim.y, sim.z);
      let d = sim.heading - smoothHeading;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      smoothHeading += d * 0.17;
      bot.rotation.y = smoothHeading;
      body.position.y = walk
        ? Math.abs(wave) * 0.06
        : motion === "celebrate" || motion === "victory"
          ? Math.abs(Math.sin(t * 5)) * 0.22
          : sim.settings.reduceMotion
            ? 0
            : Math.sin(t * 2.3) * 0.022;
      body.scale.set(1, motion === "land" ? 0.88 : 1, 1);
      body.rotation.x = motion === "run" ? 0.12 : motion === "fall" ? -0.11 : 0;
      head.rotation.z =
        motion === "think"
          ? 0.19
          : motion === "surprised"
            ? -0.15
            : motion === "idle"
              ? Math.sin(t * 1.45) * 0.028
              : 0;
      head.rotation.x = motion === "scan" ? 0.24 : 0;
      for (let k = 0; k < 2; k++) {
        const sign = k ? 1 : -1;
        legs[k].rotation.x = walk
          ? wave * sign * 0.52
          : motion === "jump" || motion === "double"
            ? -sign * 0.52
            : 0;
        arms[k].rotation.x = walk
          ? -wave * sign * 0.47
          : motion === "scan"
            ? -1.1
            : motion === "think" && k === 1
              ? -1.7
              : 0.04;
        arms[k].rotation.z =
          sign *
          (motion === "celebrate" || motion === "victory"
            ? 2.5 + Math.sin(t * 8) * 0.15
            : motion === "fall" || motion === "surprised"
              ? 1.22
              : motion === "jump" || motion === "double"
                ? 0.85
                : 0.15);
      }
      shadow.position.set(sim.x, (sim.platforms[sim.at]?.y ?? 0) + 0.06, sim.z);
      shadow.visible = sim.y > -1;
      shadow.scale.setScalar(
        Math.max(0.4, 1 - Math.max(0, sim.y - shadow.position.y) * 0.13),
      );
      platforms.forEach((g, i) => (g.position.x = sim.platforms[i].x));
      for (const p of items) {
        p.mesh.visible = !sim.taken.has(p.id);
        p.mesh.rotation.y = sim.settings.reduceMotion
          ? 0.22
          : t * 1.6 + p.phase;
        p.mesh.position.y =
          1.17 +
          (sim.settings.reduceMotion ? 0 : Math.sin(t * 2 + p.phase) * 0.11);
      }
      barrier.visible = !sim.solved;
      bridge.visible = sim.solved;
      portal.rotation.z = sim.settings.reduceMotion
        ? 0
        : Math.sin(t * 0.5) * 0.03;
      portalMat.emissiveIntensity = sim.solved ? 0.9 : 0.27;
      clouds.forEach((g, i) => {
        if (!sim.settings.reduceMotion)
          g.position.x =
            (i % 2 ? -1 : 1) * (9 + ((i * 7) % 27)) +
            Math.sin(t * 0.055 + i) * 1.7;
      });
      target.set(
        sim.x * 0.75,
        Math.max(-0.3, sim.y) * 0.25 + 1.25,
        sim.z - 3.45,
      );
      desired.set(
        sim.x + 0.8,
        Math.max(-0.3, sim.y) * 0.55 + 5.65,
        sim.z + 7.35,
      );
      direction.subVectors(desired, target);
      const distance = direction.length();
      ray.set(target, direction.normalize());
      ray.far = distance;
      const hit = ray.intersectObjects(blockers, false)[0];
      if (hit && hit.distance > 2)
        desired
          .copy(target)
          .addScaledVector(direction, Math.max(2, hit.distance - 0.28));
      camera.position.lerp(
        desired,
        1 - Math.exp(-dt * (3 + sim.settings.camera / 13)),
      );
      camera.lookAt(target);
      render.render(scene, camera);
    },
    dispose() {
      const geometry = new Set<T.BufferGeometry>(),
        mats = new Set<T.Material>();
      scene.traverse((o) => {
        if (o instanceof T.Mesh) {
          geometry.add(o.geometry);
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            mats.add(m),
          );
        }
      });
      geometry.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      render.dispose();
      render.domElement.remove();
    },
  };
}
