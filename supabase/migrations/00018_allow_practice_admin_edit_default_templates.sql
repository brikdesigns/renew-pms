-- =============================================================================
-- 00018: ALLOW PRACTICE_ADMIN TO EDIT DEFAULT TEMPLATES
-- =============================================================================
-- Practice admins own their practice and should be able to customize default
-- templates. Previously only platform_admin could edit is_default=true rows.
-- =============================================================================

drop policy if exists "task_templates_update" on public.task_templates;
create policy "task_templates_update" on public.task_templates
  for update using (
    (
      practice_id in (select public.user_practice_ids(auth.uid()))
      or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
    )
    and (
      is_default = false
      or (select system_role from public.profiles where id = auth.uid()) in ('platform_admin', 'practice_admin')
    )
  );
