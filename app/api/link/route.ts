import { authenticate, bindings, error, hash, token, validOrigin } from "../../../lib/connector";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (!validOrigin(request)) return error("Invalid request origin.",403);
  try {
    const body = await request.json() as { action?: string; name?: string };
    const {db, bucket} = bindings();
    if (body.action === "create") {
      // Bounded cleanup keeps expired/revoked transfers from accumulating.
      const old = await db.prepare("SELECT id FROM sessions WHERE expires_at <= ? OR revoked_at IS NOT NULL LIMIT 10").bind(Date.now()).all<{id:string}>();
      for (const item of old.results) {
        const objects = await db.prepare("SELECT object_key FROM files WHERE session_id=?").bind(item.id).all<{object_key:string}>();
        if (objects.results.length) await bucket.delete(objects.results.map(row => row.object_key));
        await db.prepare("DELETE FROM files WHERE session_id=?").bind(item.id).run();
        await db.prepare("DELETE FROM sessions WHERE id=?").bind(item.id).run();
      }
      const host = token(), join = token(), id = crypto.randomUUID(), now = Date.now(), expires = now + 30 * 60 * 1000;
      await db.prepare("INSERT INTO sessions (id,host_hash,join_hash,created_at,expires_at) VALUES (?,?,?,?,?)").bind(id,await hash(host),await hash(join),now,expires).run();
      return Response.json({host,join,expiresAt:expires},{headers:{"Cache-Control":"no-store"}});
    }
    const session = await authenticate(request);
    if (!session) return error("This connection has expired or is unavailable.",401);
    if (body.action === "join" && session.role === "sender") {
      const name = typeof body.name === "string" ? body.name.trim().slice(0,50) : "";
      await db.prepare("UPDATE sessions SET joined_at=COALESCE(joined_at,?),device_name=COALESCE(device_name,?) WHERE id=?").bind(Date.now(),name || "Another device",session.id).run();
      return Response.json({ok:true});
    }
    if (body.action === "disconnect" && session.role === "receiver") { await db.prepare("UPDATE sessions SET revoked_at=? WHERE id=?").bind(Date.now(),session.id).run(); return Response.json({ok:true}); }
    return error("Unknown action.");
  } catch (e) { console.error("connection error",e); return error("Connection service is temporarily unavailable.",503); }
}
export async function GET(request: Request) {
  try {
    const session = await authenticate(request); if (!session) return error("This connection has expired or is unavailable.",401);
    const {db}=bindings(); const rows=await db.prepare("SELECT id,name,size,mime,sender,created_at FROM files WHERE session_id=? ORDER BY created_at DESC LIMIT 100").bind(session.id).all();
    return Response.json({role:session.role,connected:!!session.joined_at,deviceName:session.device_name,expiresAt:session.expires_at,files:rows.results},{headers:{"Cache-Control":"no-store"}});
  } catch { return error("Connection service is temporarily unavailable.",503); }
}
