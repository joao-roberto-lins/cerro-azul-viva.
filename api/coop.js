const {createClient}=require('@supabase/supabase-js');
const {applyEvent}=require('../server/coop-rules.cjs');
module.exports=async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({error:'Use POST.'});
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return res.status(503).json({error:'O modo online ainda não está configurado.'});
  const token=(req.headers.authorization||'').replace(/^Bearer /,'');
  if(!token||token.length>8192)return res.status(401).json({error:'Entre na sua conta.'});
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  try{
    const {data:auth,error:authError}=await client.auth.getUser(token);
    if(authError||!auth.user)return res.status(401).json({error:'Entre novamente na sua conta.'});
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
    const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
    if(!body||!uuid.test(body.groupId)||!uuid.test(body.eventId)||JSON.stringify(body).length>2048)return res.status(400).json({error:'Ação inválida.'});
    const {data:membership}=await client.from('coop_members').select('group_id').eq('group_id',body.groupId).eq('user_id',auth.user.id).maybeSingle();
    if(!membership)return res.status(403).json({error:'Você não pertence a esse grupo.'});
    const {count}=await client.from('coop_events').select('event_id',{count:'exact',head:true}).eq('user_id',auth.user.id).gte('created_at',new Date(Date.now()-60000).toISOString());
    if(count>90)return res.status(429).json({error:'Aguarde um instante antes de interagir de novo.'});
    for(let attempt=0;attempt<4;attempt++){
      const {data:past}=await client.from('coop_events').select('result').eq('group_id',body.groupId).eq('event_id',body.eventId).maybeSingle();
      if(past)return res.status(200).json(past.result);
      const {data:group,error}=await client.from('coop_groups').select('state,version').eq('id',body.groupId).single();
      if(error)throw new Error('Grupo indisponível.');
      const result=applyEvent(group.state,body.action||{});
      result.version=group.version+1;
      const {data:committed,error:commitError}=await client.rpc('commit_coop_event',{p_group:body.groupId,p_version:group.version,p_event:body.eventId,p_user:auth.user.id,p_state:result.state,p_result:result});
      if(commitError)throw new Error('Não foi possível salvar a ação do grupo.');
      if(committed)return res.status(200).json(committed);
    }
    return res.status(409).json({error:'Outra ação chegou ao mesmo tempo. Tente novamente.'});
  }catch(error){return res.status(400).json({error:error.message==='Grupo indisponível.'?error.message: /Aproxime|outra área|Ação inválida|Não foi possível/.test(error.message)?error.message:'Não foi possível concluir a ação. Tente novamente.'});}
};
