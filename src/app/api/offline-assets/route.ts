import { readdir } from "node:fs/promises";
import { join } from "node:path";
export const dynamic = "force-dynamic";
// Only public, compiled browser assets are exposed. No profile or server files.
export async function GET() {
  try {
    const files = await readdir(join(process.cwd(), ".next", "static"), {
      recursive: true,
    });
    return Response.json(
      {
        assets: files
          .filter((f) => /\.(?:js|css|woff2?)$/.test(f))
          .map((f) => "/_next/static/" + f.replaceAll("\\", "/")),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ assets: [] });
  }
}
