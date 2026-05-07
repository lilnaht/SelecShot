# Next Steps

## Prioridade alta

- [x] Criar uma tela de acompanhamento para a analise, com estados claros de upload, cancelamento seguro, processamento, previews e ZIP.
- [x] Preparar o caminho para processamento assíncrono com status `pending`/`processing`, metricas de duracao e retry seguro.
- [x] Adicionar retry seguro para analises com falha, sem reenviar os arquivos.
- [x] Melhorar mensagens de erro do usuario sem expor detalhes internos.
- [x] Atualizar `supabase/schema.sql` com RLS reaplicavel, validacao de path e tabela de auditoria.
- [x] Criar testes cobrindo autorizacao basica da rota de worker e validacoes sensiveis.

## Upload e processamento

- [x] Mostrar validacao antes do envio para cada arquivo: formato, tamanho, duplicidade e motivo de rejeicao.
- [x] Evitar arquivos duplicados no mesmo lote por nome e tamanho.
- [x] Adicionar estimativa de tempo de processamento com base em quantidade e tamanho total.
- [x] Permitir cancelar upload antes do inicio do worker.
- [x] Registrar metricas de processamento por analise: duracao, arquivos processados, invalidos e tamanho do ZIP.
- [x] Exibir arquivos invalidos depois do processamento na tabela de detalhes.
- [x] Definir limites operacionais por lote e por pagina de conta.

## Dashboard e resultados

- [x] Adicionar filtros no dashboard por status, data e quantidade de fotos.
- [x] Criar busca por ID da analise.
- [x] Adicionar carregamento incremental no historico de analises.
- [x] Mostrar cards de resumo com tendencia mensal, descarte tecnico e tempo medio.
- [x] Na pagina de detalhe, mostrar tabela com todos os arquivos, categoria, brilho, blur score e status.
- [x] Permitir baixar uma categoria especifica por rota server-side.
- [x] Adicionar preview ampliado em modal ao clicar em uma imagem.
- [x] Mostrar aviso claro quando uma analise terminou mas o ZIP ainda nao esta disponivel.

## UX de autenticacao e conta

- [x] Adicionar fluxo de recuperacao de senha.
- [x] Adicionar confirmacao visual quando o e-mail de cadastro precisa ser verificado.
- [x] Criar pagina de perfil com nome, e-mail, plano atual, limites e uso mensal.
- [x] Adicionar estados vazios e alertas mais especificos para sem analises, filtros sem resultado e limite indisponivel.
- [ ] Melhorar navegacao mobile do dashboard com menu lateral recolhivel.

## Seguranca e confiabilidade

- [x] Adicionar testes automatizados para `next`, UUID, upload e CSV injection.
- [x] Adicionar rate limit em `/api/worker/trigger`.
- [x] Adicionar auditoria para eventos importantes do worker e processamento.
- [x] Documentar alertas e checklist de deploy/RLS em `docs/deploy-supabase.md`.
- [x] Adicionar headers defensivos no `next.config.ts`.
- [x] Garantir que `.env` nao seja rastreado e que `.env.example` fique disponivel.

## Produto e monetizacao

- [ ] Conectar cobranca real: depende de provedor de pagamentos e chaves externas.
- [x] Criar onboarding curto no primeiro acesso.
- [x] Manter lote demo/mock para usuarios sem Supabase configurado.
- [x] Criar feedback local de classificacao para calibrar thresholds.
- [ ] Permitir ajustar sensibilidade de desfoque, exposicao e escuridao por analise ou preset.

## Qualidade tecnica

- [x] Criar suite minima de testes unitarios para `src/lib/upload.ts`, `src/lib/security.ts` e `src/lib/image-analysis/zip.ts`.
- [x] Criar teste de integracao da rota do worker com mocks de Supabase e processador.
- [x] Separar respostas do detalhe em DTOs seguros via `getAnalysisDetail`, mantendo signed URLs e dados filtrados por usuario.
- [x] Documentar fluxo de deploy e aplicacao de migrations/policies Supabase.
- [x] Adicionar CI com `npm run lint`, `npm test` e `npm run build`.

## Pendencias recomendadas para proxima rodada

- [ ] Substituir rate limit em memoria por Redis/Upstash/Vercel KV em producao.
- [ ] Migrar processamento pesado para fila real quando o volume ultrapassar o limite seguro de Vercel Functions.
- [ ] Adicionar menu mobile tipo Sheet para o dashboard.
- [ ] Integrar Stripe ou outro provedor para cobranca real.
- [ ] Persistir feedback de classificacao no Supabase em vez de somente `localStorage`.
