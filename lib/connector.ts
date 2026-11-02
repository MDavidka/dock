import { env } from "cloudflare:workers";
export const MAX_FILE = 20 * 1024 * 1024;
export function bindings() { if (!env.DB || !env.BUCKET) throw new Error("Storage is unavailable"); return { db: env.DB, bucket: env.BUCKET }; }
export async function hash(value: string) { return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))), b => b.toString(16).padStart(2,"0")).join(""); }
export function token() { const b = crypto.getRandomValues(new Uint8Array(32)); return Array.from(b, x=>x.toString(16).padStart(2,"0")).join(""); }
export async function authenticate(request: Request) {
  const secret = request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  if (!/^[a-f0-9]{64}$/.test(secret)) return null;
  const { db } = bindings(); const digest = await hash(secret);
  const row = await db.prepare("SELECT id,host_hash,join_hash,expires_at,joined_at,device_name,revoked_at FROM sessions WHERE host_hash = ? OR join_hash = ?").bind(digest,digest).first<{id:string;host_hash:string;join_hash:string;expires_at:number;joined_at:number|null;device_name:string|null;revoked_at:number|null}>();
  if (!row || row.expires_at <= Date.now() || row.revoked_at) return null;
  return { ...row, role: digest === row.host_hash ? "receiver" : "sender" };
}
export function error(message: string, status = 400) { return Response.json({error:message},{status,headers:{"Cache-Control":"no-store"}}); }
export function validOrigin(request: Request) { const origin = request.headers.get("origin"); return !origin || origin === new URL(request.url).origin; }
