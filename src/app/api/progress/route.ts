import { createHash } from "node:crypto";
import { db } from "@/db";
import { classrooms } from "@/db/schema";
import { eq, lte } from "drizzle-orm";
import { saveSchema } from "@/lib/game";
export const dynamic = "force-dynamic";
function key(req: Request) {
  const t = req.headers.get("authorization")?.replace(/^Bearer /, "");
  return t && /^[a-zA-Z0-9-]{32,100}$/.test(t)
    ? createHash("sha256").update(t).digest("hex")
    : null;
}
export async function GET(req: Request) {
  const k = key(req);
  if (!k)
    return Response.json(
      { error: "Perangkat tidak terdaftar." },
      { status: 401 },
    );
  try {
    const [r] = await db
      .select({ state: classrooms.state })
      .from(classrooms)
      .where(eq(classrooms.deviceHash, k))
      .limit(1);
    return Response.json(
      { state: r?.state ?? null },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Salinan lokal tetap tersedia." },
      { status: 503 },
    );
  }
}
export async function PUT(req: Request) {
  const k = key(req);
  if (!k)
    return Response.json(
      { error: "Perangkat tidak terdaftar." },
      { status: 401 },
    );
  try {
    const text = await req.text();
    if (text.length > 4500000)
      return Response.json(
        { error: "Cadangan terlalu besar." },
        { status: 413 },
      );
    const parsed = saveSchema.safeParse(JSON.parse(text));
    if (!parsed.success)
      return Response.json(
        { error: "Data progres tidak valid." },
        { status: 400 },
      );
    const s = parsed.data;
    await db
      .insert(classrooms)
      .values({ deviceHash: k, state: s, updatedAt: s.updatedAt })
      .onConflictDoUpdate({
        target: classrooms.deviceHash,
        set: { state: s, updatedAt: s.updatedAt },
        setWhere: lte(classrooms.updatedAt, s.updatedAt),
      });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Simpan lokal aktif." }, { status: 503 });
  }
}
