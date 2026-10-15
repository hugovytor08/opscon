# Incremento 0.3.6 — retroativos e efeito no saldo

15/10/2026. Bloco RET-01, após autorização para continuar. Receitas, gastos, pagamentos e transferências podem anteceder a data do saldo informado. A data de referência não é mais um limite para o histórico. O usuário escolhe se o movimento ainda altera o saldo ou se já estava refletido nele; transferências tratam as duas contas independentemente. A conta mantém seu valor/data de referência originais.

## Comportamento entregue

Formulários financeiros mostram o saldo atual e o resultado antes de salvar, sem gravar na prévia. Datas anteriores exigem escolha; na própria data de referência, `apply` é a seleção inicial com opção de revisar. Movimentos posteriores usam `apply`. Valor excessivo ou contas iguais em transferência não mostram uma previsão enganosa. Compra sem pagamento continua a pagar, sem afetar caixa.

Finanças passa ao mês do acontecimento após o registro e mostra as movimentações desse mês, incluindo transferências. Data de cadastro é separada; antigos registros sem essa informação não recebem um horário fictício. Revisar efeito no saldo conserva ID, valor, data e vínculos, exige motivo e produz antes/depois auditáveis. Pagamento já incluído ainda quita a obrigação correspondente.

O salário de 30/09 informado na conversa não estava incluído no saldo: quando registrado pelo usuário, a escolha `apply` acrescenta o valor. Nenhum salário, saldo ou pagamento pessoal foi criado pelo agente.

Versão **0.3.6**, domínio **2**, IndexedDB **2**, protocolo remoto **1**, shell **v14**. Migração aditiva exigida: `202610150001_retroactive.sql`. A versão do build identifica o SQL requerido; sua instalação remota não foi feita nem certificada. A migração inicial foi preservada.

## Evidências desta execução

Regressão **57/57 aprovada**:

```text
node --test tests/domain.test.mjs tests/continuity.test.mjs tests/remote.test.mjs tests/sql.test.mjs tests/retroactive.test.mjs tests/retroactive-sql.test.mjs tests/retroactive-ui.test.mjs tests/password-ui.test.mjs
```

Após duas proteções finais da prévia (limite inteiro seguro e origem/destino iguais), **2/2 testes de `retroactive-ui.test.mjs` repetidos e aprovados**, incluindo essas proteções. `npm run check`, `git diff --check` e integridade de versões/IDs/fontes aprovados. Os testes anteriores de tema/importação/planta não foram reexecutados ou usados como nova evidência.

- Modelo: receita anterior acrescenta saldo quando não incluída; receita/gasto já incluídos mantêm o saldo; pagamento parcial/quitação e fechamento do Mercado usam a mesma regra; pendência não inventa pagamento; transferências por conta; correção/idempotência; competência e data de registro; valores/data/classificação inválidos recusados.
- Migração: fixture sintética v1 preserva contas, IDs, saldos, auditoria e operações. Migração só ocorre na próxima escrita; leitura/recibo/replay não reescrevem dados antigos. Backup 1 pode ser lido e restaurado em 2.
- Fila real no IndexedDB: payload/UUID/base 1 em voo mantidos exatamente; novo estado 2 enfileirado separadamente; ACK antigo não substitui estado atual; restauração antiga conserva revisão remota e migra domínio.
- PostgreSQL PGlite: aplicação do complemento não muda snapshot/recibo 1; reenvio com ACK perdido continua idempotente mesmo após snapshot 2; nova escrita 1 sobre snapshot 2 é recusada com CS426. Campos ausentes/impossíveis, timestamp inválido e downgrade disfarçado falham sem gerar recibos. RLS, ausência de sessão, anon e isolamento de outra identidade preservados.
- UI Chromium 390/1280 px: prévia sem mutação, receita de R$ 500 sobre referência sintética de R$ 1.000 resultando em R$ 1.500, gasto incluído sem débito, transferência com referências distintas, revisão auditável, pendência e pagamento posteriores, reload offline com estado/fila/geração iguais. Nenhum erro de página. Capturas e JSON em `evidencias/incremento-0.3.6/`.

Todos os registros são sintéticos em contextos isolados. PGlite executa SQL real em processo local; Auth/protocolo de navegador são simulados. Isso não comprova implantação do complemento, autenticação ou recuperação no Supabase hospedado. Sem teste físico no S23.

## Prévia e pendências

A aba real foi recarregada e liberada para atualização, voltando à mesma origem. Finanças mostra o novo histórico mensal e continua sem contas/valores cadastrados, com a mesma indicação de uma pendência existente. Não foram enviados formulários de finanças nem limpos dados. Captura em `tmp/diagnostico-preview/financas-retroativos-0.3.6.jpg`. A demonstração da prévia monetária nas evidências usa dados sintéticos, não a base do usuário.

**RET-01 parcial até aplicação manual e prova remota:** seguir `supabase/RETROATIVOS.md`. Até aplicar, envios 2 podem permanecer pendentes no servidor antigo; não afirmar recuperação pela nuvem sem ACK. Depois de gravar domínio 2, não voltar ao cliente 0.3.5 ou reduzir esquema para tentar sincronizar. Continuidade e rollback documentados em `../arquitetura/saldo-de-referencia.md`.

Sem alteração da identidade Auth ou de `features.json`, sem novo serviço, credencial, SQL remoto, push, deploy ou publicação. Nenhum CA/feature/gate concluído. Próximo bloco local: **BEN-01**, carteira alimentação, previsão mensal e confirmação do recebimento. Demais tarefas permanecem no backlog.
