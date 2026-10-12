# Onde estamos e o que acontece agora

**11/10/2026 — implementação iniciada, V1 não publicada.** Vytor aprovou a direção visual do protótipo v0.2, priorizou o smartphone e escolheu uso offline. Ele esclareceu que precisa recuperar seus registros em outro telefone se perder o primeiro; a V1 exige banco remoto e sincronização, além de backup exportável independente. A estratégia de coordenação continua C: o agente principal mantém o contexto e pede somente decisões que mudem o uso real.

## Atualização desta sessão — incremento0.3.0

IndexedDB2/fila atômica preservam snapshots anteriores. Cliente Supabase/Auth, status visível, sincronização automática, reenvio idempotente, conflito conservador e backup independente estão no código. Migração202610110001 aplicada no projeto Free de teste fornecido; ensaio SQL de integridade/RLS passou com rollback e contagens0/0/0. Login e recuperação por conta real ainda precisam de prova integrada. V1/HTTPS/instalação continuam pendentes.

Dispositivo informado: GalaxyS23/Samsung Internet. Ler `docs/validacao/matriz-ca.md`, `docs/arquitetura/protocolo-sync.md` e `supabase/README.md` para evidências atuais. Nenhum CA/feature completo. Git local iniciado; sem remoto/publicação.

## O que já foi produzido

1. **Plano e regras:** `C:\opscon\workflow_desenvolvimento_v1.md`, `C:\opscon\features.json` e os exemplos em `docs\produto` conservam requisitos e critérios de aceite.
2. **Direção visual aprovada:** `C:\opscon\prototype\index.html` permanece como referência de aparência e interação. M1–M6 guiam a composição móvel.
3. **Primeiro código do app:** `C:\opscon\app` contém seis áreas, navegação inferior de cinco destinos, Mercado no menu e atalho, operações locais persistidas, uso offline após carregamento inicial e backup JSON com restauração validada. Testes de domínio e um percurso de navegador a 390 px passaram.
4. **Decisões:** `decisoes.md` registra smartphone, offline e backup. `C:\opscon\docs\arquitetura\decisao-tecnica.md` descreve a escolha técnica e seus limites.

## Próxima etapa de trabalho

Atualização de 12/10/2026: o usuário confirmou entrada no app e priorizou GitHub + deploy de teste no Vercel para validar no Galaxy S23. `README.md` contém os comandos da ferramenta `npm run github:push` e os passos manuais para autorizar a URL HTTPS no Supabase. `vercel.json` serve somente `app`. Ainda sem remoto/push/deploy efetuado pelo agente; aceite final da V1 permanece pendente.

Implementar a arquitetura offline + banco remoto (Supabase recomendado), conta recuperável, sincronização e restauração em aparelho limpo; completar regras e jornadas da V1 ainda ausentes; revisar a interface contra M1–M6 em aparelho real; definir proteção e hospedagem HTTPS; executar CA-01–CA-22 antes de publicar.

O endereço local de prévia é `http://127.0.0.1:8766/` enquanto o servidor de desenvolvimento estiver ativo; ele não é endereço instalável no smartphone.

**Limite atual:** o código presente é um primeiro incremento verificável, não a V1 concluída nem a entrega MCP da Berenice. Nenhum dado demonstrativo é inserido no app.
