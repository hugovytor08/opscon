# Revisão visual e de interação — protótipo v0.2

**29/09/2026.** O storyboard v0.1 foi rejeitado por falta de personalidade, interação e diferenças entre áreas. Esta revisão acompanha `C:\opscon\prototype\index.html`, uma demonstração responsiva com controles reais e estado local fictício. Ela não é implementação de produção.

| Área | Referência principal | Nova composição e gesto demonstrável |
|---|---|---|
| Início | D1/M1 | Cartão principal ilustrado e contextual, captura em cartão próprio, indicadores, vencimentos e pendências de assuntos variados. O foco alterna entre Casa e viagem. |
| Casa | D2/M2/M6 | Mapa isométrico da referência como área dominante, zonas selecionáveis e troca Mapa/Lista. O detalhe do cômodo mostra itens, estados e valores sem misturar entrega com pagamento. |
| Compras | D3/M3 | Lista com miniaturas e detalhe amplo do objeto; abas de resumo, alternativas e histórico; estimativa pesquisada separada do valor da compra. |
| Mercado | Nova, derivada de D3/M3 | Lista operacional com entrada rápida, seções, carrinho, progresso e subtotal identificado como parcial. Fechamento por total real cria uma compra; reutilizar cria nova lista. |
| Finanças | D4/M4 | Período, saldo, cifras, agenda, gráfico discreto e composição consultável. Confirmar parcela altera pago, aberto e saldo uma vez. A planta não aparece. |
| Projetos | M5 e estrutura D5 | Capa editorial da viagem, próxima ação, checklist animado e bloco financeiro separado. Estimativa não vira obrigação. |

**Navegação:** desktop com lateral clara de seis áreas e topo com busca/Novo; celular com cinco destinos inferiores e Mercado via menu e atalho. Busca e ações Novo abrem camadas sobre a área corrente. Teclado e redução de movimento têm suporte inicial.

**Conferência feita:** páginas móveis e desktop foram abertas no navegador; foram inspecionadas visualmente Início, Casa, Compras, Mercado, Finanças e Projetos. Seleção de cômodo, carrinho, produto novo, pagamento de parcela, fechamento/reutilização do Mercado e atualização de saldos tiveram resultados visíveis. O protótipo usa dados locais; recarregar reinicia os exemplos.

**Ainda aberto:** revisão visual fina de todos os D/M lado a lado, completar estados de erro/vazio/correção, medir contraste e áreas de toque, testar com Vytor, fixar fonte Manrope local se o acesso remoto for indesejado, além das decisões financeiras/arquiteturais pendentes de F001–F003. Não declarar F004 concluída antes desses pontos.
