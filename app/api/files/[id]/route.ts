import { authenticate, bindings, error } from "../../../../lib/connector";
export async function GET(request: Request, {params}: {params: Promise<{id:string}>}) {
 try {
  const session=await authenticate(request); if(!session)return error("This connection has expired or is unavailable.",401);
  const {id}=await params; if(!/^[0-9a-f-]{36}$/.test(id))return error("File not found.",404);
  const {db,bucket}=bindings();const file=await db.prepare("SELECT object_key,name FROM files WHERE id=? AND session_id=?").bind(id,session.id).first<{object_key:string;name:string}>();
  if(!file)return error("File not found.",404);const object=await bucket.get(file.object_key);if(!object)return error("File not found.",404);
  return new Response(object.body,{headers:{"Content-Type":"application/octet-stream","Content-Disposition":`attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
 } catch{return error("The file is unavailable.",503)}
}
