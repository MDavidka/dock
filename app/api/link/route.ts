import { authenticate, error, hash, saveSession, SESSION_SECONDS, store, token, validOrigin, type Session } from "../../../lib/connector";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!validOrigin(request)) return error("Invalid request origin.", 403);
  try {
    const body = await request.json() as { action?: string; name?: string };
    if (body.action === "create") {
      const host = token(), join = token(), now = Date.now();
      const session: Session = { id: crypto.randomUUID(), hostHash: await hash(host), joinHash: await hash(join), expiresAt: now + SESSION_SECONDS * 1000, joinedAt: null, deviceName: null, revokedAt: null, files: [] };
      await saveSession(session);
      return Response.json({ host, join, expiresAt: session.expiresAt }, { headers: { "Cache-Control": "no-store" } });
    }
    const session = await authenticate(request);
    if (!session) return error("This connection has expired or is unavailable.", 401);
    if (body.action === "join" && session.role === "sender") {
      session.joinedAt ??= Date.now();
      session.deviceName ??= typeof body.name === "string" ? body.name.trim().slice(0, 50) || "Another device" : "Another device";
      await saveSession(session);
      return Response.json({ ok: true });
    }
    if (body.action === "disconnect" && session.role === "receiver") {
      session.revokedAt = Date.now();
      await store().set(`connector:session:${session.id}`, session, { ex: SESSION_SECONDS });
      return Response.json({ ok: true });
    }
    return error("Unknown action.");
  } catch (cause) { console.error("connection error", cause); return error("Connection service is temporarily unavailable.", 503); }
}

export async function GET(request: Request) {
  try {
    const session = await authenticate(request);
    if (!session) return error("This connection has expired or is unavailable.", 401);
    return Response.json({ role: session.role, connected: !!session.joinedAt, deviceName: session.deviceName, expiresAt: session.expiresAt, files: session.files.map(({ objectKey, ...file }) => file) }, { headers: { "Cache-Control": "no-store" } });
  } catch { return error("Connection service is temporarily unavailable.", 503); }
}
