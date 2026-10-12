# Contratos de operações compartilhadas

**Rascunho 0.1 — 29/09/2026.** Base: proposta v1.2 §§2, 4, 6–10 e o modelo conceitual deste diretório. São contratos de **comportamento** para interface, testes e futuro adaptador MCP; nomes técnicos e transporte ainda não foram escolhidos. Toda escrita conserva as invariantes de `modelo-dados.md` e os exemplos E01–E18 de `docs/produto/exemplos-financeiros.md`.

## Padrão comum a cada comando

| Campo ou regra | Significado exigido |
|---|---|
| Identidade do principal | Vytor na UI; futuramente Berenice sob autorização própria e revogável. Resolvida por sessão/credencial confiável, jamais aceita como um `owner_id` livre no corpo do comando. |
| Escopo | Todas as referências de entrada e registros retornados precisam pertencer ao dono autorizado. Conferir vínculo novo e antigo, inclusive anexos e exportação. |
| Identidade da operação | Chave única por intenção de escrita, estável em reenvio após timeout. O servidor guarda assinatura lógica da entrada e resultado consultável; retenção concreta depende de F003/F005. |
| Pré-condições | Versão/estado esperado do registro quando houver disputa de edição, permissões e validações de valor/data/rateio. Conflito não deve sobrescrever silenciosamente. |
| Resultado | IDs estáveis, estado final, efeitos financeiros explícitos, valores antes/depois quando relevantes, avisos de dados ausentes e referência de histórico. |
| Erro de validação | Indicar campo e regra violada, preservando entrada da interface; nenhuma parte financeira é salva. |
| Erro de acesso | Não revelar dados de outro dono; nenhuma alteração. |
| Conflito | Distinguir versão desatualizada, estado incompatível e reutilização da mesma chave com conteúdo diferente. |
| Resposta perdida | Cliente consulta resultado por identidade ou repete mesma entrada; o núcleo não executa novamente. Se o resultado ainda é incerto, UI sinaliza pendência e conserva formulário. |
| Auditoria | Registrar autor/origem/momento, identificador, parâmetros essenciais sem segredos, resultado e vínculo com eventos/ajustes. |

Exemplo de resposta **conceitual** à compra do sofá, sem fixar JSON/API final: `resultado = concluído; compra_id = c1; obrigações = [900, 900, 900]; adquirido = 2700; pago = 0; aberto = 2700; item_id = i1; operação = op-sofa-1`. A repetição da mesma entrada retorna os mesmos IDs. Alterar o total mantendo `op-sofa-1` produz conflito, exigindo uma nova operação de correção auditada (E02/E16; RF-14; CA-12).

## Catálogo mínimo de comandos e consultas

Os nomes abaixo facilitam rastreabilidade; podem mudar na implementação desde que a capacidade e os efeitos permaneçam.

| Operação de domínio | Entrada e efeito indivisível | Resultado/erro decisivo | Origem visual / CA |
|---|---|---|---|
| `criarItem`, `editarItem`, `descartarItem` | Nome mínimo; complementos opcionais; estado de intenção independente. Descartar não apaga compra já feita. | Mesmo ID em Casa/Compras/Projeto; preço ausente sinalizado. | D1/D2/D3/M1/M2/M3; CA-01/02/13 |
| `criarComodo`, `listarComodos`, `listarItens` | Nomear ambiente e consultar itens sem mapa. | Lista utilizável com representação indisponível. | D2/M2/M6; CA-14 |
| `criarAlternativa`, `selecionarEstimativa` | Associar opções ao item; selecionar referência sem gerar compra. | Uma necessidade/estimativa relevante no planejado. | D3/M3; CA-03 |
| `vincularRegistro`, `desvincularRegistro` | Ligar item, compra, projeto, cômodo e contexto permitidos, conferindo dono e rateios. | Vínculo reflete o mesmo ID; nenhuma nova cobrança. | Casa/Compras/Projetos; CA-02/10/16 |
| `registrarCompra` | Total/data/forma/linhas/rateios/obrigações; retirar estimativa atendida do planejado; persistir tudo ou nada. | Soma exata, IDs de obrigações, adquirido separado de pago; rejeição limpa se incoerente. | D3/M3; CA-04/10/12 |
| `registrarGastoRapido` | Total/data/conta ou cartão, classificação opcional; usa o mesmo mecanismo de compra/obrigação. | Não exige item/casa/projeto; pagamento imediato só se informado como ocorrido. | Novo/Finanças; CA-16 |
| `confirmarPagamento` | Conta/data/valor e alocações às obrigações. | Uma saída de caixa, saldos abertos atualizados; não cria compra. | D3/D4/M4; CA-05/06/12 |
| `comporFatura`, `pagarFatura` | Associar obrigações de cartão e liquidá-las por uma saída da conta, com alocações explícitas. | Parcial permanece aberto; compras originais intactas. Ciclo/estorno aguardam AB-02. | D4/M4; CA-06 |
| `registrarSaldoInicial`, `registrarReceita`, `registrarTransferencia` | Saldo datado; receita confirmada/prevista; transferência com dois efeitos. | Saldo confiável e renda/despesa invariantes para transferência. | D4/M4; CA-07 |
| `criarReserva`, `vincularCobertura`, `liberarReserva` | Destinação, vínculo a obrigação e consumo/liberação conforme pagamento. | Disponibilidade sem dupla dedução, conta sem movimento ao reservar. | D4/M4; CA-08 |
| `definirOrcamento`, `registrarRecorrencia`, `gerarOcorrencia` | Limite/recorte; ocorrência única por período; previsão e obrigação distinguidas. | Nenhum pagamento automático; orçamento não cria caixa. | D4/M4; CA-09/13 + critérios de §6 |
| `criarProjeto`, `editarProjeto`, `criarTarefa`, `concluirTarefa` | Resultado/ação/tarefas/vínculos e progresso por execução. | Estimativa de viagem não cria dívida; tarefa concluída não liquida obrigação. | D5/M5; CA-02/09/22 |
| `criarListaMercado`, `editarEntrada`, `marcarCarrinho` | Produtos/quantidades/preços opcionais; estados de lista sem efeito financeiro. | Subtotal parcial localizável, saldos intactos. | Mercado derivado D3/M3; CA-17 |
| `finalizarMercado` | Lista, total real, data e pagamento/parcelas; chama a operação financeira comum em unidade indivisível. | Uma compra vinculada; resultado recuperável após reenvio. | Mercado; CA-18/12 |
| `reutilizarLista` | Lista anterior → novos IDs de entradas para próxima ida. | Histórico/compra anterior imutáveis por edição da nova. | Mercado; CA-19 |
| `marcarRecebido`, `marcarInstalado` | Evento físico aplicável ao item comprado. | Só estado/progresso físico muda, caixa e obrigações intactos. | D2/D3/M2/M3; CA-05 |
| `iniciarCancelamento`, `reconhecerAjuste`, `confirmarReembolso`, `corrigirLancamento` | Etapas explícitas com impacto e reversões. | Histórico preservado; pedido não movimenta caixa; pago em excesso vira crédito/reembolso pendente. | D3/D4; CA-11 |
| `buscarRegistros`, `consultarTotais`, `consultarOperacao`, `consultarHistorico` | Consultas com escopo, período/base e filtros. | Registro e composição do total explicáveis; chamada de consulta não produz efeito. | Seis áreas; CA-02/12/13/16 |
| `exportarConsultaCsv`, `exportarBackup`, `validarBackup`, `restaurarBackup` | Escopos e formatos separados; restauração com política de substituição/mesclagem e autorização definidas. | Comparar IDs, relações, anexos e totais em ambiente limpo; rejeitar pacote inconsistente. | Configurações; CA-15 |
| `gerenciarAcesso` | Recuperação de acesso e, futuramente, revogação da Berenice com autorização apropriada. | Revogação impede leitura/escrita subsequentes sem remover trilha histórica. | Configurações; §9 / MCP futuro |

**Operações administrativas futuras** são as disponibilizadas ao próprio Vytor, conforme §9. A matriz de cobertura de D deve mapear cada operação real da UI a uma ferramenta/recurso MCP ou justificar por que uma ação puramente visual não é operação de dados. Um servidor só de leitura não cumpre a integração planejada.

## Pontos de decisão por operação

- **Fatura:** definir fechamento, data de vencimento, regra padrão/alocação revisável de pagamento parcial e destino de estorno antes de finalizar `pagarFatura`.
- **Devolução:** definir como ajustar parcelas e rateios já pagos e registrar crédito em cartão versus reembolso em conta antes de liberar correção complexa. Nunca ocultar excesso pago como saldo aberto negativo.
- **Reserva:** definir quais contas compõem saldo elegível e como cobertura parcial/excedente se deslocam entre obrigações e pagamentos.
- **Recorrência:** configuração distingue previsão e obrigação assumida; uma ocorrência gerada não confirma pagamento.
- **Restauração:** escolher semântica de sobrescrever/mesclar, versão de pacote e o tratamento de operações idempotentes restauradas; não reativar credenciais revogadas silenciosamente.
- **Offline:** escolher se as escritas podem ficar pendentes e qual política resolve concorrência entre aparelhos. Se não houver offline, contrato/erro deve dizer que não salvou.

## Verificação antes de concluir F003

1. Para E01–E18, apontar operação, campos, efeito, retorno, erro e consulta que explicam o resultado. A matriz não pode depender da tela específica para preservar dinheiro.
2. Simular perda de resposta em `registrarCompra`, `confirmarPagamento` e `finalizarMercado`; mesmo identificador deve recuperar IDs anteriores. Simular mesma chave com entrada diferente e obter conflito.
3. Simular falha entre compra e obrigações, entre duas pontas de transferência e entre lista fechada e sua compra; cada conjunto fica completo ou não concluído.
4. Conferir escopo do dono em leitura, escrita, vínculos, anexos, busca, backup e restauração. Quando Berenice for ativada, testar com identidade própria e após revogação.
5. Restaurar um conjunto representativo em ambiente limpo e conferir relacionamentos e totais. O formato físico e a estratégia offline devem estar escolhidos antes de considerar essa verificação executada.

Este catálogo **prepara** o adaptador MCP. Não escolhe protocolo/SDK, não cria servidor e não dá permissão de acesso real; essas tarefas pertencem à entrega D.
