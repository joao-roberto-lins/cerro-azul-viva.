-- Execute once in a new Supabase project's SQL editor.
begin;
create table public.player_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check(char_length(display_name) between 2 and 20),
  color text not null default '#e97843' check(color ~ '^#[0-9a-fA-F]{6}$'),
  skin text not null default '#bd916f' check(skin in ('#f0c9a8','#bd916f','#86583f','#50372b')),
  hair text not null default '#382e24' check(hair in ('#382e24','#8f603e','#d4ad62','#262528')),
  updated_at timestamptz not null default now()
);
create table public.player_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}' check(jsonb_typeof(state)='object' and octet_length(state::text)<32768),
  updated_at timestamptz not null default now()
);
create table public.online_players (
  user_id uuid primary key references public.player_profiles(id) on delete cascade,
  seen_at timestamptz not null default now()
);
create table public.player_blocks (
  blocker uuid not null references auth.users(id) on delete cascade,
  blocked uuid not null references auth.users(id) on delete cascade,
  primary key(blocker,blocked),check(blocker<>blocked)
);
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  a uuid not null references public.player_profiles(id) on delete cascade,
  b uuid not null references public.player_profiles(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check(status in ('pending','accepted','declined','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(a,b),check(a<b),check(requested_by in (a,b))
);
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender uuid not null references auth.users(id) on delete cascade,
  body text not null check(char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index chat_messages_room_time on public.chat_messages(conversation_id,created_at);
create table public.coop_groups (
  id uuid primary key default gen_random_uuid(),
  state jsonb not null default '{"step":0,"money":50}',
  version integer not null default 0,
  created_at timestamptz not null default now()
);
create table public.coop_members (
  group_id uuid not null references public.coop_groups(id) on delete cascade,
  user_id uuid not null unique references public.player_profiles(id) on delete cascade,
  primary key(group_id,user_id)
);
create table public.coop_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.coop_groups(id) on delete cascade,
  sender uuid not null references auth.users(id) on delete cascade,
  recipient uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check(status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),check(sender<>recipient)
);
create table public.coop_events (
  group_id uuid not null references public.coop_groups(id) on delete cascade,
  event_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key(group_id,event_id)
);
create index coop_events_rate on public.coop_events(user_id,created_at);

create function public.touch_player_row() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end $$;
create trigger profile_timestamp before insert or update on public.player_profiles for each row execute function public.touch_player_row();
create trigger save_timestamp before insert or update on public.player_saves for each row execute function public.touch_player_row();
create function public.touch_presence() returns trigger language plpgsql set search_path='' as $$
begin new.seen_at=now(); return new; end $$;
create trigger presence_timestamp before insert or update on public.online_players for each row execute function public.touch_presence();

create function public.is_blocked(u uuid,v uuid) returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.player_blocks where (blocker=u and blocked=v) or (blocker=v and blocked=u));
$$;
create function public.is_group_member(g uuid) returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.coop_members where group_id=g and user_id=auth.uid());
$$;
create function public.can_read_chat(c uuid) returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.conversations where id=c and auth.uid() in (a,b) and status='accepted' and not public.is_blocked(a,b));
$$;

alter table public.player_profiles enable row level security;
alter table public.player_saves enable row level security;
alter table public.online_players enable row level security;
alter table public.player_blocks enable row level security;
alter table public.conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.coop_groups enable row level security;
alter table public.coop_members enable row level security;
alter table public.coop_invites enable row level security;
alter table public.coop_events enable row level security;
create policy profiles_read on public.player_profiles for select to authenticated using(true);
create policy profiles_insert on public.player_profiles for insert to authenticated with check(id=auth.uid());
create policy profiles_update on public.player_profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy saves_own on public.player_saves for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy presence_read on public.online_players for select to authenticated using(seen_at>now()-interval '60 seconds');
create policy presence_own on public.online_players for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy blocks_read on public.player_blocks for select to authenticated using(blocker=auth.uid());
create policy conversations_read on public.conversations for select to authenticated using(auth.uid() in (a,b));
create policy messages_read on public.chat_messages for select to authenticated using(public.can_read_chat(conversation_id));
create policy groups_read on public.coop_groups for select to authenticated using(public.is_group_member(id));
create policy members_read on public.coop_members for select to authenticated using(user_id=auth.uid() or public.is_group_member(group_id));
create policy invites_read on public.coop_invites for select to authenticated using(auth.uid() in(sender,recipient));
-- No client policy grants writes to conversations, messages or cooperative state.
grant select,insert,update on public.player_profiles to authenticated;
grant select,insert,update,delete on public.player_saves,public.online_players to authenticated;
grant select on public.player_blocks,public.conversations,public.chat_messages,public.coop_groups,public.coop_members,public.coop_invites to authenticated;
grant all on public.player_profiles,public.player_saves,public.online_players,public.player_blocks,public.conversations,public.chat_messages,public.coop_groups,public.coop_members,public.coop_invites,public.coop_events to service_role;

create function public.request_chat(target uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare me uuid=auth.uid(); c uuid; current_status text; requested_at timestamptz;
begin
 if me is null or me=target or public.is_blocked(me,target) then raise exception 'Convite indisponível.'; end if;
 perform 1 from public.player_profiles where id=me for update;
 if (select count(*) from public.conversations where requested_by=me and updated_at>now()-interval '1 minute')>=6 then raise exception 'Aguarde antes de enviar mais convites.'; end if;
 select id,status,updated_at into c,current_status,requested_at from public.conversations where a=least(me,target) and b=greatest(me,target) for update;
 if c is not null and (current_status='accepted' or (current_status='pending' and requested_at>now()-interval '5 minutes')) then return c; end if;
 insert into public.conversations(a,b,requested_by) values(least(me,target),greatest(me,target),me)
 on conflict(a,b) do update set requested_by=me,status='pending',updated_at=now() returning id into c;
 return c;
end $$;
create function public.respond_chat(conversation uuid,accept boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 update public.conversations set status=case when accept then 'accepted' else 'declined' end,updated_at=now()
 where id=conversation and auth.uid() in(a,b) and requested_by<>auth.uid() and status='pending' and updated_at>now()-interval '5 minutes' and not public.is_blocked(a,b);
 if not found then raise exception 'Esse convite expirou ou já foi respondido.'; end if;
end $$;
create function public.close_chat(conversation uuid) returns void language plpgsql security definer set search_path='' as $$
begin update public.conversations set status='closed',updated_at=now() where id=conversation and auth.uid() in(a,b); end $$;
create function public.send_chat(conversation uuid,message text,nonce uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare me uuid=auth.uid(); item uuid;
begin
 perform 1 from public.conversations where id=conversation and me in(a,b) and status='accepted' and not public.is_blocked(a,b) for update;
 if not found then raise exception 'A conversa precisa ser aceita pelos dois jogadores.'; end if;
 select id into item from public.chat_messages where id=nonce and sender=me and conversation_id=conversation;
 if item is not null then return item; end if;
 if char_length(btrim(message)) not between 1 and 500 then raise exception 'Escreva de 1 a 500 caracteres.'; end if;
 if (select count(*) from public.chat_messages where sender=me and created_at>now()-interval '1 minute')>=20 then raise exception 'Aguarde um pouco para enviar mais mensagens.'; end if;
 insert into public.chat_messages(id,conversation_id,sender,body) values(nonce,conversation,me,btrim(message)) returning id into item;
 return item;
end $$;
create function public.invite_coop(target uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare me uuid=auth.uid(); g uuid; invitation uuid;
begin
 if me is null or me=target or public.is_blocked(me,target) then raise exception 'Convite indisponível.'; end if;
 perform 1 from public.player_profiles where id=me for update;
 if exists(select 1 from public.coop_members where user_id=target) then raise exception 'Esse jogador já está em um grupo.'; end if;
 if (select count(*) from public.coop_invites where sender=me and created_at>now()-interval '1 minute')>=6 then raise exception 'Aguarde antes de enviar mais convites.'; end if;
 select group_id into g from public.coop_members where user_id=me;
 if g is null then insert into public.coop_groups default values returning id into g; insert into public.coop_members values(g,me); end if;
 if (select count(*) from public.coop_members where group_id=g)>=4 then raise exception 'O grupo já tem quatro jogadores.'; end if;
 select id into invitation from public.coop_invites where group_id=g and recipient=target and status='pending' and created_at>now()-interval '5 minutes' limit 1;
 if invitation is not null then return invitation; end if;
 insert into public.coop_invites(group_id,sender,recipient) values(g,me,target) returning id into invitation;
 return invitation;
end $$;
create function public.respond_coop(invitation uuid,accept boolean) returns void language plpgsql security definer set search_path='' as $$
declare inv public.coop_invites;
begin
 select * into inv from public.coop_invites where id=invitation and recipient=auth.uid() and status='pending' and created_at>now()-interval '5 minutes' for update;
 if not found then raise exception 'Esse convite expirou ou já foi respondido.'; end if;
 if accept then
  perform 1 from public.coop_groups where id=inv.group_id for update;
  if not exists(select 1 from public.coop_members where group_id=inv.group_id and user_id=inv.sender) then raise exception 'O anfitrião saiu do grupo.'; end if;
  if exists(select 1 from public.coop_members where user_id=auth.uid()) then raise exception 'Saia do seu grupo antes de aceitar outro.'; end if;
  if (select count(*) from public.coop_members where group_id=inv.group_id)>=4 then raise exception 'O grupo está cheio.'; end if;
  if exists(select 1 from public.coop_members where group_id=inv.group_id and public.is_blocked(user_id,auth.uid())) then raise exception 'Convite indisponível.'; end if;
  insert into public.coop_members values(inv.group_id,auth.uid());
 end if;
 update public.coop_invites set status=case when accept then 'accepted' else 'declined' end where id=invitation;
end $$;
create function public.leave_coop() returns void language plpgsql security definer set search_path='' as $$
begin
 update public.coop_invites set status='declined' where sender=auth.uid() and status='pending';
 delete from public.coop_members where user_id=auth.uid();
end $$;
create function public.block_player(target uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or target=auth.uid() then raise exception 'Jogador inválido.'; end if;
 insert into public.player_blocks values(auth.uid(),target) on conflict do nothing;
 update public.conversations set status='closed' where auth.uid() in(a,b) and target in(a,b);
 update public.coop_invites set status='declined' where auth.uid() in(sender,recipient) and target in(sender,recipient);
 if exists(select 1 from public.coop_members me join public.coop_members other using(group_id) where me.user_id=auth.uid() and other.user_id=target) then perform public.leave_coop(); end if;
end $$;
create function public.unblock_player(target uuid) returns void language plpgsql security definer set search_path='' as $$
begin delete from public.player_blocks where blocker=auth.uid() and blocked=target; end $$;

-- Called only by the authenticated Vercel server, after validating the action.
create function public.commit_coop_event(p_group uuid,p_version integer,p_event uuid,p_user uuid,p_state jsonb,p_result jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare g public.coop_groups; previous jsonb;
begin
 select * into g from public.coop_groups where id=p_group for update;
 if not found or not exists(select 1 from public.coop_members where group_id=p_group and user_id=p_user) then raise exception 'Você saiu do grupo.'; end if;
 select result into previous from public.coop_events where group_id=p_group and event_id=p_event;
 if previous is not null then return previous; end if;
 if g.version<>p_version then return null; end if;
 update public.coop_groups set state=p_state,version=version+1 where id=p_group;
 insert into public.coop_events(group_id,event_id,user_id,result) values(p_group,p_event,p_user,p_result);
 return p_result;
end $$;

revoke all on function public.is_blocked(uuid,uuid) from public,anon,authenticated;
revoke all on function public.is_group_member(uuid),public.can_read_chat(uuid) from public,anon;
grant execute on function public.is_group_member(uuid),public.can_read_chat(uuid) to authenticated;
revoke all on function public.request_chat(uuid),public.respond_chat(uuid,boolean),public.close_chat(uuid),public.send_chat(uuid,text,uuid),public.invite_coop(uuid),public.respond_coop(uuid,boolean),public.leave_coop(),public.block_player(uuid),public.unblock_player(uuid) from public,anon;
grant execute on function public.request_chat(uuid),public.respond_chat(uuid,boolean),public.close_chat(uuid),public.send_chat(uuid,text,uuid),public.invite_coop(uuid),public.respond_coop(uuid,boolean),public.leave_coop(),public.block_player(uuid),public.unblock_player(uuid) to authenticated;
revoke all on function public.commit_coop_event(uuid,integer,uuid,uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.commit_coop_event(uuid,integer,uuid,uuid,jsonb,jsonb) to service_role;

-- Each player can broadcast only on their own channel. Names/avatar data come from profiles.
create policy player_positions_receive on realtime.messages for select to authenticated using(extension='broadcast' and realtime.topic() like 'player:%');
create policy player_positions_send on realtime.messages for insert to authenticated with check(extension='broadcast' and realtime.topic()='player:'||auth.uid()::text);

do $$ begin
 if not exists(select 1 from pg_publication where pubname='supabase_realtime') then create publication supabase_realtime; end if;
end $$;
alter publication supabase_realtime add table public.conversations,public.chat_messages,public.coop_groups,public.coop_members,public.coop_invites;
commit;
