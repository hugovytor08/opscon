# Especificação funcional — ciclo essencial e finanças

**Rascunho 0.1 — 29/09/2026.** Fonte principal: proposta consolidada v1.2, §§1–12, sobretudo §4 (RF-01–RF-20), §7 (jornadas), §9 (integridade) e §10 (CA-01–CA-22). Ler junto com `C:\opscon\docs\produto\decisoes.md` e `C:\opscon\docs\produto\exemplos-financeiros.md`. O documento detalha comportamentos para revisão e protótipo; não afirma que as políticas ainda abertas estão aprovadas ou implementadas.

## 1. Resultado e limites

Vytor registra uma intenção, pesquisa alternativas, compra quando decidir, acompanha obrigações/pagamentos e marca a execução física ou da tarefa. O mesmo item pode ser visto em Casa, Compras e Projeto sem cópias financeiras. Mercado permite uma jornada operacional distinta para supermercado, mas usa o mesmo mecanismo de compra/pagamento ao finalizar (§§1–5).

A primeira ação pode ser somente: **salvar nome de item**, **registrar gasto rápido** ou **abrir lista de Mercado**. Preço, casa, projeto, categoria e renda não são exigidos para começar. A experiência tem de explicar números e permitir corrigir erros, inclusive após pagamento. Não há pagamentos reais pelo aplicativo; um pagamento registrado é a informação de um acontecimento financeiro (§§2, 6–7, 9).

**Cobertura deste rascunho:** conceitos, estados, dados mínimos, fórmulas candidatas, exemplos, situações de erro, rastreabilidade de RF/CA e pontos de decisão. A política completa de armazenamento/offline, a implementação dos contratos e o protótipo visual dependem de etapas posteriores. Essas dependências não impedem usar este texto para desenhar fluxos navegáveis sem gravar dinheiro real.

## 2. Linguagem única entre as áreas

| Conceito | O que significa | O que não significa |
|---|---|---|
| Necessidade/item | Algo que Vytor quer obter ou resolver; pode estar sem preço. | Compra, dívida ou pagamento. |
| Alternativa | Opção pesquisada para atender um item; uma pode fornecer a estimativa de referência. | Outra necessidade somada ao planejamento. |
| Estimativa | Valor provisório escolhido para o restante a adquirir; pode faltar. | Valor contratado, gasto real ou dinheiro reservado. |
| Compra/aquisição | Decisão já confirmada, com data e total acordado; pode conter vários itens. | Saída de caixa necessariamente ocorrida. |
| Obrigação | Valor devido em uma data, inclusive parcela ou componente de fatura. | Novo custo além da compra que a originou. |
| Pagamento | Saída efetiva, informada/verificada, de uma conta; liquida obrigações. | Compra nova, recebimento do produto ou inferência por vencimento. |
| Fatura | Agrupamento de obrigações de cartão que serão liquidadas conjuntamente. | Despesa adicional ao valor das compras. |
| Reserva | Destinação de parte do saldo registrado. | Saída bancária ou verba livre para outro objetivo. |
| Orçamento | Limite de planejamento para um período/recorte. | Saldo existente em conta. |
| Recorrência | Regra para sugerir/gerar ocorrências futuras. | Pagamento automático; a distinção previsão/obrigação deve ser configurada. |
| Devolução e reembolso | Ajuste reconhecido do que foi adquirido/devido; eventual entrada confirmada em caixa. | Um único estado que automaticamente devolve dinheiro ao pedir cancelamento. |
| Contexto e categoria | Formas de localizar e resumir o mesmo registro. | Transações financeiras independentes. |

**Estados independentes:** planejamento (`desejo`, `em pesquisa`, `planejado`, `descartado`, `atendido` quando houver aquisição pertinente); entrega (`sem compra`, `aguardando`, `recebido`, `instalado` quando se aplicar); pagamento (`sem obrigação`, `não pago`, `parcialmente pago`, `quitado`), calculado das obrigações e alocações. Os nomes são rótulos de especificação a revisar na UI. Um sofá pode estar instalado e parcialmente pago (§4.2; CA-05). Conclusão de tarefa/projeto é outra dimensão.

**Datas independentes:** intenção, compra, vencimento, pagamento, recebimento, instalação, ajuste reconhecido e reembolso confirmado. Mudar uma data não altera retroativamente as outras. Eventos financeiros e de execução devem conservar histórico quando corrigidos.

## 3. Entradas e operações do primeiro ciclo

| Ação | Mínimo para solicitar | Resultado observável | Erro/recuperação |
|---|---|---|---|
| Criar item | Nome não vazio. | ID estável e item visível; preço/cômodo/projeto continuam opcionais. | Nome inválido: explicar e conservar texto. Reenvio com mesma operação não cria outro ID. |
| Acrescentar alternativa | Item existente e identificação da opção. | Opção ligada ao item; escolher estimativa de referência não altera caixa. | Item ausente/sem acesso: nenhuma alteração; manter formulário. |
| Registrar compra | Data, total real, forma de pagamento e distribuição dos itens quando houver mais de um. | Compra e obrigações consistentes, valores rastreáveis; estimativa atendida sai do ainda planejado. | Soma, data ou distribuição inválida: nenhuma metade é salva. Após resposta perdida, consultar/repetir a mesma operação. |
| Gasto rápido | Valor real, data e conta ou cartão. | Aquisição/despesa financeira sem item/cômodo/projeto obrigatório; pagamento imediato quando informado. | Dados inválidos preservados para correção; categoria/contexto nunca exigidos. |
| Confirmar pagamento | Acontecimento informado/verificado, conta, valor, data e obrigação(ões) a liquidar. | Uma saída de caixa com alocações; saldo aberto cai; compra permanece a mesma. | Não inferir pagamento por vencimento/entrega. Valor acima do saldo devido exige fluxo de correção/crédito definido, não quitação silenciosa. |
| Transferir | Duas contas próprias diferentes, valor e data. | Débito/crédito atômicos; saldo consolidado, renda e despesa invariantes. | Falha não pode salvar só um lado. |
| Criar reserva | Finalidade, valor e origem do saldo no escopo definido. | Destinação identificável, saldo bancário inalterado. | Destinação além do montante elegível ou sobreposição deve ser rejeitada/explicada. |
| Marcar recebido/instalado | Item adquirido e evento aplicável. | Progresso físico muda; obrigações e caixa não mudam. | Estado impossível (instalação sem recebimento, quando exigido) explicado; correção com histórico. |
| Cancelar/devolver | Registro, quantidade/valor e etapa do processo. | Ajuste apropriado de custo/obrigações, trilha de antes/depois, reembolso separado. | Pedido isolado não aumenta saldo; conflito com pagamento já feito exige resolução explícita. |
| Abrir/editar lista Mercado | Nome do produto; quantidade/unidade/preço estimado quando úteis. | Entradas operacionais, subtotal completo ou parcial, carrinho separado. | Preço ausente não vira zero; perda de conexão informa se entrada foi salva. |
| Finalizar Mercado | Lista em andamento, total real, data, conta ou cartão e forma de pagamento. | Uma compra/despesa vinculada à lista; produtos são detalhes. | Reenvio retorna o mesmo fechamento; correção segue operação financeira, não edita silenciosamente histórico fechado. |
| Reutilizar lista | Lista anterior e ação de criar próxima ida. | Novos IDs editáveis para as entradas, preservando compra e produtos históricos. | Repetição da ação não pode criar listas acidentais se mesma operação for reenviada. |

Todos os comandos de escrita terão identidade de operação e retorno consultável. Identidade/autorização virão de contexto confiável, inclusive na futura interface MCP (§9). O contrato concreto e a duração da retenção de idempotência pertencem a F003.

## 4. Totais e tempo — política proposta para testar no protótipo

Os rótulos precisam acompanhar o período escolhido. **PROP-01** propõe estas bases, sem tratá-las como aprovação definitiva:

| Indicador | Registros que entram | Data de referência | Aviso necessário |
|---|---|---|---|
| Custo adquirido | Linhas de compras confirmadas, com ajustes reconhecidos explicitados. | Data de aquisição; ajustes podem ser vistos na data do evento e atribuídos à compra para visão líquida. | Não somar pagamentos; mostrar bruto/líquido quando devoluções existirem. |
| Pago | Pagamentos confirmados alocados; distinguir pago bruto de reembolsos confirmados quando aplicável. | Data da saída efetiva. | Pagamento de obrigação de outro mês continua no mês do caixa; indicar a obrigação de origem. |
| A pagar | Saldo aberto das obrigações, com vencimento/ajustes. | Vencimento para a vista mensal. | Parcela paga parcialmente entra só com o saldo aberto; mostrar vencidas em recorte adequado, sem sumir. |
| Ainda planejado | Estimativas selecionadas das necessidades ainda não atendidas. | Período pretendido, quando informado. | Se faltar preço ou período, total é parcial e lista faltantes. |
| Saldo registrado | Saldo inicial datado + movimentos confirmados posteriores no mesmo conjunto de contas. | Data de corte da consulta. | Saldo inicial ausente não é R$ 0; não somar receita prevista nem limite de cartão. |
| Reserva ativa | Destinações de recursos existentes, com cobertura vinculada discriminada. | Estado na data consultada. | Não é despesa nem saída bancária. |
| Orçamento consumido | Obrigações assumidas incluídas no recorte e período da política escolhida. | **Candidata:** vencimento para a visão mensal, preservando também visão por aquisição e por caixa. | Uma obrigação não entra de novo por ser paga; parte paga/aberta soma uma única obrigação. |

**Compra, vencimento e caixa não precisam coincidir no mesmo mês.** Por exemplo, uma compra de setembro com parcela de outubro paga antecipadamente em setembro aparece no custo adquirido de setembro, no compromisso de vencimento de outubro e no caixa pago de setembro. Esses indicadores não devem ser somados entre si para “reconciliar” um mês. O protótipo deve permitir abrir os registros de cada total. Vytor só precisará decidir alguma exceção se sua rotina exigir outra leitura.

**Saldo inicial:** registrar valor e data de corte por conta. Movimentos anteriores já embutidos nesse saldo não entram novamente no cálculo prospectivo. O destino de lançamentos retroativos ou de edição do saldo inicial ainda será fechado em F003 antes da camada de dados.

**Projeção:** `custo projetado = custo adquirido ajustado reconhecido + estimativas das quantidades ainda não atendidas` para um mesmo conjunto de itens/contexto. Preço ausente torna o total **parcial**, mesmo que a soma dos preços conhecidos seja calculável. Receita prevista, limite de cartão e orçamento não provam disponibilidade. Se saldo de conta, obrigações ou estimativas essenciais estiverem incompletos, a resposta à pergunta “cabe?” é **dados insuficientes**, com indicação do que falta (RF-16).

**Disponibilidade candidata para um horizonte definido:** `saldo confirmado − reservas ativas − obrigações abertas + cobertura de reservas vinculada a essas obrigações`. A cobertura só pode existir dentro da reserva e da obrigação abertas. Esse número não é exibido como garantia de compra quando contas, horizonte ou obrigações estão incompletos. Limites por categoria, projeto e cômodo são visões do mesmo dinheiro; não viram três saldos livres (RF-10–RF-12).

**Precisão e rateios:** calcular internamente em centavos exatos. Para parcelar ou ratear um total, a soma das partes confirmadas tem de ser exatamente o total. Uma convenção determinística candidata para resto é distribuir centavos a partir da primeira parcela/linha, sempre visível na revisão; outras convenções são possíveis desde que estáveis, auditáveis e não alterem o total. Para ratear frete/desconto entre itens/cômodos, sugerir proporção pelos valores dos itens e permitir revisão explícita; a proporção é proposta, não regra confirmada por Vytor. Nunca dividir arbitrariamente o total de Mercado entre produtos sem preços conhecidos.

## 5. Detalhamento RF-01–RF-20 para execução e verificação

Cada linha abaixo declara comportamento, verificação concreta e erro que não pode produzir estado inconsistente. Os exemplos completos estão no arquivo de casos. Requisitos acrescentados como convenção estão identificados nas seções anteriores e em `decisoes.md`.

| RF | Comportamento e verificação | Falha/limite |
|---|---|---|
| RF-01 | Nome basta para desejo. Valor ausente permanece desconhecido. Criar com/sem estimativa não muda saldo, obrigação ou pagamento. | Converter `sem preço` em R$ 0 no agregado ou criar dívida ao salvar intenção viola a regra. |
| RF-02 | Aquisição confirmada retira do ainda planejado a quantidade atendida; valor estimado original pode ser mostrado como histórico. | Recontar estimativa antiga junto ao valor adquirido, ou apagar referência histórica sem decisão, distorce projeção. Atendimento parcial é PROP-07. |
| RF-03 | Exibir adquirido, pago e a pagar separados, com origem e período. O status de entrega não calcula pagamento. | Rótulo “gastos” sem definição ou soma de pagos ao custo adquirido é rejeitado. |
| RF-04 | Ao criar compra parcelada, validar parcelas positivas, datas e soma em centavos igual ao total; mostrar resto distribuído. | Diferença de um centavo, parcela negativa ou quantidade inválida impede confirmação inteira. |
| RF-05 | Confirmar pagamento produz uma saída de conta e alocação contra uma ou mais obrigações; reduz saldo aberto. | Não criar outra compra nem liquidar obrigação acima do que foi confirmado. |
| RF-06 | Fatura referencia obrigações de cartão existentes. Pagá-la registra uma saída e aloca valores sem nova aquisição; pagamento parcial deixa aberto o restante. | Fatura sem composição rastreável ou quitação integral inferida de pagamento parcial é inválida. Rotativo/juros não são simulados. |
| RF-07 | Transferência própria altera duas contas de modo indivisível e mantém saldos totais, receita e despesa consolidadas invariantes. | Conta origem igual à destino, valor inválido ou falha no segundo lado cancela a operação. |
| RF-08 | Limite de cartão, receita prevista e saldo confirmado são apresentados separadamente. | Não somar previsão ou limite à caixa/disponibilidade confirmada. |
| RF-09 | Orçamento, projeto e desejo ficam no planejamento. Só obrigação assumida entra em compromisso financeiro. | Uma viagem estimada sem contratação não cria dívida. Recorrência prevista requer política PROP-04. |
| RF-10 | Criar/alterar reserva identifica finalidade e valor destinado, sem movimento bancário; mostrar quanto do saldo resta sem destino. | Mesmo centavo não pode ficar livre em duas reservas incompatíveis; escopo/conta ainda dependem de F003. |
| RF-11 | Compra com reserva cria cobertura vinculada às obrigações; disponibilidade deduz o compromisso uma vez. Pagamento consome cobertura correspondente; excedente pode ser liberado. | Cobertura maior que reserva ou obrigação, ou pagamento que subtrai cobertura sem atualizar reserva, é rejeitado. |
| RF-12 | Limites de categoria, projeto e cômodo são recortes do mesmo registro/dinheiro; suas disponibilidades não são somáveis. | Vincular uma compra a duas visões não duplica saldo nem compromisso. |
| RF-13 | Distribuir compra multi-item/contexto, frete e desconto com total fechado; guardar rateios consultáveis. | Faltante, excesso ou soma diferente da compra impede confirmação; não replicar total em cada cômodo. |
| RF-14 | Vincular registros existentes não cria outro lançamento. Repetir a mesma operação devolve o resultado anterior; mesma chave com conteúdo diferente exige conflito explícito. | Falha de rede após persistência não justifica segunda compra/pagamento. |
| RF-15 | Cancelamento/devolução guarda histórico; separar solicitação, ajuste reconhecido e reembolso confirmado. Corrigir obrigações/reservas pertinentes. | Pedido não aumenta caixa; se houver valor já pago, tratar crédito/reembolso pendente sem apagar pagamento histórico. |
| RF-16 | Projeção mostra período, premissas, cobertura do dado e faltantes localizáveis. | Não afirmar capacidade de compra com saldo/valores ausentes; não converter ausência em zero. |
| RF-17 | Categoria, contexto, cômodo e projeto classificam/vinculam sem exigir Casa. Consultas por dimensões usam IDs de lançamentos/rateios únicos. | Somar totais de recortes sobrepostos como se fossem transações diferentes é proibido. |
| RF-18 | Lista Mercado guarda produto, quantidade/unidade e preço estimado opcionais. Carrinho só muda estado operacional. Subtotal avisa parcialidade. | Marcar item no carrinho não altera caixa, obrigação ou pagamento. |
| RF-19 | Fechar Mercado com total real/data/forma cria uma compra financeira vinculada à lista e pagamento/parcelas correspondentes; reenvio retorna mesmo fechamento. | Preços estimados por produto não viram lançamentos extras; não fechar sem total real. |
| RF-20 | Reutilizar lista/produto cria entradas novas para próxima ida, preservando dados da lista fechada e sua compra. | Alterar quantidade futura não atualiza aquisição anterior. |

## 6. Regras de correção e resultados desconhecidos

1. **Salvar ou falhar sem metade:** compra, parcelas, vínculos e rateios devem ser confirmados como uma unidade. O mesmo vale para os dois lados de transferência e para compra/obrigações geradas por Mercado (§9; CA-12/18). A tecnologia de transação será escolhida em F003/F005.
2. **Resposta perdida:** se a gravação ocorreu mas o cliente não recebeu confirmação, consultar resultado pelo identificador da operação ou repetir exatamente a solicitação. Retornar o mesmo resultado. Se o mesmo identificador vier com dados diferentes, exigir correção explícita em vez de sobrescrever (RF-14/19).
3. **Valor pago não some:** editar compra depois de pagamento preserva o pagamento histórico. Um ajuste reconhecido pode reduzir custo/obrigação; valor pago em excesso fica como crédito/reembolso pendente, sem criar caixa antes de confirmação. A regra de crédito em cartão versus dinheiro em conta ainda precisa de contrato específico para o modo escolhido.
4. **Cancelar a intenção não cancela o acontecido:** descartar item não apaga compra, obrigações ou pagamentos que já existam. Cancelamento de compra tem fluxo próprio; devolução parcial conserva o restante adquirido.
5. **Registro incorreto de pagamento:** correção auditada/estorno de lançamento informado, com efeito inverso explícito no caixa e obrigação, sem excluir o histórico. O comportamento exato para fatura já paga depende dos exemplos de AB-02.
6. **Falha offline:** enquanto AB-01 estiver aberto, protótipo não promete gravação sem internet. Na implementação, se offline não for suportado, preservar formulário e informar indisponibilidade; se suportado, mostrar pendente até sincronização confirmada. Backup e sincronização continuam distintos (§9).

## 7. Critérios e trabalho seguinte

**Pronto para teste de protótipo:** CA-01–CA-05, CA-07, CA-09, CA-13, CA-14, CA-16–CA-22 têm efeitos/rótulos suficientes para um fluxo demonstrável com dados de exemplo. CA-06, CA-08, CA-10–CA-12 e CA-15 também têm cenários de referência neste rascunho, mas exigem fechar os contratos de fatura, reserva, rateio, recuperação e persistência antes da implementação real. CA-20–CA-22 exigem inspeção visual lado a lado, não podem ser provados só por este texto.

**Pendências para fechar F002:** base de orçamento mensal/atrasos e pagamentos antecipados, política de fatura parcial/estorno em cartão (AB-02), disponibilidade/reserva com várias contas, quantidade parcialmente adquirida, devolução com pagamento já realizado e destinos de itens não comprados em Mercado. As propostas PROP-01–PROP-07 dão um caminho concreto e verificável; permanecem marcadas até teste ou decisão pertinente. A necessidade de aparelhos/offline (AB-01) bloqueia F003/F005, não este texto.

**Próximo artefato:** `C:\opscon\docs\design\fluxos-prototipo.md` transforma estes cenários em telas/ações/estados; depois F003 mapeia cada ação para contrato de domínio. Os exemplos numéricos do arquivo acompanhante são dados de teste esperados, não valores reais de Vytor.
