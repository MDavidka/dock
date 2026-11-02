import { authenticate, bindings, error, MAX_FILE, validOrigin } from "../../../lib/connector";
export async function POST(request: Request) {
  if (!validOrigin(request)) return error("Invalid request origin.",403);
  try {
    const session = await authenticate(request); if (!session) return error("This connection has expired or is unavailable.",401);
    if (!session.joined_at) return error("Connect another device first.",409);
    const length = Number(request.headers.get("content-length") || 0); if (length > MAX_FILE + 65536) return error("File exceeds the 20 MB limit.",413);
    const form = await request.formData(); const file = form.get("file");
    if (!(file instanceof File) || !file.size || file.size > MAX_FILE) return error("Choose a file up to 20 MB.",413);
    const {db,bucket}=bindings(); const count=await db.prepare("SELECT COUNT(*) AS count FROM files WHERE session_id=?").bind(session.id).first<{count:number}>();
    if ((count?.count||0)>=100) return error("This connection has reached its file limit.",429);
    const id=crypto.randomUUID(), key=`transfers/${session.id}/${id}`;
    const name=file.name.replace(/[\u0000-\u001f\u007f/\\]/g,"_").slice(0,180) || "file";
    await bucket.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:"application/octet-stream"}});
    try { await db.prepare("INSERT INTO files (id,session_id,object_key,name,size,mime,sender,created_at) VALUES (?,?,?,?,?,?,?,?)").bind(id,session.id,key,name,file.size,file.type.slice(0,120)||"application/octet-stream",session.role,Date.now()).run(); }
    catch(e){ await bucket.delete(key); throw e; }
    return Response.json({id,name,size:file.size},{status:201});
  } catch(e) { console.error("file upload error",e); return error("The file could not be sent. Please try again.",503); }
}
