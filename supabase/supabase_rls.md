# Políticas RLS recomendadas para `messages` (Supabase)

-- Ative Row Level Security:
-- ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: permitir inserção quando o usuário for o remetente autenticado
-- CREATE POLICY "allow-insert-if-sender" ON public.messages
-- FOR INSERT
-- WITH CHECK (auth.uid() = from_id);

-- Policy: permitir leitura se o usuário estiver entre os participantes
-- CREATE POLICY "allow-select-if-participant" ON public.messages
-- FOR SELECT
-- USING (auth.uid() = ANY(participants));

-- Policy: permitir delete/update apenas se usuário for remetente (ajustar conforme regras de negócio)
-- CREATE POLICY "allow-update-delete-if-sender" ON public.messages
-- FOR UPDATE, DELETE
-- USING (auth.uid() = from_id)
-- WITH CHECK (auth.uid() = from_id);

-- Lembrete: no Supabase, `auth.uid()` é a função que retorna o uid do usuário autenticado.
