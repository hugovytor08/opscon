# Editor da planta — formato e proporções

12/10/2026, data local do usuário. Pedido: permitir edição manual, com prioridade explícita para formato/tamanho dos cômodos. Bloco entregue: editor local independente, sem alterar a integração 0.3.1 ou os dados do Casa Serena.

`docs/design/apartamento-real/editor/dist/index.html` é autocontido e funciona por arquivo local. Seleção dos oito ambientes, arraste de paredes/cantos, largura/profundidade em porcentagens da planta inicial, nome visual, isometria imediata, zoom/deslocamento, desfazer/refazer e restauração reversível. Móveis são camada opcional. Alinhamentos compartilhados acompanham o ajuste; limites preservam topologia. Esta versão modifica a malha existente, sem criar novos recuos/ambientes.

Rascunho local com namespace separado e até 30 passos de histórico; mensagem persistente em falha de armazenamento, com exportação conservando trabalho em memória. Baixar/Abrir projeto em JSON; exportações SVG 2D/isométrico e regiões JSON. Importação valida oito IDs, coordenadas, perímetro sem lacunas/sobreposições, paredes, vãos, elementos contidos e projeção. Arquivo inválido conserva o projeto aberto. Metadados mantêm escala relativa e vínculo `appRoomId:null`; áreas do papel não viram áreas medidas da edição.

Validação:

- `geometry-core.test.mjs`: **5/5 passaram**, com dimensões esperadas, compartilhamento de paredes, limites, preservação da fonte/IDs, sequência de cantos, importações quebradas e SVG autocontido/nomes escapados.
- `qa.cjs`: **12 cenários passaram**; campo e arraste reais, toque simulado em 390 px, undo/redo, recarga, exportação/reabertura, importação inválida, reset reversível, zoom/deslocamento sem mudar geometria, quota com exportação ainda disponível e HTML offline com recarga.
- Larguras **360/390/412/1400 px**, sem overflow ou IDs duplicados. Prévias inicial e editada foram inspecionadas; controles móveis compactados e opções secundárias recolhíveis. Evidência em `editor/previews/qa.json` e PNGs.
- Servidor apenas em 127.0.0.1:8869; resposta HTTP200 comprovada e abertura solicitada no painel. HTML não solicita serviços externos.

Não foram sobrescritos geometria/SVGs originais, recursos já integrados, código executável do app, banco, credenciais, sincronização ou registros financeiros. Não foi feito push/deploy/publicação. Testes financeiros da V1 não foram repetidos porque esse código não mudou. Alterações anteriores presentes no workspace foram preservadas.

Próximo: o usuário editar/baixar o projeto; revisar o JSON e conferir dimensões/layout antes de regenerar e aplicar ao mapa integrado. Smartphone físico e medidas confiáveis continuam pendentes. F014 permanece em andamento; nenhum CA ou gate completo por este bloco.
