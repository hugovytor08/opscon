# Planejamento dos achados de uso — 15/10/2026

Pedido do usuário: discutir os achados e preparar o plano antes de executar mudanças no aplicativo. Entregues `docs/produto/plano-ajustes-2026-10-15.md`, complemento do guia inicial/plano anterior e backlog com AUT-01, RET-01, BEN-01, CAS-04, MER-01/02 e VIS-04. RF/CA/F e IMP-01–07 preservados; nenhum gate concluído.

Respostas do usuário incorporadas: nome de usuário + senha; cartão alimentação previsto com confirmação de recebimento; salário de 30/09 não incluído no saldo inicial informado. Nome de usuário real, senha, valor do salário e saldo pessoal não foram solicitados ou registrados no app.

Inspeção focada: `app/domain.js` (datas de referência, cálculo do saldo, criação/fechamento/reutilização de Mercado), `app/ui.js` (lista ativa, Casa, cadastro e receita), `app/supabase.js`/`config.js` (acesso por link), regras de data no SQL instalado e `.market-banner` em `app/styles.css`/tema. Print fornecido confirma texto claro sobre fundo claro. Listas são acrescentadas ao estado, mas não têm navegador/gestão completos na UI; não foi alegado que uma lista apagou outra nem inspecionada a base pessoal para provar sua presença.

Documentação primária do Supabase consultada sobre senha, configuração de acesso e limites em 15/10, com links no plano. Nome de usuário exige um adaptador proposto sobre a identidade nativa e um desenho técnico antes de implementar. Não houve configuração no dashboard, chamada de autenticação, definição de senha, deploy de função, migração ou serviço contratado. O motivo específico da falha do link não foi diagnosticado por este planejamento.

Verificação de integridade desta sessão: JSON do backlog parseado, IDs únicos, referências F válidas, F001–F020 e IMP-01–07 conservados e novas tarefas não iniciadas. SHA-256 dos arquivos de `app`, `supabase`, `tests`, `scripts`, `features.json` e `package.json` comparados antes/depois para comprovar ausência de alteração executável/configuração. `git diff --check` verifica integridade textual dos documentos. Verificador local em `tmp/planning-integrity-2026-10-15.mjs`.

Testes funcionais não foram repetidos: não houve alteração de comportamento, contrato executável, SQL ou base. Evidências 43/43 e 22/22 anteriores permanecem históricas dos respectivos incrementos, não são execução de 15/10. Critérios futuros estão no plano: datas antigas sem duplicação, alimentação e pagamento misto, gestão de listas, importação/preços recuperáveis, acesso real, continuidade, contraste com listas preenchidas e teste físico no S23.

## Complemento: nova representação de Casa

O usuário pediu acrescentar a nova representação ao sistema e respondeu “Mesma geometria, só melhorou a imagem”. Incorporado ao planejamento em andamento, sem iniciar implementação. O anexo `C:/Users/hugov/AppData/Local/Temp/codex-clipboard-ea1b71d1-079d-4eb0-87d2-ea36da0c5198.png` é idêntico por SHA-256 ao arquivo já preservado `docs/design/apartamento-real/estudo-visual-2026-10-15/apartamento-sem-moveis-v2.png`: `8cff27b8892ae51cf679b6aed5fd8648d19420e95eb652224ad6a82456fe579d`. Sem duplicação, regeneração ou edição do PNG.

Plano, guia inicial, referência visual e CAS-01 agora apontam para essa base vazia; a ilustração antiga fica histórica. Preservado o pedido paralelo de móveis reais, sem torná-lo pré-requisito para integrar a base. O guia da v2 usa `geometria.json`, conforme relatório visual; a confirmação do usuário registra continuidade da geometria, sem alegar identidade numérica com os exports de 14/10. Registro das oito regiões sobre o PNG, IDs, gestos e cache offline continuam pendentes de implementação/teste integrado. Verificação de integridade repetida para este complemento; versão continua 0.3.3.

Prompt solicitado para encaminhamento ao executor entregue em `docs/produto/prompt-agente-ajustes-2026-10-15.md`: decisões de acesso, retroativos, alimentação, Casa/v2, listas, importação/preços, sequência por blocos e critérios de validação consolidados. Não foi enviado a outro agente nem executado nesta sessão. Código, configuração e estados de implementação preservados; integridade documental e referências verificadas.

Durante a execução posterior, o usuário substituiu a decisão de nome de usuário por **e-mail/senha**, dispensando o adaptador. Plano/prompt/backlog atualizados; a escolha anterior acima permanece como histórico. Implementação local e evidências em `incremento-0.3.5.md`; configuração e jornada reais não foram executadas pelo agente.
