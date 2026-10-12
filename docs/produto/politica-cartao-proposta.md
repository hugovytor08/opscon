# Proposta executável para cartão/fatura (AB-02)

Preparação de F002/F003/F009, 11/10/2026. Não é decisão aprovada do usuário nem função implementada. RF-06 e E04 fixam os efeitos; datas e rotina real ainda precisam ser confirmadas antes de congelar esse modelo.

Recomendação para A: cadastrar cartão com nome, fechamento/vencimento informados pelo usuário; criar fatura com competência e vencimento explícitos. As parcelas de uma compra pertencem a obrigações existentes e são associadas à fatura revisada. O calendário é sugestão com revisão, nunca inferência de pagamento. Limite do cartão fica separado de contas/saldo. Rotativo/juros/renegociação ficam fora da V1.

Pagamento de fatura pede conta, data, valor factual e alocações. Um pagamento1050 com obrigações900/150 tem duas alocações e uma saída1050; não gera compra1050. Para parcial300, a tela propõe alocação por ordem de vencimento/sequência/ID, mostrando300 para a obrigação900 e saldo600/150. Confirmar esse quadro registra apenas300. A convenção PROP-05 continua proposta até o cenário concreto ser validado; não supor quitação integral.

Correção da composição antes do pagamento é operação auditada; após pagamento conserva movimentos e alocações históricos. Pedido de devolução não muda saldo. Crédito reconhecido no cartão reduz compromisso na fatura explicitamente indicada, sem inventar receita em conta; dinheiro devolvido à conta exige reembolso confirmado. Não apagar pagamento para ajustar igualdade simplista entre adquirido e pago. A apresentação deve separar custo líquido, pago bruto, crédito e reembolso pendente.

Próxima implementação: esquema aditivo do domínio, migração dos backups schema1, comandos cartão/fatura/alocação/pagamento, UI de revisão e testes E04/E09/E13. Não modificar o protocolo remoto por causa desse incremento: ele mantém snapshot indivisível e revisão independente. Antes de dados reais, validar as datas usadas pelo usuário e a forma de apresentar crédito/estorno. Somente informação exclusiva da rotina real deve ser perguntada; o algoritmo e a estrutura ficam a cargo do desenvolvimento.
