# Ativar a sincronização da alimentação — 0.3.7

O app usa domínio 3, IndexedDB 2 e protocolo 1. A carteira funciona localmente; a nuvem precisa dos complementos novos para confirmar envios. O agente validou os SQLs em PostgreSQL local, sem aplicá-los ao projeto hospedado.

1. Em **Dados e backup**, exporte o JSON e guarde-o fora do aparelho.
2. No SQL Editor do mesmo projeto Supabase, consulte:

   ```sql
   select version, protocol from casa_private.schema_versions
   where version in ('202610110001', '202610150001', '202610150002')
   order by version;
   ```

3. Com `202610110001` já instalado, execute **apenas os complementos ausentes**, nesta ordem, uma vez cada:
   - `C:\opscon\supabase\migrations\202610150001_retroactive.sql`
   - `C:\opscon\supabase\migrations\202610150002_benefit.sql`

   Se uma versão já constar, pule-a. Não reaplique a migração inicial ou algum complemento instalado. Se a versão inicial não existir, siga primeiro a preparação do projeto em `README.md`.
4. Repita a consulta: as três versões devem constar com protocolo 1. Os complementos preservam snapshots, UUIDs e recibos existentes; não criam créditos ou contas.
5. Reabra a versão 0.3.7 na mesma origem, liberando as abas antigas para a atualização. Entre com o mesmo e-mail/senha e confira os ACKs. Não limpe dados ou filas para forçar sincronização. Em conflito, preserve o backup e revise as cópias.

Em **Finanças → Cartão alimentação → Cadastrar carteira**, informe o saldo real que existe hoje e sua data, incluindo sobras anteriores. Informe `0,00` se estiver zerado. Não copie R$ 690 como saldo apenas por ser a previsão mensal. O recebimento fica previsto no dia 30 (28/29 em fevereiro); **Confirmar recebimento** permite alterar data/valor reais e credita somente a competência selecionada, uma vez. Se o crédito já estava no saldo informado, a escolha de efeito no saldo evita contá-lo novamente.

No fechamento do Mercado, escolha alimentação, conta bancária ou **Dividir: alimentação + conta bancária**. Na divisão, informe a parte do alimentação; a tela mostra o restante exato na conta e os dois saldos antes de salvar. A compra continua única. Sem pagamento informado, fica a pagar.

Até aplicar os complementos, o servidor antigo pode recusar estados 3: eles permanecem pendentes neste aparelho e ainda não são recuperáveis da nuvem. `remoteMigration` identifica o SQL exigido pelo build, não certifica aplicação remota. Depois de gravar domínio 3, use cliente 0.3.7 ou posterior compatível; não faça downgrade de domínio, IndexedDB, banco ou recibos. Backups 1/2 continuam legíveis e são convertidos apenas na restauração/escrita.
