# Incremento 0.3.7 — alimentação / BEN-01

15/10/2026. Próximo bloco do caminho crítico autorizado pelo usuário, sem subagentes, publicação ou dados financeiros pessoais. **Implementado localmente; BEN-01 parcial até aplicação e prova no Supabase hospedado e teste físico.** Próximos blocos: Casa (imagem aprovada, seleção na planta/card) e gestão das listas de Mercado.

## Resultado

- Carteira alimentação separada dos bancos, com saldo inicial real informado pelo usuário; nenhum saldo de R$ 690 presumido. Sobras permanecem entre meses.
- Previsão de R$ 690 no dia 30, limitada ao último dia válido em fevereiro. Consultar meses não grava ou credita valores. Nenhum lançamento automático ou preenchimento de meses antigos.
- Confirmação por carteira/competência com data/valor reais editáveis e efeito no saldo de referência. Uma única confirmação mensal mesmo com outra chave; reenvio da mesma operação permanece idempotente. O benefício não entra como salário ou saldo bancário.
- Mercado e despesa podem usar alimentação, banco ou divisão explícita entre ambos. As partes positivas somam exatamente o total em centavos; geram uma compra e pagamentos vinculados por origem. Saldo alimentação insuficiente recusa toda a gravação com orientação para dividir/conferir os recebimentos. Fechamento/reutilização não duplicam despesas ou pagamentos.
- Início/Finanças mostram os saldos separados. Receitas/transferências bancárias não oferecem o benefício como conta bancária. Históricos de compras, pagamentos e obrigações mantêm os valores efetivos.

Domínio **3**, IndexedDB **2**, envelope de backup **1**, protocolo remoto **1**, shell **v15**. Nova migração `202610150002_benefit.sql`; as anteriores são preservadas. Arquitetura em `../arquitetura/carteira-alimentacao.md`; aplicação manual em `../../supabase/ALIMENTACAO.md`.

## Evidência

Regressão integrada **71/71** aprovada:

```text
node --test tests/domain.test.mjs tests/continuity.test.mjs tests/remote.test.mjs tests/sql.test.mjs tests/retroactive.test.mjs tests/retroactive-sql.test.mjs tests/retroactive-ui.test.mjs tests/password-ui.test.mjs tests/benefit.test.mjs tests/benefit-sql.test.mjs tests/benefit-ui.test.mjs
```

Depois, **2/2 testes de interface alimentação repetidos e aprovados** com capturas sem avisos transitórios e verificação adicional de que receita comum só oferece banco. `npm run check` e `git diff --check` aprovados. As evidências de acesso/retroativos desta regressão usam `CASA_EVIDENCE_DIR` em `evidencias/incremento-0.3.7/regressao/`, preservando os diretórios históricos 0.3.5/0.3.6.

- Modelo: fevereiro 28/29, meses 30/31, previsão sem escrita, valor/data editáveis, sobras, competência independente da data real, confirmação única, retries, retroativos incluídos e recusa de revisão que produziria saldo negativo.
- PostgreSQL PGlite: instalação não altera snapshot/recibos 1/2; ACKs perdidos permanecem válidos após domínio 3; novas escritas 1/2 sobre 3 falham com CS426. Campos novos disfarçados como antigos, carteira/previsão/competência inválidas, duplicação mensal, saldo insuficiente e transferências corrompidas falham sem recibo. RLS, anon/sem sessão e isolamento de outro dono preservados.
- Navegador Chromium isolado em 390/1280 px: saldo bancário sintético R$ 1.000, alimentação R$ 50; confirmação real ajustada para R$ 700 no dia 29 deixa R$ 750. Compra de R$ 350 debita só alimentação; depois, compra de R$ 450,01 usa R$ 400 da carteira e R$ 50,01 do banco. Resultado: banco R$ 949,99, alimentação R$ 0,00. Falha anterior por insuficiência não altera snapshot/fila/geração. Prévia não escreve; backup conserva o estado; recarga offline mantém dados/fila; nenhum erro de página ou overflow horizontal.
- Continuidade: fila v2 em voo conserva payload/UUID/base; novo estado 3 fica em operação separada. ACK v2 não substitui estado 3; envio seguinte confirma uma vez. Contexto limpo recupera o mesmo snapshot/IDs/saldos por protocolo simulado. Restaurar backup antigo converte para 3 e mantém a revisão remota.

Arquivos em `evidencias/incremento-0.3.7/`: `qa-alimentacao.json`, `qa-continuidade.json`, `carteira-390.png`, `carteira-1280.png`, `carteira-card-390.png`, `pagamento-misto-390.png` e `pagamento-misto-resumo-390.png` (também 1280). Capturas conferidas visualmente. Dados estritamente sintéticos; não são os saldos do usuário. Testes de importação/tema/planta não foram reexecutados como evidência deste bloco.

## Prévia real e pendências

A aba real `http://127.0.0.1:8767/` foi atualizada liberando o shell antigo e retornando à mesma origem. Finanças exibe **Cartão alimentação → Cadastrar carteira**. Continuam sem conta/saldo pessoal cadastrado, sem movimentações financeiras, com a mesma indicação de uma pendência; a lista existente continua aparecendo no Início. Nenhum formulário financeiro foi enviado nem armazenamento limpo. Captura: `tmp/diagnostico-preview/financas-alimentacao-0.3.7.jpg`.

O SQL novo foi apenas preparado/testado localmente. Aplicar manualmente os complementos ausentes 202610150001 e 202610150002, em ordem, conforme `supabase/ALIMENTACAO.md`, antes de considerar os novos envios recuperáveis da nuvem. Auth/recuperação reais e Samsung Internet/S23 físico ainda pendentes. Após dados 3, não voltar ao cliente 0.3.6 ou rebaixar banco/IndexedDB/fila. Nenhum CA/RF/feature/gate promovido, nenhuma alteração de identidade Auth, `features.json`, serviço contratado, push, deploy ou publicação.
