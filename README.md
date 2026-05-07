# SelecShot

SelecShot é um MVP SaaS para fotógrafos separarem fotos tecnicamente problemáticas em poucos minutos. O app permite autenticação, dashboard, criação de análise, upload para Supabase Storage e processamento de imagens em TypeScript dentro do Next.js.

O produto não escolhe as melhores fotos artisticamente. Ele ajuda a organizar fotos claras, escuras e desfocadas, preservando os arquivos originais.

## Stack

- Next.js App Router, TypeScript e React
- Tailwind CSS v4
- shadcn/ui
- Supabase Auth, Postgres e Storage
- sharp para leitura, EXIF, pixels e previews
- archiver para pacote ZIP final
- Deploy pensado para Vercel

## Como rodar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra `http://localhost:3000`.

Sem Supabase configurado, as páginas públicas rodam normalmente. Login, cadastro, dashboard e upload exigem as variáveis públicas do Supabase.

## Variáveis de ambiente

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` fica reservada para rotinas server-side e nunca deve ser usada no client.

## Estrutura

```txt
src/app                 Rotas públicas, privadas e API de trigger
src/components/landing  Landing page e pricing
src/components/dashboard Dashboard, upload e resultado
src/components/shared   Logo, navbar, footer e estados
src/components/ui       shadcn/ui
src/lib                 Tipos, constantes, Supabase, mocks, upload e análise
src/lib/image-analysis  Processamento de imagens, preview e ZIP
supabase/schema.sql     SQL de tabelas, índices, RLS e Storage
```

## Configurar Supabase

1. Crie um projeto Supabase.
2. Rode o SQL em `supabase/schema.sql`.
3. Configure Auth com e-mail/senha.
4. Copie `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` para `.env.local`.
5. Crie o bucket privado `framesort` se o SQL não tiver criado automaticamente.

### Tabelas

O schema cria:

- `profiles`
- `analyses`
- `analysis_files`

Cada tabela usa RLS por usuário. Registros são acessíveis apenas quando `user_id = auth.uid()` ou, no caso de `profiles`, `id = auth.uid()`.

### Storage

Bucket privado: `framesort`.

Estrutura lógica:

```txt
uploads/{user_id}/{analysis_id}/originals/
analyses/{user_id}/{analysis_id}/previews/
analyses/{user_id}/{analysis_id}/result.zip
```

As policies permitem que usuários autenticados leiam e escrevam apenas em seus próprios caminhos.

## Processamento de imagens

O processamento roda no backend do Next.js pela rota `POST /api/worker/trigger`.

Fluxo atual:

- O cliente cria a análise e envia originais para Supabase Storage
- A rota valida a sessão do usuário
- Atualiza status para `processing`
- Baixa imagens do Supabase Storage
- Corrige EXIF, converte para grayscale e extrai pixels com `sharp`
- Calcula brilho, percentis, proporções, ruído e `blur_score`
- Classifica em `dark`, `bright`, `blurred`, `good`
- Gera previews JPEG
- Cria `result.zip` com `blurred`, `dark`, `bright`, `good` e `relatorio.csv`
- Salva artefatos no Storage
- Atualiza `analysis_files` e `analyses` para `done` ou `failed`

Os limiares ficam em `src/lib/image-analysis/constants.ts`.

## Deploy na Vercel

1. Envie o repositório para GitHub.
2. Importe o projeto na Vercel.
3. Configure as variáveis de ambiente.
4. Faça deploy.

Para lotes grandes, observe o limite de duração e memória das Vercel Functions. O processamento atual limita concorrência, mas centenas de imagens gigantes podem exigir fila/background job.

## Comandos úteis

```bash
npm run lint
npm run build
```
