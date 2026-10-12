# Registro de decisões — aplicativo pessoal

**Atualizado em 11/10/2026.** Fonte principal: `C:\opscon\proposta_consolidada_app_pessoal_v1 (1).md`, conteúdo v1.2, revisado em 28/09/2026. Este registro distingue o que Vytor já escolheu, a direção proposta e convenções de trabalho que ainda serão testadas. A aceitação da estratégia de execução C significa que o agente principal coordena o trabalho com mínima intervenção de Vytor; não equivale à aprovação silenciosa de toda hipótese da proposta.

## Decisões expressas nos materiais

| ID | Decisão de produto | Fonte e efeito |
|---|---|---|
| DEC-01 | Casa Serena é a referência visual, com D1–D5 e M1–M6 como base para aparência. | Proposta §§1, 8, 13; PDF visual. No celular, as referências móveis prevalecem para composição; dados e cálculos seguem a proposta atual. |
| DEC-02 | O produto integra Início, Casa, Compras, Mercado, Finanças e Projetos. Mercado é área própria. | §§3, 5, 8.1. O exemplo antigo de supermercado em M3 vai para Mercado. |
| DEC-03 | Uma compra, item ou gasto tem identidade própria e pode ser visto por vários contextos; vínculo a casa/projeto é opcional. | §§2–4; CA-01/02/16. |
| DEC-04 | Intenção, estimativa, compra, obrigação, pagamento, reserva e execução são acontecimentos diferentes. | §§2/4; RF-01–RF-20. Nenhum total pode contar a mesma transação duas vezes. |
| DEC-05 | O mapa da casa é aproximado e opcional para executar as ações essenciais; Mapa/Lista deve estar disponível. | §§5/8; CA-14. |
| DEC-06 | O objetivo da V1 é o ciclo entre planejar, adquirir, pagar e executar, incluindo correção, exportação, backup e restauração. | §6, entregas A/B/C. |
| DEC-07 | A futura Berenice terá acesso operacional completo e revogável, passando pelos serviços e regras da interface. | §§2/9, entrega D. Preparar contratos na V1; ativar servidor MCP depois. |
| DEC-08 | Pagamentos reais em serviços externos, integração bancária, OCR, editor arquitetônico/3D e demais exclusões de §6 ficam fora da V1. | §6. Registrar pagamentos informados/verificados não equivale a transferir dinheiro de verdade. |
| DEC-09 | A estratégia de trabalho é C: agente principal mantém contexto e coordena especialistas quando houver ganho real. Vytor prefere intervir o mínimo possível. | Escolha de Vytor nesta conversa, posterior ao workflow. |
| DEC-10 | O smartphone é o dispositivo principal. O protótipo visual v0.2 foi aprovado como direção para implementar o produto; M1–M6 prevalecem no desenho móvel. | Aval de Vytor em 29/09/2026. A aprovação autoriza iniciar a implementação, mas não declara a V1 pronta nem resolve armazenamento, sincronização ou publicação. |
| DEC-11 | Em 29/09, a primeira versão foi descrita como uso em um smartphone, com gravação sem internet e backup exportável, sem necessidade de sincronização entre aparelhos simultaneamente. | Registro histórico da resposta inicial. A interpretação de que backup manual bastaria foi corrigida por DEC-12. |
| DEC-12 | Os dados não podem existir somente no telefone: se ele for perdido, Vytor precisa entrar em outro aparelho e continuar usando o app com seus registros. A V1 requer persistência remota e recuperação por conta, além de escrita offline local. | Esclarecimento de Vytor em 11/10/2026. Supabase é o candidato recomendado para o banco remoto. O backup exportável permanece como cópia independente; a interpretação anterior de que restauração manual bastava foi superada. |

**Situação da proposta:** seu cabeçalho informa “direção recomendada para discussão”. Os itens acima são decisões ou direções expressas no conteúdo e na conversa; características que a própria proposta chama de hipótese continuam hipóteses. A delimitação final de escopo da V1 será registrada ao avançar F001.

## Informações da sessão de continuidade (11/10/2026)

O usuário identificou o dispositivo como GalaxyS23/SamsungInternet e forneceu o projeto Free de teste `azqlukwlcotyhildfvwt`, entrando no dashboard para permitir configuração. Isso autoriza a preparação e os testes desse projeto; não aprova V1, publicação nem contratação. Migração/RLS aplicadas sem dados pessoais financeiros. E-mail de acesso escolhido pelo usuário fica somente no fornecedor/sessão, fora destes registros de desenvolvimento; credencial de provisionamento é definida diretamente por ele.

Escolha técnica para o teste: templateFree padrão de link comPKCE, pois o dashboard exige SMTP próprio ouPro para editar o corpoOTP. Não há serviço pago contratado. O bloqueio do cadastro público e a allowlist das origens locais de teste delimitam acesso; antes de publicar, exigirHTTPSestável e prova de recuperação. Matriz/evidências em `docs/validacao/` preservam as hipóteses financeiras restantes, sem convertê-las em decisões aprovadas.

## Convenções propostas para detalhar regras, ainda sujeitas a revisão

| ID | Convenção de trabalho | Motivo e ponto de validação |
|---|---|---|
| PROP-01 | Exibir custo adquirido pela data da compra, a pagar pelo vencimento e pago pela data do pagamento, sempre com rótulo do período. | Permite explicar os indicadores distintos de RF-03/16. Rever com exemplos reais antes do protótipo de Finanças. |
| PROP-02 | Usar centavos inteiros nos exemplos e distribuir resto de divisão de forma determinística, registrando em quais parcelas/linhas ele caiu. | Garante RF-04/13 sem inventar centavos. Convenção de distribuição ainda não foi escolhida por Vytor. |
| PROP-03 | Pagamento parcial de uma obrigação mantém valor pago e saldo aberto; o orçamento a apresenta uma única vez pela base temporal definida. | Resolve a tensão de §4.3 com estados parciais de §4.2. O detalhamento do orçamento permanece em validação. |
| PROP-04 | Uma recorrência terá instância prevista e, quando apropriado, uma obrigação confirmada por regra configurada para aquele tipo; nunca pagamento automático. | Evita promover toda previsão a dívida e reduz confirmações repetidas. Validar contra aluguel e contas reais antes de B. |
| PROP-05 | Se uma obrigação de fatura receber pagamento parcial, a interface mostrará o valor/alocação para revisão. Um padrão determinístico, se adotado, será registrado no contrato. | Evita quitação inventada. Faturas exigem exemplos de uso real antes do fechamento de F002. |
| PROP-06 | Uma devolução pode gerar ajuste reconhecido de custo/obrigação e reembolso ainda pendente; caixa só muda com reembolso confirmado. | Preserva RF-15, sem esconder pagamentos históricos. Diferenciar crédito em cartão e dinheiro em conta no contrato. |
| PROP-07 | Quantidade parcialmente atendida preserva estimativa apenas da parcela ainda não comprada, quando houver base de preço. | Extensão coerente de RF-02, a demonstrar no protótipo; não consta como algoritmo fechado na proposta. |

Essas convenções são **propostas**, não escolhas aprovadas. Serão usadas nos exemplos para tornar os pontos de decisão concretos. Nenhuma exige resposta imediata de Vytor para produzir os artefatos seguintes.

## Pendências com momento de decisão

| ID | O que falta | Impacto e último momento seguro |
|---|---|---|
| AB-01 | Resolvida para a V1: smartphone principal, gravação offline e continuidade em outro aparelho após perda, usando persistência remota (DEC-10–12). | A arquitetura deve manter escrita local e sincronização automática com o banco quando houver conexão. Backup manual isolado não satisfaz DEC-12. |
| AB-02 | Rotina de cartão: fechamento, vencimento, pagamentos parciais e estornos usados na prática. | Muda faturas e datas mensais. Resolver antes de congelar essa parte de F002 e implementar F009. |
| AB-03 | Exemplos reais de gastos/contextos e esforço aceitável de registro manual. | Orienta filtros e formulários. Avaliar no protótipo, sem exigir dados financeiros privados antes disso. |
| AB-04 | Fidelidade espacial suficiente e aprovação da primeira composição de Mercado. | Validar com protótipo Casa Serena antes de concluir F004. |
| AB-05 | Responsável pela manutenção, disponibilidade e aceitação de eventual gasto recorrente. | Resolver antes de estimar prazo, escolher fornecedor ou assumir custo em F005. Prioridade a custo recorrente zero permanece. |
| AB-06 | Local/cliente/momento de ativação da Berenice e autenticação MCP. | Resolver antes de D; não bloqueia a V1. |
| AB-07 | Supabase é o candidato recomendado ao banco remoto; ainda faltam projeto/conta acessível, configuração de autenticação e avaliação de custos e recuperação. | Preparar arquitetura, esquema e testes locais agora. Vincular um projeto real quando houver acesso à conta. Nenhuma cobrança deve ser assumida sem decisão explícita. |

O agente principal pode preparar soluções e opções para essas pendências. Vytor só precisa decidir quando uma escolha mudar seu uso, exigir dados que apenas ele conhece ou criar compromisso de custo. Perguntas futuras serão curtas e acompanhadas do artefato concreto a avaliar.

## Conflitos visuais e funcionais já encaminhados

- D3 e D5 exibem planta fora de Casa, enquanto CA-22 restringe a planta isométrica a Casa. Aplicar CA-22 e preservar composição com imagem contextual apropriada; registrar a diferença na revisão visual.
- M3 mostra supermercado como desejo em Compras, anterior ao Mercado próprio de §8.1. Usar Mercado.
- M2 não exibe claramente Mapa/Lista, mas M6 e §§5/8 o exigem. Usar M6 para o seletor.
- Mercado não tem imagem original aprovada. Sua tela será criada com os componentes de D3/M3 e aprovada pelo uso e pela comparação de identidade.
