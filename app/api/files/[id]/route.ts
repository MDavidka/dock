import { get } from "@vercel/blob";
import { authenticate, error } from "../../../../lib/connector";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await authenticate(request);
    if (!session) return error("This connection has expired or is unavailable.", 401);
    const { id } = await params, file = session.files.find(item => item.id === id);
    if (!file) return error("File not found.", 404);
    const object = await get(file.objectKey, { access: "private" });
    if (!object || object.statusCode !== 200) return error("File not found.", 404);
    return new Response(object.stream, { headers: { "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return error("The file is unavailable.", 503); }
}
