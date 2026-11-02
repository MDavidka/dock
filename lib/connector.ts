import { Redis } from "@upstash/redis";

export const MAX_FILE = 20 * 1024 * 1024;
export const SESSION_SECONDS = 30 * 60;

export type Transfer = { id: string; name: string; size: number; mime: string; sender: "receiver" | "sender"; created_at: number; objectKey: string };
export type Session = { id: string; hostHash: string; joinHash: string; expiresAt: number; joinedAt: number | null; deviceName: string | null; revokedAt: number | null; files: Transfer[] };

let redis: Redis | null = null;
export function store() { if (!redis) redis = Redis.fromEnv(); return redis; }
export async function hash(value: string) { return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))), byte => byte.toString(16).padStart(2, "0")).join(""); }
export function token() { return Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, "0")).join(""); }
export async function saveSession(session: Session) {
  const ttl = Math.max(1, Math.ceil((session.expiresAt - Date.now()) / 1000));
  const db = store();
  await Promise.all([db.set(`connector:session:${session.id}`, session, { ex: ttl }), db.set(`connector:host:${session.hostHash}`, session.id, { ex: ttl }), db.set(`connector:join:${session.joinHash}`, session.id, { ex: ttl })]);
}
export async function authenticate(request: Request) {
  const secret = request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  if (!/^[a-f0-9]{64}$/.test(secret)) return null;
  const digest = await hash(secret), db = store();
  const id = await db.get<string>(`connector:host:${digest}`) ?? await db.get<string>(`connector:join:${digest}`);
  if (!id) return null;
  const session = await db.get<Session>(`connector:session:${id}`);
  if (!session || session.expiresAt <= Date.now() || session.revokedAt) return null;
  return { ...session, role: digest === session.hostHash ? "receiver" as const : "sender" as const };
}
export function error(message: string, status = 400) { return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } }); }
export function validOrigin(request: Request) { const origin = request.headers.get("origin"); return !origin || origin === new URL(request.url).origin; }
