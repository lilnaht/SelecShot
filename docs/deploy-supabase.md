# Deploy e Supabase

## Variaveis de ambiente

Configure no provedor de deploy:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` deve existir apenas no ambiente server-side. Nunca use essa chave em Client Components.

## Aplicar schema e policies

Rode `supabase/schema.sql` no SQL editor do projeto Supabase antes do deploy ou sempre que houver mudanca de schema.

O arquivo e reaplicavel para policies: ele usa `drop policy if exists` antes de recriar as regras principais.

Depois de aplicar, valide:

- `profiles`: usuario autenticado le e altera apenas o proprio perfil.
- `analyses`: usuario autenticado le, cria e altera apenas linhas com `user_id = auth.uid()`.
- `analysis_files`: `storage_path` precisa seguir `uploads/{user_id}/{analysis_id}/originals/...`.
- `storage.objects`: bucket `framesort` fica privado; usuarios leem apenas `uploads/{uid}/...` e `analyses/{uid}/...`.
- `audit_events`: usuario autenticado consegue ler apenas seus eventos.

## Checklist de deploy

1. Confirmar que `.env` nao esta rastreado por Git.
2. Confirmar que `src/lib/supabase/*` e `supabase/schema.sql` estao no commit.
3. Rodar `npm run lint`, `npm test` e `npm run build`.
4. Aplicar `supabase/schema.sql` no Supabase.
5. Configurar as variaveis de ambiente no deploy.
6. Fazer um upload pequeno em staging e validar dashboard, detalhe, retry e downloads.
