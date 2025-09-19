# Script PowerShell para setup do banco Supabase (mensageria)
# ATENÇÃO: Use apenas em ambiente seguro. Apague a chave service_role após uso.

$SUPABASE_URL = "https://lfgsgbogjtlqpqhqbiyw.supabase.co"
$SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmZ3NnYm9nanRscXBxaHFiaXl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODMwMzQ0NiwiZXhwIjoyMDczODc5NDQ2fQ.v2zVVHZXFjrKPMo3J5Rl6zMeI5CKJ_4EtPvjs1u1lEY"

# 1. Criação da tabela messages
$createTable = @"
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    from_id uuid NOT NULL,
    to_id uuid NOT NULL,
    participants text[] NOT NULL,
    text text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_participants_created_at ON public.messages USING GIN (participants) WITH (fastupdate = off);
"@

# 2. Políticas RLS
$enableRLS = "ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;"
$policyInsert = 'CREATE POLICY "Allow insert if sender" ON public.messages FOR INSERT USING (auth.uid() = from_id);'
$policySelect = 'CREATE POLICY "Allow select if participant" ON public.messages FOR SELECT USING (auth.uid() = ANY(participants));'
$policyUpdate = 'CREATE POLICY "Allow update if sender" ON public.messages FOR UPDATE USING (auth.uid() = from_id);'
$policyDelete = 'CREATE POLICY "Allow delete if sender" ON public.messages FOR DELETE USING (auth.uid() = from_id);'

# 3. Executar comandos via REST API (rpc/execute_sql)
function Invoke-SupabaseSQL {
    param(
        [string]$sql
    )
    $body = @{ "query" = $sql } | ConvertTo-Json
    $headers = @{ "apikey" = $SERVICE_ROLE_KEY; "Authorization" = "Bearer $SERVICE_ROLE_KEY" }
    Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/rpc/execute_sql" -Method Post -Headers $headers -Body $body -ContentType 'application/json'
}

Invoke-SupabaseSQL -sql $createTable
Invoke-SupabaseSQL -sql $enableRLS
Invoke-SupabaseSQL -sql $policyInsert
Invoke-SupabaseSQL -sql $policySelect
Invoke-SupabaseSQL -sql $policyUpdate
Invoke-SupabaseSQL -sql $policyDelete

Write-Host "Setup do banco Supabase concluído. Troque a chave service_role por segurança!"