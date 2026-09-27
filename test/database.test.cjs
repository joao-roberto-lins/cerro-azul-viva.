const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {PGlite}=require('@electric-sql/pglite');
test('chat consent, private data, group membership and atomic rewards',async()=>{
 const db=new PGlite();
 try {
 await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema public,auth to authenticated,service_role;
 create schema realtime; create table realtime.messages(extension text); alter table realtime.messages enable row level security;
 create function realtime.topic() returns text language sql stable as $$select current_setting('realtime.topic',true)$$;`);
 await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/001_multiplayer.sql'),'utf8'));
 const ids=[1,2,3].map(n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`);
 for(const [i,id] of ids.entries()) {await db.query('insert into auth.users values($1)',[id]);await db.query('insert into public.player_profiles(id,display_name) values($1,$2)',[id,`Jogador ${i}`]);}
 async function as(id,sql,args=[]){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');return db.query(sql,args);}
 const room=(await as(ids[0],'select request_chat($1) as id',[ids[1]])).rows[0].id;
 await assert.rejects(as(ids[0],'select send_chat($1,$2,gen_random_uuid())',[room,'antes de aceitar']));
 await assert.rejects(as(ids[2],'select respond_chat($1,true)',[room]));
 await as(ids[1],'select respond_chat($1,true)',[room]);
 await as(ids[0],'select send_chat($1,$2,gen_random_uuid())',[room,'Olá Natália']);
 assert.equal((await as(ids[1],'select * from chat_messages')).rows.length,1);
 assert.equal((await as(ids[2],'select * from chat_messages')).rows.length,0);
 await assert.rejects(as(ids[0],"insert into chat_messages(conversation_id,sender,body) values($1,$2,'forjada')",[room,ids[1]]));
 const invitation=(await as(ids[0],'select invite_coop($1) as id',[ids[1]])).rows[0].id;
 await as(ids[1],'select respond_coop($1,true)',[invitation]);
 const group=(await as(ids[0],'select id from coop_groups')).rows[0].id;
 assert.equal((await as(ids[2],'select * from coop_groups')).rows.length,0);
 const event='00000000-0000-0000-0000-000000000099';
 const args=[group,0,event,ids[0],{step:1,money:80},{version:1}];
 const commit='select commit_coop_event($1,$2,$3,$4,$5,$6) as result';
 await assert.rejects(as(ids[0],commit,args));
 await db.exec('reset role; set role service_role');
 assert.deepEqual((await db.query(commit,args)).rows[0].result,{version:1});
 assert.deepEqual((await db.query(commit,args)).rows[0].result,{version:1});
 assert.equal((await db.query('select version from coop_groups where id=$1',[group])).rows[0].version,1);
 args[2]='00000000-0000-0000-0000-000000000098';
 assert.equal((await db.query(commit,args)).rows[0].result,null);
 await as(ids[1],'select block_player($1)',[ids[0]]);
 assert.equal((await as(ids[0],'select * from chat_messages')).rows.length,0);
 await assert.rejects(as(ids[0],'select request_chat($1)',[ids[1]]));
 assert.equal((await as(ids[1],'select * from coop_members')).rows.length,0);
 } finally {await db.close();}
});
