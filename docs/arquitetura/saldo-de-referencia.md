# Saldo de referência e histórico retroativo — domínio 2

15/10/2026, RET-01/0.3.6. `openingDate` e `openingBalanceCents` identificam o saldo informado pelo usuário; deixam de limitar a data do histórico. Não são rebasedos automaticamente. Compra, obrigação, pagamento e data de registro continuam distintos.

Pagamentos e receitas têm `balanceEffect: apply | included`. Transferências têm `fromBalanceEffect` e `toBalanceEffect`, avaliados independentemente. `apply` participa do saldo; `included` já estava refletido na referência e participa apenas do histórico. Este último só é válido até a data de referência da respectiva conta. Data anterior exige escolha explícita; na própria data, o formulário oferece a escolha com `apply` inicialmente selecionado. Datas posteriores usam `apply`.

Saldo = referência + receitas aplicáveis − pagamentos aplicáveis + transferências de entrada aplicáveis − transferências de saída aplicáveis. Receitas/pagamentos históricos continuam nos totais de sua competência, mesmo se incluídos na referência. Pagamento incluído quita a obrigação sem novo débito; despesa sem conta não inventa pagamento. Uma transferência não vira receita ou despesa.

`recordedAt` separa a data de cadastro da data do fato nas compras, pagamentos, receitas e transferências. Vem do timestamp do comando da UI. Registros antigos recebem `null`: a data de cadastro desconhecida não é inventada. `balance-effect.update` exige chave idempotente e motivo, conserva valor/data/vínculos/ID e registra antes/depois e horário no evento de auditoria.

## Compatibilidade e fila

- Leitura aceita domínio 1 validado pelas regras antigas e domínio 2 pelas novas. A leitura não persiste migração nem reescreve fila.
- Primeiro comando novo copia a base 1 para 2, conserva IDs, referência, auditoria e assinaturas de operações; efeitos antigos tornam-se `apply`, preservando os saldos. Replay de chave antiga continua retornando exatamente o estado anterior.
- Novos estados entram na fila com outro UUID. Envios 1 em voo mantêm UUID, base e payload exatos; ACK perdido pode ser reconhecido mesmo após evolução do remoto. Teste de fila mista 1/2 confirma que ACK antigo não substitui o estado corrente 2.
- `restoreBackup` converte backups 1 antes de persistir/restaurar. Envelope de backup 1, IndexedDB 2 e protocolo de sincronização 1 permanecem. Versão de domínio não pode regredir em gravação normal.
- Migração SQL aditiva `202610150001_retroactive.sql`: conserva o validador 1, valida o domínio 2 e calcula somente efeitos aplicáveis ao conferir os limites monetários. RPC mantém fingerprint/recibos/RLS e recusa uma nova gravação 1 sobre estado 2, mesmo com revisão correta. Replay de recibo 1 preexistente permanece permitido, sem regravar o snapshot.
- Cliente antigo não interpreta snapshot 2; não pode sobrescrevê-lo pela RPC nova. Conflitos, quota, restauração e pendências continuam conservadores. Não fazer downgrade para 0.3.5 depois de gravar domínio 2.

O gerador `scripts/prepare-retroactive-migration.mjs` carrega as regras integrais da migração original, altera apenas os trechos versionados e falha se os trechos de origem mudarem. Normaliza finais de linha para geração e registra o hash dos bytes da origem. A migração instalada não é editada. Testes PGlite exercitam o SQL resultante, incluindo RLS, validação cliente/servidor, ACK antigo e bloqueio de downgrade.

Aplicação remota é manual: `supabase/RETROATIVOS.md`. Código/testes locais não comprovam aplicação do SQL ou recuperação de dados reais no projeto hospedado.
