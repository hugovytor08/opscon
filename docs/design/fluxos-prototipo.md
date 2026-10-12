# Fluxos para o protótipo navegável Casa Serena

**Briefing funcional 0.1 — 29/09/2026.** Base: proposta consolidada v1.2 §§5, 7, 8, 10 e 13; PDF visual D1–D5/M1–M6; `C:\opscon\docs\produto\regras-funcionais.md` e seus exemplos E01–E18. Este arquivo especifica o protótipo a construir; não afirma que telas navegáveis já foram produzidas ou aprovadas. Dados abaixo são demonstrativos.

## Estrutura a demonstrar

**Destinos:** Início, Casa, Compras, Mercado, Finanças e Projetos. Desktop conserva lateral clara e barra superior das imagens D1–D5; Mercado entra entre Compras e Finanças. Mobile conserva os **cinco destinos** de M1–M6 na barra inferior (Início, Casa, Compras, Finanças, Projetos). Mercado fica em menu lateral visível no cabeçalho e atalho contextual em Início/Novo, sem sexta aba. Cabeçalho móvel deve acomodar identidade, busca e acionador do menu. Conteúdo rolável reserva espaço para a barra inferior.

**Casa Serena:** base marfim, verde profundo, sálvia, cartões claros arredondados, espaçamentos generosos, ícones de traço e tipografia Manrope como alvo (§8.2). Ajustar proporções e contraste pela comparação lado a lado; copiar apenas cores não basta. D1/M1 dão estrutura de Início; D2/M2/M6 de Casa; D3/M3 de Compras; D4/M4 de Finanças; D5/M5 de Projetos. Mercado usa a gramática de D3/M3 e conteúdo de lista operacional. Não usar captura inteira como tela. Planta isométrica interativa apenas em Casa (CA-22); D3/D5 exigem adaptação visual registrada.

## F1 — Capturar só o nome

**Entrada:** cartão “Guardar uma ideia” em Início (D1/M1) ou Novo. **Ação:** digitar “Luminária” e salvar. **Resultado:** item com mesmo ID aparece em Compras, sem estimativa, e em Casa apenas se cômodo for vinculado depois. Detalhe permite acrescentar três alternativas e selecionar referência E01; o total fica “parcial” enquanto faltar preço. **Estados:** campo vazio com erro preservando texto, carregamento, salvo, resposta de resultado desconhecido. **CA:** 01/03/13. **Ponto de observação:** Vytor deve conseguir completar a primeira captura sem configurar apartamento/renda.

## F2 — Intenção até compra parcelada

**Entrada:** item “Sofá”, por Compras D3/M3 ou Casa D2/M2. **Ações:** estimar R$ 3.000 → revisar compra de R$ 2.700 e três parcelas de R$ 900 → confirmar → abrir detalhe. **Resultado:** estimativa histórica visível, ainda planejado R$ 0, adquirido R$ 2.700, a pagar R$ 2.700. A tela de confirmação mostra datas, conta/cartão, vínculos e efeito antes de salvar. **Estados:** soma inválida, falha de rede, resultado pendente e repetição sem duplicação. **CA:** 02/04/12. **Conferência:** número e ID iguais nas perspectivas relevantes; não criar múltiplos sofás por navegação.

## F3 — Pagar, receber e corrigir

**Entrada:** detalhe do sofá ou próximos vencimentos (D1/D3/D4 e M1/M4). **Ações:** confirmar pagamento factual de R$ 900 → marcar recebido → opcionalmente iniciar correção de data/valor ou devolução. **Resultado:** pago R$ 900, aberto R$ 1.800; recebido altera só entrega. Se devolução for apenas solicitada, caixa permanece igual; ajuste/reembolso têm passos diferentes (E09). **Estados:** pagamento parcial, reenvio, correção que afeta obrigação já paga e confirmação de impacto. **CA:** 05/06/11/12. **Conferência:** rótulos e datas distintos; nenhuma ação de “pagar” efetua transferência bancária externa.

## F4 — Gasto rápido sem Casa

**Entrada:** Novo → Registrar movimentação, por Início/Finanças. **Ação:** informar valor, data e conta/cartão; deixar categoria, contexto, cômodo e projeto vazios; depois, se desejar, classificar como Viagem ou Alimentação. **Resultado:** compra/despesa avulsa rastreável em Finanças, fora da Casa. Editar contexto muda filtro, sem criar nova transação (E10). **Estados:** saldo inicial ainda desconhecido, falha de gravação, pagamento imediato opcional se factual. **CA:** 16/12/13. **Ponto de observação:** Vytor não deve ter de abrir um formulário longo para registrar um gasto simples.

## F5 — Mercado da lista ao fechamento

**Entrada:** menu Mercado ou atalho no Início. **Ações:** adicionar arroz sem preço e leite com estimativa R$ 6 → ajustar unidade se útil → marcar carrinho → revisar subtotal parcial → finalizar com total real R$ 48,90, data e conta/cartão → ver histórico → reutilizar lista e alterar leite (E11/E12). **Resultado:** carrinho não altera finanças; fechamento cria uma aquisição vinculada, com pagamento/parcelas conforme informado; nova lista não herda a compra. **Estados:** preço desconhecido, lista em andamento, revisão, resposta perdida, fechamento já realizado, correção do financeiro. **CA:** 17/18/19/12. **Conferência visual:** campo Adicionar produto imediatamente acessível, linhas curtas, frequentes/histórico secundários, identidade Casa Serena sem planta ou galeria de desejos. Não existe imagem aprovada dessa tela.

## F6 — Casa via Mapa ou Lista

**Entrada:** Casa D2/M2/M6. **Ações:** nomear cômodo → escolher Sala pelo mapa → ver sofá/luminária → alternar Mapa/Lista → abrir item. **Resultado:** mesma coleção e valores nas duas vistas; preferência lembrada. Quando mapa indisponível, lista conserva consultar, criar, editar e ações financeiras/operacionais essenciais (E18). **Estados:** sem cômodos, projeção incompleta, mapa indisponível, item selecionado. **CA:** 14/13/20/21. **Conferência:** desktop mapa/detalhe lado a lado; mobile mapa antes do conteúdo ou lista completa; “representação aproximada” visível.

## F7 — Projeto, revisão do mês e próximo passo

**Entrada:** projeto de viagem M5 ou Início M1; Finanças D4/M4. **Ações:** criar resultado e tarefas, estimar R$ 8.000, vincular item existente, concluir tarefa, navegar ao mês, ver conta, obrigações, reservas e dados faltantes. **Resultado:** projeto com previsão sem dívida; progresso por tarefas, custo separado; Início mostra assuntos variados. Finanças distingue custo adquirido, pago, a pagar, saldo não informado e projeção parcial. **Estados:** sem saldo, orçamento não definido, receita prevista, parcela parcialmente paga, período alterado sem criar compra. **CA:** 02/08/09/13/16/20–22. **Conferência:** viagem usa conteúdo/imagem de viagem; planta interativa não aparece fora de Casa.

## Como revisar o protótipo

1. Fazer comparação **lado a lado** para D1–D5 e M1–M6, na tela correspondente; marcar estrutura, densidade, tipografia, paleta, cartões, ícones, imagens, foco e estados. Registrar ajustes deliberados de Mercado, menu e remoção de plantas fora de Casa.
2. Executar F1–F7 sem pular etapas visíveis. Os valores devem bater com E01–E18 e os CA correspondentes. Clicar em total deve levar aos registros que o formam.
3. Testar estados vazio, erro, carregamento, incompleto e confirmação; toque/teclado/foco e espaço para barra inferior. O mapa deve poder falhar sem impedir a lista.
4. Observar Vytor capturar um desejo, registrar gasto rápido e fechar Mercado; registrar dificuldades concretas. Nenhuma meta de tempo foi definida antes desse teste (§10).

O protótipo pode simular persistência e erros, mas deve **declarar dados demonstrativos**. Só a implementação posterior comprovará transações, segurança, idempotência e backup real. A escolha de ferramenta de prototipação ainda pertence à etapa F004/F005.
