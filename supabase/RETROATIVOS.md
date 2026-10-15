# Ativar a sincronização dos retroativos — 0.3.6

**Versão atual 0.3.7:** também exige o complemento alimentação 202610150002. Use `ALIMENTACAO.md` para conferir e aplicar apenas os complementos ausentes, em ordem. As instruções abaixo registram a entrega 0.3.6; não rebaixar dados 3 para segui-las.

O app 0.3.6 usa domínio 2. A entrada e a revisão funcionam localmente, mas o Supabase precisa da nova validação antes de confirmar os novos envios. Aplicação manual, sem modificar/reaplicar o SQL instalado de 11/10.

1. Em **Dados e backup**, exporte uma cópia e guarde-a fora do aparelho. Não envie dados ou credenciais no chat.
2. No SQL Editor do mesmo projeto Supabase, confira as versões instaladas:

   ```sql
   select version, protocol
   from casa_private.schema_versions
   where version in ('202610110001', '202610150001')
   order by version;
   ```

3. Se `202610110001` existe e `202610150001` ainda não existe, execute **uma única vez** o conteúdo completo de `C:\opscon\supabase\migrations\202610150001_retroactive.sql`. Não execute novamente `202610110001_continuity.sql`. Se a nova versão já consta, pule sua aplicação. Se a versão inicial estiver ausente, use a preparação do projeto antes de aplicar o complemento.
4. Repita a consulta: as duas versões devem aparecer com protocolo 1. Esta migração troca a validação/RPC e registra a versão; não altera os snapshots, pagamentos ou recibos existentes.
5. Reabra a prévia 0.3.6, mantendo a mesma origem e liberando as abas antigas para a atualização. Entre na mesma conta por e-mail/senha e confira a confirmação dos envios. Não limpe IndexedDB/fila/cache de dados para forçar sincronização. Em conflito, preserve o backup e revise as cópias.

Para uma receita de 30/09 que **ainda não estava incluída** no saldo cadastrado, escolha **Ainda não estava incluído · altera o saldo**. Para um movimento já refletido no saldo informado, escolha **Já estava incluído · só histórico**. A prévia mostra o saldo antes/depois; em transferências, a escolha vale por conta. O valor real continua sendo informado por você.

Finanças mostra o mês do acontecimento. **Revisar efeito no saldo** corrige a classificação, exige motivo e mantém o mesmo movimento e sua auditoria. Não altera o saldo/data de referência da conta para esconder diferenças.

Enquanto o SQL novo não estiver aplicado, envios de domínio 2 podem ser recusados pelo servidor antigo; a pendência fica no aparelho e não deve ser apresentada como recuperável da nuvem. O campo `remoteMigration` do build identifica o SQL exigido, não certifica sua aplicação no projeto.

Depois que houver dados de domínio 2, use cliente 0.3.6 ou posterior compatível. O cliente 0.3.5 não interpreta esse domínio; não é rollback seguro. Backups antigos podem ser revisados/restaurados pelo cliente novo, que os converte preservando os efeitos originais. Não remova recibos ou faça downgrade de dados/banco para resolver uma divergência.
