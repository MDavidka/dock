import { GridFSBucket, MongoClient, ObjectId } from "mongodb";
export const MAX_FILE = 20 * 1024 * 1024, SESSION_SECONDS = 1800;
type Session = { id:string; hostHash:string; joinHash:string; expiresAt:number; joinedAt?:number; deviceName?:string; revokedAt?:number };
let client:MongoClient|null=null, indexes:Promise<void>|null=null;
function uri(){const value=process.env.MONGODB_URI||(process.env.MONGO_API_KEY?.startsWith("mongodb")?process.env.MONGO_API_KEY:"");if(!value)throw new Error("Set MONGODB_URI; MONGO_API_KEY is accepted only when it contains a MongoDB URI.");return value}
export async function db(){if(!client)client=new MongoClient(uri());await client.connect();const database=client.db(process.env.MONGODB_DB||"dock");if(!indexes)indexes=Promise.all([database.collection<Session>("sessions").createIndex({hostHash:1},{unique:true}),database.collection<Session>("sessions").createIndex({joinHash:1},{unique:true}),database.collection("files").createIndex({sessionId:1,createdAt:-1})]).then(()=>undefined);await indexes;return database}
export function bucket(database:Awaited<ReturnType<typeof db>>){return new GridFSBucket(database,{bucketName:"transfer_data"})}
export async function hash(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,"0")).join("")}
export function token(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,"0")).join("")}
export async function authenticate(request:Request){const secret=request.headers.get("authorization")?.replace(/^Bearer /,"")||"";if(!/^[a-f0-9]{64}$/.test(secret))return null;const digest=await hash(secret);const session=await(await db()).collection<Session>("sessions").findOne({$or:[{hostHash:digest},{joinHash:digest}],expiresAt:{$gt:Date.now()},revokedAt:{$exists:false}});return session?{...session,role:digest===session.hostHash?"receiver" as const:"sender" as const}:null}
export function error(message:string,status=400){return Response.json({error:message},{status,headers:{"Cache-Control":"no-store"}})}
export function validOrigin(request:Request){const origin=request.headers.get("origin");return !origin||origin===new URL(request.url).origin}
export { ObjectId };
