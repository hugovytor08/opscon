# Modelo conceitual de dados e invariantes

**Rascunho 0.1 — 29/09/2026.** Fonte: proposta consolidada v1.2 §§2–4, 6, 9–10; regras e exemplos em `C:\opscon\docs\produto\`. Define responsabilidades e relações, sem escolher banco, framework, formato físico ou tecnologia offline. Campos técnicos e cardinalidades abaixo são **propostos** para viabilizar os CA; serão revistos quando AB-01 (aparelhos/offline) e as convenções financeiras forem decididos.

## Fronteira do núcleo

Uma identidade de dono delimita todos os registros pessoais. A interface e o futuro servidor MCP chamam os mesmos serviços de domínio. Casa, Compras, Mercado, Finanças e Projetos são **visões** de registros ligados por IDs, não bancos separados. A representação isométrica lê cômodos/itens e nunca calcula nem grava dinheiro diretamente. Toda alteração financeira passa por comando com validação, efeito indivisível, resultado consultável, identidade de operação e histórico (§9).

```mermaid
flowchart LR
  UI[Interface responsiva] --> OPS[Operações do domínio]
  MCP[Adaptador MCP futuro] --> OPS
  OPS --> CORE[Validações, autorização, idempotência e auditoria]
  CORE --> DATA[(Dados e anexos autoritativos)]
  MAP[Mapa e lista da Casa] --> UI
```

O diagrama não implica arquitetura de implantação escolhida. A identidade da Berenice e sua revogação serão incluídas quando D for ativada; os contratos devem aceitar autores distinguíveis desde a V1.

## Entidades e relações propostas

| Registro | Campos e relações necessários para os cenários | Restrições que o modelo deve permitir verificar |
|---|---|---|
| Dono e autor | Dono dos dados; autor da operação com tipo `Vytor`/serviço futuro, origem e momento. | Autor vem de autenticação/contexto confiável, não de campo escrito pelo cliente. Todos os registros consultados pertencem ao dono autorizado. |
| Conta | ID, nome/tipo, moeda BRL V1, saldo inicial e data de corte; movimentos posteriores referenciados. | Saldo ausente é desconhecido. Movimentos já incluídos no saldo inicial não são somados novamente. |
| Cartão e fatura | Cartão associado ao dono, ciclo/vencimento; fatura identifica obrigações incluídas. | Fatura agrupa; não é uma segunda compra. Ciclo exato aguarda AB-02. Limite não é caixa. |
| Cômodo | ID e nome; representação simples opcional. | Item pode existir sem cômodo; lista completa independe do mapa. |
| Item/necessidade | ID, nome obrigatório, quantidade/unidade quando úteis, prioridade, estado de planejamento, links/imagem opcionais, estimativa selecionada/quantidade restante, vínculos a cômodo/projeto/contexto. | Um item pode ter várias alternativas, mas uma estimativa de referência por quantidade em projeção. Não exigir casa ou preço. |
| Alternativa | ID, item, descrição/link/preço/data opcionais. | Pertence a uma necessidade; preço da alternativa não entra automaticamente em obrigação. |
| Projeto/tarefa | Resultado desejado, próxima ação, prazo opcional, tarefas/conclusão, vínculos de itens/compras, contexto e orçamento opcional. | Progresso por execução, não por pagamento. Tarefa avulsa pode não ter projeto. |
| Categoria/contexto | IDs e nomes de classificação; vínculos opcionais a gasto/compra/tarefa conforme tipo. | Recortes diferentes consultam a mesma aquisição. Se houver múltiplos destinos em uma dimensão, guardar rateios explícitos. |
| Compra | ID, dono, data de aquisição, total em centavos, origem (`Compras`, `gasto rápido`, `Mercado`), estado e histórico de ajustes. | Confirmar compra, linhas, rateios e obrigações como um conjunto; total acordado não é pagamento. |
| Linha de compra e rateio | Linha com valor real e vínculo opcional a item; quantidade atendida; rateios por cômodo/contexto/projeto/categoria com valores em centavos. | Soma das linhas e distribuição de frete/desconto = total; cada dimensão reconcilia sem replicar integralmente compra. Evitar múltiplas atribuições sem regra de rateio. |
| Obrigação | ID, compra ou fato gerador, valor devido original, vencimento, cartão/fatura quando aplicável, ajustes reconhecidos e saldo aberto derivado. | Soma das obrigações de compra = total correspondente; estado pago deriva de alocações. Pagamentos parciais permitidos. |
| Pagamento e alocação | Pagamento com conta, data, valor e origem; uma ou mais alocações para obrigações, com valor em centavos. | Uma saída de caixa por pagamento confirmado; soma das alocações = valor aplicado. Fatura paga não cria compra. Excesso exige crédito/correção explícita. |
| Receita e transferência | Receita confirmada ou prevista com data/valor; transferência com origem/destino e dois efeitos de conta. | Previsão não é saldo. Transferência conserva consolidado e não conta renda/despesa. |
| Reserva e cobertura | Reserva por finalidade/escopo/valor ativo; cobertura identificada por obrigação; consumo e liberação auditados. | Cobertura ≤ reserva ativa e obrigação aberta; reservas não destinam o mesmo saldo duas vezes. Criar reserva não é saída de caixa. |
| Orçamento | Período, tipo de recorte, limite e política de consumo. | Não cria saldo. A mesma obrigação ocupa uma posição no orçamento; visões sobrepostas não são somadas como dinheiro disponível. |
| Recorrência/ocorrência | Regra de repetição, ocorrência/competência, valor e vencimento previstos; estado de previsão ou obrigação assumida conforme política. | Uma ocorrência por chave de regra+período; não gera pagamento automaticamente. Política de transformação aguarda PROP-04. |
| Ajuste/devolução/reembolso | Referência à compra/linhas/obrigações, valor, etapa do processo e data; reembolso confirmado ligado a conta/cartão. | Solicitação não muda caixa. Ajuste reconhecido não apaga pagamento; reembolso só movimenta caixa quando confirmado. |
| Lista/entrada Mercado | Lista em andamento ou fechada, data/compra vinculada; entradas com produto, quantidade/unidade, preço estimado opcional e estado de carrinho; vínculo de cópia para nova lista opcional. | Lista fechada tem no máximo uma compra originada por seu fechamento. Preço por produto é detalhe, não lançamento. Reutilizar cria novos IDs de entrada. |
| Anexo/configuração | Imagem/arquivo com dono, referência e metadados; preferência Mapa/Lista e demais opções de UI. | Backup inclui anexos e configurações; ausência de arquivo é detectada na restauração. |
| Operação e histórico | Identidade de repetição, dono, tipo, hash/assinatura lógica dos dados de entrada, resultado/IDs, estado, autor/origem/momento, antes/depois essenciais. | Mesmo identificador + mesma entrada retorna mesmo resultado; mesmo identificador + entrada diferente dá conflito. Correções preservam proveniência. |

Esses registros podem ser realizados em estruturas físicas diferentes conforme a tecnologia escolhida. Não definir uma tabela por linha desta lista sem avaliar necessidade. **Não usar um campo único `status` para intenção, entrega e pagamento.** Quantias monetárias não usam arredondamento implícito de ponto flutuante; armazenamento exato em centavos ou decimal equivalente será documentado.

## Invariantes que devem sobreviver a qualquer interface

1. **Integridade de compra:** soma de linhas/rateios/obrigações aplicáveis fecha o total em centavos. Se algum elo falha, nenhum elo fica confirmado.
2. **Estimativa:** há no máximo uma estimativa selecionada por parcela ainda não atendida de uma necessidade. Comprar muda apenas o restante planejado, não reescreve a estimativa histórica.
3. **Pagamento:** saldo aberto de cada obrigação é derivado do valor devido ajustado e das alocações válidas. Se houver pagamento histórico acima do devido ajustado, registrar crédito/reembolso pendente em vez de saldo negativo oculto.
4. **Caixa:** movimentos confirmados após a data de corte do saldo inicial afetam a conta. Compra no cartão não altera caixa até pagamento real informado. Transferência tem duas pontas indivisíveis.
5. **Reserva:** soma das destinações elegíveis não excede o saldo elegível definido; cobertura não excede reserva/obrigação correspondentes. Pagamento coberto reduz caixa, obrigação e cobertura de modo coerente.
6. **Perspectivas:** a mesma linha de compra pode aparecer em Casa, Compras, Finanças e Projeto pelo mesmo ID. Um recorte pode exibir parte rateada, jamais uma cópia da compra inteira em cada cômodo.
7. **Mercado:** carrinho/estimativas não geram compra. Um fechamento cria uma aquisição financeira vinculada à lista; reenviar não cria outra. Lista futura não altera histórico.
8. **Reversões:** pedido, ajuste reconhecido e reembolso confirmado têm efeitos distintos. Histórico permite explicar valor anterior e atual.
9. **Dados faltantes:** `desconhecido` é distinto de zero; projeção parcial aponta registros faltantes. Uma conclusão sobre capacidade de compra não é produzida sem base suficiente.
10. **Autorização:** leitura e escrita aplicam escopo do dono em cada operação e resultado. Um eventual adaptador MCP não pode passar por cima do núcleo ou abrir banco bruto.

## Consultas e trilhas necessárias

- `item por ID`: intenção, alternativas, aquisição, obrigações, pagamentos, entrega, vínculos e histórico pertinente.
- `totais por período e dimensão`: definição da data usada, valores parciais, lista de registros componentes e filtros por Casa/cômodo, categoria, contexto ou Projeto.
- `saldo e compromissos`: saldo inicial datado, movimentos efetivos, receita prevista separada, obrigações pendentes/pagas e reservas/cobertura.
- `lista Mercado`: entradas e estimativas com sinal de parcialidade, compra real vinculada ao fechar e cópia independente da próxima ida.
- `resultado de operação`: consulta após timeout por identidade de repetição, com estado final e IDs criados, sem disparar novamente efeito financeiro.
- `auditoria`: filtro por registro/operação/autor/data para explicar correção, inclusive quando Berenice estiver conectada.

## Decisões ainda necessárias antes de persistir dados reais

| Pendência | Por que muda modelo/contrato |
|---|---|
| AB-01: offline, múltiplos aparelhos e conflitos | Define cópia local, sincronização, versões concorrentes e o que significa “salvo”. |
| AB-02: ciclo e estorno de cartão | Define agrupamento/fechamento de fatura, pagamento parcial e crédito em cartão. |
| PROP-01: períodos e orçamento | Define datas dos agregados e o modo de apresentar pagamento antecipado/atrasado. |
| PROP-02/07: centavos e atendimento parcial | Define distribuição determinística e estimativa remanescente. |
| PROP-04/05/06: recorrência, alocação e devolução | Define quando previsão vira obrigação e como corrigir valor já pago. |
| Política de backup/restauração | Define pacote versionado, substituição/mesclagem, conflitos de IDs, anexos e identidade de operações restauradas. |

**Gate para F003 concluída:** todos os casos E01–E18 são representáveis sem duplicação; cada comando tem resultado/erro definido; decisões acima que afetem A estão fechadas; armazenamento, conflitos e recuperação têm política explícita. Até lá, este é modelo conceitual proposto, suficiente para avançar o desenho do protótipo.
