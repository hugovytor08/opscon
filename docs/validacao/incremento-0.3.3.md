# Ajuste 0.3.3 — imagem do Início e referência de Casa

14/10/2026. O usuário confirmou **a ilustração antiga `app/assets/ref-casa.png` como acabamento de Casa**, com possibilidade de ocultar móveis. O JSON/isometria novos continuam sendo a geometria; a ilustração histórica só define qualidade gráfica. Decisão registrada em `docs/design/reformulacao-2026-10-14.md` e no backlog. A integração definitiva e a opção de ocultar móveis continuam pendentes, agora sem bloqueio de escolha da referência.

O usuário também pediu remover a imagem antiga do Início por não combinar com o novo design. O dashboard novo já usava cards; neste ajuste, `app/assets/ref-inicio.png` saiu da pasta publicada e do shell offline, e os estilos/componentes mortos da antiga composição foram retirados. O arquivo original foi movido para `docs/design/referencias-historicas/ref-inicio.png`, com SHA-256 preservado. Nenhum dado, ID, vínculo, saldo ou fila foi alterado por essa remoção.

Versão 0.3.3, shell v11; schema 1, IndexedDB 2 e protocolo remoto 1 mantidos. Sem `skipWaiting`: abas abertas continuam coerentes; o cache antigo é removido após fechá-las e ativar a atualização. Reabrir conectado para receber esta versão, sem limpar os dados do navegador.

Evidência desta alteração:

- **22/22 testes de domínio e continuidade aprovados**: `node --test tests/domain.test.mjs tests/continuity.test.mjs`. Incluem integridade financeira, fila atômica, quota, backup/restauração, offline, resposta perdida e conflito.
- `node scripts/qa-shell-removal.mjs`: ensaio Chromium com cache v10 contendo a imagem, atualização para v11 aguardando fechamento da aba, remoção do cache antigo e resposta 404 para o recurso removido. Estado, geração e fila sintéticos permaneceram exatamente iguais. Início sem imagens e reload offline funcionaram; os 25 recursos atuais do shell existem.
- Captura 390 px e resultado em `evidencias/incremento-0.3.3/inicio-390.png` e `qa.json`. Contexto de navegador e registros exclusivamente sintéticos; nenhuma limpeza da base pessoal.
- `npm run check` e `git diff --check` passaram. A regressão completa anterior 43/43 pertence ao incremento 0.3.2; não é apresentada como nova execução neste ajuste. Sem prova física no Galaxy S23/Samsung Internet.

Sem SQL, push, deploy ou publicação. Nenhum gate/CA foi concluído. O próximo trabalho de Casa é aplicar o modelo novo com a qualidade da ilustração escolhida e camada de móveis opcional; o backlog de importação permanece preservado.

## Correção da prévia aberta pelo usuário

Após o relato de tela sem mudanças, a aba real em `http://127.0.0.1:8767/` foi inspecionada: ainda carregava o Início antigo (`Seu próximo passo`), `ref-inicio.png` e somente os dois CSS anteriores. O processo Node de prévia ocupava a porta, mas as consultas HTTP expiravam. Foi reiniciado apenas esse servidor, na mesma origem, e a resposta HTTP confirmou a versão 0.3.3. A aba antiga foi liberada temporariamente para ativar o novo shell e então reaberta, sem limpar armazenamento ou alterar registros.

Confirmação no navegador do usuário: título `Seu espaço`, ações `Compra / despesa` e `Recebimento`, novo `design-system.css`, fundo `rgb(12,16,24)` e nenhuma imagem no Início. Captura local em `tmp/diagnostico-preview/navegador-atualizado.jpg`, fora do Git. Essa verificação da prévia real é adicional aos contextos isolados anteriores; não equivale à validação física no S23.
