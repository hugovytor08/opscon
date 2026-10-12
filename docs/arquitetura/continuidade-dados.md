# Continuidade dos dados em outro telefone

**Decisão de produto, 11/10/2026:** a V1 deve permitir que Vytor perca ou troque o telefone, entre em outro aparelho e recupere os registros já sincronizados. Deve continuar aceitando registros sem internet. A necessidade de persistência remota está confirmada; Supabase é o candidato recomendado. O código atual ainda guarda dados apenas no IndexedDB local.

## Atualização do incremento0.3.0

Cliente/fila/sincronização implementados; migração aplicada no projeto Free de teste fornecido (`azqlukwlcotyhildfvwt`). Ver `protocolo-sync.md`. Browser limpo/offline/reenvio/conflito passaram localmente; ensaio SQL no Supabase passou e reverteu todos os registros artificiais. Prova com Auth real e telefone pendente. Acesso padrão Free por link de e-mail com PKCE; editar template para OTP exige SMTP próprio ou upgrade. Nenhum plano pago contratado. GalaxyS23/Samsung Internet confirmado; versões/uso físico pendentes. Afirmações de ausência de código remoto neste documento descrevem o ponto de partida.

## Comportamento esperado

```text
Registro no app
  → validação pelas mesmas regras financeiras
  → gravação local durável + operação pendente
  → quando houver internet e sessão válida: envio idempotente ao banco remoto
  → confirmação do servidor, revisão reconciliada e indicação de “sincronizado”

Novo telefone
  → instalação/abertura + entrada na mesma conta (exige internet na primeira vez)
  → busca do estado confirmado no servidor
  → validação e gravação local
  → uso normal, inclusive offline depois da preparação inicial
```

Uma operação ainda marcada como pendente no telefone perdido **não pode ser prometida como recuperável**. O app deve mostrar claramente a última sincronização e a quantidade de registros pendentes. A perda do aparelho após a confirmação do servidor deve ser coberta pelo ensaio de recuperação.

## Componentes e decisões técnicas

1. **Cliente PWA:** manter `app/domain.js` como regra única do produto. Evoluir `app/storage.js` para guardar estado e fila de comandos/alterações na mesma transação local; nunca anunciar sucesso remoto antes da confirmação. O service worker continua responsável somente pelos arquivos do app.
2. **Identidade e acesso:** criar uma conta que o usuário consiga recuperar após perder o telefone. Cada conjunto de dados no Supabase deve pertencer a um `auth.uid()` e ter RLS testada para leitura e escrita. Não colocar chave privilegiada de serviço no navegador. Testar acesso negado com outra conta e recuperação de sessão no aparelho limpo. [Supabase Auth](https://supabase.com/docs/guides/auth), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
3. **Persistência remota:** versionar esquema e operações, usar identificadores estáveis e idempotência no envio, garantir que compra, obrigações e pagamento não possam ficar parcialmente aplicados, e impedir que uma cópia antiga sobrescreva outra mais nova. Escolher entre snapshot versionado com log de operações e tabelas relacionais após comparar os invariantes de F007–F013 e a futura API MCP; documentar a escolha antes da migração real. A sessão de um aparelho só simplifica conflitos, mas não elimina reenvios e sobreposição durante troca de telefone.
4. **Migração:** exportar cópia local antes de vincular conta; importar registros preservando IDs/vínculos e totais, detectar estado remoto existente e oferecer um caminho explícito de reconciliação. Nunca sobrescrever o remoto silenciosamente. Backups antigos precisam de política de versão e teste de restauração.
5. **Backup independente:** sincronização protege contra perda do aparelho após confirmação, mas pode propagar exclusão/corrupção. Manter exportação verificável e definir cópia periódica independente, com ensaio de restauração. O plano gratuito do Supabase não inclui backup automático da base e pode pausar por baixa atividade; checar condições vigentes antes da escolha de plano. [Preços e recursos](https://supabase.com/pricing), [pausa de projetos gratuitos](https://supabase.com/docs/guides/platform/free-project-pausing).

## Gate mínimo antes de dados reais

- Criar um registro e uma compra em aparelho A; verificar confirmação no servidor.
- Entrar em perfil/aparelho B limpo; recuperar os mesmos IDs, vínculos e totais sem arquivo manual.
- Registrar offline em A; ver pendência; reconectar e confirmar em B sem duplicação.
- Reenviar após perda de resposta e testar duas revisões concorrentes; não perder nem duplicar finanças.
- Negar acesso de conta diferente, restaurar backup independente e verificar migração de versão.

Preparação de esquema, cliente, testes locais e documentação pode avançar sem credenciais. A configuração de um projeto Supabase real depende de acesso à conta e da escolha de plano antes de qualquer cobrança. Não pedir senha ou chave privilegiada por mensagem.
