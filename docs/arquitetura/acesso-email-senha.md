# Acesso nativo por e-mail e senha — 15/10/2026

AUT-01 foi simplificada pelo usuário durante a execução: e-mail/senha aceita; adaptador por nome de usuário dispensado. Mantêm-se o projeto Supabase, a identidade Auth existente, RLS, formato de sessão, domínio 1, IndexedDB 2 e protocolo remoto 1. Nenhuma senha própria, cadastro público, função ou migração foi criada.

`SupabaseClient.signInWithPassword` usa `POST /auth/v1/token?grant_type=password`, preserva espaços da senha e só guarda a sessão retornada. Quando o aparelho já possui proprietário, resposta de outra conta é recusada antes de substituir sua sessão. Senha incorreta/conta inexistente compartilham mensagem; respostas internas não são mostradas. HTTP 429 pede espera, sem reenvio automático de credenciais.

Recuperação separada: `/auth/v1/recover` com PKCE S256 e retorno validado em HTTPS ou localhost. O verificador fica apenas no navegador solicitante, com validade local de uma hora, e é removido após troca. O propósito de recuperação fica marcado por 15 minutos após a troca, ligado ao UUID da sessão, para resistir à recarga. A URL é limpa antes da renderização. `PUT /auth/v1/user` define a senha mediante sessão validada; confirmação de identidade é exigida e o marcador é descartado. Senhas não vão para estado de domínio, fila, backup, URL, armazenamento local ou logs. Tokens de sessão continuam no armazenamento de autenticação já existente, fora do backup.

## Continuidade no aparelho

Preservada a estratégia offline existente: primeiro login/verificação requer rede; sessão persistida permite continuar trabalhando no aparelho. A expiração do token exige renovação para sincronizar; não apaga dados nem descarta pendências offline. Sair remove sessão, verificador e propósito de recuperação mesmo se o servidor não responder. O formulário volta para e-mail/senha e os registros/fila locais permanecem.

Esta alteração protege o acesso remoto e o vínculo ao proprietário. Não introduz um bloqueio ou criptografia da base local: dados previamente salvos no aparelho continuam acessíveis no uso local, inclusive após sair, como no comportamento anterior. Um requisito futuro de cofre/bloqueio local precisa de desenho próprio; não foi simulada uma proteção apenas visual nem criado PIN/senha local.

Os modos antigos de código/link permanecem como compatibilidade explícita do cliente/testes, mas `app/config.js` seleciona `password`. Links antigos pendentes continuam verificáveis; o login normal não os solicita.

Passos manuais: `supabase/ACESSO-EMAIL-SENHA.md`. Sem alteração de dashboard, credencial, e-mail real, SQL ou publicação nesta implementação. Provas com Auth simulado não demonstram configuração/entrega de e-mail real.
