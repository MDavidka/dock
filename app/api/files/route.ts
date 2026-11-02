import { put } from "@vercel/blob";
import { authenticate, error, MAX_FILE, saveSession, validOrigin } from "../../../lib/connector";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!validOrigin(request)) return error("Invalid request origin.", 403);
  try {
    const session = await authenticate(request);
    if (!session) return error("This connection has expired or is unavailable.", 401);
    if (!session.joinedAt) return error("Connect another device first.", 409);
    if (Number(request.headers.get("content-length") || 0) > MAX_FILE + 65_536) return error("File exceeds the 20 MB limit.", 413);
    const file = (await request.formData()).get("file");
    if (!(file instanceof File) || !file.size || file.size > MAX_FILE) return error("Choose a file up to 20 MB.", 413);
    if (session.files.length >= 100) return error("This connection has reached its file limit.", 429);
    const id = crypto.randomUUID(), name = file.name.replace(/[\u0000-\u001f\u007f/\\]/g, "_").slice(0, 180) || "file", objectKey = `connector/${session.id}/${id}`;
    await put(objectKey, file, { access: "private", addRandomSuffix: false, contentType: "application/octet-stream" });
    session.files.unshift({ id, name, size: file.size, mime: file.type.slice(0, 120) || "application/octet-stream", sender: session.role, created_at: Date.now(), objectKey });
    await saveSession(session);
    return Response.json({ id, name, size: file.size }, { status: 201 });
  } catch (cause) { console.error("file upload error", cause); return error("The file could not be sent. Please try again.", 503); }
}
