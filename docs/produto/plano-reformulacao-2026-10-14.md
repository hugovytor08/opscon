# Plano de implementação — visual Samsung, apartamento e importação

14/10/2026. Documento de execução solicitado pelo usuário. Este bloco prepara o trabalho de outro agente; não implementa alterações no app. O escopo visual anterior é atualizado pelas decisões desta conversa. Requisitos funcionais e dados existentes permanecem válidos, acrescidos da importação descrita aqui.

## Resultado esperado

Uma PWA de controle pessoal com acabamento e organização inspirados no Samsung Health mostrado no vídeo: cards arredondados, fundo escuro com profundidade, tipografia hierarquizada, números legíveis, ícones/gráficos cuidados, navegação consistente e animações curtas. As seis áreas continuam Início, Casa, Compras, Mercado, Finanças e Projetos, com conteúdos próprios. Funcionalidades e gráficos precisam responder ao uso real; não adicionar funções de saúde, desafios ou indicadores só para preencher uma composição da referência.

Casa terá o apartamento com a geometria do novo JSON fornecido pelo usuário e o padrão de acabamento do desenho que ele aprovou no aplicativo. Selecionar um cômodo abre seus itens em **Quero comprar** e **Já comprei**. Uma imagem isométrica pode sustentar zoom contínuo e arraste fluido; rotação real/3D navegável não faz parte deste pedido.

Importação: **imagens → ChatGPT/GPT de extração → JSON → colar ou abrir no app → revisar → confirmar → registros, pagamentos vinculados e histórico de preços**. A entrada manual rápida continua existindo.

## Fontes e ponto de partida

- Repositório `C:\opscon`, incremento 0.3.1, shell v9, IndexedDB 2, schema de domínio 1 e protocolo remoto 1. Confirmar o estado ao começar; há alterações locais de outras sessões que devem ser preservadas.
- Vídeo: `C:\Users\hugov\Downloads\WhatsApp Video 2026-10-14 at 21.49.58.mp4`, aproximadamente 135 s. Quadros de consulta desta conversa em `tmp/samsung-health-reference/`, se disponíveis. Analisar o original, inclusive transições; quadros isolados não comprovam timing de animação.
- Referências do apartamento já existentes em `docs/design/apartamento-real/`, integração em `app/assets/apartamento-real/`, regiões em `app/house-map-data.js` e editor independente em `docs/design/apartamento-real/editor/`.
- O usuário enviará **novo JSON da planta e nova isometria**. Esses arquivos ainda precisam ser identificados explicitamente pelo executor. Não confundir o `geometria.json` relativo atual ou a planta inicial do editor com a nova entrega final.
- O JSON exportado pelo editor pode ser o próprio modelo geométrico, e a isometria pode ser SVG ou imagem raster. Inspecionar os arquivos recebidos e documentar seu formato; não pressupor extensão ou estrutura.
- `docs/validacao/incremento-0.3.1.md` registra 37 testes anteriores aprovados, não uma execução nesta sessão nem aceite da V1. Consultar também o relatório do editor, a matriz CA e os fluxos financeiros relevantes.

## Ordem de implementação e entregas verificáveis

| Bloco | Implementação | Critério para avançar |
|---|---|---|
| 1. Referências e proposta | Auditar anexos e estado do código; documentar linguagem visual, tokens e navegação. Produzir prévias de Início, Casa e importação com estados vazios e dados sintéticos isolados. | Correspondência demonstrável com o vídeo, sem novos recursos funcionais decorativos; fontes da geometria identificadas. |
| 2. Estrutura visual | Aplicar tokens, componentes de cards/botões/formulários, navegação, feedback de gravação e transições às seis áreas. Preservar ações existentes e preferências essenciais. | Fluxos atuais funcionam no tema novo; alvos de toque, foco, contraste e redução de movimento verificados. |
| 3. Casa | Aplicar o JSON e a isometria do usuário, elevar acabamento ao padrão da imagem aprovada, recalcular regiões, implementar pinch/zoom/arraste e detalhe por cômodo com duas listas. | Geometria não deformada para melhorar aparência; imagem/regiões alinhadas no zoom; mesmos IDs, itens e valores; Mapa/Lista e fallback funcionam. |
| 4. Contrato e domínio da importação | Fixar contrato de rascunho v1, validação, revisão, relações entre documentos, preço por item, cadastro de estabelecimentos/produtos e migrações aditivas. | Casos de compra, Pix, conta e receita distinguidos; nota+pagamento não duplicam despesa; restauração e servidor entendem os dados novos. |
| 5. Importador e histórico | Implementar colar JSON/abrir arquivo, prévia editável, conciliação com existentes, deduplicação, confirmação atômica e histórico/comparação de preços. Entrada manual usa a mesma estrutura. | Lote de 20 itens é importado sem cadastrar item a item; reenvio e falhas não duplicam registros; comparações usam unidades compatíveis. |
| 6. Validação e entrega | Executar regressões, testar backup/sync/offline/conflito, produzir capturas e instruções de deploy de teste no Vercel/Supabase. | Evidências reproduzíveis e pendências explícitas. Teste físico S23 e revisão do desenho com o usuário continuam necessários antes de aceite final. |

Executar em incrementos pequenos e completos. O agente deve implementar, testar e documentar, sem encerrar com outro plano. Dúvidas que afetem somente um bloco não impedem trabalho independente nos demais. Anexos indispensáveis ausentes impedem apenas a substituição final da planta; não inventar seus dados.

## Diretrizes visuais e de interação

- Identidade visual próxima da referência Samsung: cards com diferentes densidades, informação principal evidente, agrupamentos e acentos cromáticos por contexto. Evitar uma simples recoloração da interface atual.
- O vídeo mostra apresentação escura, cards sóbrios, destaques saturados e navegação compacta. Extrair proporções/tokens da referência; manter cores de sucesso, alerta e seleção distinguíveis além da cor.
- Fonte de qualidade com licença disponível, preferencialmente sistema Android ou arquivo local licenciado. Não depender de fonte proprietária indisponível ou de rede para o shell offline.
- Preservar acesso às seis áreas. Priorizar a navegação móvel existente de cinco destinos com Mercado acessível por menu/atalho; reorganizações devem demonstrar ganho de acesso e não esconder funções.
- Ações rápidas: despesa/compra pequena e receita com campos essenciais, seleções de conta explícitas e resultado imediato após gravação local. Não presumir pagamento, conta, renda, saldo ou valor desconhecido.
- Transições curtas entre seções, expansão de detalhe e feedback de ação, respeitando `prefers-reduced-motion`. Gestos no mapa não devem impedir rolagem normal fora dele.
- Layout e interações em 360/390/412 px, verificação de 320 px e desktop; teclado Samsung, áreas seguras e barra inferior não podem encobrir conteúdo.

## Apartamento: geometria e acabamento têm fontes distintas

O novo JSON define layout, proporções, paredes, aberturas, ambientes, unidades e medidas que efetivamente contiver. A isometria nova é a referência da disposição; a representação aprovada no app é o padrão de qualidade de materiais, volumes, iluminação, sombras, linhas, paleta e nível de detalhe. Identificar a imagem aprovada entre o mapa integrado e a referência histórica; se houver ambiguidade relevante, perguntar qual delas, sem substituir silenciosamente o alvo.

Exigência do usuário: **manter o mesmo padrão de qualidade gráfica do exemplo aprovado, com a geometria do apartamento dele**. Fazer comparação lado a lado; não entregar uma planta com acabamento inferior só porque os polígonos estão corretos. Fidelidade estética será conferida visualmente, não pode ser declarada por um teste de sintaxe.

Preservar coordenadas/unidades do novo modelo. Se contiver apenas unidades relativas/ajustes percentuais, respeitar exatamente a forma fornecida e marcar a escala física como não verificada. Não converter os 53,05 m² documentais ou a janela aproximada de 1,60 m do acervo anterior em uma calibração inventada. Conflitos JSON/isometria exigem reconciliação explícita antes de publicar o desenho definitivo.

Preferir SVG multicamada/recursos vetoriais ou render de alta resolução com camada de seleção derivada da geometria. Raster não deve ser esticado a ponto de perder nitidez; uma imagem gerada não valida posições/medidas. Se o executor usar geração de imagens, usar as habilidades/ferramentas adequadas e conferir o resultado contra a geometria. Rótulos e ações continuam em HTML/SVG acessível.

Zoom por pinça, roda e botões; arraste com um dedo/pointer na região do mapa; ação de recentralizar. Distinguir tap de arraste para não abrir cômodo ao movimentar; um pinch não pode acionar uma compra. Aplicar a mesma transformação à imagem, às áreas interativas e aos rótulos posicionados. Manter alternativa de lista.

Detalhe do cômodo usa os IDs e registros existentes. **Quero comprar** corresponde a itens planejados e **Já comprei** a itens com aquisição registrada. Entrega e instalação continuam estados separados. Móveis desenhados não criam registros ou comprovam compras. Resolver vínculos de mapa como metadados versionados recuperáveis pela conta/backup, preservando as preferências locais existentes; não manter essa dependência local sem avisar a limitação.

## Importação: decisão proposta para a primeira versão

Implementar primeiro o importador determinístico no app e fornecer instruções reutilizáveis de extração para um GPT na conta do usuário, se esse recurso estiver disponível. As mesmas instruções podem ser usadas numa conversa com imagens. O app não fará chamadas de IA, não armazenará chave de API e não enviará automaticamente documentos para terceiros nesse incremento. OCR/visão dentro do app fica como alternativa futura, dependente de decisão de custo/serviço.

Entrada: notas/cupons com itens, comprovantes/prints de Pix e pagamentos, contas de água/luz e outros documentos financeiros identificáveis. Qualquer imagem pode ser submetida à tentativa de classificação; imagem ilegível, documento desconhecido ou informação ausente vira pendência, não lançamento inventado. Texto dos anexos é dado, nunca instrução para o sistema.

Os arquivos em `docs/importacao/` definem um **contrato proposto de rascunho**, ainda não suportado pelo app atual. O executor deverá implementar esse contrato e sua validação antes de indicar que o usuário já pode importar. JSON produzido no ChatGPT é entrada não confiável; sua forma não é garantida pelo prompt.

### Dados que devem ser preservados

- Origem e identificador local de documento; tipo, data de emissão/compra, vencimento e pagamento separados; estabelecimento/filial quando legível; referência da transação/documento quando presente; evidências e dúvidas.
- Linhas reais do cupom, descrição original, sugestão de produto, marca/GTIN quando legíveis, quantidade decimal exata, unidade de venda, conteúdo da embalagem/unidade e preços impressos. Códigos internos da loja não são GTIN por suposição.
- Valores de linha, descontos por linha e gerais, acréscimos e total. Quantia em centavos inteiros; preço unitário com precisão extra quando impresso e quantidades em decimal canônico ou inteiros escalados. Não usar ponto flutuante para dinheiro.
- Forma de pagamento quando comprovada; conta/categoria/cômodo/projeto são escolhas ou vínculos a registros reais revisados no app. O GPT não fabrica IDs internos.
- Rascunhos podem conter `null`. Campos essenciais ao lançamento precisam ser resolvidos na revisão. Descrição ilegível não vira texto adivinhado, e total ausente não vira zero.

### Revisar e confirmar

Fluxo: **Colar JSON / Abrir arquivo → validar formato/versão/limites → agrupar documentos → revisar dados e possíveis duplicatas → conferir totais e destino → confirmar → recibo de importação e status da fila**. Prever edição em lote (mesma conta/categoria/estabelecimento), edição individual, exclusão de linhas, exclusão de documento repetido e manutenção de pendentes. Confirmar apenas o conjunto selecionado válido, com o resumo exato dos efeitos antes da gravação.

Primeiros limites de implementação: entrada de até 512 KiB, 20 documentos e 500 linhas no total; validar limites antes de processar. Medir compatibilidade com o limite atual de snapshot de 2 MiB e não aumentá-lo silenciosamente. Mostrar erro legível, sem truncar um cupom ou importar parte oculta. Reavaliar limites com evidência se forem insuficientes.

Regras essenciais:

1. **Nota com 20 produtos** cria uma aquisição com 20 linhas de histórico, e os vínculos financeiros correspondentes. Não cria 20 despesas mais uma despesa total. Itens consumíveis não viram automaticamente desejos/móveis de Casa.
2. **Pix + nota da mesma compra**: conciliar como pagamento da aquisição, inclusive aquisição já existente. O Pix pode ser entrada, saída ou transferência própria; direção exige revisão. Sem nota, pode comprovar uma movimentação, mas não autoriza inventar produtos.
3. **Conta de água/luz** sem quitação comprovada cria obrigação a vencer/pendente; só a evidência revisada de pagamento, com conta identificada, registra baixa. Comprovante agendado/falhou/cancelado não representa pagamento executado.
4. **Recebimento** confirmado entra como receita na conta escolhida; transferência entre contas próprias conserva a distinção de receita/despesa. Parcelamento/fatura continua separado da aquisição.
5. **Somatórios**: conferir bruto, descontos, acréscimos e total. Valores ilegíveis ou divergentes pedem correção. Preservar o total e descontos reais; rateio de desconto geral é calculado/documentado pelo app, com arredondamento em centavos e soma exata. Frete/juros não alteram silenciosamente o preço de produto; mostrar a política de comparação.
6. **Duplicatas**: usar identificadores documentais quando disponíveis e impressão digital canônica do conteúdo revisado. Hash/UUID gerados pelo app, não pelo GPT. Foto repetida, recorte diferente, ordem diferente e novo batchId não devem burlar a checagem. Chaves fiscais/IDs Pix repetidos com dados divergentes pedem revisão; documentos apenas parecidos não são excluídos automaticamente.
7. **Confirmação atômica**: gravar registros, proveniência/recibos e fila juntos no IndexedDB. Falha de quota/validação não deixa parte do conjunto confirmada. Reenvio após falha/reload usa identidade persistente; servidor também garante unicidade/consistência, não só a interface. Conflito entre aparelhos segue a política conservadora existente.
8. **Correção**: prévia é editável. Após confirmar, correção/cancelamento deve atualizar ou estornar os efeitos vinculados com auditoria, inclusive histórico de preços, sem recriar despesas ou apagar pagamentos independentes. Antes de permitir confirmação financeira, entregar ao menos esse percurso necessário da importação.

### Histórico e comparação de preços

Importar dados deve produzir a consulta que motivou a funcionalidade: histórico de um produto por data/estabelecimento, último preço, menor/maior observado e comparação equivalente. Dizer **menor/maior entre os seus registros**, com período, amostra e produto, sem afirmar menor preço atual do mercado.

Cadastro canônico de produto com aliases revisáveis; marca, variante e embalagem preservadas. Sugerir correspondências, sem juntar automaticamente produtos diferentes. Estabelecimentos/filiais também têm correspondências revisáveis. Identificadores originais e descrições permanecem rastreáveis.

Exemplo: duas unidades de óleo de 900 ml por R$ 8,50 cada representam R$ 17,00 e 1,8 L. Comparar R$/L com óleo de 1 L, mantendo preço por embalagem e variante/marca visíveis. Item por peso usa kg/g; unidade sem conteúdo conhecido não é comparável por litro/kg. Conversões determinísticas e arredondamento só na exibição. Descontos/reembolsos e correções entram de forma rastreável. Não sugerir compra em uma loja com base em dado antigo sem mostrar a data.

Entrada manual de um pão ou suco usa a mesma estrutura/histórico, com fluxo curto e campos opcionais progressivos. Captura rápida não pode virar formulário obrigatório de 20 campos.

## Persistência, migrações e entrega

O domínio atual não armazena histórico detalhado de preço/loja/unidade: `market.close` cria uma linha agregada do total, e `market.addItem` usa quantidade inteira/estimativa. Será necessária evolução real do modelo, não apenas colar um textarea e gravar JSON fora da sincronização.

Projetar migração aditiva versionada no cliente e no Supabase, validação equivalente, backup/restauração e compatibilidade durante atualização de shell. Não editar/reaplicar a migração já instalada `202610110001_continuity.sql`; criar uma nova quando necessário. Preservar IDs, compras, obrigações, pagamentos e totais existentes. Importação não é restauração de backup e não substitui o estado atual inteiro.

Preservar RF-01–RF-20/CA-01–CA-22/F001–F020. Acrescentar requisitos/testes identificados `IMP-01…` para esta expansão; atualizar backlog sem reutilizar F020, que continua fora da V1. Registrar a mudança de escopo da versão em vez de declarar que já estava implementada. Não marcar gates completos só por testes unitários.

Se uma configuração/migração no Supabase real for necessária, entregar ao usuário SQL e passos curtos; não automatizar seu dashboard. Sem plano pago/serviço externo novo ou publicação final por inferência. Entregar código revisável, testes, imagens e comando de push/deploy de teste; a preparação local não equivale a aceite final.

## Verificações obrigatórias

Rastreabilidade desta expansão (requisitos novos; nenhum está implementado por este documento):

| ID | Requisito | Evidência mínima de aceite |
|---|---|---|
| IMP-01 | Receber JSON versionado por colagem/arquivo e validar rascunho | Formato/versão/limites/valores inválidos não alteram a base |
| IMP-02 | Revisar e editar lote e resolver campos essenciais | Nota de 20 itens revisada e confirmada em um fluxo; pendências ficam explícitas |
| IMP-03 | Conciliar documentos e detectar duplicatas | Nota+Pix em lotes distintos e reextração não duplicam aquisição/pagamento |
| IMP-04 | Confirmar com atomicidade e reenvio seguro | Quota/falha no último item/reload/ACK perdido preservam integridade e identidade |
| IMP-05 | Guardar e comparar preços equivalentes por produto/loja/data | 900 ml versus 1 L, peso fracionário, descontos e variantes tratados corretamente |
| IMP-06 | Recuperar dados importados pela conta e por backup | Migração, RLS, offline→servidor→aparelho limpo e backup antigo/novo verificados |
| IMP-07 | Corrigir/cancelar importação sem duplicar ou apagar efeitos independentes | Compra/pagamento/histórico conservam seus vínculos e auditoria |

- Seis áreas, tema novo e ações rápidas; estados vazio, carregando, erro, pendente, sincronizado e conflito; contraste, teclado, foco, toque, TalkBack a verificar no aparelho e movimento reduzido.
- Geometria do novo arquivo preservada; comparativo do acabamento; seleção correta antes/depois de pinch/arraste; tap separado de gesto; revisão de vínculos; compra registrada migra a visualização do mesmo item entre as duas listas do cômodo; lista funcional sem mapa.
- Cupom de 20 itens, duas imagens do mesmo cupom, duas compras distintas da mesma loja no mesmo dia, nota+Pix no mesmo lote e em lotes separados, conciliação com compra existente, Pix recebido, transferência própria, conta não paga, quitação parcial e agendamento.
- Quantidade fracionária/peso, embalagem 900 ml versus 1 L, descontos mistos, divergência de soma, dados ilegíveis, moeda não BRL, JSON inválido/versão desconhecida/tamanho excedido, conteúdo hostil e duplicatas com novos IDs.
- Erro no último item sem efeito parcial, falta de quota, reenvio após resposta perdida, offline/reload, mudança de aparelho, conflitos, correção/estorno e manutenção dos preços históricos.
- Upgrade de dados reais antigos em fixture isolada, migração SQL e RLS, backup antigo/novo e restauração limpa; nunca usar os dados pessoais do usuário como massa de teste ou apagar sua base para testar.

## Decisão sobre o GPT e referências

A separação proposta mantém o reconhecimento de imagem fora do app e permite importar/revisar offline depois de obter o JSON. Não garante acerto de todas as imagens: texto pequeno, rotação e erros de interpretação são limitações documentadas da visão. O validador e a revisão continuam necessários. A disponibilidade de criar um GPT personalizado deve ser conferida na conta do usuário; este plano não cria GPT, não contrata API e não promete limites de uso.

Referências oficiais consultadas em 14/10/2026: [entradas de imagem](https://learn.chatgpt.com/docs/image-inputs) e [visão e suas limitações](https://developers.openai.com/api/docs/guides/images-vision). Instruções reutilizáveis em `docs/importacao/instrucoes-gpt-extrator.md`; contrato proposto em `docs/importacao/contrato-importacao.schema.json`.
