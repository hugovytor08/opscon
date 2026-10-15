# Incremento 0.3.4 — contraste do Mercado

15/10/2026. Primeiro bloco pequeno do prompt de execução reenviado pelo usuário: **VIS-04**. O card de lista existente herdava texto claro do tema sobre fundo claro fixo; o subtotal tinha o mesmo problema. `app/design-system.css` agora aplica superfícies escuras ao banner, ícone e subtotal, com os tokens existentes. Produtos de listas concluídas continuam desabilitados para edição, com opacidade integral para leitura do histórico. Nenhuma lógica financeira ou de listas foi alterada.

Versão **0.3.4**, shell **v12**. Domínio 1, IndexedDB 2, protocolo remoto 1 e migração instalada preservados. Service worker continua aguardando a liberação das abas antigas antes de ativar; não foi adicionado `skipWaiting` nem procedimento de limpeza de dados.

## Evidências desta execução

- `npm run check`: sintaxe válida em todos os módulos do app.
- `node --test tests/market-contrast.test.mjs`: **1/1 aprovado**. Contexto isolado, dados sintéticos; estados sem lista, lista vazia, preenchida com produto marcado/desmarcado e concluída. Capturas abertas/concluídas em **390 e 1280 px**, sem overflow horizontal e com controles de pelo menos 44 px. Medições estáticas usam redução de movimento para excluir a opacidade transitória da animação de entrada.
- Texto: menor contraste observado **6,07:1** no estado vazio; banner/lista aberta no mínimo **7,33:1** e estado concluído **8,58:1**, superando 4,5:1. Ícone do banner **7,02:1**, marca de seleção **9,99:1**, contorno de foco **11,75:1**, superando 3:1. Cálculo inclui fundos e opacidade de ancestrais; foco testado por teclado.
- O teste cria/conclui uma compra sintética de R$ 35 sem pagamento e confirma uma aquisição/nenhum pagamento. Conferência visual, mudança de largura e reload offline mantiveram estado, fila e geração exatamente iguais aos respectivos snapshots. Os produtos concluídos permaneceram legíveis e desabilitados. Nenhum erro de página.
- `node --test tests/domain.test.mjs tests/continuity.test.mjs`: **22/22 aprovados**. Integridade financeira, IndexedDB/fila atômica, quota, reenvio após resposta perdida, offline, conflitos, vínculo de proprietário, backup e recuperação em navegador limpo. O protocolo remoto/Auth desses testes é simulado; não comprova login ou configuração Supabase real.
- `git diff --check` e conferência de integridade do backlog/IDs/fontes: aprovados. Em `app`, somente tema, versão e nome do cache foram alterados; módulos financeiros, armazenamento, sincronização, Auth e SQL permaneceram sem alterações.

Capturas e medições reproduzíveis em `evidencias/incremento-0.3.4/`: `mercado-vazio-390.png`, `mercado-aberto-390.png`, `mercado-aberto-1280.png`, `mercado-concluido-390.png`, `mercado-concluido-1280.png` e `qa.json`.

## Prévia realmente aberta

A aba do usuário ainda exibia o banner antigo `rgb(241,245,235)` e o servidor da porta 8767 estava encerrado. Porta livre conferida; prévia iniciada com `node scripts/serve.mjs --port=8767`. Resposta HTTP de `version.json` confirmou 0.3.4/shell v12.

A aba foi recarregada e temporariamente liberada em `about:blank` para ativar a atualização. Ao reabrir a mesma origem, Mercado conservou a lista existente, zero produtos e indicação de **uma alteração pendente**. Inspeção do DOM/CSS confirmou banner `rgb(25,30,41)`, título `rgb(246,247,251)` e subtotal `rgb(36,43,57)`. Nenhum formulário de dados foi enviado nem armazenamento limpo nessa verificação. Captura da prévia em `tmp/diagnostico-preview/mercado-0.3.4.jpg`, fora do Git.

Sem SQL, senha/configuração real, push, deploy ou publicação. Nenhuma feature, CA ou gate concluído. Samsung Internet/S23 físico e revisão do usuário continuam pendentes. **Próximo bloco: AUT-01, acesso por nome de usuário/senha mantendo a identidade existente.** Retroativos, alimentação, nova planta/interação de Casa, gestão de listas e importação/preços permanecem no backlog.
