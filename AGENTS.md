# Trabalho no Casa Serena

## Economia de tokens — orientação do usuário em 12/10/2026

- Manter contexto e integração no agente principal; não criar subagentes sem pedido explícito.
- Escolher um bloco pequeno do caminho crítico por sessão e entregar código, evidência e backlog atualizado.
- Consultar primeiro docs/produto/leia-primeiro.md e o relatório mais recente. Depois ler apenas trechos/arquivos necessários à alteração; não despejar documentos inteiros já auditados.
- Agrupar buscas e verificações independentes. Evitar repetir resultados, navegação exploratória e verificações sem nova mudança ou risco.
- Executar testes adequados à alteração; ampliar somente por falha, mudança adicional ou preocupação concreta. Nunca dispensar teste de integridade por economia.
- Preferir APIs/CLI disponíveis a navegação manual. Para configuração do Supabase, entregar ao usuário passos curtos e concretos para executar; não retomar automação do dashboard sem solicitação.
- Respostas e atualizações curtas: resultado, evidência, lacuna relevante e próxima ação. Não repetir planos completos.

## Regras preservadas

- Em 12/10/2026, o usuário decidiu subir o repositório ao GitHub e fazer deploy de teste pela própria conta Vercel para validar no telefone antes dos ajustes finais. Preparar ferramenta/configuração é autorizado; esse deploy de teste não equivale à aceitação ou publicação final da V1.

- V1: Início, Casa, Compras, Mercado, Finanças e Projetos; planta somente em Casa. M1–M6 prioritárias para smartphone.
- PWA mobile-first com escrita offline, IndexedDB/fila, Supabase remoto e backup independente. Pendências sem ACK não são recuperáveis após perda do aparelho.
- Preservar dados, IDs RF-01–RF-20, CA-01–CA-22 e F001–F020; não marcar completo sem evidência integrada. Não inserir demonstrações na base inicial.
- Não publicar, contratar plano pago, implementar pagamento externo real ou introduzir dados pessoais financeiros antes dos gates/decisões previstos.
- Credenciais ficam fora do chat, código, backup e logs. Berenice/MCP somente em D; F020 fora da V1.
