# Ajustes de acesso, Casa, finanças e Mercado — 15/10/2026

**Execução 0.3.7/BEN-01:** carteira alimentação, previsão/competência, confirmação, sobras e pagamentos exclusivos/mistos implementados localmente no domínio 3. Regressão 71/71 e prova UI 2/2; relatório `../validacao/incremento-0.3.7.md`. Aplicação SQL e recuperação hospedada/S23 ainda pendentes conforme `../../supabase/ALIMENTACAO.md`. Próximos blocos Casa e gestão de listas; nenhum gate concluído.

**Execução 0.3.6/RET-01:** cliente, UI, domínio 2 e migração SQL aditiva preparados; prévia de saldo e revisão auditável incluídas. SQL remoto/recuperação real ainda pendentes. Ver `../validacao/incremento-0.3.6.md`, `../arquitetura/saldo-de-referencia.md` e `../../supabase/RETROATIVOS.md`. Próximo bloco local BEN-01; nenhuma conclusão de gate por esta implementação.

**Decisão posterior e execução 0.3.5:** usuário aceitou e-mail/senha e dispensou adaptações por nome de usuário. AUT-01 tem cliente/UI nativos e recuperação separados, com provas simuladas; falta validação real conforme `../../supabase/ACESSO-EMAIL-SENHA.md`. Estratégia offline documentada em `../arquitetura/acesso-email-senha.md`. Próximo bloco independente RET-01. Evidências em `../validacao/incremento-0.3.5.md`; nenhuma configuração real ou gate concluído.

**Execução posterior autorizada pelo prompt reenviado:** primeiro bloco VIS-04 entregue localmente na versão 0.3.4; ver `../validacao/incremento-0.3.4.md`. As notas de planejamento abaixo descrevem a preparação anterior. Login, retroativos, alimentação, Casa, gestão de listas e importação/preços ainda não foram implementados por esse incremento; próximo bloco AUT-01.

Planejamento para discussão, a pedido do usuário. Não executar alterações no aplicativo por este documento. Complementa `plano-reformulacao-2026-10-14.md`; preserva seus requisitos de importação, geometria, continuidade e correção. Base examinada: 0.3.3, shell v11, domínio 1, IndexedDB 2, protocolo remoto 1. Nenhum gate/CA/feature passa a concluído.

## Decisões já respondidas

| Ponto | Decisão do usuário |
|---|---|
| Login | Decisão posterior: e-mail + senha nativos do Supabase, sem adaptador. Substitui nome de usuário; link fica só na recuperação da senha. |
| Cartão alimentação | R$ 690 previstos mensalmente; só confirmar o crédito quando recebido. |
| Salário de 30/09 | Ainda não estava incluído no saldo informado. Seu registro deve acrescentar o valor à conta escolhida. Não foi informado nem registrado o valor do salário nesta sessão. |
| Casa | Cadastro de cômodos já suficiente; retirar criação de cômodo e seletores visíveis redundantes. Seleção normal apenas pela planta; toque abre card com duas listas: Quero comprar / Já comprei. |
| Nova imagem de Casa | Usar `docs/design/apartamento-real/estudo-visual-2026-10-15/apartamento-sem-moveis-v2.png` como base principal. O usuário confirmou a mesma geometria, apenas melhoria da imagem. A antiga `ref-casa.png` fica como referência histórica; a imagem antiga do Início permanece fora do app. |

O pedido autoriza tratar esses requisitos no plano; não é ordem para implementar ou configurar o Supabase durante a discussão.

## Achados no código e no print

| Achado | Evidência e consequência |
|---|---|
| Login atual depende de link | `app/config.js` usa `magic-link`; `app/supabase.js` só oferece código/link. O relato de falha do link não identifica sozinho sua causa. Não substituir apenas o rótulo do formulário. |
| Mensagem de receita anterior | `income.record`, pagamentos e transferências bloqueiam datas anteriores a `account.openingDate`. A validação de snapshot e o SQL também impõem isso. O saldo atual soma os movimentos ao saldo inicial; retirar uma trava só na UI não resolve. |
| Listas anteriores inacessíveis | `market.create` acrescenta registros a `state.markets`; `currentMarket()` mostra a selecionada, a última aberta ou a última existente. Não há navegador completo de listas, renomeação ou exclusão. O código não substitui a lista anterior ao criar outra. |
| Histórico insuficiente | `market.close` cria uma aquisição com uma linha agregada. A conferência de JSON não grava compras, produtos, pagamentos nem preços. Não há base de histórico detalhado para calcular as médias solicitadas. |
| Contraste ruim no Mercado | `.market-banner` em `app/styles.css` mantém `#f1f5eb`, enquanto texto/acento herdados vêm do tema escuro. O print mostra o estado com lista existente; testar só a tela vazia não cobre esse defeito. |
| Seleção de Casa redundante | `renderHouse` oferece regiões na planta, botões numerados, abas de nomes e criação de cômodo. O detalhe não separa explicitamente planejado/adquirido. Vínculos ainda ficam apenas no navegador. |

## 1. Acesso por e-mail e senha — AUT-01

- Tela de login com e-mail/senha, uma conta pessoal já existente e cadastro público fechado. Preservar o mesmo UUID Auth e todos os vínculos de dados; não criar outro proprietário para trocar o método de entrada.
- Durante a execução o usuário dispensou nome de usuário/adaptador e autorizou e-mail/senha nativos. Não criar função intermediária, tabela de senhas ou e-mail pessoal fixo no JavaScript público.
- Usar o backend Supabase já adotado e entregar instruções manuais curtas de configuração/recuperação. Sem contratação ou promessa de quota/custo novo. Segredos e senhas ficam fora de código, chat, backup e logs.
- Erro genérico de credenciais, limite de tentativas e sessão renovável. Recuperação de acesso é um percurso separado do login normal; definir/testar sua configuração sem exigir link a cada entrada.
- Primeiro acesso/verificação no servidor requer conexão; preservar uso offline posterior e fila do aparelho já autorizado. Autenticação remota não equivale à criptografia do armazenamento local. Fechar a política de bloqueio/expiração offline no desenho técnico, sem descartar dados nem trocar silenciosamente a estratégia offline.

Aceite: entrar com e-mail/senha real no ambiente de teste, renovar/sair, falhar com credencial incorreta, recuperar acesso e entrar em navegador limpo mantendo o mesmo proprietário e registros. Testar isolamento RLS e retenção de pendências offline. Senha real definida pelo usuário fora do chat.

## 2. Receitas e gastos retroativos — RET-01

- Permitir datas passadas em receitas, despesas, pagamentos e transferências. A data de referência do saldo deixa de ser uma data mínima de lançamento.
- Separar **data do acontecimento**, **data de registro** e **efeito sobre o saldo de referência**. Histórico retroativo deve aparecer na competência correta.
- Quando um valor anterior já estiver refletido no saldo informado, permitir guardá-lo no histórico sem somar/descontar novamente. Quando não estiver incluído, aplicar seu efeito ao saldo. Mostrar o resultado antes de confirmar; não alterar automaticamente saldo/data de referência para fazer a conta fechar.
- Neste caso, o usuário respondeu que o salário de 30/09 não estava incluído: o registro deve aumentar o saldo da conta selecionada. Não preencher valor ou registrar salário real a partir da conversa.
- O tratamento é por conta, inclusive em transferências com datas de referência diferentes nas duas pontas. Pagamento refletido no saldo ainda precisa quitar a obrigação correspondente no histórico. Correções e mudança de classificação são auditáveis.
- Migrar registros antigos preservando seus efeitos atuais. Atualizar comandos, validação de snapshot, cálculo de saldo, SQL, backup e recuperação juntos, por migrações aditivas; não editar a migração já instalada.

Aceite: o salário anterior é aceito e aumenta o saldo quando não incluído; receita/despesa já refletida não altera o saldo duas vezes; despesa antiga pendente não inventa pagamento; transferência trata as duas contas; repetir/offline/restaurar conserva IDs e totais.

## 3. Cartão alimentação como saldo próprio — BEN-01

- Modelar uma carteira de benefício, distinta da conta corrente e de cartão de crédito/fatura. Saldo de alimentação aparece separado do dinheiro disponível no Início e em Finanças.
- Não presumir saldo inicial de R$ 690: o saldo real pode ter consumo ou sobra. O usuário informa o saldo de referência; créditos/despesas confirmados compõem a carteira. Não zerar sobras ao virar o mês.
- Recorrência prevista de **R$ 690 no dia 30**. Em fevereiro, usar o último dia válido, 28/29. Não retrogerar créditos de meses anteriores sem revisão. Mostrar previsão fora do saldo disponível.
- Ao confirmar, registrar valor/data efetivamente recebidos; permitir data adiantada, como 28/29, e corrigir divergência real. Identidade por carteira e competência evita confirmar o mesmo recebimento duas vezes, inclusive offline/reenvio.
- No pagamento do Mercado, escolher Alimentação, conta corrente ou divisão explícita. Uma compra pode ter pagamentos vinculados em carteiras distintas, com soma exata em centavos. Uma compra de R$ 350 paga em Alimentação reduz só essa carteira; não reduz a conta corrente.
- Saldo insuficiente conhecido no benefício deve pedir complemento/divisão ou correção do saldo informado, sem criar dinheiro disponível. O crédito de benefício fica identificado e não é apresentado como salário/dinheiro livre.

Aceite: previsão não altera saldo; confirmar uma vez credita R$ 690 na carteira; nova confirmação/reenvio não duplica; compra no benefício não debita banco; pagamento misto fecha o total; sobras e fevereiro/adiantamento funcionam após sync e restauração.

## 4. Casa: uma seleção e duas listas — CAS-04, CAS-01–03

- Remover Novo cômodo/Criar cômodo do uso normal, os botões de seleção numerados fora da planta, as abas por nome e a alternância Mapa/Lista como navegação normal. Preservar cômodos e IDs já existentes; não deduzir cadastro a partir de móveis ilustrados.
- Um toque em uma região da planta abre o detalhe do cômodo: **Quero comprar** (ideias/necessidades anotadas) e **Já comprei** (aquisição registrada). Adicionar/editar item parte desse detalhe, já com o cômodo selecionado.
- Registrar uma compra muda a categoria visual do mesmo item/ID. Entrega e instalação continuam independentes de aquisição e pagamento. Não criar uma terceira lista para repetir as necessidades anotadas.
- Smartphone: card em painel inferior; desktop: painel de detalhe. Fechar/voltar conserva posição/zoom da planta. Tap, arraste e pinch não podem disparar ações uns dos outros.
- Regiões continuam operáveis por teclado e com nomes acessíveis. Alternativa textual deve aparecer somente em contingência de falha da planta ou necessidade de acessibilidade; não volta como uma segunda seleção permanente na tela normal.
- Migrar os vínculos locais válidos para dados recuperáveis por conta/backup, com revisão em conflito. A parte gráfica definitiva continua CAS-01; gestos, CAS-02; vínculos/listas por cômodo, CAS-03.
- Integrar a nova imagem vazia v2, sem regenerá-la: PNG de 1265 × 1243 px, idêntico por SHA-256 ao anexo reenviado pelo usuário. Ele confirmou que não alterou a geometria, apenas a imagem. Preservar ambientes e IDs; conferir o registro das regiões clicáveis sobre os pisos na nova projeção, sem reutilizar automaticamente as coordenadas da imagem anterior. Imagem e alvos devem compartilhar a mesma transformação de zoom/arraste.
- Proveniência técnica da v2: o guia usa `docs/design/apartamento-real/geometria.json`, conforme `docs/validacao/estudo-planta-vazia-2026-10-15.md`; o JSON/SVG de 14/10 permanece histórico. A confirmação de continuidade geométrica pelo usuário não equivale à identidade numérica desses arquivos nem à calibração pixel a pixel do PNG. Não converter UR em metros sem medida verificada.
- A base vazia pode ser integrada antes da biblioteca dos móveis reais. Preparar móveis futuros como camada separada, ocultável, conforme `docs/design/apartamento-real/guia-fotos-moveis.md`; não embutir móveis no PNG aprovado nem anunciar alternância mobiliada antes de essa camada existir.

Aceite: a imagem v2 aparece somente em Casa, inclusive offline; só a planta oferece seleção na tela normal; cada região abre os itens do ID certo; compra migra o mesmo item entre as duas listas; não há botão de cadastrar cômodo; fallback, teclado, gestos e troca de aparelho não perdem dados ou alinhamento. Conferir os oito ambientes e bordas em largura móvel/desktop, com zoom e arraste. Quando houver camada de móveis, ocultá-la conserva base, alvos e dados.

## 5. Mercado: página de listas e gestão — MER-01

- Entrada do Mercado mostra **as listas**, com nome, quantidade de produtos e estado. Nova lista acrescenta um card independente; nomes iguais não são identidade e não sobrescrevem outra lista.
- Abrir uma lista leva ao seu detalhe: adicionar/remover produtos, editar quantidade e nome da lista, voltar às demais listas, excluir e concluir a compra. Conservar as listas já guardadas pelo modelo atual.
- Lista semanal/diária/mensal são nomes/uso escolhido pelo usuário, sem obrigar uma periodicidade ou criar listas automaticamente.
- Excluir lista aberta é uma ação recuperável com identificação da lista e possibilidade de desfazer. Uma lista já vinculada a aquisição deve poder sair da visualização sem apagar compras, pagamentos ou preços; correção/cancelamento financeiro é um percurso próprio auditável.
- Produto no carrinho não significa pago. **Marcar compra como realizada/concluir** exige revisar a compra real; escolher pagamento apenas quando ocorrido. Lista concluída vai para histórico e pode originar outra lista sem copiar o pagamento.

Aceite: criar A e B, editar/reabrir A, excluir B e desfazer, recarregar offline e recuperar por conta; concluir A uma vez, repetir confirmação sem duplicar, retirar lista da visão sem apagar histórico financeiro.

## 6. Preços como ferramentas — IMP-01–07 e MER-02

- Primeiro entregar modelo detalhado compartilhado por entrada manual e importação: aquisição com linhas, produto/variante/embalagem, quantidades exatas, estabelecimento/filial, datas, descontos e preço efetivamente pago. Confirmação, conciliação e correção acompanham esse modelo; seguir as regras IMP do plano de 14/10.
- Nome digitado sugere correspondência revisável. Não juntar automaticamente arroz de embalagens diferentes, macarrões de variantes diferentes ou marcas incompatíveis com a comparação escolhida.
- Ao incluir um produto, sugerir estimativa a partir das compras compatíveis do usuário, sempre identificada como estimativa. Exibir amostra, período e origem dos preços. Sem histórico, o preço fica desconhecido; total parcial informa quantos itens faltam, sem substituir desconhecido por zero.
- Média proposta: soma dos valores líquidos comparáveis dividida pela quantidade equivalente adquirida, com ponderação pelas quantidades. Mostrar também último, menor e maior observados, preço da embalagem e R$/unidade equivalente. Preservar marca/variante/embalagem e permitir filtros por loja/data.
- Desconto geral tem rateio determinístico que fecha em centavos; frete/juros ficam discriminados e não mudam silenciosamente o preço comparável do produto. Não usar dinheiro em ponto flutuante nos cálculos.
- Comparar compra de R$ 600 com R$ 620 separando **variação de preço**, **quantidade** e **itens diferentes**. A diferença total de R$ 20 sozinha não prova aumento de preços. Comparações entre supermercados mostram datas e amostra; não prometem preço atual de prateleira.
- Notas e comprovantes relacionados não duplicam compra/pagamento. Conta alimentação escolhida na revisão determina de onde sai o pagamento. Histórico corrigido/cancelado acompanha a auditoria sem apagar pagamentos independentes.

Aceite: nota com 20 produtos, 900 ml × 1 L, peso fracionário, descontos, duas lojas, variantes revisáveis, estimativa da lista, diferença de cesta/preço/quantidade, nota+Pix, alimentação/pagamento misto, correção e recuperação em aparelho limpo. Não liberar conclusões de preço a partir de rascunhos não confirmados.

## Correção visual — VIS-04

Uniformizar `.market-banner` com as superfícies do tema escuro e corrigir todos os textos/ícones/badges associados. Verificar contraste no estado com lista real aberta e concluída, além do vazio; texto comum deve atingir ao menos 4,5:1 e controles/indicadores essenciais, 3:1. Manter alvos de 44 px, foco e tamanhos móveis. O print é evidência de defeito existente; a correção não foi aplicada nesta sessão.

## Sequência proposta de incrementos

| Ordem | Bloco pequeno e verificável | Condição de entrega |
|---|---|---|
| 1 | Corrigir contraste do Mercado | Lista aberta/concluída e tela vazia legíveis no tema, com captura e contraste medido. |
| 2 | Acesso por e-mail/senha | Auth nativo, configuração manual entregue e jornada real preservando o mesmo proprietário. |
| 3A | Lançamentos retroativos e saldo de referência | Cálculos, migração cliente/SQL, auditoria e backup íntegros. |
| 3B | Carteira alimentação e crédito previsto | Saldo separado, confirmação mensal idempotente e pagamento na carteira certa. |
| 4A | Casa: seleção pela planta e card de duas listas | Remover controles redundantes sem perder cômodos/itens; recuperar vínculos. |
| 4B | Casa: integrar a imagem vazia v2 | Oito regiões alinhadas à nova imagem, IDs/vínculos preservados e cache offline atualizado; biblioteca de móveis reais pode vir depois. |
| 5 | Navegador e gestão de listas de Mercado | Listas coexistem, edição/exclusão/conclusão mantêm os vínculos e histórico. |
| 6A | Aquisições detalhadas e importação confirmável | IMP-02/03/04/06/07, correção e validação no servidor antes de gravação financeira em lote. |
| 6B | Histórico, estimativa e comparação de preços | IMP-05/MER-02 alimentados por dados confirmados e unidades compatíveis. |

São propostas de execução, não datas/prazos prometidos. Um bloco não será declarado completo só porque a UI parece pronta. Auth, retroativos, carteira e importação podem exigir SQL/configuração; entregar arquivos e passos curtos ao usuário, sem automação do dashboard ou reaplicação da migração instalada. Cada alteração traz sua evidência, atualização do shell quando cabível e prova na aba realmente aberta, preservando cache coerente e fila.

## Rastreabilidade e validação futura

Tarefas novas em `backlog-reformulacao.json`: VIS-04, AUT-01, RET-01, BEN-01, CAS-04, MER-01 e MER-02. Ligadas às F existentes, sem reutilizar F020 nem renumerar RF/CA/IMP. O estado de implementação atual permanece explícito.

Além dos aceites acima, testar migração antiga/nova, RLS, quota, atomicidade, reenvio após ACK perdido, conflito entre aparelhos, backup/restauração limpa e shell offline nos blocos afetados. Usar fixtures sintéticas isoladas; não copiar salário, senha, documentos ou base pessoal para logs/Git. Chromium não substitui Samsung Internet/S23 físico.

Fontes oficiais consultadas em 15/10/2026: [login por senha](https://supabase.com/docs/reference/javascript/auth-signinwithpassword), [configuração de acesso/cadastro](https://supabase.com/docs/guides/auth/general-configuration) e [limites de autenticação](https://supabase.com/docs/guides/auth/rate-limits). A proposta anterior de adaptador foi dispensada pelo usuário; usar o acesso nativo por e-mail/senha.
