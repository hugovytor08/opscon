# Incremento0.3.0 — continuidade e auditoria

Preparação de GitHub/Vercel em 12/10/2026, solicitada pelo usuário para testar no telefone: ferramenta `scripts/github-push.mjs` valida sintaxe, padrões comuns de credenciais, identidade Git e destino, faz commit/push sem force e oferece `--dry-run` sem mutações/rede. `vercel.json` publica somente `app`, sem instalar dependências de teste, com revalidação HTTP e no-referrer. README inclui autenticação GitHub, identidade de commit e URL Configuration manual no Supabase. Repositório local ainda sem commit/remoto: identidade Git e destino precisam ser fornecidos pelo usuário. Não foi executado push/deploy e nenhum gate foi aprovado.

Retorno do usuário em12/10/2026: após a correção e solicitação de novo link, informou que o acesso funcionou. Registrar como confirmação manual de entrada; não presumir vínculo da conta, fila confirmada no servidor ou recuperação de registros em ambiente limpo. Esses ensaios permanecem necessários.

Correção de12/10/2026: callback de link expirado agora mostra aviso persistente e ação para solicitar novo acesso; limpa parâmetros de autenticação da query/hash e preserva registros. SWcachev8 permite abrir o shell com query de callback também offline. Teste integrado verifica erro/recuperação/dados preservados e callback offline. A prévia8767 teve processo sem resposta identificado e reiniciado; HTTP200 confirmado. Isso não altera a condição de aceite da V1 nem comprova login real.

Sessão de11/10/2026 (horário do usuário, São Paulo). V1 não aceita/publicada. Bloco executado: auditoria e fundação de F001–F006; F016 iniciado com matriz, sem fechar gates.

## Ponto de partida reproduzido

`npm run check` passou; `npm test` passou7/7; `node tmp/app_qa.cjs` concluiu `errors []` na prévia8766. Código inicial só persistia snapshot local, shellSW e JSON manual. Não havia conta/nuvem/fila. A pasta não tinha Git; iniciado agora, sem remoto/push. Direção visual preservada e referências PDF D1–D5/M1–M6 inspecionadas; nenhuma nova aceitação visual declarada.

## Implementação

IndexedDB1→2 aditiva conserva schema1/IDs/vínculos. Snapshot+fila indivisíveis; UUID/base de envio fixados antes da rede; ACK remove somente entrada correspondente. Revisão remota é independente da revisão de domínio (restaurar backup antigo não regride protocolo). Geração local impede salvar aba/formulário desatualizado, inclusive após restauração de mesma revisão. Falha de quota aborta snapshot/fila e explica erro; limite por snapshot2MB.

Cliente Supabase com HTTPS/chave pública apenas; Auth/refresh/logout, linkPKCE para templateFree e OTP para template futuro. Sessão/verificador fora de dados e backups; código removido da URL; metaReferrer e servidor local sem logs de query. Snapshot servidor+recibo na mesma transação, usuário da sessão, RLS e escrita direta revogada. Reconexão/foco/polling60s/novos registros tentam envio; app fechado não promete trabalho em segundo plano. Conflito interrompe escritas/envios e preserva cópias; exportar local antes de selecionar remoto. Não há mesclagem financeira automática.

Backup JSONv1 independente continua válido. Restauração/cadastro inicial preservam cópia anterior e não importam credenciais. Restauração não descarta operação transmitida com resposta incerta. SWcachev7 inclui módulos novos, sem skipWaiting no meio da sessão; rollback deve ser compatívelIDB2/protocolo1. Ainda faltam atualização/instalação física, retenção das cópias/fila, configurações/anexos no backup, CSV e domínio A/B completos.

## Supabase real

Usuário forneceu projeto Free `azqlukwlcotyhildfvwt`, nome `opscon`, organização com seloFree, bancoNano emus-east-1. Entrou no dashboard diretamente. Antes da migração, consulta de tabelas públicas retornou nenhuma linha. Migração202610110001 aplicada viaSQL Editor; `casa_private.schema_versions` registra versão/protocolo. Não houve CLI vinculada; indicador padrão de migrações CLI pode seguir vazio.

Consulta de metadados mostrou `casa_snapshots`/`casa_receipts`: RLS=true; INSERT diretoauthenticated=false; RPCauthenticated=true; RPCanon=false. `scripts/create-remote-qa.mjs` gerou teste com usuários/estado artificiais e rollback. Execução no PostgreSQL hospedado retornouPASS para sofá2700/pago900/aberto1800, recibo único, conteúdo divergente, revisão antiga, centavos inválidos, contaB sem acesso e ausência de sessão. Consulta posterior confirmou0 snapshots,0 recibos,0 usuários de teste persistidos. Imagens em `evidencias/`.

Chave pública configurada no app; chave secreta não revelada/copiada. Cadastro público desabilitado; loginanônimo desabilitado; confirmação de e-mail preservada. Retornos autorizados exatamente `http://127.0.0.1:8767/` e8768, SiteURL8767, somente preparação local. Nenhuma hospedagem pública/HTTPSdoapp ou plano pago escolhido.

DashboardFree exige SMTP próprio ou Pro para editar o templateOTP. Adaptamos ao linkpadrão comPKCE e mantivemos limites do envio de teste; não contratamos provedor. Conta pessoal está em provisionamento: usuário define credencial no painel. **Ainda não comprovados:** recebimento do e-mail, login/JWT, envio automático real da UI e recuperação em origem/aparelho limpo. Não declarar continuidade entregue antes dessa prova.

## Testes e falhas corrigidas

Tests locais cobrem domínio/limite de soma, configuração/segredo, Auth/renovação/saída, PKCE sem verificador/reutilização, interface de login, migraçãoIDB1→2, browser limpo, offline/recarga, resposta perdida, gravação durante envio, conflito/conta divergente, JSON limpo/inválido e quota. MigraçãoSQL também executada emPGlite, com permissões/RLS/recibo/revisão/validação/rollback lógico.

Os testes revelaram e permitiram corrigir chamada de fetch sem vínculo ao navegador, reconexão concorrente com tentativaoffline e ambiguidade de variáveisSQL. A revisão adicional protegeu geração ausente do snapshotIDBv1 e somas acima do limite seguro. Nenhum teste financeiro movimenta dinheiroexterno.

## Próximo bloco e limites

Verificação final desta sessão: `npm run check` passou, `npm test`33/33 passou e QA histórico novamente `errors []`. `node scripts/probe-remote.mjs` comprovou HTTP401 nas leituras de snapshots/recibos e na RPC sem sessão, com chave pública. A conta pessoal foi provisionada diretamente pelo usuário e o Supabase aceitou o primeiro envio de link pelo app. A entrada efetiva e a prova A→servidor→B ainda dependem de concluir esse link no navegador. Não registrar o link/código/token em evidências.

Concluir conta/login no projetoFree e provar A→servidor→Blimpo, offline→ACK e restauraçãoindependente. GalaxyS23/SamsungInternet identificado pelo usuário; versões/físico pendentes. Seguir F002/F003/F007–F010 (proposta concreta de cartão/fatura em `docs/produto/politica-cartao-proposta.md`), depois B/C. G-A/G-B/G-V1/G-P abertos; F019 emD, F020 foraV1. Nenhuma featurecomplete e nenhum CAaprovado. Matriz registra lacunas porCA e riscos transversais.
