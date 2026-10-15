# Incremento 0.3.2 — estrutura visual e conferência de rascunhos

Atualização posterior: no ajuste 0.3.3, o usuário escolheu `ref-casa.png` como referência de acabamento, com móveis ocultáveis, e pediu retirar a imagem antiga do Início. Ver `incremento-0.3.3.md`; a decisão pendente relatada abaixo foi respondida.

14/10/2026. Entrega local em blocos pequenos, preservando as alterações já presentes no workspace. A reformulação completa continua em andamento; nenhum gate, CA ou feature foi concluído por este incremento.

## Funcionando

- Sistema escuro aplicado às seis áreas, com componentes, tipografia de sistema offline, cards e navegação compacta. Início recomposto com densidades diferentes e dados reais; Mercado e Projetos recebem destaques próprios. Detalhe de item não exibe um sofá genérico como se fosse o produto cadastrado.
- Compra/despesa e recebimento acessíveis no Início. Conta não é presumida: a despesa sem conta fica a pagar; com conta registra compra e pagamento vinculados; recebimento exige escolher conta. Resultado e pendência aparecem após gravação. Mantidas as semânticas do domínio existente: compra ≠ pagamento, transferência ≠ receita/despesa.
- Foco contido nos diálogos, conteúdo de fundo inerte, Escape e retorno ao acionador. Feedback de uma operação anterior é limpo ao iniciar outro diálogo. Navegação, detalhes e confirmação têm movimentos curtos e redução de movimento.
- **Novo → Conferir JSON de documentos**, também acessível no Mercado vazio: colar/abrir rascunho v1, validar e mostrar documentos, datas separadas, totais/descontos, produtos/embalagens, fontes/evidências e pendências. Erro de entrada conserva o formulário. Textos hostis são escapados e não executados.
- Validação de todos os campos/regras do contrato distribuído, datas reais, centavos inteiros seguros, decimais em string, IDs locais únicos, campos proibidos, profundidade e limites 512 KiB/20 documentos/500 linhas globais. Divergências de soma são pendências. Conta a vencer ou comprovante agendado não prova pagamento. Valores `null` aparecem como desconhecidos.
- **A conferência não confirma nem persiste o lote.** Não existe promessa de deduplicação, conciliação, correção ou recuperação de importações ainda não implementadas. O usuário pode voltar ao JSON; edição por linha/em lote é próxima entrega.

## Geometria e comparação

Fontes, papéis e comparação com o vídeo: `docs/design/reformulacao-2026-10-14.md`. JSON/SVG/2D novos preservados sem alteração em `docs/design/apartamento-real/revisao-2026-10-14/`, com hashes e validação geométrica. A isometria fornecida corresponde exatamente à exportação do JSON com móveis contextuais ocultos. O modelo tem UR, oito ambientes, 18 paredes e 14 aberturas; metros não verificados.

O mapa integrado continua sendo o recurso anterior aproximado. A substituição definitiva aguarda a escolha entre a imagem histórica `app/assets/ref-casa.png` e o mapa integrado como fonte de acabamento. Não foi confundida qualidade gráfica com prova geométrica. Pinch/pan/recentralização, listas por cômodo e recuperação dos vínculos permanecem no backlog.

## Evidências

Regressão atual: `npm.cmd test` — **43/43 aprovados**, incluindo a base financeira, Auth simulado, IndexedDB real, resposta perdida, offline, quota, recuperação em browser limpo, SQL/RLS em PGlite e mapa/fallback. O cenário novo valida seis áreas em 320/360/390/412/1200 px, sem overflow e controles verificados de 44 px; foco; receita; despesa paga/pendente; prévia com 20 linhas; arquivo de três documentos; JSON hostil sem execução; nenhuma alteração de domínio/geração/fila ao conferir; shell e conferência após reload offline. Evidência em `evidencias/reformulacao-0.3.2/qa.json` e PNGs. Capturas anteriores do mapa ficam preservadas em seu diretório original.

`npm.cmd run check` verifica todos os módulos; `git diff --check` verifica integridade textual. A primeira tentativa de testes no sandbox falhou somente nos dois acessos Chromium a localhost (`ERR_NETWORK_ACCESS_DENIED`); a base repetida com rede local liberada passou em 37/37 antes das mudanças. Correções durante a nova QA incluíram alvos da busca/setas de mês, marca com pouco contraste e largura da busca desktop. Limitação de arredondamento subpixel do Chromium é tratada a 0,001 px nas asserções.

Um ensaio concorrente também encontrou uma janela entre ativação do service worker e controle da página de callback. O teste agora estabelece explicitamente um reload controlado antes de desligar a rede; o cenário isolado e a regressão completa passaram com o mesmo critério de recuperação. No endurecimento final do parser, os cinco testes de rascunho foram repetidos incluindo IDs/decimais com quebra de linha final; esses formatos não canônicos são rejeitados.

Dados de teste são sintéticos e isolados por servidor/contexto de navegador. Nenhuma limpeza da base pessoal, credencial em fixture ou escrita no Supabase real. Esses testes não comprovam login real hospedado, TalkBack ou instalação/uso físico no Galaxy S23/Samsung Internet. Contraste completo continua pendente; o contraste da marca desktop é medido no navegador.

## Versão, deploy de teste e próximo bloco

Versão 0.3.2, shell v10; IndexedDB 2, schema de domínio 1 e protocolo remoto 1 preservados. Novos módulos/CSS do conferidor estão no cache offline. Sem `skipWaiting`; fechar janelas antigas e reabrir conectado para receber atualização, sem limpar armazenamento.

Não é necessário SQL novo neste bloco: nenhum registro/coleção financeira foi adicionado. Não reaplicar `202610110001_continuity.sql`. A futura confirmação de lotes exige migração aditiva e validação equivalente no servidor.

A simulação da ferramenta de push passou na branch `main`, usando o remoto já configurado, sem commit/alteração de remoto/rede/push. `npm run map:audit-reference` confirmou hashes e igualdade exata entre JSON e SVG com móveis contextuais ocultos.

Para revisar localmente: `node scripts/serve.mjs --port=8767`, abrir `http://127.0.0.1:8767/`. Para enviar ao repositório escolhido, usar os comandos de `README.md`, primeiro `npm run github:push -- URL_DO_REPOSITORIO --dry-run`, revisar e então executar sem `--dry-run`. O Vercel continua servindo apenas `app` conforme `vercel.json`; preparar o deploy de teste pela conta do usuário e autorizar sua URL de retorno no Supabase conforme o README. Nenhum push, deploy ou publicação final executado nesta sessão.

Próximo bloco crítico: domínio detalhado de aquisições/produtos/estabelecimentos e correção auditável, migração cliente/servidor e testes; depois revisão editável, conciliação e confirmação atômica. Não habilitar gravação de lote antes de IMP-03/04/06/07. Backlog explícito em `docs/produto/backlog-reformulacao.json`.
