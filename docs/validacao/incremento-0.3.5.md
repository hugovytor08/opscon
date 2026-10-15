# Incremento 0.3.5 — acesso por e-mail e senha

15/10/2026. Bloco AUT-01 iniciado após “continue”. Durante a inspeção, o usuário simplificou a decisão: “pode ser pelo email mesmo, não precisa criar adaptações”. Implementado o acesso **nativo por e-mail/senha** na conta Supabase existente. A proposta anterior de adaptador foi descartada antes de criar código de servidor; não há nova função, tabela, migração ou senha própria.

## Comportamento entregue

- Dados e backup oferece e-mail, senha e Entrar. O login normal usa `/auth/v1/token?grant_type=password`, sem pedir mensagem por e-mail. Sessões existentes continuam na mesma chave/formato e usam renovação/verificação de identidade já presentes.
- Erros de credenciais são genéricos e detalhes internos não aparecem. HTTP 429 pede espera; não há repetição automática do login. O limite efetivo pertence ao provedor e não foi configurado remotamente neste bloco.
- Em aparelho vinculado, login/callback de outra identidade é recusado antes de substituir a sessão. A fila e os registros não são apagados para trocar o método de acesso.
- Esqueci minha senha usa recuperação nativa separada, PKCE S256, retorno no mesmo navegador, limpeza de código da URL e formulário de nova senha com confirmação. O propósito de recuperação sobrevive à recarga por 15 minutos após a troca; verificador é descartado. Senhas são limpas dos campos após tentativa e não entram em domínio/fila/backup/URL/armazenamento/logs.
- Sair limpa credenciais e contexto de recuperação local mesmo sem confirmação remota e volta ao formulário. Estado/fila do aparelho permanecem íntegros.

Versão **0.3.5**, shell **v13**; domínio 1, IndexedDB 2, protocolo remoto 1 e migração instalada inalterados. Sem `skipWaiting` ou limpeza de armazenamento. Modos antigos de link/código permanecem como compatibilidade explícita, enquanto a configuração publicada seleciona `password`.

## Validação

`node --test tests/password-ui.test.mjs tests/remote.test.mjs tests/domain.test.mjs tests/continuity.test.mjs`: **33/33 aprovados** nesta execução. Incluem login incorreto sem mutação, senha com espaços preservados, renovação, outro proprietário recusado, recuperação PKCE, identidade confirmada, confirmação de senha divergente recusada, marcador persistente após recarga, saída offline, fila durável, reconexão com uma única gravação e mesmos IDs, credenciais fora do backup. A regressão existente cobre atomicidade/quota, resposta perdida, conflitos, recuperação em navegador limpo e preservação financeira.

Testes exclusivamente sintéticos em contextos isolados, com respostas Auth/API simuladas; nenhum login real, mensagem de recuperação ou senha real foi enviado. Capturas de formulário em 390/1280 px sem overflow, e resultados em `evidencias/incremento-0.3.5/acesso-390.png`, `acesso-1280.png`, `qa-login.json` e `qa-recuperacao.json`. O harness passou a aceitar configuração sintética servida também ao service worker, mantendo o teste offline isolado da conta real. Um teste de continuidade foi ajustado ao novo rótulo Voltar ao acesso. A falha inicial de retomada vinha de recibo sintético sem `operationId`; o app conservou a pendência e a simulação foi corrigida sem relaxar a validação.

`npm run check`, `git diff --check` e conferência de integridade de versões/IDs/fontes aprovados. Domínio, armazenamento, sincronização, SQL e `features.json` não foram alterados. Capturas históricas dos incrementos anteriores foram preservadas; não são apresentadas como nova execução.

## Prévia e limites

A aba real de `127.0.0.1:8767` foi recarregada/liberada para ativar o novo shell e retornou à mesma origem. Dados e backup mostra E-mail da sua conta, Senha, Entrar e Esqueci minha senha; ambos os campos estavam vazios e o campo Senha usa tipo `password`. A indicação de uma pendência e a lista existente continuaram visíveis. Nenhuma credencial/formulário foi enviado nem armazenamento limpo. Captura em `tmp/diagnostico-preview/acesso-email-senha-0.3.5.jpg`, fora do Git.

Estratégia offline preservada e explicitada em `../arquitetura/acesso-email-senha.md`: esta mudança autentica a conta remota; não criptografa ou bloqueia a base local já acessível no aparelho. Saída/expiração não eliminam dados ou pendências. Não foi introduzida uma proteção local fictícia ou PIN.

**AUT-01 permanece parcial:** confirmar manualmente conta existente/UUID, senha, cadastro público fechado, entrada/renovação/recuperação reais, navegador limpo e Galaxy S23. Passos em `supabase/ACESSO-EMAIL-SENHA.md`. A senha fica somente com o usuário. Recuperação depende da configuração/entrega de e-mail do provedor; login por senha existente não depende de envio de e-mail. Fontes: [senha nativa](https://supabase.com/docs/reference/javascript/auth-signinwithpassword), [recuperação PKCE](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), [API oficial de recuperação](https://github.com/supabase/auth/blob/master/internal/api/recover.go).

Nenhum gate/CA/feature concluído; sem dashboard automatizado, SQL, contratação, push, deploy ou publicação. Próximo bloco independente: **RET-01**, lançamentos retroativos com efeito explícito no saldo. Alimentação, Casa/v2, listas e importação/preços continuam pendentes.
