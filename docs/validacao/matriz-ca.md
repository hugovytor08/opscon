# Matriz de aceite da V1

14/10/2026 — evidência adicional do incremento 0.3.2 em `incremento-0.3.2.md`: seis áreas no tema novo, ações rápidas com conta explícita, foco em diálogos, conferência de JSON sem escrita e shell offline. RF/CA não foram aprovados por esse bloco; IMP-01–07 e tarefas de expansão estão em `../produto/backlog-reformulacao.json`. S23 físico, correção auditável de movimentos, mapa definitivo e confirmação financeira de importação seguem pendentes.

Auditoria e incremento 0.3.0 de 11/10/2026. Estados: **não implementado**, **parcial**, **implementado sem validação completa**, **aprovado**. Nenhum CA foi aprovado nesta sessão. Protótipo aprovado e teste de domínio isolado não liberam o requisito integrado. G-A, G-B, G-V1 e G-P permanecem abertos.

Evidências reproduzíveis: `npm run check`; `npm test` (domínio, Auth/PKCE simulado, IndexedDB real no Chromium e migração/RLS em PostgreSQL PGlite); `node tmp/app_qa.cjs` em127.0.0.1:8766 (seis áreas,320/360/390/430/768/1536px, backup/offline). PGlite usa identidade de teste e não comprova JWT/e-mail. No projeto Free fornecido, a migração foi aplicada, RLS/permissões verificadas e ensaio SQL de finanças/recibos/conflitos/isolamento passou com rollback e contagens0/0/0. Evidências em `evidencias/supabase-*.png`. Login real/recuperação integrada e S23 ainda pendentes; as provas SQL não substituem essa jornada.

| CA | Estado | RF associados | F responsáveis | Evidência verificável | Lacuna | Próximo teste |
|---|---|---|---|---|---|---|
| CA-01 | implementado sem validação completa | RF-01 | F007 | `item.create`, `tests/domain.test.mjs`; captura/reabertura em `tmp/app_qa.cjs` | Captura e teclado no S23 | Criar somente nome, fechar/reabrir a PWA instalada e recuperar pela conta |
| CA-02 | parcial | RF-14/17 | F007/F012 | IDs `item.roomId/projectId`, domínio; UI Casa/Compras | Edição e navegação cruzada completa em Projeto | Vincular o mesmo item às três perspectivas, editar e conferir ID/totais após sync |
| CA-03 | não implementado | RF-01/02/16 | F007 | `app/domain.js` não tem coleção/comando de alternativas | Alternativas/seleção da referência | Três opções, uma necessidade, apenas estimativa escolhida no projetado |
| CA-04 | implementado sem validação completa | RF-02/03/04 | F008 | Sofá 300000 → 270000, três 90000 em domínio e `tests/continuity.test.mjs`; UI QA | Revisão das datas/forma e aparelho físico | Reproduzir sofá no S23 e verificar todos os valores em browser limpo via Supabase |
| CA-05 | implementado sem validação completa | RF-03/05 | F009 | `tests/domain.test.mjs` testa pagamento/recebimento; continuidade testa 90000 pagos/180000 abertos | Jornada de recebimento integrada na UI/S23 | Pagar primeira parcela, receber pela UI, consultar caixa e aberto em outro perfil |
| CA-06 | não implementado | RF-05/06/08 | F009 | `payment.record` suporta alocações, mas não há cartão/fatura | Cartão/ciclo/composição e pagamento revisável | E04: obrigações 900/150, uma saída 1050; parcial 300; reenvio |
| CA-07 | implementado sem validação completa | RF-07 | F009 | Transferência atômica no snapshot; `tests/domain.test.mjs` testa saldos | Cenário exato R$200 e UI/falha integrado | A1000/B500 → A800/B700, confirmar consolidado 1500 na UI e remoto |
| CA-08 | não implementado | RF-10/11/12 | F011 | Sem reserva/cobertura no domínio | Reserva, cobertura e consumo | E06 com saldo5000/reserva1000/compra800 e fronteiras |
| CA-09 | implementado sem validação completa | RF-01/08/09 | F011/F012 | Projeto 800000 sem obrigações em `tests/domain.test.mjs` | Limite/orçamento/projeção integrados e uso no telefone | Criar viagem8000, concluir tarefa, recuperar sem dívida em outro aparelho |
| CA-10 | parcial | RF-12/13/17 | F008 | Compra admite linhas cuja soma fecha; validação SQL verifica soma | Frete/desconto, consultas e rateios por cômodo | E08: 600+400+50−20=1030; 618/412 sem duplicação |
| CA-11 | não implementado | RF-03/15 | F010 | Sem comandos de ajuste/devolução/reembolso | Histórico e correção financeira | E09: compra paga300, devolução100, caixa só aumenta após reembolso |
| CA-12 | parcial | RF-14/19 | F006/F008/F009/F010/F013 | Testes continuidade: resposta perdida/reenvio/ACK com nova escrita; SQL recibo/conflito | Falhas no Supabase real, correções/fatura/Mercado completo | Resposta perdida e duas revisões em duas sessões reais, mesmo UUID divergente |
| CA-13 | parcial | RF-01/16/18 | F007/F008/F011/F013 | `getSummary` e `getMarketSummary` sinalizam preço ausente | Faltantes localizáveis em todos agregados; planejamento completo | Item/mercado sem preço, listar faltantes e consultar bases temporais |
| CA-14 | parcial | RF-01/14 | F007/F014 | Mapa real estimado, vínculo explícito, Mapa/Lista; `tests/house-map.test.mjs` verifica imagem 404 e cadastro/seleção pela lista | Edição/compra/pagamento integrados no fallback; vínculos locais fora do backup | Percurso completo pela lista e revisão dos vínculos após recuperação no S23 |
| CA-15 | parcial | RF-02/03/04/05/06/07/10/11/13/14/15/19/20 | F006/F010/F015 | JSONv1 restaurado em contexto Chromium limpo, IDs/totais iguais; inválido não altera base | Fatura/reserva/devolução/configurações/anexos ainda ausentes do modelo/pacote | E17 integrado, recuperação real e restauração de exclusão já propagada |
| CA-16 | parcial | RF-14/17 | F008/F009 | `expense.record` permite gasto sem Casa | Categoria/contexto e filtros não implementados | E10: viagem120/passeio80/relacionamento50; geral250 sem soma de recortes |
| CA-17 | implementado sem validação completa | RF-18 | F013 | Domínio verifica subtotal parcial e carrinho sem efeito financeiro | Quantidade/unidade/seção pela UI, telefone real | Arroz sem preço/leite6, ambos no carrinho, conferir conta inalterada |
| CA-18 | parcial | RF-05/14/19 | F008/F009/F013 | Mercado48,90 uma compra/pagamento, reenvio de domínio; UI QA | Formas de pagamento/parcelamento/correção completos | Fechar E11 à vista e em cartão; falhar após confirmação no fornecedor |
| CA-19 | parcial | RF-20 | F013 | `market.reuse` cria novos IDs e mantém histórico | Edição da quantidade/unidade da nova entrada | Reutilizar leite, mudar para2 e conferir aquisição anterior48,90 |
| CA-20 | parcial | RF-03/16 | F004/F012/F013/F014 | PDF visual inspecionado; QA desktop seis áreas | Comparação detalhada lado a lado, densidade e contraste | D1–D5 com dados de teste, documentar diferenças deliberadas |
| CA-21 | parcial | RF-03/16 | F004/F013/F014 | Cinco abas/menu Mercado; QA320–1536 sem overflow | M1–M6 lado a lado e S23/Samsung Internet | Instalar em HTTPS, teclado/toque/foco e retorno em todas áreas |
| CA-22 | parcial | RF-17/18/19 | F004/F012/F013/F014 | `tests/house-map.test.mjs` confirma mapa somente em Casa nas seis áreas | Avaliação cruzada final com projetos de outros assuntos | Compras/Mercado/Finanças/viagem com conteúdo próprio e nenhuma planta |

## Riscos transversais

| Risco | Estado | RF/F associados | Evidência | Lacuna | Próximo teste |
|---|---|---|---|---|---|
| Integridade financeira | parcial | RF-01–RF-20; F002/F008–F013 | Centavos, parcelas/alocações, validação local/SQL e atomicidade | Cartão/reservas/rateio/devolução e fronteiras completas | E01–E18 com UI/persistência, incluindo seguro limite de soma |
| Migrações e retorno seguro | parcial | RF-14; F003/F006/F015/F017 | IndexedDB1→2 conserva IDs/totais; schema domínio1; SQL versionada; Git iniciado | Migração no projeto real e rollback ensaiado | Aplicar em Supabase teste; voltar somente para build compatível IDB2, restaurar cópia se necessário |
| Concorrência e reenvio | parcial | RF-14/19; F006/F008–F010/F013 | UUID/base duráveis, recibos SQL, ACK concorrente, geração local | Concorrência de conexões Postgres hospedadas e mesclagem revisada | Duas contas e dois aparelhos, perda de resposta e troca durante pendência |
| Atualização e shell offline | parcial | F006/F014/F017 | Cachev6 completo; sem skipWaiting; mantém abas existentes; QA offline | Atualização v5→v6 em PWA instalada e recuperação de atualização interrompida | Registrar offline, instalar atualização, verificar fila/IDs antes/depois |
| Privacidade e acesso | parcial | F003/F005/F006/F015 | Chaves privilegiadas rejeitadas, RLS local isola contas, sessão fora do backup | JWT/OTP/SMTP reais, avaliação de proteção local e dispositivo | Outra conta/anon negados no fornecedor; logout/expiração/recuperação real |
| Backup/restauração limpa | parcial | CA-15; F006/F010/F015 | Browser limpo, validação e abortos; cópia pré-restauração; sem sessão no JSON | Modelo completo, configuração/anexos e cópia externa verificada | E17, backup guardado fora do S23, restaurar após exclusão sincronizada |
| Acessibilidade | parcial | F004/F014/F016 | Rótulos/foco inicial e aviso textual; sem overflow nos tamanhos QA | Contraste medido, leitor de tela, foco em modal, teclado real | TalkBack, teclado Samsung, zoom e targets de toque no S23 |
| Uso/instalação no telefone | não implementado | F001/F014/F016/F017 | Usuário identificou Galaxy S23/Samsung Internet nesta sessão | Versões Android/browser, HTTPS e teste físico | Roteiro em `docs/operacao/instalacao-s23.md` |
| Continuidade após perda | parcial | DEC-12; F003/F005/F006/F015/F016 | Browser limpo recupera IDs/totais no protocolo simulado; fila offline confirmada | Supabase/Auth reais, limites de pausa/e-mail e recuperação física | Login B limpo após sync A; repetir offline e comprovar pendência ausente até ACK |
| Quota e armazenamento | parcial | F006/F015 | Falha injetada ao escrever fila aborta snapshot; limite2MB e solicitação persistência | Limite real no Samsung Internet, espaço da fila/cópias e retenção | Aproximar quota, confirmar formulário preservado, exportar e liberar espaço sem perda |

## Cobertura RF e pendências

RF-01/02/03/04/05/07/09/14/16/18/19/20 têm implementação e testes parciais indicados acima; RF-12/13/17 têm estrutura parcial de linhas/vínculos e faltam agregações completas. RF-06/10/11/15 não têm implementação funcional. RF-08 evita hoje saldo inventado, mas cartão/receita prevista ainda não existem para o ensaio completo. Não considerar uma RF aprovada porque o recurso correspondente está ausente.

Próximo bloco crítico: validar 0.3.0 em projeto Supabase de teste e terminar as políticas/modelo A, sobretudo AB-02 (cartão/fatura). Publicação/aceite continuam após A/B/C e F016. F019 permanece em D, F020 fora da V1.
