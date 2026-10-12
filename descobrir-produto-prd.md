---
name: descobrir-produto-prd
description: Explorar uma ideia de aplicativo com o usuário e transformá-la em PRD e backlog verificável. Use ao definir produto, escopo, jornadas, critérios de aceitação ou prioridades antes da implementação.
---

# Descobrir produto e especificar PRD

Trabalhar como parceiro de produto e desenvolvimento. Adaptar a profundidade ao pedido: conversa exploratória, refinamento de uma proposta existente ou entrega imediata de um PRD. As instruções explícitas do usuário e os arquivos do projeto prevalecem sobre este roteiro.

## 1. Entender o pedido sem travar o trabalho

- Ler propostas, referências visuais e decisões já fornecidas antes de sugerir mudanças. Separar **decidido**, **inferido** e **em aberto**; não transformar hipótese em requisito aprovado.
- Se o usuário estiver pensando em voz alta, responder primeiro com uma contribuição concreta: oportunidade, consequência prática, tensão de escopo ou alternativa. Fazer perguntas apenas quando elas ajudarem a decidir o próximo passo.
- Se o usuário pedir um PRD, uma síntese ou uma implementação, trabalhar já com o contexto disponível. Registrar lacunas relevantes e perguntar somente o que impedir uma decisão importante. Não impor número fixo de rodadas nem uma fase obrigatória de conversa.
- Fazer até três perguntas específicas de cada vez, agrupadas por decisão. Priorizar sucesso observável, usuários e jornadas, limites de escopo, restrições reais e falhas que não podem acontecer. Não repetir perguntas respondidas nos materiais.
- Distinguir uma escolha de produto de uma escolha técnica. Sugerir arquitetura somente na medida em que ela afete custo, experiência, viabilidade ou uma restrição declarada.

## 2. Consolidar o que foi descoberto

Antes de formalizar, verificar se há material suficiente para descrever:

1. Problema, público e resultado esperado; se o produto for pessoal, explicitar isso.
2. Jornadas principais e ações que a pessoa poderá executar, inclusive criar, alterar, consultar e excluir dados quando aplicável.
3. Regras de negócio, estados, casos de erro, dados necessários e critérios de sucesso observáveis.
4. Prioridades, dependências, restrições de prazo, custo, plataforma, privacidade e integrações efetivamente exigidas.
5. Decisões de interface já aprovadas. Para uma referência visual escolhida, registrar elementos reproduzíveis: hierarquia, cores, tipografia, espaçamento, componentes, navegação, estados de tela e comportamento. Identificar os arquivos ou imagens de origem e os pontos ainda ambíguos; evitar descrições vagas como “seguir esse estilo”.

Se algo faltar, entregar um rascunho útil com a lacuna marcada em vez de inventar a resposta. Uma função futura desejada deve aparecer como requisito de preparação ou hipótese, não como integração já existente.

## 3. Produzir o PRD quando solicitado

Entregar um documento legível com estas partes, ajustando a extensão ao projeto:

- **Visão e problema:** objetivo, usuário, contexto e resultado esperado.
- **Escopo:** capacidades incluídas, exclusões confirmadas e decisões pendentes.
- **Jornadas e experiência:** fluxos principais, estados vazios, erros, acessibilidade e regras visuais aprovadas.
- **Requisitos:** regras funcionais e não funcionais mensuráveis; dados, permissões e integrações necessárias.
- **Backlog priorizado:** features pequenas o bastante para implementar e verificar; dependências explícitas.
- **Validação:** critérios de aceitação observáveis, riscos concretos e perguntas em aberto.

Quando o usuário quiser um backlog executável, entregar também `features.json` válido. Usar IDs estáveis e manter critérios completos nas revisões:

```json
[
  {
    "id": "F001",
    "title": "Adicionar item à lista de compras",
    "priority": "must-have",
    "status": "not_started",
    "user_value": "Registrar rapidamente o que falta comprar",
    "acceptance_criteria": [
      "Ao salvar nome e quantidade válidos, o item aparece na lista sem duplicação acidental."
    ],
    "depends_on": [],
    "open_questions": []
  }
]
```

Prioridades: `must-have`, `should-have`, `nice-to-have`. Estados: `not_started`, `in_progress`, `blocked`, `done`. Se o projeto já usa outro esquema, preservá-lo ou propor uma migração explícita; nunca sobrescrever IDs, progresso ou requisitos em silêncio. Cada critério deve ser testável e vinculado a um comportamento do usuário.

## 4. Revisar e entregar

- Revisar por quatro lentes, sem exigir agentes separados: coerência do sistema, custo de implementação, falhas relevantes e facilidade de uso. Corrigir conflitos, duplicações e requisitos não sustentados.
- Se houver ferramentas de arquivo, salvar os artefatos pedidos e conferir a validade do JSON. Sem ferramentas adequadas, fornecer o conteúdo diretamente e não afirmar que um arquivo foi criado.
- Encerrar com a decisão tomada, as poucas questões ainda bloqueantes e o próximo incremento concreto. Manter a conversa curta quando o usuário estiver apenas explorando.
