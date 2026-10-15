# Prompt de execução — ajustes do Casa Serena

Implemente os ajustes abaixo no repositório `C:\opscon`. Quero código funcionando, migrações necessárias, testes e evidências visuais. Este pedido de execução, quando enviado ao agente responsável, sucede a etapa de discussão registrada em 15/10; as notas de “somente planejamento” descrevem o estado anterior. Não refaça o planejamento inteiro nem pergunte novamente decisões já respondidas.

## Antes de alterar

Leia `AGENTS.md`, `docs/produto/leia-primeiro.md`, o relatório mais recente e `docs/produto/plano-ajustes-2026-10-15.md`. Consulte `docs/produto/backlog-reformulacao.json` para o estado de cada tarefa. Leia os demais arquivos apenas conforme o bloco exigir. O plano de 15/10 e as decisões deste prompt prevalecem sobre instruções antigas incompatíveis de aparência, seleção de Casa e escolha da imagem.

Confira `git status` e a versão realmente encontrada. A última base examinada foi 0.3.3, shell v11, domínio 1, IndexedDB 2 e protocolo remoto 1; isso é referência, não motivo para reverter trabalho posterior. Preserve alterações de outras sessões e todos os dados existentes.

Mantenha o contexto no agente principal, sem subagentes. Execute um bloco pequeno do caminho crítico por sessão, com código, evidência e backlog atualizado, conforme `AGENTS.md`. O objetivo completo está abaixo; cada entrega deve indicar precisamente o que funciona e o que ainda falta. Comece por VIS-04, salvo se já estiver comprovadamente resolvida.

## Decisões confirmadas e comportamento exigido

### 1. Contraste do Mercado — VIS-04

Corrija o card de lista existente: hoje há texto claro sobre fundo claro. Use as superfícies do tema escuro e confira textos, ícones e badges nos estados vazio, lista aberta e concluída. Valide contraste, foco e alvos móveis; não teste apenas a tela vazia. Preserve o sistema visual já implantado, inspirado no Samsung Health.

### 2. Login por e-mail e senha — AUT-01

O usuário atualizou esta decisão durante a execução: o acesso normal deve usar **e-mail + senha**, sem link em cada entrada. Nome de usuário e adaptador foram dispensados. Há uma única conta pessoal; preserve seu UUID Supabase Auth, dados e RLS, com cadastro público fechado.

Use a autenticação nativa por senha do Supabase, com erros genéricos, limites do provedor, recuperação separada e sessão renovável. Não crie adaptador, tabela/senha local ou e-mail pessoal fixado no frontend. Primeiro acesso é online; preserve o uso offline e a fila do aparelho autorizado. Explicite a política de expiração offline sem inventar um PIN obrigatório.

Prepare código/configuração e passos manuais curtos para o Supabase. Não automatize seu dashboard. O usuário define a senha fora do chat; nunca coloque credenciais em código, logs ou backup. Não declare a jornada real concluída enquanto faltar configuração ou teste integrado. Continue os blocos independentes se uma configuração externa estiver pendente.

### 3. Receitas e gastos anteriores ao saldo inicial — RET-01

Permita datas passadas em receitas, despesas, pagamentos e transferências. Corrija domínio, validação de snapshot, cálculo, SQL, backup e recuperação; retirar só a trava do formulário não resolve.

Distinga data do acontecimento, data de registro e efeito sobre o saldo de referência. Valor já refletido nesse saldo entra no histórico sem duplicar seu efeito; valor ainda não incluído altera o saldo. Mostre o resultado antes de confirmar. Preserve os efeitos dos registros antigos e trate transferências por conta.

O salário de **30 de setembro ainda não estava incluído no saldo informado**: quando o usuário registrá-lo, deve aumentar o saldo da conta escolhida. Seu valor não foi fornecido. Não crie esse lançamento por conta própria nem altere silenciosamente saldo/data de referência.

### 4. Cartão alimentação — BEN-01

Crie uma carteira de benefício separada da conta corrente e da fatura de crédito, com saldo próprio no Início/Finanças. Não presuma saldo inicial ou apague sobras.

Preveja **R$ 690 mensais no dia 30**, usando o último dia válido em fevereiro. A previsão não é dinheiro recebido: **o usuário confirma o recebimento**, com valor e data reais, inclusive adiantamento. Não gere créditos antigos automaticamente. Use identidade por carteira/competência para evitar duplicação após confirmação repetida, offline ou reenvio.

No Mercado, permita pagar com Alimentação, conta corrente ou divisão explícita. Compra de R$ 350 paga com Alimentação debita somente essa carteira. Pagamentos mistos fecham exatamente em centavos; insuficiência conhecida pede complemento ou correção do saldo.

### 5. Casa: nova imagem e seleção única — CAS-01–04

Use a imagem aprovada já preservada:

`C:\opscon\docs\design\apartamento-real\estudo-visual-2026-10-15\apartamento-sem-moveis-v2.png`

PNG de 1265 × 1243 px, SHA-256 `8cff27b8892ae51cf679b6aed5fd8648d19420e95eb652224ad6a82456fe579d`. O usuário confirmou: **mesma geometria, só melhorou a imagem**. Não regenere o PNG nem volte à imagem histórica `ref-casa.png` como base principal.

Consulte `docs/validacao/estudo-planta-vazia-2026-10-15.md`: o guia da v2 usa `docs/design/apartamento-real/geometria.json`; os exports de 14/10 ficam preservados como histórico. Continuidade da geometria não comprova identidade numérica entre arquivos nem registro pixel a pixel. Confira os oito ambientes sobre o PNG, sem copiar automaticamente alvos antigos ou inventar escala em metros. Imagem e regiões devem compartilhar a transformação de zoom/arraste.

Remova a criação de cômodos e os seletores redundantes por números/nomes fora da planta. A seleção normal ocorre **somente na planta**; tocar abre um card com **Quero comprar** e **Já comprei**. Preserve cômodos, itens e IDs; aquisição muda a categoria do mesmo item, sem confundir compra, pagamento, entrega e instalação. Vínculos precisam ser recuperáveis pela conta/backup.

No smartphone, use painel inferior; no desktop, detalhe adequado. Preserve posição/zoom ao fechar, suporte teclado e nomes acessíveis. Separe toque, arraste e pinça; permita roda/botões/recentralização. Alternativa textual somente em contingência/acessibilidade, sem manter outra seleção permanente.

A planta fica **somente em Casa**, inclusive offline. A imagem antiga do Início continua removida. A base vazia pode ser integrada antes da biblioteca de móveis reais; depois os móveis entram em camada separada e ocultável, conforme o guia de fotos existente. Não bloqueie esta atualização esperando fotos nem invente móveis do usuário.

### 6. Mercado com várias listas — MER-01

A página inicial de Mercado mostra todas as listas; abrir uma leva ao detalhe. Permita criar, renomear, adicionar/remover produtos, editar quantidades, voltar, excluir com recuperação/desfazer e concluir a compra. Listas diárias/semanais/mensais são usos livres; uma nova lista não substitui outra. Preserve listas já existentes.

Marcar produto no carrinho não significa pagar. Conclusão exige revisão da compra real e da origem do pagamento, com repetição idempotente. Lista concluída vai para histórico; retirar seu card da visão não apaga aquisição, pagamentos ou preços vinculados. Reutilizar lista não copia pagamento anterior.

### 7. Importação e preços úteis — IMP-01–07, MER-02

O app atual apenas confere rascunhos JSON: ainda não confirma importações financeiras. Evolua o modelo compartilhado de entrada manual/importação antes de apresentar médias como disponíveis. Consulte o plano de 14/10 e `docs/importacao/` para o contrato, reconciliação e aceites completos.

Fluxo: JSON colado/aberto → revisão editável → confirmação atômica de aquisição detalhada, pagamentos vinculados, proveniência e fila. Nota + Pix não duplica gasto/pagamento, inclusive entre lotes ou contra registros existentes. Identidade durável calculada pelo app, validação/unicidade no servidor, correção/cancelamento auditável e backup/restauração fazem parte da entrega antes de habilitar gravação financeira em lote. Conta a vencer não é conta paga; Pix pode ser entrada, saída ou transferência. Desconhecido não é zero. Não integrar API de IA ou serviço pago para extrair imagens.

Use preços realmente confirmados para sugerir estimativas das listas, mostrando amostra, período e loja. Correspondência de produto, marca, variante e embalagem deve ser revisável. Média ponderada por quantidades equivalentes; mostrar último, mínimo/máximo, preço da embalagem e unidade comparável, incluindo 900 ml versus 1 L. Use centavos e decimais exatos, com rateio de descontos determinístico.

Compare compras de R$ 600 e R$ 620 separando preço, quantidade e composição da cesta, com diferenças por produto/loja. Não trate os R$ 20 como inflação automaticamente. Sem histórico, indique preço desconhecido e total parcial; estimativa não vira preço pago nem movimenta saldo.

## Execução, validação e entrega

Siga a sequência do plano: contraste → acesso → retroativos → alimentação → Casa → gestão de listas → importação detalhada → ferramentas de preços, respeitando dependências. Faça escolhas técnicas rotineiras sem reabrir decisões do usuário. Não encerre um bloco apenas com protótipo/plano se houver implementação local possível e autorizada.

Preserve escrita offline, IndexedDB/fila, reenvio idempotente, conflitos, Auth/RLS e backup independente. Migrações são aditivas no cliente/servidor; não altere ou reaplique SQL já instalado. Preserve RF-01–20, CA-01–22 e F001–20; F020 continua fora da V1. Não insira demonstrações na base inicial, limpe armazenamento ou use dados pessoais para testes.

Rode `npm run check`, testes adequados às mudanças e integridade obrigatória; amplie somente por falha ou risco concreto. Use dados sintéticos isolados. Conforme o bloco, prove migração, cálculos, offline/reload, quota/atomicidade, ACK perdido, conflito, RLS, backup e recuperação limpa. Evidências antigas não substituem uma execução nova. Capture estados preenchidos móvel/desktop; Chromium não comprova Samsung Internet/S23 físico.

Atualize shell/service worker quando necessário e comprove a versão visível na prévia real: houve caso de interface antiga presa no cache. Não limpe dados para atualizar. Se a porta 8767 estiver ocupada, identifique o servidor existente antes de iniciar outro; comando local: `node scripts/serve.mjs --port=8767`.

Atualize backlog, relatório e `leia-primeiro.md` com comportamento, evidências e lacunas. Não marque feature/CA/gate concluído sem prova integrada. Entregue alterações locais revisáveis, capturas e passos de configuração necessários. Não faça push/deploy/publicação por este prompt nem contrate serviços; mantenha o deploy de teste como etapa separada, sem confundi-lo com aceite final da V1.

Responda em português, de forma curta: o que funciona, como foi validado, o que depende do usuário/ambiente e qual é o próximo bloco.
