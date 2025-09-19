-- SQL para criar tabela de mensagens (rodar no SQL editor do Supabase)
create table if not exists public.messages (
  id bigserial primary key,
  from_id text not null,
  to_id text not null,
  participants text[] not null,
  text text not null,
  created_at timestamptz default now()
);

-- Index para consultas por participantes e ordenação por tempo
create index if not exists idx_messages_participants_created_at on public.messages using btree(participants, created_at);
