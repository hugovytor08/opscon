# Preparação do Supabase — 0.3.0

Projeto Free de teste fornecido pelo usuário: `azqlukwlcotyhildfvwt`, nome `opscon`, regiãous-east-1. Migração202610110001 aplicada manualmente pelo SQL Editor em11/10/2026 e registrada em `casa_private.schema_versions`. RLS/permissões verificadas; ensaio transacional remoto passou e rollback deixou0 snapshots/0 recibos/0 usuários artificiais. Conta pessoal em provisionamento pelo usuário; prova de login/recuperação real ainda pendente. Nenhum plano/add-on pago ou hospedagem do app contratado/publicado.

## Configuração concreta

1. Acessar a conta Supabase pelo navegador, sem enviar senha, token de administração ou chave secreta no chat. Identificar organização/plano e um projeto de teste (região a verificar na conta). Manter credenciais de administrador no dashboard/gerenciador de segredos.
2. Em SQL Editor ou CLI, aplicar `migrations/202610110001_continuity.sql` uma única vez. Ela cria `casa_snapshots`, `casa_receipts`, RLS, validador privado e RPC. Migrações seguintes terão nomes novos; nunca alterar uma migração já aplicada em ambiente real. A revisão local executa esse SQL em PostgreSQL PGlite, sem alterar infraestrutura remota.
3. Desabilitar cadastro público e provisionar a conta de teste pessoal em Auth. O app solicita OTP com `create_user: false`. Criar segunda conta de teste para isolamento. Não usar autenticação anônima. Conta Auth não é a mesma coisa que conta do dashboard.
4. No Free, o dashboard exige SMTP próprio ou Pro para editar o template. Mantivemos o template padrão de **link**, com PKCE(verificador local/desafioS256), troca por sessão e remoção do código da URL. Abrir o link no mesmo navegador/origem que solicitou acesso. Site URL: `http://127.0.0.1:8767/`; allowlist exata:8767/8768. São origens locais de teste, não publicação. A origem HTTPS futura deverá substituir a configuração antes do gate. O modo `code` permanece suportado para templateOTP configurado futuramente, sem impor upgrade.
5. O SMTP padrão só envia para membros autorizados da organização, limita atualmente a 2 mensagens/hora e não é destinado à produção. Para o gate de publicação, avaliar SMTP próprio ou outra identidade recuperável com motivo concreto, sem contratar serviço automaticamente. Só configurar segredos SMTP no painel do fornecedor. [Documentação oficial](https://supabase.com/docs/guides/auth/auth-smtp).
6. Preencher **somente URL HTTPS do projeto e chave pública publishable/anon** em `app/config.js`. Nunca service_role, `sb_secret_*`, senha Postgres ou refresh/access token. O app rejeita chave privilegiada. Configuração vazia mantém operação local e informa nuvem não configurada.

## Ensaio real obrigatório

Migração/RLS/recibos/conflitos/validação foram ensaiados no PostgreSQL hospedado com identidades artificiais e rollback. Isso não é prova de Auth/JWT/entrega de e-mail. A tabela abaixo ainda precisa ser concluída com login real na UI, perfis limpos e smartphone. A senha de provisionamento fica somente com o usuário; não armazená-la no código.

Guardar relatório sem tokens/senhas ou dados pessoais. Registrar versão/build, migração aplicada, navegador e horário das confirmações; usar dados artificiais de teste apenas nas contas de teste.

| Passo | Resultado obrigatório |
|---|---|
| Conta A, browser A: cômodo, sofá3000, conta5000, compra2700/3×900, pagar900 | Snapshot íntegro; UI indica pendências até recibo; banco confirma uma compra, três obrigações, um pagamento; adquirido2700/pago900/aberto1800/saldo4100 |
| Browser B limpo: entrar na mesma conta pelo código e vincular | Recuperar mesmos IDs/vínculos/totais sem importar arquivo; primeira entrada exige internet |
| A offline: registrar novo item, recarregar | Arquivos e registro abrem offline; há pendência; B não recebe o novo registro antes da confirmação |
| A reconectado, B atualizado | Envio automático, fila vazia após ACK; mesmo item em B, uma vez |
| A resposta perdida após commit (interceptar resposta da RPC no DevTools) | Mesmos UUID/base/conteúdo no reenvio; recibo existente; revisão/finanças sem duplicação |
| A e B divergem da mesma revisão | Um commit aceito; outro para com conflito; ambos preservados; exportar local antes de selecionar remoto |
| Conta C diferente e usuário sem sessão | Leitura não revela A; escrita direta negada; RPC determina dono por sessão e não aceita owner livre |
| Exportar JSON em A; restaurar em browser C limpo e em A vinculado | IDs/totais iguais; inválido não substitui base; restauração vinculada vira operação nova, nunca reduz revisão remota |
| Expirar token, sair, entrar novamente, perder acesso ao e-mail | Renovação/saída funcionam; mesmo e-mail recupera; recuperação do próprio e-mail deve ser verificada pelo usuário, não prometida pelo app |

Não tratar banco sincronizado como backup: exclusão/corrupção pode se propagar. Manter JSON independente fora do aparelho; backups administrativos devem ter retenção/destino acordados antes da publicação. Não apagar recibos enquanto uma operação puder ser reenviada; crescimento/quotas precisam de medição.

## Manutenção e retorno seguro

Aplicar migração com backup verificável da base; guardar o artefato e os hashes de cada build. `app/version.json` identifica protocolo1, domínio1 e IndexedDB2. Voltar somente a build que saiba abrir IndexedDB2 e protocolo1. O código antigo que abre IndexedDB1 não é rollback seguro após a atualização: pode falhar com VersionError. Não fazer downgrade destrutivo de IndexedDB ou apagar filas para resolver conflito. Para estrutura futura, publicar migração aditiva, ensaiar restauração e compatibilidade antes de remover campos. Pausa do Free pode exigir reativação pelo dashboard; ela não deve ser disfarçada como sincronização confirmada.
