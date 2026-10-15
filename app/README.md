# Meu espaço — incremento 0.3.3

Imagem antiga do Início retirada de `app/assets` e do shell. Cópia histórica fora da pasta publicada; shell v11. Acabamento da Casa definido pelo usuário: ilustração histórica `ref-casa.png`, com possibilidade de ocultar móveis na futura integração da planta. Evidência em `docs/validacao/incremento-0.3.3.md`.

Base visual 0.3.2: sistema escuro nas seis áreas, Início recomposto, atalhos de compra/despesa e recebimento e foco contido nos diálogos. **Novo → Conferir JSON de documentos** valida e mostra rascunhos v1 por texto/arquivo, também offline; não confirma lançamentos financeiros de lotes. Relatório da base em `docs/validacao/incremento-0.3.2.md`; pendências em `docs/produto/backlog-reformulacao.json`.

Casa mantém a isometria aproximada anterior, com oito regiões, ampliação e vínculo explícito aos cômodos cadastrados. O JSON/SVG novo foi validado e preservado em `docs/design/apartamento-real/revisao-2026-10-14/`, aguardando integração com o acabamento escolhido. Dimensões/móveis ainda estimados. Vínculos são preferências locais do navegador, não sincronizados nem incluídos no backup JSON; configurar novamente ao trocar de aparelho. Fotos/vídeos originais não integram os arquivos servidos. Dados e protocolo preservados. Evidência anterior em `docs/validacao/incremento-0.3.1.md`.

Interface prioritária para smartphone. A direção de 14/10/2026 usa a linguagem do vídeo Samsung Health fornecido pelo usuário; referências M1–M6 e requisitos funcionais continuam rastreados, sem exigir a paleta clara anterior.

Para prévia local, na raiz `C:\opscon`:

```powershell
python -m http.server 8766 --directory app --bind 127.0.0.1
```

Abra `http://127.0.0.1:8766/` no navegador do computador. Esse endereço local **não** é endereço de acesso pelo telefone. A instalação no smartphone requer publicação em origem HTTPS estável ou ambiente local seguro apropriado, ainda não preparado.

Os dados reais começam vazios. Já é possível criar cômodo, item, conta e saldo; registrar compra parcelada e pagamento ocorrido; montar, fechar e reutilizar lista de Mercado; registrar despesa, receita e transferência; criar projeto e tarefas; buscar; exportar e restaurar backup. Recarregar a página conserva os registros no mesmo navegador. A interface e os dados abrem sem internet depois que os arquivos forem carregados e o service worker estiver ativo. O backup JSON precisa ser guardado fora do aparelho.

**Persistência0.3.0:** snapshot e fila são gravados juntos no IndexedDB2. Login/vínculo, envio automático, UUID/base duráveis, confirmação, conflito conservador e status visível estão no código. O projeto Free de teste `azqlukwlcotyhildfvwt` recebeu a migração202610110001 e RLS; `config.js` contém somente URL/chave pública. A prova com conta Auth real/novo aparelho continua pendente. Somente os dados confirmados podem ser recuperados após perder o telefone. Backup JSON independente ainda é necessário para recuperar exclusão/corrupção propagada.

O acesso no Free usa link por e-mail com PKCE: abrir no mesmo navegador/origem que pediu acesso. Personalizar o template para OTP exige SMTP próprio ou upgrade; nenhum serviço foi contratado. A senha de provisionamento é definida diretamente no dashboard pelo usuário; senhas/tokens/verificador nunca entram no backup, código ou relatório.

Para o ensaio de login, use `node scripts/serve.mjs --port=8767`;8768 é a origem separada para recuperação limpa. O servidor não registra URLs de requisição, que podem conter códigos temporários. Ambas as origens foram autorizadas no projeto Supabase apenas para testes; não são publicação HTTPS nem acesso do telefone.

Verificação: `npm ci`, `npm run check`, `npm test` e `node tmp/app_qa.cjs` na raiz (QA histórico requer8766). PGlite0.5.8 é dependência exclusiva de teste; PWA continua sem dependências em execução. Tests Chromium usam Playwright/Chrome do runtime desta máquina e iniciam servidor isolado; simulam o protocolo/Auth, não o fornecedor. O QA percorre seis áreas,320–1536px, offline e backup. Ensaio SQL no Supabase real também passou com rollback e contagens0/0/0. A migração aplicada está registrada em `casa_private.schema_versions`; não reaplicar. Ler `supabase/README.md` e `docs/validacao/matriz-ca.md` para procedimentos e lacunas.

O roteiro histórico também está versionado em `scripts/app-qa.cjs` (`npm run qa`). Em outra máquina, fornecer `CASA_PLAYWRIGHT_MODULE` e `CASA_CHROME_PATH` para os testes Chromium; `CASA_PREVIEW_URL` altera a origem do QA. `npm test` inicia seu servidor isolado automaticamente. A PWA pode ser servida sem essas dependências de teste.

Este incremento não é a V1 pronta para publicação. Ainda faltam as funções e os gates descritos em `C:\opscon\docs\arquitetura\decisao-tecnica.md` e em `C:\opscon\features.json`.
