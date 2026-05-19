-- ============================================================
-- LEAD ENGINE — Auth Setup
-- Cole no SQL Editor do Supabase e execute
-- ============================================================

-- ── 1. Trigger: cria profile automaticamente no cadastro ──────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, tenant_id, nome, iniciais, role)
  values (
    new.id,
    -- Pega tenant_id dos metadados do cadastro (passado pelo app)
    coalesce(
      (new.raw_user_meta_data->>'tenant_id')::uuid,
      '00000000-0000-0000-0000-000000000001'  -- tenant padrão (EBT) enquanto não há multi-tenant
    ),
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    upper(left(coalesce(new.raw_user_meta_data->>'nome', new.email), 2)),
    coalesce(new.raw_user_meta_data->>'role', 'vendedor')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 2. Policy: usuário pode ler seu próprio profile ───────────
drop policy if exists "profiles_own" on profiles;
create policy "profiles_own" on profiles
  for all using (id = auth.uid());

-- ── 3. Policy temporária: leitura anônima dos leads ──────────
-- (enquanto não há auth completo, mantém o app funcionando)
-- REMOVER em produção quando auth estiver 100% implementado
drop policy if exists "leads_anon_read" on leads;
create policy "leads_anon_read" on leads
  for select using (
    auth.uid() is null  -- acesso anon temporário
    or
    tenant_id = (select tenant_id from profiles where id = auth.uid())
  );

drop policy if exists "leads_authed_write" on leads;
create policy "leads_authed_write" on leads
  for all using (
    tenant_id = (select tenant_id from profiles where id = auth.uid())
  );

-- ── 4. Usuário admin padrão (opcional — para primeiro acesso) ─
-- Crie via Supabase Dashboard > Authentication > Users > "Invite user"
-- ou rode o cadastro pelo app após deployar

-- ── 5. Verificar se trigger foi criado ───────────────────────
select trigger_name, event_manipulation, action_timing
from information_schema.triggers
where trigger_name = 'on_auth_user_created';
