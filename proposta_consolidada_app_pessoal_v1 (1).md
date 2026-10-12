# Aplicativo pessoal de organização
## Proposta consolidada de produto — versão 1.2

**Preparado para:** Vytor Hugo  
**Data:** 24 de setembro de 2026; revisões em 28 de setembro de 2026  
**Finalidade:** estabelecer uma base única para a especificação funcional, o protótipo e o planejamento de desenvolvimento.  
**Status:** direção recomendada para discussão; hipóteses e decisões pendentes estão identificadas. Não representa escopo já aprovado nem escolha definitiva de tecnologia.

**Documentos de origem:** “Markdown.md colado” e “proposta_conceitual_v1.md”. Esta consolidação preserva o modelo financeiro e os fluxos mais consistentes da primeira proposta e a priorização por etapas e a representação isométrica da segunda. As contradições entre elas foram resolvidas nas regras abaixo.

**Refinamentos da versão 1.1:** despesas em contextos de vida além da casa; Mercado como área própria para listas de compra recorrentes; compatibilidade arquitetural com MCP e acesso operacional completo da Berenice quando a integração for ativada. A direção visual Casa Serena foi escolhida como referência, sem fazer a casa dominar as demais áreas.

**Refinamento da versão 1.2:** especificação visual executável da Casa Serena, ancorada nas telas aprovadas para computador e celular e no anexo que as contém. A seção 8 estabelece composição, componentes, navegação, tokens e critérios de revisão; a seção 13 identifica cada imagem pelo nome e pela sua identidade na Biblioteca.

---

## 1. Visão do produto

Uma central pessoal para conectar **o que Vytor quer fazer, o que precisa comprar, quanto isso custa e o que já foi executado**, em qualquer área da vida.

A casa terá uma experiência visual própria. Compras, Mercado, Finanças e Projetos terão identidades de navegação e conteúdo reconhecíveis, compartilhando informações quando necessário para acompanhar uma decisão da intenção à conclusão, sem recadastro. Viagens, lazer, relacionamentos, saúde e despesas cotidianas não dependerão de vínculo com a casa.

**Pergunta central:** “Considerando meus planos, meu dinheiro registrado e meus compromissos, qual próximo passo faz sentido?”

Exemplo: salvar um sofá para a sala, comparar alternativas, planejar a compra, registrar o valor final e as parcelas, acompanhar a entrega e consultar quanto ainda falta pagar. O mesmo registro aparece nos contextos relevantes.

O sucesso do produto será medido pela facilidade de manter os dados úteis e tomar decisões. A quantidade de telas, o tempo dentro do aplicativo e a quantidade de funcionalidades não serão metas.

### Premissas de trabalho

| Premissa | Direção adotada nesta proposta |
|---|---|
| Público | Uso pessoal por Vytor, inicialmente sem colaboração. |
| Contexto inicial | Organização do apartamento e da vida financeira, com compras, mercado e planos pessoais. |
| Alcance | Gastos, compras e projetos de qualquer contexto de vida, sem exigir cômodo ou projeto. |
| Custo | Priorizar custo monetário recorrente zero; qualquer dependência paga exigirá justificativa. Gratuidade de serviços não é garantida por este documento. |
| Acesso | Celular para captura e consulta; computador para planejamento. Hipótese a confirmar. |
| Dados | Um apartamento e moeda BRL na primeira versão. |
| Manutenção | Poucos componentes e integrações; baixo esforço para manter o aplicativo e atualizar seus dados. |

## 2. Princípios que orientam as decisões

1. **Um registro, vários contextos.** Casa, Compras, Mercado e Projetos exibem seus dados nos lugares adequados; Finanças recebe obrigações e pagamentos sem duplicá-los. Vínculos opcionais permitem diferentes perspectivas sobre o mesmo registro.
2. **Registrar primeiro, complementar depois.** Criar um desejo exige apenas o nome; cômodo, projeto, imagem e preço podem ser adicionados depois.
3. **Números explicáveis.** Todo total financeiro permite consultar os registros que o compõem. Estimativas e informações incompletas ficam identificadas.
4. **Planejamento e execução separados.** Desejar, reservar dinheiro, comprar, receber e pagar são acontecimentos diferentes.
5. **Visual útil e opcional.** A representação da casa ajuda a reconhecer ambientes; listas permitem executar todas as ações essenciais.
6. **Correção e recuperação fazem parte do produto.** Editar, cancelar, exportar e restaurar dados entram desde a primeira versão utilizável.
7. **Automação responde a uma dificuldade observada.** Integrações entram quando reduzirem um esforço real e recorrente.
8. **Berenice usa as regras do aplicativo.** A integração MCP terá acesso completo aos dados e operações autorizadas, mas passará pelas mesmas validações, histórico e proteção contra duplicidade da interface.

## 3. Organização do aplicativo

| Área | Função | Ações principais |
|---|---|---|
| **Início** | Mostrar o que merece atenção agora. | Retomar um plano, consultar próximos vencimentos e resolver registros incompletos. |
| **Casa** | Organizar necessidades por ambiente. | Criar cômodos, consultar itens, definir prioridades e acompanhar recebimento e instalação. |
| **Compras** | Reunir desejos, pesquisas e aquisições planejadas. | Salvar referências, comparar alternativas, planejar e registrar compras como um tênis ou uma passagem. |
| **Mercado** | Preparar e executar compras recorrentes de supermercado. | Montar lista, reutilizar produtos, acompanhar itens no carrinho e fechar a compra com o valor real. |
| **Finanças** | Explicar dinheiro registrado e compromissos em todos os contextos de vida. | Registrar receitas e despesas, acompanhar parcelas, planejar o mês e consultar gastos por categoria e contexto. |
| **Projetos** | Conectar objetivos a próximas ações. | Definir um resultado, organizar tarefas e vincular compras. |

**Planejamento** será uma capacidade compartilhada dessas áreas. **Revisão periódica** será um fluxo opcional, acessível pelo Início e por Finanças. Não precisam de módulos próprios na navegação inicial.

Busca, captura rápida, configurações, exportação e recuperação serão recursos transversais. Tarefas e observações ficam nos registros aos quais pertencem; uma tarefa avulsa pode ficar sem projeto.

**Categoria** responde “com o que gastei?” (por exemplo, alimentação ou transporte). **Contexto** responde “a que parte da minha vida ou plano isso pertence?” (por exemplo, viagem, lazer ou relacionamento). Ambos são opcionais no gasto rápido. Um contexto pode reunir despesas, compras e tarefas; não obriga a criar um projeto. A casa mantém sua navegação própria por cômodo.

### Integração entre as áreas

Uma luminária pode pertencer à Sala e ao projeto “Organizar o apartamento”, aparecer em Compras e ter obrigações em Finanças. Alterar sua referência atualiza o mesmo item. Registrar sua compra cria os vínculos financeiros correspondentes.

Cômodo e projeto são opcionais. Uma passagem de viagem, um curso ou um gasto de alimentação não precisam ser associados artificialmente a um ambiente.

Mercado tem uma lista operacional própria: arroz e leite adicionados à lista não se tornam automaticamente desejos permanentes em Compras. Ao fechar a ida ao supermercado, uma única aquisição/despesa é registrada em Finanças conforme a forma de pagamento. O detalhe dos produtos permanece consultável em Mercado sem duplicar o valor financeiro.

## 4. Modelo funcional e financeiro

### 4.1 Entidades com responsabilidades distintas

| Entidade | Representa | Regra principal |
|---|---|---|
| **Item desejado** | Uma necessidade ou intenção, como “sofá para a sala”. | Pode existir sem preço, compra ou pagamento. |
| **Alternativa** | Uma opção pesquisada para atender ao item. | Três opções de sofá não contam como três necessidades nem três despesas. |
| **Lista e entrada de Mercado** | Uma ida ao supermercado e seus produtos, quantidades e marcas opcionais. | Marcar um produto no carrinho não cria obrigação nem pagamento; uma lista pode ser reutilizada sem duplicar compras antigas. |
| **Categoria e contexto** | Classificação financeira e vínculo opcional a uma área da vida ou plano. | Permitem consultar o mesmo gasto por perspectivas diferentes, sem somá-lo duas vezes. |
| **Compra** | A aquisição confirmada, com data e valor acordado. | Pode conter vários itens; não depende de já ter sido paga. |
| **Obrigação** | Um valor devido, com vencimento. | Uma compra parcelada gera várias obrigações. |
| **Pagamento** | A saída efetiva de dinheiro de uma conta. | Liquida total ou parcialmente as obrigações vinculadas. |
| **Receita ou transferência** | Entrada de renda ou movimentação entre contas próprias. | Transferência não aumenta renda nem despesa. |
| **Orçamento** | Um limite de planejamento para um período, categoria ou projeto. | Não comprova que o dinheiro existe. |
| **Reserva** | Uma parte do dinheiro registrado destinada a uma finalidade. | Não é despesa e não pode estar livre para dois planos ao mesmo tempo. |
| **Projeto e tarefa** | Resultado desejado e ações para alcançá-lo. | Conclusão depende de critérios de execução, não de orçamento consumido. |

Uma despesa avulsa, como uma refeição, usa o mesmo mecanismo financeiro sem obrigar a criação prévia de um item desejado. Compra e pagamento imediato podem ser registrados em uma única ação da interface, mantendo conceitos separados internamente. O fechamento de Mercado também usa esse mecanismo, com o total efetivamente informado e os detalhes da lista vinculados à transação.

### 4.2 Estados independentes

| Dimensão | Estados ou informações previstas |
|---|---|
| Planejamento do item | Desejo, em pesquisa, planejado ou descartado. Ao ser atendido por uma compra, deixa de compor os itens ainda por comprar. |
| Aquisição e entrega | Sem compra, comprado/aguardando recebimento, recebido e instalado, quando instalação se aplicar. |
| Pagamento | Sem obrigação, não pago, parcialmente pago ou quitado; calculado a partir das obrigações e pagamentos. |

**Consequência:** um sofá pode estar instalado e parcialmente pago; uma luminária pode estar quitada e aguardando entrega. Não haverá um único status tentando explicar tudo.

As datas de compra, vencimento, pagamento e recebimento também serão independentes. Pagar a última parcela não altera retroativamente a data da compra.

### 4.3 Regras obrigatórias de cálculo e comportamento

| ID | Regra |
|---|---|
| **RF-01** | Desejos e estimativas não alteram saldo nem criam obrigações. Um valor ausente é desconhecido, não zero. |
| **RF-02** | Compra confirmada substitui a estimativa correspondente nos totais projetados. A estimativa original pode permanecer como referência histórica, sem ser somada novamente. |
| **RF-03** | Custo adquirido, valor pago e valor a pagar aparecem separados. O rótulo genérico “gastos” será evitado quando seu significado não estiver claro. |
| **RF-04** | Compras parceladas preservam o valor total. Eventuais diferenças de centavos são distribuídas de forma explícita, mantendo a soma das parcelas igual ao total contratado. |
| **RF-05** | Confirmar um pagamento atualiza o caixa e reduz a obrigação correspondente. Não cria outra compra. |
| **RF-06** | A fatura reúne obrigações de cartão. Pagá-la gera uma saída da conta e liquida essas obrigações; não duplica as despesas já registradas. |
| **RF-07** | Transferências entre contas próprias alteram os saldos envolvidos, sem criar receita ou despesa. |
| **RF-08** | Limite de cartão não é dinheiro disponível. Receita prevista não é saldo confirmado. |
| **RF-09** | Orçamentos de projetos e intenções de compra aparecem no planejamento. Só uma obrigação assumida entra como compromisso financeiro. |
| **RF-10** | Reservar dinheiro não altera o saldo da conta. A reserva reduz o montante sem destinação e continua identificada enquanto cobrir obrigações ainda não pagas. |
| **RF-11** | Ao comprar com dinheiro reservado, a reserva é vinculada à obrigação. Não se subtraem reserva e obrigação duas vezes para calcular a mesma disponibilidade. O pagamento consome a cobertura correspondente; eventual excedente pode ser liberado. |
| **RF-12** | Limites por categoria, projeto e cômodo são perspectivas sobre os mesmos valores. Não podem criar disponibilidades independentes para o mesmo dinheiro. |
| **RF-13** | Uma compra com itens de contextos diferentes distribui seu valor, incluindo frete e descontos. A soma das distribuições deve fechar com o total da compra. |
| **RF-14** | Registros existentes podem ser vinculados a itens e projetos. Repetir um envio ou vincular uma despesa não pode gerar uma segunda cobrança. |
| **RF-15** | Cancelamentos e devoluções preservam o histórico. Uma devolução solicitada não aumenta o saldo; só o reembolso confirmado produz entrada de caixa. |
| **RF-16** | Projeções mostram período, hipóteses e informações faltantes. O aplicativo não afirma que uma compra “cabe” quando não dispõe de dados suficientes. |
| **RF-17** | Categoria, contexto de vida, cômodo e projeto são dimensões de consulta e vínculos opcionais, conforme o tipo de registro. Uma despesa de viagem, lazer, relacionamento ou saúde pode existir sem cômodo ou projeto; agregações por dimensões não somam o mesmo lançamento duas vezes. |
| **RF-18** | Entradas da lista de Mercado guardam produto, quantidade e unidade quando útil; preço estimado é opcional. Itens sem preço tornam o subtotal estimado parcial, não zero. Marcar “no carrinho” não registra gasto nem pagamento. |
| **RF-19** | Fechar uma compra de Mercado registra o valor real total e a forma de pagamento como uma única compra/despesa financeira, com parcelas ou pagamento quando aplicável. Os valores opcionais por produto permanecem detalhes da lista e não geram lançamentos adicionais. Reenvio não duplica o fechamento. |
| **RF-20** | Reutilizar uma lista ou produto frequente cria novas entradas para a próxima ida ao mercado, mantendo o histórico de listas e compras anteriores. Alterar uma lista futura não modifica o valor de uma compra já fechada. |

No orçamento mensal, uma obrigação deve ocupar uma única posição: pendente ou paga. Sua liquidação não consome o limite novamente. Destinações ainda sem obrigação precisam ser identificadas separadamente para não confundir planejamento com dívida.

Quando o total da compra de Mercado é conhecido, mas os preços de produtos individuais não são, Finanças pode mostrar o total real e Mercado pode mostrar produtos comprados sem atribuir custos individuais inventados. Um subtotal estimado, mesmo completo, não substitui o valor efetivamente pago no caixa.

### 4.4 Exemplo de referência

Sofá estimado em **R$ 3.000**, comprado por **R$ 2.700**, em **3 parcelas de R$ 900**:

| Momento | Custo adquirido | Pago | A pagar | Estimativa ainda por comprar |
|---|---:|---:|---:|---:|
| Antes da compra | R$ 0 | R$ 0 | R$ 0 | R$ 3.000 |
| Compra confirmada | R$ 2.700 | R$ 0 | R$ 2.700 | R$ 0 |
| Primeira parcela paga | R$ 2.700 | R$ 900 | R$ 1.800 | R$ 0 |
| Sofá recebido, sem outro pagamento | R$ 2.700 | R$ 900 | R$ 1.800 | R$ 0 |

Para uma casa ou projeto, **custo projetado = compras confirmadas, ajustadas por cancelamentos/devoluções reconhecidos, + estimativas das necessidades ainda não atendidas**. Somam-se apenas as parcelas atribuídas àquele contexto. Valores pagos nunca são adicionados novamente ao custo adquirido.

## 5. Experiências específicas: Casa e Mercado

### Direção recomendada: isometria simples e listas completas

A primeira versão terá uma representação isométrica estilizada, com ambientes reconhecíveis e seleção direta. Ela pode dar personalidade ao aplicativo sem exigir modelagem arquitetônica, câmera livre ou catálogo de móveis.

**Fluxo:** Casa → selecionar ambiente → consultar itens → abrir detalhe ou registrar uma ação.

No computador, o detalhe pode abrir ao lado da representação. No celular, abre a página do cômodo, preservando o contexto ao voltar. O seletor **Mapa / Lista** fica visível e lembra a preferência.

O cadastro mínimo consiste em nomear cômodos. Isso já libera as listas e o planejamento. Uma composição visual inicial, baseada em modelos simples, pode ser escolhida depois. Nenhuma ação financeira depende de terminar a planta.

O editor da V1 ficará limitado a modelos e ajustes simples de organização. Arrastar paredes, importar plantas e reconstruir medidas ficam para evolução. Uma representação aproximada será identificada como tal e não afirmará que um móvel cabe sem medidas verificadas.

### Conteúdo de cada ambiente

- Itens e prioridades, com filtros por planejamento, entrega e pagamento.
- Resumo de custo adquirido, pago, a pagar e ainda planejado.
- Pendências concretas, como “duas compras essenciais e uma instalação”.
- Acesso aos registros que compõem cada total.

O progresso será opcional e terá critério explícito: por exemplo, “3 de 5 necessidades essenciais atendidas”. Um item que exige instalação só estará concluído após essa etapa. Gastar mais ou quitar uma parcela não aumenta automaticamente o progresso físico do ambiente.

### Mercado: lista rápida, compra rastreável

**Fluxo:** Mercado → abrir ou criar lista → adicionar produtos em uma linha → ajustar quantidades e unidades quando necessário → marcar itens no carrinho → fechar compra com total real, data e conta ou cartão. Uma compra incompleta pode permanecer como lista em andamento; apenas o fechamento cria o lançamento financeiro.

A tela principal oferece a lista atual, entrada rápida, itens pendentes e itens no carrinho. Produtos frequentes e a opção de reutilizar uma lista anterior reduzem digitação. Agrupamento por seção do mercado é útil quando configurado, mas não será obrigatório para adicionar um produto. Preço estimado por produto pode ser informado, nunca exigido. Ao concluir, a interface mostra o efeito financeiro e permite corrigir o registro.

Compras continua dedicada à pesquisa e aquisição planejada; Mercado concentra a rotina de supermercado. Ambos compartilham o mecanismo financeiro, mas as listas de produtos não poluem a visão de desejos em Compras. Histórico de preço por produto, inventário doméstico e automação de ofertas são possíveis evoluções, não requisitos da V1.

## 6. Escopo da primeira versão

**Resultado esperado:** organizar compras, mercado, gastos e projetos pessoais em contextos variados, entender seus efeitos financeiros e acompanhar sua execução sem duplicidade.

| Área | Incluído na V1 |
|---|---|
| Casa | Cadastro de cômodos, listas, prioridades, recebimento/instalação e vista isométrica simples. |
| Compras | Captura rápida, quantidade, links, imagem opcional, alternativas, estimativa, valor final, pagamento à vista e parcelado. |
| Mercado | Lista ativa, entrada rápida, quantidade e unidade opcionais, itens no carrinho, produtos frequentes, reutilização de lista e fechamento com total real e forma de pagamento. Preço por produto opcional. |
| Finanças | Contas e saldos iniciais registrados manualmente, receitas, despesas, transferências, obrigações, parcelas de cartão, registro de faturas e pagamentos, orçamento mensal e reservas simples. Categoria e contexto de vida opcionais permitem consultar gastos fora da casa. |
| Recorrências | Gerar compromissos previstos, como aluguel e contas fixas, permitindo editar valor e vencimento. Nunca confirmar pagamento automaticamente. |
| Projetos | Nome, resultado desejado, tarefas, próxima ação, prazo opcional e compras vinculadas. Sem dependências avançadas ou gestão de equipe. |
| Início | Próximos compromissos, plano em andamento e pendências de organização. |
| Recursos comuns | Busca por texto, edição, cancelamentos/estornos básicos, exportação, backup e restauração. |
| Qualidade | Interface responsiva, estados de erro e vazio, proteção de acesso compatível com a arquitetura, totais rastreáveis e serviços internos reutilizáveis pela futura interface MCP. |

O suporte a cartão se limita inicialmente às compras, parcelas e liquidações registradas. Rotativo, renegociação de dívida e conciliação bancária automática exigem uma especificação própria; não devem ser simulados por regras incompletas.

### Fora da V1

3D navegável, editor arquitetônico, escaneamento de ambientes, posicionamento preciso de móveis, integração bancária, importação de extratos, OCR, busca automática de preços, assistente de IA embutido, pagamentos reais pelo aplicativo, colaboração, múltiplas moedas e gestão de investimentos.

Calendário completo, hábitos, prontuário de saúde, inventário de todos os bens e repositório geral de documentos também ficam fora. Despesas de saúde podem ser classificadas em Finanças sem criar um módulo de saúde. O foco inicial é o ciclo entre planejar, comprar, pagar e executar. O servidor MCP operacional e conexões externas são uma integração planejada após o núcleo da V1; sua compatibilidade influencia os contratos internos desde a entrega A.

### Sequência de construção

| Entrega | Resultado verificável |
|---|---|
| **A — Ciclo essencial** | Cadastrar um cômodo e um item, registrar compra à vista ou parcelada, confirmar pagamentos e consultar totais corretos. Registrar também gastos avulsos com contexto opcional. Inclui correção e recuperação mínima dos dados e operações internas reutilizáveis. |
| **B — Planejamento integrado** | Organizar orçamento e reservas, acompanhar recorrências e projetos simples, criar/usar listas de Mercado e fechar uma compra sem duplicar a despesa; mostrar pendências no Início. |
| **C — Experiência da V1** | Incorporar a isometria simples, concluir a busca e os fluxos de recuperação, distinguir visualmente as áreas e validar a experiência nos dispositivos escolhidos. |
| **D — Integração MCP planejada** | Expor as operações completas à Berenice com identidade própria, leitura e escrita, histórico e controles de acesso. Conectores para outros serviços entram conforme casos de uso definidos. Esta entrega não bloqueia o uso da V1. |

A qualidade visual começa na entrega A. A identidade espacial entra na entrega C, apoiada em dados e fluxos já utilizáveis. Cada entrega deve funcionar como um conjunto completo; não serão construídas várias telas demonstrativas sem operações concluídas.

## 7. Jornadas prioritárias

| Jornada | Ação e resultado esperado |
|---|---|
| **Capturar um desejo** | Abrir “Novo item”, informar nome e salvar. Se a ação começou em um cômodo ou projeto, o vínculo vem preenchido. Complementos são opcionais. |
| **Pesquisar e planejar** | Adicionar alternativas ao mesmo item, escolher a estimativa usada na projeção e definir prioridade e período pretendido. |
| **Registrar a compra** | Informar valor final, data e forma de pagamento. Revisar parcelas e vínculos antes de confirmar. A estimativa deixa de contar como compra futura. |
| **Registrar gasto rápido** | Informar valor, data e conta ou cartão. Categoria e contexto de vida são opcionais; uma despesa de lazer ou relacionamento não exige Casa nem Projeto. Voltar à tela de origem com opção de corrigir. |
| **Fazer mercado** | Adicionar produtos rapidamente, aproveitar frequentes, marcar os que foram para o carrinho e fechar a ida com total real e forma de pagamento. A lista não gera dívida antes do fechamento. |
| **Reutilizar lista** | Copiar produtos e quantidades de uma lista anterior para uma nova ida, sem copiar sua transação financeira nem alterar o histórico. |
| **Acompanhar entrega** | Marcar recebimento e instalação, quando aplicável. Os valores pagos permanecem iguais. |
| **Revisar o mês** | Consultar saldo registrado, receitas previstas, obrigações, reservas e planos. Simular mudança de período sem registrar uma compra real. |
| **Executar um projeto** | Definir resultado e próxima ação, concluir tarefas e vincular compras sem exigir um cômodo. |
| **Corrigir um lançamento** | Editar dados ou iniciar cancelamento/estorno, ver o impacto antes da confirmação e preservar pagamentos e histórico pertinentes. |
| **Berenice opera o app (integração planejada)** | Consultar qualquer área e executar as mesmas ações disponíveis ao usuário, como criar item de Mercado, reorganizar projeto ou corrigir gasto. O app registra origem e efeito, valida os dados e evita duplicidade. |

O primeiro uso oferece entradas para **organizar uma compra**, **montar uma lista de Mercado** ou **registrar uma movimentação**. A configuração aparece quando for necessária à ação. Não será obrigatório cadastrar apartamento e renda mensal antes de qualquer benefício.

## 8. Direção visual e navegação

### 8.1 Referência aprovada e ordem de autoridade

**Casa Serena é a identidade visual definida por Vytor**, representada nas imagens D1–D5 (computador) e M1–M6 (celular) identificadas na seção 13 e reunidas no arquivo **“Guia_visual_Casa_Serena_referencias_aprovadas.pdf”**. Quem desenhar ou implementar o app deverá abrir esse anexo e inspecionar as telas em tamanho integral antes de produzir novas telas. O texto abaixo transforma o que foi aprovado em regras replicáveis; somente ler a paleta ou esta descrição não substitui observar as imagens.

Para decisões de **aparência, composição, densidade, ilustração, bordas e hierarquia**, as imagens aprovadas são a referência principal, com M1–M6 prevalecendo para o celular e D1–D5 para o computador. Para **funcionalidades, nomenclatura de estados e cálculos**, valem as regras atualizadas desta proposta. Dados, datas, nome provisório “Meu espaço” e ilustrações de itens nas imagens são demonstrativos; o design não deve presumir que todo usuário ou registro pertence à casa. A identidade Casa Serena deve permanecer reconhecível em todas as áreas.

**Correções deliberadas em relação às imagens:** o módulo Mercado ainda não existia; produtos recorrentes de supermercado deixam de aparecer como desejos em Compras e passam a Mercado. No computador, incluir Mercado entre Compras e Finanças na lateral. No celular, preservar a aparência e os cinco destinos da barra inferior das referências (Início, Casa, Compras, Finanças, Projetos) e dar acesso claro a Mercado pelo menu lateral acionado no cabeçalho, além de atalho contextual no Início ou em “Novo”. Não inventar uma sexta aba apertada na barra inferior. As imagens de celular também mostram assuntos variados, que devem continuar visíveis fora de Casa.

### 8.2 Sistema visual a reproduzir

| Elemento | Especificação de partida e comportamento obrigatório |
|---|---|
| Sensação | Interface pessoal, serena, organizada e calorosa. Base clara e fosca; pouco ruído; espaço em branco generoso; dados destacados pela hierarquia, não por decoração excessiva. |
| Paleta base | Marfim de fundo `#F5F2EB`; verde profundo `#245C48` para ações e seleção; sálvia `#DFE8D9` para superfícies selecionadas e ícones. Superfícies próximas do branco quente (`#FFFEFA`), texto carvão (`#172427`) e texto secundário cinza quente (`#687078`). Ajustar os valores finais por amostragem das imagens e contraste real; conservar a relação entre as cores. |
| Estados | Verde e sálvia para recebido/confirmado; âmbar terroso para pendência, pagamento parcial e alerta (`#A4540B` sobre fundo creme claro); cinza neutro para pesquisa e dados desconhecidos. Acompanhar cada cor de texto ou ícone. Vermelho fica reservado a erro, cancelamento ou prioridade crítica, sem dominar a tela. |
| Tipografia | **Manrope** como família alvo, com alternativa sans legível se indisponível. Títulos escuros em peso 700, subtítulos 600, corpo 400/500 e valores monetários 700 com algarismos alinhados. Não usar letras decorativas, condensadas ou monoespaçadas como identidade principal. Escala inicial: título da página 38–44 px no computador e 30–36 px no celular; título de cartão 20–24 px; corpo 14–16 px; legenda 12–14 px, ajustada para densidade e acessibilidade. |
| Superfícies | Cartões brancos ou marfim muito claro, cantos arredondados de aproximadamente 16–20 px, contorno fino cinza quente e sombra curta, difusa e discreta. Botões primários verdes com texto branco e raio de cerca de 10–14 px; secundários claros com borda fina; chips em cápsula. Sem vidro brilhante, neon, gradientes fortes ou painéis escuros. |
| Ritmo | Escala de espaçamento de 4/8/12/16/24/32 px. Usar 24–32 px entre blocos principais no computador e 16–24 px no celular; controles e linhas com área de toque confortável. Separadores finos organizam dados dentro dos cartões. |
| Ícones | Traço simples e coerente, arredondado e legível; espessura visual semelhante entre áreas. Usar pictogramas em círculos sálvia, creme ou azul acinzentado conforme o contexto; sem emojis como ícones de produto. |
| Imagens | Ilustrações com volume macio, luz difusa, materiais foscos, verde sálvia, areia e madeira natural. A isometria estilizada pertence à Casa; Projetos podem ter cenas editoriais do assunto (a serra de M5), e Compras pode mostrar recortes de produtos. Finanças usa dados e ícones, sem planta decorativa. Mercado usa produtos ou grupos discretos, sem transformar a lista em vitrine. |

Esses valores são **tokens de implementação**, não uma autorização para substituir o resultado visual das referências por uma tela genérica que usa as mesmas cores. O designer deve comparar as telas resultantes lado a lado com D1–D5 e M1–M6 e ajustar proporções, contraste, tipografia e respiro.

### 8.3 Estrutura responsiva e navegação

**Computador (D1–D5):** lateral clara persistente com marca provisória no topo, seis áreas com ícone + rótulo e seleção em faixa sálvia; Configurações e Backup/exportação no rodapé. Nas referências de 1536 × 1024 px, a lateral ocupa cerca de 260–280 px e a barra superior cerca de 70–80 px. A barra contém busca longa, botão verde **Novo** e perfil. A área principal usa margem de cerca de 24–32 px, título grande, ações de página à direita e cartões de larguras relacionadas ao conteúdo. O detalhe de um registro pode aparecer ao lado da lista sem perder o contexto, como em D3.

**Celular (M1–M6):** cabeçalho claro com marca, busca e perfil; título forte e ação relevante no alto; cartões empilhados com margens laterais próximas de 16–20 px. A barra inferior fixa conserva cinco destinos, ícones de traço e uma cápsula sálvia atrás do destino ativo. Incluir um acionador visível do **menu lateral** no cabeçalho para abrir as seis áreas, inclusive Mercado; a solução deve caber sem eliminar busca ou identidade. O conteúdo rola atrás da navegação fixa e reserva espaço no final para não cobrir botões. Ações primárias importantes podem ocupar a largura útil do cartão. O celular não é uma miniatura da página de computador: mapas, gráficos e detalhes se reorganizam na vertical.

**Navegação completa:** Início · Casa · Compras · Mercado · Finanças · Projetos. “Novo” oferece as ações relevantes ao contexto e também gasto, item, lista/produto de Mercado e tarefa. Busca retorna registros de todas as áreas e informa o contexto de cada resultado. No celular, Mercado recebe um atalho claro no Início e fica sempre no menu lateral; a barra inferior de cinco itens segue a referência aprovada. Seleção, foco, toque e retorno de página preservam o contexto anterior.

### 8.4 Anatomia das áreas, conforme as telas aprovadas

| Área | Composição a preservar | Conteúdo que a distingue |
|---|---|---|
| **Início — D1/M1** | Título “Seu próximo passo” em destaque; cartão principal com ação concreta e ilustração contextual; captura rápida “Guardar uma ideia”; cartões de próximos vencimentos e informações faltantes. No computador, o cartão principal e a captura ficam lado a lado; no celular, são empilhados. | Mistura assuntos da vida. M1 mostra viagem, parcela do sofá, dentista e tatuagem no mesmo painel, cada qual com ícone ou etiqueta contextual. A ilustração do cartão principal muda conforme o plano em foco; a tela não vira um painel exclusivo da casa. |
| **Casa — D2/M2/M6** | Representação isométrica aproximada, vista superior em três quartos, paredes marfim, piso claro, madeira e móveis sálvia. Cômodo ativo delineado em verde, etiqueta preenchida e nomes dos demais em chips claros. Seletor **Mapa / Lista** visível; cartões de resumo e itens do cômodo. No computador, mapa à esquerda e detalhes à direita; no celular, mapa acima da Sala. | Somente esta área tem planta. Exibir “Representação aproximada” e manter lista totalmente funcional. Separar adquirido, pago, a pagar e ainda planejado; item sem preço gera aviso de projeção incompleta. |
| **Compras — D3/M3** | No computador, coluna de lista com abas “Por comprar / Adquiridos” e painel detalhado à direita; no celular, abas e filtros por contexto seguidos de cartões com miniaturas, estado, estimativa e seta. Produtos são ilustrados sobre fundo neutro. | Tênis, tatuagem, remédio, sofá e outros desejos podem aparecer sem vínculo com Casa. Estados de pesquisa, compra, entrega e pagamento são independentes. O supermercado recorrente vai para Mercado; o exemplo “Compras do mês” em M3 é anterior a essa decisão. |
| **Mercado — nova tela** | Derivar cabeçalho, cartões, chips, tipografia e botões de M3 e D3. Título “Mercado”; lista ativa em primeiro plano; campo **Adicionar produto** sempre fácil de alcançar; linhas curtas com nome, quantidade/unidade opcional e controle “No carrinho”; agrupamento opcional por seção. Mostrar subtotal estimado como parcial se houver preços desconhecidos; botão destacado **Finalizar compra** abre revisão do total real, data e conta/cartão. Histórico e produtos frequentes ficam abaixo ou em guia secundária. | A aparência é Casa Serena, mas o conteúdo é uma lista operacional, sem planta da casa nem galeria de desejos. Finalizar gera um único efeito financeiro e preserva o detalhe dos produtos. Não existe imagem aprovada de Mercado: o designer produzirá a primeira tela seguindo estas regras e os componentes das referências. |
| **Finanças — D4/M4** | Título + período; abas de visão mensal, contas, cartões/faturas e recorrências quando houver largura. Cartões de saldo, a pagar e pago, alerta discreto de dados faltantes, obrigações e ações por linha. No computador, números em faixas e painel lateral de orçamento/reservas; no celular, saldo em cartão largo, dois indicadores lado a lado e pagamentos empilhados. | Valores e períodos são protagonistas. Distinguir “não informado”, “não definido”, “pendente” e “pago”; consultar gastos por categoria e contexto, inclusive viagem, lazer e relacionamento. Não usar ilustrações da casa como pano de fundo financeiro. |
| **Projetos — D5/M5** | Título do plano, resultado desejado, próxima ação em cartão proeminente, tarefas com progresso calculado por conclusão e custos em bloco separado. O computador permite coluna de tarefas e coluna de custos; o celular empilha capa contextual, ação, tarefas e previsão. | M5 mostra uma viagem com paisagem suave e mapa; um projeto de casa pode usar ilustração da casa, mas nenhum tema visual é imposto a todos. Estimativa de projeto não vira dívida antes de uma compra/obrigação. |

### 8.5 Componentes, estados e fidelidade

- **Botões:** texto de ação explícito (“Registrar compra”, “Finalizar compra”, “Confirmar pagamento”, “Marcar recebido”). Primário verde profundo; secundário claro com contorno; destrutivo tratado de modo distinto e sem destaque habitual. Um cartão pode ter ação textual verde sublinhada no canto, como nas referências.
- **Chips e etiquetas:** cápsulas suaves para contexto, status e filtro. Seleção sálvia/verde; pendência âmbar; neutro cinza. Não usar somente cor para distinguir situações financeiras.
- **Formulários:** campo amplo, borda fina e rótulo claro; entrada rápida pede apenas o mínimo. Informações ausentes aparecem como “Sem preço”, “Não informado” ou “Sem estimativa”, jamais como R$ 0,00 inferido.
- **Números:** BRL no padrão brasileiro, pesos tipográficos fortes e alinhamento consistente; totais próximos dos registros que os formam. Uma projeção incompleta mostra o que falta. Despesa, obrigação, pagamento e reserva conservam rótulos distintos.
- **Estados de interface:** projetar e validar carregamento, vazio, erro, item selecionado, dados incompletos, confirmação e correção. Nenhum estado pode depender apenas da ilustração. O mapa falhando deve ceder lugar à lista sem perder ações.
- **Acessibilidade:** contraste de texto e botões medido no protótipo, área de toque adequada, foco visível, suporte a teclado e redução de movimento. Transições discretas ajudam orientação sem alterar a lógica.

**Critério de revisão visual:** comparar lado a lado D1–D5 e M1–M6 com as telas produzidas. Verificar primeiro estrutura, proporção, tipografia, ritmo, cartões, ícones, estados e tratamento das imagens; depois conferir os fluxos e números deste documento. A proposta será rejeitada visualmente se ficar com aparência de painel corporativo escuro, caderno ilustrado de contornos grossos, catálogo de móveis, ou se Casa contaminar todas as áreas. Mercado pode estrear com composição própria, mas deve parecer do mesmo produto. O nome “Meu espaço” permanece provisório; trocar o nome não justifica mudar o sistema visual.

Tema escuro é uma evolução possível, sem prioridade sobre a reprodução fiel do tema claro Casa Serena.

## 9. Dados, arquitetura e manutenção

### Direção técnica a avaliar

Uma aplicação web responsiva é a hipótese inicial para compartilhar a experiência entre celular e computador. Instalação como aplicativo e recursos nativos serão avaliados conforme os dispositivos e as necessidades reais. A escolha de framework, banco e hospedagem pertence à próxima etapa.

O sistema deverá manter uma única fonte de dados para os registros compartilhados e isolar a representação visual da casa das operações financeiras. Nenhuma biblioteca gráfica deve ser responsável pelos cálculos ou impedir um registro. Interface web, automações e futura interface MCP chamarão os mesmos serviços de domínio, com contratos explícitos para leitura, criação, edição, vinculação, cancelamento e recuperação. A representação de Mercado também será uma interface sobre registros e transações consistentes.

### Compatibilidade MCP e acesso da Berenice

**MCP significa Model Context Protocol.** O aplicativo será preparado para atuar como **servidor MCP**, oferecendo à Berenice consulta e operações sobre seus dados. Se o próprio aplicativo vier a acessar serviços externos por MCP, essa será uma função distinta de **cliente MCP**, implementada por conectores específicos. Não há dependência de um modelo de linguagem ou fornecedor no núcleo do produto.

**Autorização decidida:** quando conectada, Berenice terá acesso operacional completo a todas as áreas e dados do aplicativo, incluindo busca, leitura, criação, edição, vinculação, conclusão, cancelamento, exportação e operações administrativas disponibilizadas ao próprio Vytor. Poderá extrair informações e modificar registros quando necessário, sem confirmação repetitiva para cada mudança cotidiana. Ela não receberá um atalho direto ao banco: suas chamadas atravessam as mesmas validações e regras de negócio da interface. A autorização poderá ser revogada e cada operação terá identidade, origem, data, parâmetros essenciais e resultado registrados.

Pagamentos registrados em Finanças representam acontecimentos informados ou verificados, não inferências. Se faltar base para afirmar que uma obrigação foi liquidada, Berenice pedirá o dado faltante em vez de confirmar o pagamento. Cancelamentos, estornos e ações de recuperação preservarão o histórico e usarão as regras próprias de reversão. Transferir dinheiro ou efetuar pagamentos reais em serviços externos continua fora do escopo atual.

**Preparação na V1:** serviços de domínio independentes da interface, contratos de entrada e saída claros, operações idempotentes para escrita, controle de acesso, rastreabilidade e mecanismos de correção. **Ativação posterior:** implementar servidor MCP com a versão estável vigente, autenticação adequada ao modo de implantação e catálogo de ferramentas/recursos cobrindo todas as operações do app. A cobertura funcional completa, inclusive escrita, é requisito da integração com Berenice; um protótipo apenas de leitura não a satisfaz. A integração de outros clientes ou serviços será especificada separadamente.

Como referência técnica em 28 de setembro de 2026, a especificação MCP `2026-07-28` define requisições autocontidas, ferramentas e recursos, além de princípios de consentimento e controle de dados. A implementação deve verificar a versão vigente e as orientações de segurança no momento da ativação: [especificação oficial](https://modelcontextprotocol.io/specification/2026-07-28) e [boas práticas de segurança](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices).

### Requisitos mínimos

| Tema | Requisito |
|---|---|
| Integridade | Salvar compra, obrigações e vínculos como uma operação consistente. Falha não pode deixar metade da compra registrada. |
| Valores | Tratar dinheiro com precisão de centavos e validar somas, datas e distribuição entre itens. |
| Repetição de envio | Detectar tentativas repetidas para evitar compras e pagamentos duplicados. |
| Acesso | Proteger os dados e definir recuperação de acesso. Se houver servidor, autenticação e autorização devem fazer parte da arquitetura. |
| MCP | Permitir que uma futura camada MCP invoque todas as operações do domínio sob identidade revogável da Berenice, com os mesmos resultados e regras da interface. Protocolos e SDKs ficam isolados em adaptadores substituíveis. |
| Auditoria | Identificar autor/origem e momento das mudanças, manter histórico suficiente para entender e corrigir alterações da interface ou da Berenice sem depender de um log de conversa. |
| Backup | Preservar registros, vínculos, configurações e imagens/anexos existentes, com restauração verificável. |
| Exportação | Oferecer CSV para consulta e um formato estruturado para recuperação completa. CSV isolado não substitui backup. |
| Falhas | Preservar o preenchimento e explicar se o registro foi salvo, falhou ou está pendente. |
| Sincronização | Definir um modelo explícito caso haja vários dispositivos. Backup e sincronização têm funções diferentes. |
| Manutenção | Documentar configuração, recuperação e dependências, evitando serviços que o uso pessoal não justifique. |

**Funcionamento sem internet:** não será presumido apenas pela escolha de uma aplicação instalável. Antes de desenvolver a camada de dados, será decidido se a primeira versão precisa registrar operações offline e como tratar conflitos. Se não houver suporte, a interface deve indicar a indisponibilidade sem sugerir que salvou os dados.

Integrações bancárias, OCR, serviços de preços e plataformas específicas citadas nos documentos de origem permanecem candidatas futuras. Disponibilidade, custos e condições não foram revalidados nesta consolidação e não são dependências do escopo inicial. A preparação para MCP não torna essas integrações automáticas; cada uma precisará de caso de uso, autorização e tratamento de falhas próprios.

## 10. Critérios de aceitação da V1

Estes cenários serão a base dos testes funcionais e da revisão do protótipo.

| ID | Cenário | Resultado obrigatório |
|---|---|---|
| **CA-01** | Criar um item informando somente o nome. | Salvar sem exigir preço, cômodo, projeto ou planta. |
| **CA-02** | Consultar o mesmo item pela casa, compras e projeto. | Exibir o mesmo registro e refletir alterações em todos os contextos. |
| **CA-03** | Cadastrar três alternativas de um sofá. | Manter uma necessidade e uma estimativa de referência no total planejado. |
| **CA-04** | Comprar por R$ 2.700 um item estimado em R$ 3.000, em 3 parcelas. | Mostrar R$ 2.700 adquiridos, três obrigações de R$ 900 e retirar os R$ 3.000 do ainda planejado. |
| **CA-05** | Pagar a primeira parcela e marcar o item como recebido. | Mostrar R$ 900 pagos e R$ 1.800 a pagar; recebimento não altera esses valores. |
| **CA-06** | Quitar uma fatura com compras já cadastradas. | Registrar uma saída de caixa e liquidar as obrigações correspondentes, sem novas compras nem dupla contagem. |
| **CA-07** | Transferir R$ 200 entre contas próprias. | Alterar os dois saldos e manter renda e despesa consolidadas inalteradas. |
| **CA-08** | Reservar recursos e usá-los numa compra. | Manter a destinação explícita e impedir que reserva e obrigação descontem o mesmo dinheiro duas vezes. |
| **CA-09** | Planejar uma viagem de R$ 8.000 sem contratar nada. | Exibir uma estimativa ou limite de projeto, sem criar R$ 8.000 de dívida. |
| **CA-10** | Registrar uma compra com itens de dois cômodos. | Distribuir os valores e fechar o total, sem replicar o valor integral em cada ambiente. |
| **CA-11** | Cancelar uma compra ou registrar devolução parcial. | Ajustar custos e obrigações pertinentes, preservar o histórico e só alterar caixa quando houver reembolso confirmado. |
| **CA-12** | Reenviar uma confirmação após falha de conexão. | Recuperar ou concluir a operação sem duplicá-la. |
| **CA-13** | Consultar total com um item sem preço. | Identificar o total como parcial e permitir localizar o item faltante. |
| **CA-14** | Usar Casa com a representação visual indisponível. | Consultar e editar todos os registros essenciais pela lista. |
| **CA-15** | Exportar backup e restaurar em ambiente limpo. | Recuperar registros, vínculos e anexos incluídos, com totais financeiros equivalentes. |
| **CA-16** | Registrar gastos de uma viagem, um passeio e um relacionamento sem associá-los à casa. | Permitir categoria e contexto opcionais; consultar cada recorte e o total geral sem duplicar despesas. |
| **CA-17** | Criar uma lista de Mercado com arroz sem preço e leite com preço estimado; marcar ambos no carrinho. | Manter o subtotal identificado como parcial e não alterar saldo, obrigação ou pagamento. |
| **CA-18** | Fechar essa compra de Mercado com total real e forma de pagamento. | Criar uma única transação financeira, apresentar seu efeito conforme a forma de pagamento e manter a lista vinculada, sem lançar cada produto novamente. |
| **CA-19** | Reutilizar a lista anterior e alterar a quantidade de leite. | Criar uma nova lista editável e preservar produtos e valor real da compra anterior. |
| **CA-20** | Revisar protótipo de computador contra D1–D5. | Reproduzir a lateral, a barra superior, a hierarquia dos cartões, as proporções gerais, a paleta clara, a tipografia e os tratamentos de Casa, Compras, Finanças e Projetos descritos na seção 8, acrescentando Mercado no menu. |
| **CA-21** | Revisar protótipo de celular contra M1–M6. | Preservar cabeçalho, cartões empilhados e barra inferior de cinco destinos; Mercado está acessível por menu lateral visível e atalho, sem comprimir a navegação. |
| **CA-22** | Abrir Compras, Mercado, Finanças e um projeto de viagem. | Todas as áreas pertencem à Casa Serena, mas somente Casa usa a planta isométrica; os outros assuntos têm conteúdos e imagens adequados ao próprio contexto. |

Além desses cenários, o protótipo deve ser testado com Vytor para verificar se capturar uma compra, registrar um gasto e usar Mercado exigem pouco esforço. Tempos de execução serão observados no uso, sem prometer duração antes do teste.

**Critérios da integração MCP planejada, além da V1:** Berenice autenticada consegue localizar e ler registros em todas as áreas; criar e alterar listas, itens, projetos e lançamentos financeiros pelas mesmas regras da interface; repetir uma chamada sem duplicar a operação; consultar o resultado; identificar a origem da mudança no histórico; perder acesso após revogação. Um pagamento não é marcado como realizado sem dado que o sustente. Esses cenários devem ser validados antes de considerar a integração completa.

## 11. Decisões pendentes e hipóteses para avançar

| Decisão | Hipótese de trabalho | Quando resolver |
|---|---|---|
| Dispositivo principal | Celular para captura e computador para planejamento. | Antes do protótipo detalhado. |
| Frequência de cartões e parcelas | Suporte básico é necessário; sem rotativo ou renegociação na V1. | Antes de especificar faturas e pagamentos. |
| Tolerância a registro manual | Formulários curtos podem sustentar o uso inicial. | No teste do protótipo; se falhar, reavaliar prioridade da importação. |
| Offline e vários aparelhos | Acesso responsivo é desejável; gravação offline ainda não foi confirmada. | Antes de escolher armazenamento e sincronização. |
| Fidelidade da casa | Reconhecer ambientes é suficiente para a V1. | Antes de construir a representação espacial. |
| Identidade visual | Casa Serena é a referência escolhida; cada área terá composição própria sem perder unidade visual. | Ao finalizar os componentes e o protótipo responsivo. |
| Uso do Mercado | A lista aceita preços estimados opcionais e fechamento pelo total real; granularidade de relatórios por produto ainda precisa de validação. | Ao prototipar a lista e o fechamento. |
| Contextos de vida | Categoria e contexto são opcionais no gasto rápido; nomenclatura, exemplos e filtros serão validados com gastos reais. | Antes do protótipo detalhado de Finanças. |
| Ativação MCP | Acesso completo da Berenice e preparação arquitetural estão decididos. Momento da ativação, hospedagem, autenticação e primeiras integrações externas dependem do plano técnico. | Antes de implementar o servidor MCP. |
| Recursos de desenvolvimento | Priorizar baixo custo recorrente; disponibilidade de tempo e responsável pela implementação ainda precisam ser definidos. | Antes de estimar prazo e fechar a tecnologia. |

Essas hipóteses permitem produzir fluxos e um protótipo inicial. Não devem ser convertidas silenciosamente em requisitos confirmados.

## 12. Próxima etapa do desenvolvimento

**Etapa recomendada: especificação funcional e protótipo navegável do ciclo essencial.**

| Ordem | Entregável | Conteúdo e condição de conclusão |
|---|---|---|
| **1** | Decisões de produto | Confirmar as hipóteses que alteram plataforma, registro manual, cartão, uso de Mercado e contexto financeiro. Registrar as escolhas. |
| **2** | Especificação funcional | Detalhar RF-01 a RF-20: cálculos por período, reservas, datas, faturas, pagamentos parciais, cancelamentos, contexto de gastos e fechamento de Mercado, com exemplos. |
| **3** | Modelo de dados e contratos | Definir entidades, relações, campos obrigatórios, operações reutilizáveis pela futura camada MCP e restrições, incluindo distribuição de valores, auditoria e proteção contra duplicidade. |
| **4** | Protótipo navegável | Validar captura, detalhe do item, registro de compra, pagamento, lista e fechamento de Mercado, gastos fora da casa, visão do cômodo e revisão mensal. Reproduzir a Casa Serena de D1–D5/M1–M6, com os estados vazios e erros relevantes. |
| **5** | Plano técnico e backlog | Escolher arquitetura a partir dos requisitos confirmados, verificar custos vigentes e dividir as entregas A, B e C em tarefas associadas aos critérios de aceitação. Planejar a entrega D de integração MCP completa com Berenice. |

O desenvolvimento do ciclo essencial estará pronto para começar quando seus fluxos tiverem sido revisados, as regras financeiras estiverem demonstradas com exemplos e o modelo de armazenamento e recuperação estiver definido.

**Direção consolidada:** construir uma central pessoal para casa e demais contextos de vida, com Mercado próprio, registros financeiros confiáveis e projetos simples; aprofundar primeiro o caminho que liga intenção, aquisição, pagamento e execução. Preparar serviços internos para que Berenice possa operar o aplicativo por MCP com acesso completo quando a integração for ativada.

## 13. Anexo visual obrigatório para o agente de design

O arquivo **“Guia_visual_Casa_Serena_referencias_aprovadas.pdf”** reúne, em páginas individuais, as telas originais aprovadas: [identidade do anexo: `libfile_efb094a17ffc8191801d7f86385cee95`]. Deve acompanhar esta proposta em qualquer repasse para design ou implementação. As imagens individuais abaixo também podem ser localizadas pelos nomes e identidades informados. A ordem D1–D5/M1–M5 representa as mesmas cinco áreas em computador e celular; M6 detalha o seletor Casa. A resolução dos originais é 1536 × 1024 px no computador e 887 × 1774 px no celular; são capturas de referência, não tamanhos fixos de implementação.

| Código | Tela | Arquivo original aprovado | Identidade do arquivo |
|---|---|---|---|
| D1 | Início, computador | `Próximo passo para organizar o apartamento.png` | `libfile_dd42992019ac8191bec7663e20830c2f` |
| D2 | Casa, computador | `Sala organizada com sofá e luminária.png` | `libfile_47c298630da88191b1be798f48e71b56` |
| D3 | Compras, computador | `Compras do apartamento: sofá e luminária.png` | `libfile_0641ab6aa4bc8191bff3e216edc80991` |
| D4 | Finanças, computador | `Finanças do apartamento em outubro.png` | `libfile_8e3868220558819184cc795050a19ee6` |
| D5 | Projetos, computador | `Organizar o apartamento: tarefas e custos.png` | `libfile_767c9ed5ec7c8191960fe3be0f0049ea` |
| M1 | Início, celular | `Seu próximo passo.png` | `libfile_f30d48e8b6388191bcc7c937c2798715` |
| M2 | Casa, celular | `Mapa da Casa com Itens da Sala.png` | `libfile_cd69da8b88388191af8022628f7a22cf` |
| M3 | Compras, celular | `Lista de desejos e compras.png` | `libfile_ccc981d69f288191b0532638131d8395` |
| M4 | Finanças, celular | `Finanças e pagamentos de outubro.png` | `libfile_977504451f588191916412e1fa8480b5` |
| M5 | Projetos, celular | `Fim de semana na serra.png` | `libfile_53b8635e5cb48191a0f47e7bf309b5fe` |
| M6 | Casa, seletor Mapa/Lista | `Tela Casa Serena com seletor Mapa_Lista.png` | `libfile_5107612d2d3081918d70dc7bfc4e5416` |

**Instrução de entrega ao designer:** fornecer esta proposta **e** o PDF visual. O agente deve demonstrar a fidelidade com comparações lado a lado de telas desktop e mobile, explicar ajustes necessários para Mercado e para o menu, e usar os cenários da seção 10 para verificar se o resultado funciona. Capturas geradas podem conter pequenas inconsistências de ícone, logo, datas ou números demonstrativos; a implementação deve normalizar esses detalhes sob um único sistema de componentes e sob as regras financeiras deste documento. Não usar uma imagem inteira como interface estática: os componentes precisam ser funcionais, responsivos e acessíveis.
