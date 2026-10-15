# Onde estamos e o que acontece agora

**14/10/2026 — ajuste 0.3.3:** o usuário confirmou a ilustração antiga `app/assets/ref-casa.png` como padrão de acabamento da Casa, com possibilidade de ocultar os móveis. Essa decisão libera o desenho definitivo; a implementação da nova planta/camada de móveis continua pendente. A imagem antiga do Início foi retirada dos recursos publicados e do cache, com cópia histórica em `docs/design/referencias-historicas/ref-inicio.png`. Shell v11, dados preservados. Ver `docs/validacao/incremento-0.3.3.md`.

**14/10/2026 — incremento 0.3.2 local:** sistema visual escuro nas seis áreas, Início recomposto, atalhos de despesa/recebimento, foco de diálogos e conferência de rascunhos JSON por texto/arquivo, inclusive offline. A conferência não grava lotes; conciliação, correção auditável e histórico detalhado seguem pendentes. Ler `docs/validacao/incremento-0.3.2.md` e `docs/produto/backlog-reformulacao.json`. JSON/isometria novos encontrados nos Downloads, validados e preservados em `docs/design/apartamento-real/revisao-2026-10-14/`; geometria relativa, sem metros verificados. Referência de acabamento escolhida no ajuste 0.3.3 acima. Mapa integrado anterior preservado; sem push/deploy/aceite final.

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

**Nova direção em 14/10/2026 — planejamento, sem alterar o app:** `docs/produto/plano-reformulacao-2026-10-14.md` e o prompt de execução correspondente. O usuário quer aparência/acabamento inspirados no Samsung Health (vídeo fornecido), seis áreas funcionais, ações rápidas, apartamento com a geometria de um novo JSON/isometria e acabamento da imagem aprovada, zoom/arraste e itens planejados/comprados por cômodo. Acrescentou importação em lote via extração externa no ChatGPT/GPT, JSON revisado no app e histórico de preço/produto/loja. Contrato e instruções propostos em `docs/importacao/`; ainda não suportados pelo app 0.3.1. O executor precisa identificar os novos anexos da planta, preservar mudanças locais e implementar migrações/validações/testes. Esta direção atualiza o briefing visual antigo; requisitos/dados/gates permanecem preservados. Ver `docs/validacao/planejamento-reformulacao-2026-10-14.md`.

Editor local da planta entregue em 12/10/2026, focado em formato/proporções conforme prioridade do usuário: `docs/design/apartamento-real/editor/README.md` e `docs/validacao/editor-planta-2026-10-12.md`. HTML independente com arraste, isometria, desfazer e exportação/reabertura; 5 testes de geometria e 12 cenários de navegador passaram. Próximo nesse bloco: usuário ajustar/baixar o projeto e revisar antes de aplicar ao mapa integrado. Fonte original e dados do app preservados; sem novo push/deploy.

Integração autorizada e entregue em 12/10/2026: `docs/validacao/incremento-0.3.1.md`. Casa usa o mapa real estimado dos oito ambientes, com seleção, ampliação e vínculo manual aos cômodos cadastrados. Vínculos locais por navegador; nenhum cadastro automático ou alteração do banco. Testes 37/37 passaram; revisão da planta e teste físico ainda pendentes. Próximo: enviar a alteração ao GitHub/deploy de teste e conferir no S23. O usuário já confirmou o push anterior na branch main; o incremento atual ainda não foi enviado.

Recursos visuais do apartamento real produzidos em 12/10/2026: consultar `docs/validacao/apartamento-real-2026-10-12.md` e `docs/design/apartamento-real/integracao.md`. Planta 2D, isometria SVG, acervo consolidado e regiões editáveis estão prontos para revisão. Fotos confirmadas como estado atual; janela da sala informada como aproximadamente 1,60 m, sem escala confiável. Conferência da planta e integração ao app ficam para outra etapa, sem cadastro automático de cômodos ou conclusão de F014.

Atualização de 12/10/2026: o usuário confirmou entrada no app e priorizou GitHub + deploy de teste no Vercel para validar no Galaxy S23. `README.md` contém os comandos da ferramenta `npm run github:push` e os passos manuais para autorizar a URL HTTPS no Supabase. `vercel.json` serve somente `app`. Ainda sem remoto/push/deploy efetuado pelo agente; aceite final da V1 permanece pendente.

Implementar a arquitetura offline + banco remoto (Supabase recomendado), conta recuperável, sincronização e restauração em aparelho limpo; completar regras e jornadas da V1 ainda ausentes; revisar a interface contra M1–M6 em aparelho real; definir proteção e hospedagem HTTPS; executar CA-01–CA-22 antes de publicar.

O endereço local de prévia é `http://127.0.0.1:8766/` enquanto o servidor de desenvolvimento estiver ativo; ele não é endereço instalável no smartphone.

**Limite atual:** o código presente é um primeiro incremento verificável, não a V1 concluída nem a entrega MCP da Berenice. Nenhum dado demonstrativo é inserido no app.
