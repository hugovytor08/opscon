# Sincronização v1: conjunto atômico e revisão confirmada

Incremento de 11/10/2026. Decisão técnica executável para F003/F005/F006; não fecha os critérios de aceite da V1.

## Escolha

Manter o domínio único e `schemaVersion: 1`. O banco remoto guarda um snapshot por usuário e recibos de operações. Preferido a tabelas por entidade neste incremento: compra, parcelas, pagamentos e vínculos já formam um conjunto validado; um commit Postgres indivisível evita uma migração prematura de cada entidade enquanto cartão/reservas/devolução ainda estão em especificação. A futura camada MCP deverá passar pelo domínio, nunca gravar JSON bruto diretamente. Limites: snapshot completo tem custo de tráfego proporcional ao histórico e não permite edição concorrente automática. Medir tamanho/tráfego antes de F017; 2 MB por snapshot é o limite deste protocolo. Migração futura para tabelas deve preservar IDs e recibos, com versão nova e ensaio de recuperação.

## Escrita e confirmação

IndexedDB v2 adiciona fila e cópias de recuperação sem alterar os snapshots v1 existentes. A escrita local grava snapshot e entrada na fila na mesma transação. Cada entrada tem UUID independente da revisão financeira. A revisão remota é outro contador, iniciado em zero: não confundir com `state.revision` do domínio, que pode voltar ao restaurar um backup.

Antes do envio, a base remota do primeiro elemento é fixada duravelmente. O servidor bloqueia a linha do usuário, verifica recibo antes de comparar revisão, e confirma snapshot + recibo juntos. Mesmo UUID/base/conteúdo retorna o mesmo recibo; UUID com conteúdo diferente é rejeitado. Timeout ou resposta perdida mantém a entrada exatamente igual para reenvio. Só após recibo validado o cliente remove esse elemento e grava última sincronização. Escritas novas durante o envio permanecem na fila. Polling enquanto a página estiver aberta, eventos online/foco e novos registros tentam sincronizar. A PWA fechada não promete execução em segundo plano.

## Conflito e migração inicial

Não aplicar último escritor vence. Revisão divergente interrompe os envios, mantém estado/fila locais e uma cópia remota para revisão. A interface permite exportar a cópia local e, mediante confirmação explícita, recuperar a versão remota. Não oferece mesclagem financeira automática nem sobrescrita forçada. Esta regra conservadora impede colisões dos IDs numéricos já existentes. Uma resolução com incorporação de alterações locais exige revisão de registros/valores e operação nova; permanece pendente antes de uso concorrente amplo.

Ao vincular pela primeira vez: guardar uma cópia pré-vínculo no IndexedDB e exigir exportação independente pela UI; consultar remoto. Banco vazio recebe uma entrada com o estado local completo preservando IDs/totais. Local vazio recebe o remoto validado. Se ambas as cópias contêm dados diferentes, parar com conflito. Snapshot idêntico pode apenas ser reconhecido. Nunca apagar/mesclar bases silenciosamente. Usuário já vinculado não pode enviar para outra conta; logout não apaga os dados nem transfere sua propriedade.

Restauração guarda cópia anterior, substitui o conjunto em uma transação e enfileira uma operação de restauração. Uma entrada já enviada e sem resposta precisa ser confirmada antes; a restauração não pode descartar esse recibo pendente. Restauração de backup não importa sessão, dono remoto ou credenciais. Backup v1 continua compatível; versões desconhecidas são rejeitadas. Anexos e preferência de vista ainda não fazem parte do pacote atual.

## Proteção e limites

Supabase Auth por e-mail: acesso ao mesmo e-mail permite entrar em aparelho novo. No Free de teste, link padrão com PKCE deve abrir no mesmo navegador/origem onde o acesso foi solicitado. Código OTP continua como modo futuro para template adequado; editar esse corpo no Free exige SMTP próprio ou upgrade. Sem senha na UI do app. RLS limita leituras por `auth.uid()`; escrita direta revogada, RPC autenticada resolve dono. Chave publishable/anon pública apenas; jamais service_role. Sessão/verificador são credenciais locais fora de backups/logs e removidas ao sair. IndexedDB/JSON não são criptografados; bloqueio do aparelho continua necessário. Validar e-mail/JWT/recuperação real antes do gate.

Pendências sem conexão não estão na nuvem. Perder o telefone antes da confirmação perde essas alterações, salvo cópia independente. Sincronização pode propagar exclusão/corrupção: exportação JSON continua separada e deve ser guardada fora do aparelho.

Teste Chromium usa servidor de protocolo/Auth simulado e IndexedDB real. PGlite executa SQL e RLS com identidades locais. A migração foi também aplicada no Supabase de teste: ensaio transacional de finanças/recibos/conflitos/RLS passou e foi revertido (contagens0/0/0). Nenhuma dessas provas substitui login por e-mail/JWT, browser limpo, offline/reconexão e telefone físico no fornecedor. Procedimento em `supabase/README.md`.
