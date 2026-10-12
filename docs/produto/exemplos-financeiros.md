# Casos verificáveis de cálculo e mudança de estado

**Rascunho 0.1 — 29/09/2026.** Os valores abaixo são dados artificiais para especificação e testes do aplicativo. **Obrigatório** indica efeito já definido na proposta v1.2; **proposta** indica uma convenção que ainda precisa passar pelo protótipo/contrato. Cada caso deve ser executado no núcleo financeiro e observado nas interfaces pertinentes quando houver implementação. As regras detalhadas estão em `C:\opscon\docs\produto\regras-funcionais.md`.

## E01 — Intenção, alternativas e preço desconhecido

**Dado:** não há compras nem obrigações. Criar “Luminária” apenas com nome, sem cômodo, projeto ou preço. Adicionar três alternativas com preços R$ 120, R$ 150 e R$ 180; escolher R$ 150 como estimativa de referência.

**Então, obrigatório:** antes de escolher a estimativa, o item existe e o total ainda planejado é **parcial/desconhecido**, com o item localizável. Depois, o ainda planejado conhecido para esta necessidade é R$ 150, **uma vez**. Adquirido = pago = a pagar = R$ 0; o saldo da conta não muda. Três alternativas não viram três necessidades. Vínculos de casa/projeto continuam opcionais. **RF-01/02/16; CA-01/03/13.**

**Falha a testar:** tentar salvar nome vazio conserva os outros campos digitados e explica o erro. Salvar o desejo não pode criar obrigação.

## E02 — Sofá, três parcelas e recebimento

**Dado:** um sofá para Sala tem estimativa R$ 3.000. Vytor confirma uma compra de R$ 2.700 com vencimentos de três parcelas de R$ 900. Depois confirma pagamento da primeira parcela e marca o sofá recebido.

| Momento | Adquirido | Pago bruto | A pagar | Ainda planejado referente ao sofá |
|---|---:|---:|---:|---:|
| Antes da compra | R$ 0 | R$ 0 | R$ 0 | R$ 3.000 |
| Após compra | R$ 2.700 | R$ 0 | R$ 2.700 | R$ 0 |
| Após primeiro pagamento | R$ 2.700 | R$ 900 | R$ 1.800 | R$ 0 |
| Após recebimento, sem outro pagamento | R$ 2.700 | R$ 900 | R$ 1.800 | R$ 0 |

**Obrigatório:** a estimativa de R$ 3.000 pode continuar no histórico, mas não no total ainda por comprar. Confirmar pagamento subtrai R$ 900 do caixa da conta escolhida, uma vez. Recebimento não altera números financeiros. O registro consultado por Casa/Compras/Projeto conserva o mesmo ID. **RF-02–RF-05; CA-02/04/05.**

**Falha a testar:** se a gravação de uma das três obrigações falhar, compra e obrigações não ficam parcialmente confirmadas (§9).

## E03 — Resto de centavos e pagamento parcial

**Dado:** compra de R$ 100,00 em três parcelas. **Proposta de distribuição:** R$ 33,34 + R$ 33,33 + R$ 33,33 = R$ 100,00, com a primeira recebendo o centavo residual. Para uma obrigação independente de R$ 900,00, registrar pagamento de R$ 250,00.

**Então, obrigatório:** soma das parcelas = total contratado; na obrigação de R$ 900, pago = R$ 250 e saldo aberto = R$ 650. O custo adquirido ligado à obrigação permanece R$ 900. Uma visão de orçamento baseada nessa obrigação a conta uma vez: R$ 250 pago + R$ 650 aberto representam R$ 900; não R$ 1.150. A posição temporal exata dessa visão é **PROP-01**, ainda a validar. **RF-03–RF-05; CA-04/05 mais cenário complementar.**

**Falha a testar:** R$ 33,33 × 3 produz R$ 99,99 e deve ser impedido; nenhuma diferença escondida por arredondamento.

## E04 — Fatura com duas compras

**Dado:** compras existentes originaram obrigações de cartão de R$ 900 e R$ 150 na mesma fatura. A fatura totaliza R$ 1.050. Confirmar pagamento de R$ 1.050 saindo de uma conta.

**Então, obrigatório:** um movimento de caixa de R$ 1.050 liquida as duas obrigações por alocações rastreáveis. Nenhuma terceira compra/despesa é criada. Se, alternativamente, for informado pagamento parcial de R$ 300 com alocação explícita à primeira obrigação, seus saldos ficam R$ 600 e R$ 150. Não se inventa quitação do restante. **RF-05/06; CA-06 mais cenário complementar.**

**Pendente AB-02:** ciclo de fechamento, vencimento, regra padrão para alocar pagamento parcial e crédito de estorno em cartão. Rotativo, juros e renegociação ficam fora da V1. **Falha:** reenvio do pagamento não pode retirar R$ 1.050 outra vez.

## E05 — Transferência entre contas próprias

**Dado:** conta A = R$ 1.000 e conta B = R$ 500. Transferir R$ 200 de A para B.

| Grandeza | Antes | Depois |
|---|---:|---:|
| Saldo A | R$ 1.000 | R$ 800 |
| Saldo B | R$ 500 | R$ 700 |
| Soma das contas | R$ 1.500 | R$ 1.500 |
| Receita/despesa consolidada causada pela transferência | R$ 0 | R$ 0 |

**Obrigatório:** ambos os lados persistem juntos. **RF-07; CA-07.** **Falha:** não deixar apenas débito nem apenas crédito após interrupção.

## E06 — Reserva cobrindo compra

**Dado:** conta com saldo confirmado de R$ 5.000. Destinar R$ 1.000 a uma reserva. Comprar por R$ 800, com obrigação ainda não paga e R$ 800 cobertos pela reserva.

| Estado | Saldo da conta | Reserva ativa | Obrigação aberta | Cobertura vinculada | Disponibilidade candidata¹ |
|---|---:|---:|---:|---:|---:|
| Antes da reserva | R$ 5.000 | R$ 0 | R$ 0 | R$ 0 | R$ 5.000 |
| Após reservar | R$ 5.000 | R$ 1.000 | R$ 0 | R$ 0 | R$ 4.000 |
| Após comprar | R$ 5.000 | R$ 1.000 | R$ 800 | R$ 800 | R$ 4.000 |
| Após pagar R$ 800 cobertos | R$ 4.200 | R$ 200 | R$ 0 | R$ 0 | R$ 4.000 |
| Após liberar o excedente R$ 200 | R$ 4.200 | R$ 0 | R$ 0 | R$ 0 | R$ 4.200 |

¹ `saldo confirmado − reserva ativa − obrigação aberta + cobertura vinculada`, usando o mesmo conjunto de contas e horizonte. É uma **proposta** de indicador, não promessa de que uma compra cabe no orçamento.

**Obrigatório:** reservar não muda saldo bancário; comprar não desconta obrigação duas vezes; pagar reduz caixa e consome cobertura; excedente pode ser liberado explicitamente. **RF-10–RF-12; CA-08.**

**Falhas a testar:** tentar vincular R$ 900 de cobertura a obrigação de R$ 800; tentar reservar o mesmo R$ 1.000 para duas finalidades; pagar mais do que aberto. Escopo da reserva por conta e falta de saldo ainda dependem de F003.

## E07 — Projeto estimado sem compromisso

**Dado:** projeto de viagem com limite/estimativa R$ 8.000, três tarefas e nenhuma contratação. Marcar uma tarefa concluída.

**Então, obrigatório:** custo ainda planejado/limite pode mostrar R$ 8.000 com rótulo adequado; adquirido = pago = a pagar = R$ 0; saldo bancário inalterado. Progresso de tarefas muda pela conclusão da tarefa, não pelo valor estimado. **RF-01/08/09; CA-09.**

**Falha:** mostrar R$ 8.000 em “a pagar” ou como dinheiro reservado automaticamente.

## E08 — Compra em dois cômodos, frete e desconto

**Dado:** um item para Sala custa R$ 600 e outro para Quarto custa R$ 400; frete R$ 50; desconto R$ 20. Compra total = R$ 600 + R$ 400 + R$ 50 − R$ 20 = **R$ 1.030**.

**Proposta de rateio proporcional:** net de frete/desconto R$ 30 dividido 60%/40%: Sala R$ 618, Quarto R$ 412. **Obrigatório:** R$ 618 + R$ 412 = R$ 1.030; a consulta consolidada mostra R$ 1.030, não R$ 2.060. A regra exata de rateio e o tratamento de centavos precisam ser registrados antes de F008. **RF-12/13/17; CA-10.**

**Falha:** duas linhas de R$ 1.030 cada, ou rateio que perca um centavo.

## E09 — Devolução de compra já paga

**Dado:** saldo de conta antes de compra = R$ 1.000. Compra de R$ 300 totalmente paga: saldo = R$ 700. Solicitar devolução parcial de R$ 100; depois reconhecer o ajuste e finalmente confirmar reembolso de R$ 100.

| Momento | Custo adquirido líquido | Pagamentos históricos brutos | Reembolso pendente | Saldo da conta |
|---|---:|---:|---:|---:|
| Compra paga | R$ 300 | R$ 300 | R$ 0 | R$ 700 |
| Devolução só solicitada | R$ 300 | R$ 300 | R$ 0¹ | R$ 700 |
| Ajuste reconhecido | R$ 200 | R$ 300 | R$ 100 | R$ 700 |
| Reembolso confirmado | R$ 200 | R$ 300 | R$ 0 | R$ 800 |

¹ Pedido pode ser acompanhado separadamente, sem tratá-lo como valor a receber confirmado.

**Obrigatório:** preservar a compra e o pagamento históricos; não reduzir a obrigação abaixo de zero nem inventar entrada em caixa. Depois do reembolso, saída líquida de caixa atribuível à compra = R$ 200. O modo de reconhecer ajuste e crédito em cartão é **PROP-06/AB-02**. **RF-03/15; CA-11.**

**Falha:** saldo subir para R$ 800 apenas porque a devolução foi solicitada, ou apagar pagamento de R$ 300 para forçar igualdade simplista.

## E10 — Gasto sem Casa e recortes sobrepostos

**Dado:** três despesas confirmadas, todas sem cômodo/projeto: viagem R$ 120 (categoria Transporte), passeio R$ 80 (categoria Alimentação) e relacionamento R$ 50 (categoria Lazer). Categoria e contexto podem ficar vazios no cadastro rápido.

**Então, obrigatório:** total geral adquirido = R$ 250. Consulta por contexto Viagem = R$ 120; por categoria Transporte = R$ 120; a mesma despesa de R$ 120 não vira R$ 240 porque aparece nos dois filtros. Alterar classificação não altera valor financeiro. **RF-14/17; CA-16.**

**Falha:** exigir escolher Casa/Projeto para registrar o passeio; somar totais de dimensões sobrepostas como se fossem novas compras.

## E11 — Mercado com preço incompleto e fechamento real

**Dado:** lista com arroz sem preço e leite com estimativa R$ 6. Marcar ambos “no carrinho”. Depois finalizar a ida por **R$ 48,90**, informando pagamento à vista por uma conta cujo saldo anterior era R$ 100.

| Momento | Subtotal estimado | Compra adquirida | Pago | Saldo da conta |
|---|---|---:|---:|---:|
| Lista/carrinho | R$ 6 conhecidos, **parcial** | R$ 0 | R$ 0 | R$ 100 |
| Finalizada e paga | Histórico estimado R$ 6, **parcial** | R$ 48,90 | R$ 48,90 | R$ 51,10 |

**Obrigatório:** uma compra de R$ 48,90 vinculada à lista; leite não cria despesa extra de R$ 6; arroz não recebe preço fictício. Se a forma for cartão, criar obrigações conforme o acordo e só mostrar pago quando pagamento for informado/verificado. Reenviar o fechamento mantém a mesma compra. **RF-18/19; CA-17/18.**

**Falha:** carrinho diminuir saldo, fechar sem total real ou gerar uma despesa por produto além do total.

## E12 — Reutilização do Mercado

**Dado:** lista de E11 já fechada; criar próxima ida reutilizando arroz e leite. Alterar leite de uma unidade para duas.

**Então, obrigatório:** nova lista/entradas editáveis têm novos IDs; lista anterior mantém quantidades e compra de R$ 48,90. A nova lista não tem compra/obrigação antes do próprio fechamento. **RF-20; CA-19.**

**Falha:** editar a compra anterior ou copiar seu pagamento para a nova ida.

## E13 — Meses diferentes para compra, vencimento e caixa

**Dado:** compra de R$ 100 em setembro, única obrigação vencendo em outubro, pagamento confirmado antecipadamente em setembro. **Aplicar PROP-01.**

**Então:** custo adquirido de setembro = R$ 100; pago em setembro = R$ 100; obrigação originalmente com vencimento em outubro = R$ 100, porém saldo aberto em outubro = R$ 0. Se o orçamento mensal usar vencimento como base candidata, os R$ 100 ocupam outubro uma única vez como obrigação quitada; a saída de setembro aparece na visão de caixa, não como segundo consumo do orçamento de outubro. A UI explica essa diferença. **RF-03/05/16; complemento aos CA-05/06.**

**Pendente:** a política final de orçamento e pagamentos antecipados/atrasados exige validação antes de F011. Se ela mudar, atualizar este caso e a UI; não ajustar apenas uma tela.

## E14 — Quantidade parcialmente adquirida

**Dado:** intenção de quatro cadeiras com estimativa unitária R$ 150, ou R$ 600 para as quatro. Comprar duas por total real R$ 280. **Aplicar PROP-07.**

**Então:** adquirido = R$ 280; estimativa ainda por comprar = R$ 300 para duas cadeiras; custo projetado conhecido = R$ 580. A estimativa histórica original R$ 600 não se soma novamente. Se não houver base confiável para estimar as duas restantes, projeção fica parcial. **RF-01/02/16; complemento a CA-04/13.**

**Pendente:** definir tratamento de quantidade/unidade e a escolha da estimativa restante no contrato de F003.

## E15 — Recorrência prevista e pagamento factual

**Dado:** regra mensal exemplificativa de R$ 100 para uma conta fixa futura. A próxima ocorrência é gerada. **Aplicar PROP-04**, que ainda distingue previsão de obrigação assumida conforme configuração do tipo.

**Então:** instância apenas prevista aparece como projeção, sem pagar nem mudar caixa. Se confirmada como obrigação assumida, a pagar = R$ 100 até pagamento factual. Regerar a mesma ocorrência não cria outra obrigação. Confirmar pagamento de R$ 100 reduz caixa e liquida somente a obrigação correspondente. **RF-05/09/14/16; critério adicional de recorrências de §6.**

**Falha:** gerar recorrência já marcada como paga, criar duas ocorrências para o mesmo período ou converter qualquer previsão em dívida sem a política escolhida.

## E16 — Falha de rede e idempotência

**Dado:** confirmação de compra de E02 com identidade de operação `op-sofa-1`. Persistência conclui, mas a resposta não chega à interface. Reenviar `op-sofa-1` com conteúdo igual.

**Então, obrigatório:** resposta recupera o mesmo ID de compra e as mesmas três obrigações; saldo/estimativas não se alteram outra vez. Enviar `op-sofa-1` com total R$ 2.800 deve retornar conflito explícito e instruir correção em operação nova auditada. O mesmo princípio se aplica a pagamento, transferência e fechamento Mercado. **RF-14/19; CA-12/18.**

**Falhas adicionais:** interrupção antes da confirmação não deixa compra sem parcelas; interface diferencia concluído, falhou e resultado pendente/consultável, conservando dados preenchidos.

## E17 — Backup e restauração do conjunto integrado

**Dado:** ambiente com sofá de E02, fatura parcialmente paga de E04, reserva de E06, devolução de E09, lista reutilizada de E12, categorias/contextos, projeto e imagem/anexo habilitado. Exportar pacote estruturado e restaurar em ambiente limpo.

**Então, obrigatório:** registros, IDs/vínculos, histórico pertinente, configurações e anexos presentes são recuperados. Totais antes/depois são equivalentes por conta, aquisição, obrigações, pagamento, reserva, contexto, projeto e Mercado. CSV de consulta não é aceito como substituto do pacote. **§9; CA-15.**

**Falhas:** pacote inválido/incompatível ou interrupção não produz uma base aparentemente completa com relações faltantes. Política de mesclagem/substituição e recuperação de acesso será especificada em F003/F015.

## E18 — Ausência de mapa e execução pela lista

**Dado:** serviço/representação visual da Casa indisponível, mas os registros do sofá e luminária permanecem acessíveis.

**Então, obrigatório:** pela lista, Vytor consegue consultar item, editar, registrar compra/pagamento e marcar recebimento conforme permissões, sem desenhar planta. Mapa/Lista e preferência de visualização são aspectos de UI. **§5; CA-14.**

**Falha:** a biblioteca visual interromper comandos financeiros ou esconder ações essenciais.

## Uso dos casos na próxima etapa

- **Protótipo:** mostrar E01–E02, E04–E06, E09–E13 e E18 como fluxos navegáveis, com valores/rótulos exatos e estados de erro. Mercado usa E11/E12; Projetos usa E07; gasto rápido usa E10.
- **Modelo e contratos:** representar todos os eventos, vínculos, datas, ajustes e resultados de E01–E17. Casos marcados **proposta** só serão congelados após a decisão pertinente.
- **Testes futuros:** começar pelo cálculo/estado de cada caso, depois integração entre áreas, falhas de gravação, restauração e revisão visual. Nenhum caso executado neste rascunho é teste de software; são resultados esperados para comparar com a futura implementação.
