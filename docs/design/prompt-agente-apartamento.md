# Prompt — reconstrução visual do apartamento para Casa Serena

Estou enviando vários arquivos: uma foto da planta em papel, fotos da sala, do quarto e de outros ambientes, tiradas em diferentes momentos e ângulos, e alguns vídeos. Os arquivos podem estar misturados, repetidos ou sem identificação clara. Sua primeira tarefa é consolidar esse acervo e entender o apartamento como um conjunto. Depois, produza uma representação visual fiel, com arquivos editáveis. A integração ao aplicativo acontecerá em uma etapa posterior.

## Contexto e escopo

O aplicativo é uma PWA pensada primeiro para smartphone; meu aparelho é um Galaxy S23 e uso Samsung Internet. A direção visual aprovada usa marfim, verde profundo, sálvia, traços simples e materiais discretos. A planta interativa aparece somente em Casa; a alternativa **Mapa/Lista** continua disponível.

Se tiver acesso ao repositório, consulte `AGENTS.md`, `docs/design/fluxos-prototipo.md` (F6), `docs/design/revisao-prototipo-v02.md`, a função de Casa em `app/ui.js` e os requisitos de F014 em `features.json`. Consulte a referência aprovada de Casa no protótipo/guia visual; não use a arquitetura do apartamento ilustrado no protótipo como se fosse a minha.

Seu escopo é análise, geometria e produção dos recursos visuais. Não altere autenticação, sincronização, esquema financeiro, registros existentes, banco ou configuração de deploy. Não crie cômodos automaticamente nos dados do aplicativo. Não publique o material nem faça push. A integração ao app será feita depois, preservando os IDs dos cômodos cadastrados.

## Etapa 1 — receber, organizar e consolidar as evidências

Antes de desenhar, examine todos os arquivos recebidos. Se eu informar que ainda estou enviando anexos em lotes, mantenha o inventário atualizado e deixe a reconstrução final para quando o envio terminar. Não use apenas a primeira foto ou a imagem mais clara como referência para todo o apartamento.

1. Preserve os originais e atribua um identificador a cada arquivo. Monte `inventario.csv` com ID, nome original, tipo, cômodo(s) provável(is), ângulo/ponto de vista, data quando conhecida, fonte da data, confiança da identificação, grupo de duplicatas e observações. Um arquivo pode mostrar mais de um ambiente. Datas ausentes devem ficar desconhecidas; ordem de envio ou nome do arquivo não comprovam cronologia.
2. Compare os arquivos entre si para identificar o mesmo cômodo por janelas, portas, posição das aberturas, piso, paredes e elementos fixos. Mobiliário pode ter mudado entre as fotos. Separe sala e quarto e estabeleça correspondências entre diferentes pontos de vista; mantenha nomes provisórios quando a identificação não for segura.
3. Analise os vídeos como fontes espaciais: registre duração e trechos relevantes, extraia quadros que mostrem novos ângulos, aberturas e transições entre ambientes, e referencie cada quadro pelo vídeo original e pelo tempo (`mm:ss`). Não trate um quadro isolado como prova de todo o vídeo. Se suas ferramentas não permitirem analisar um vídeo, registre a limitação e solicite quadros/uma conversão utilizável; não diga que o assistiu.
4. Crie folhas de contato legíveis das fotos e quadros úteis, agrupadas por cômodo e identificadas pelos IDs. Separe duplicatas sem apagar os originais e retenha vistas complementares. Associe também os percursos dos vídeos aos ambientes da planta para compreender circulação e conexões.
5. Consolide uma ficha por cômodo: evidências associadas, correspondência na planta, acessos, janelas, materiais, elementos fixos, mobiliário observado e lacunas. Registre mudanças entre momentos diferentes, como móveis deslocados, pintura ou reforma. Não combine versões incompatíveis em uma cena como se coexistissem.
6. Determine qual estado do apartamento a representação deve mostrar. Use o estado atual quando confirmado pelas evidências ou por mim. Se não puder distinguir o atual do antigo, faça uma pergunta objetiva antes de finalizar a camada afetada e avance nas partes confirmadas. Distingua explicitamente estrutura permanente, alterações estruturais e mobiliário móvel.

Entregue um resumo curto da consolidação, com os grupos de cômodos identificados, a relação com a planta, as mudanças temporais e as dúvidas que realmente afetam o desenho. Faça as perguntas necessárias em um único bloco. Você deve concluir o trabalho de identificação com as evidências disponíveis; não transfira para mim a tarefa de catalogar todo o acervo. Pergunte apenas sobre ambiguidades que não consegue resolver.

## Etapa 2 — reconstruir a geometria e produzir a representação visual

Use o acervo consolidado da etapa 1 como base, mantendo rastreabilidade entre cada elemento desenhado e suas fontes.

1. Confira a identificação dos ambientes e a cobertura das evidências. Fotos e vídeos do mesmo cômodo devem contribuir para uma única reconstrução coerente, considerando suas diferenças temporais.
2. Transcreva cotas, escala, nomes e símbolos legíveis da planta. Considere perspectiva da fotografia, distorção da lente e dobras do papel. Preserve o original e gere uma versão retificada para consulta, quando possível, indicando os pontos usados na correção.
3. Reconstrua perímetro, divisórias, circulação, portas (incluindo sentido de abertura quando visível), janelas, varanda, pilares e elementos fixos observáveis. Use a planta como referência principal da geometria e as fotos para conferir a situação atual. Registre divergências em vez de escolher silenciosamente uma versão.
4. Separe explicitamente: **confirmado por medida**, **observado sem medida**, **estimado** e **não identificado**. Foto não comprova dimensão exata. Se faltar escala/cotas confiáveis, peça ao menos uma medida de referência; não converta estimativas em metros nem prometa precisão ou encaixe de móveis.
5. Identifique materiais, cores e móveis visíveis nas fotos. Separe estrutura fixa de mobiliário atual. Não invente peças, decoração ou aberturas em partes não fotografadas. O mobiliário atual é apenas contexto visual; não representa automaticamente itens cadastrados, compras ou estados financeiros.

Enquanto espera esclarecimentos, avance nas partes confirmadas e documente as lacunas. Produza uma primeira planta 2D para conferência antes de finalizar a isometria; erros de estrutura devem ser resolvidos nessa etapa. Depois entregue a representação visual efetiva e suas prévias; o resultado não deve se limitar ao inventário ou a uma descrição textual.

## Recursos a produzir

Entregue em `docs/design/apartamento-real/` (ou em uma pasta equivalente se não tiver acesso ao repositório):

- **`inventario.csv`**, **`fichas-comodos.md`** e **`evidencias/`**: catálogo completo, consolidação por ambiente e folhas de contato/quadros de vídeo identificados. Preserve referências aos arquivos originais e aos tempos dos vídeos.
- **`analise.md`**: associação de fotos e vídeos, medidas e fontes, cronologia conhecida, estado representado, divergências, hipóteses e perguntas pendentes. Referencie arquivo e região da imagem ou tempo do vídeo que sustentam cada decisão relevante.
- **`planta-2d.svg`**: planta superior vetorial, com nomes/IDs estáveis dos ambientes, aberturas e cotas confirmadas. Indique medidas estimadas de forma distinta. Inclua legenda e mantenha a orientação consistente com a fonte; não invente norte geográfico.
- **`geometria.json`**: modelo da geometria em coordenadas 2D, com unidade/escala explícitas, origem e eixos, polígonos dos cômodos, paredes e aberturas. Use coordenadas relativas quando a escala for desconhecida. Inclua confiança e referência da evidência nas medidas e elementos. Defina IDs visuais estáveis; o vínculo com IDs reais do app será uma etapa posterior.
- **`casa-isometrica.svg`**: representação principal, com proporções derivadas da mesma geometria 2D, teto removido e paredes com corte para não esconder os ambientes. Evite qualquer alteração do layout só para deixá-lo mais bonito. Separe grupos de estrutura, ambientes e mobiliário contextual; identifique os ambientes por IDs. Não incorpore nomes/valores financeiros.
- **`areas-interativas.json`**: polígonos das regiões selecionáveis e posições sugeridas dos rótulos na projeção isométrica, no mesmo sistema de coordenadas/viewBox do SVG. Isso permitirá selecionar um cômodo e destacar sua região no aplicativo sem depender de pixels de uma imagem.
- **`previews/`**: imagens de conferência da planta 2D e da isometria, incluindo visualização em largura de 360–412 px e uma visualização ampla. As capturas não precisam simular todo o aplicativo.
- **`integracao.md`**: arquivos finais, sistemas de coordenadas, relação entre IDs, como destacar um cômodo, limitações e pendências. Liste o que permanece provisório até confirmação do usuário.

Produza vistas adicionais por cômodo somente se ajudarem a resolver uma ambiguidade ou se a visão geral não conseguir mostrar um detalhe relevante. Não crie uma coleção de imagens decorativas sem função no app.

## Critérios de qualidade

A entrega desta tarefa termina com o acervo consolidado, a planta 2D, a representação visual e os arquivos de apoio prontos para revisão. O documento de integração prepara a próxima etapa; não execute alterações no aplicativo agora.

Prefira SVG e geometria editável para o mapa. Não entregue apenas uma imagem achatada. SVGs devem ser autocontidos, sem scripts ou recursos externos, com `viewBox`, grupos identificados e possibilidade de alterar o destaque de um ambiente por CSS. Rótulos devem poder ser renderizados pela interface separadamente. Forneça nomes acessíveis e evite seleções que dependam apenas de cor.

Avalie orientação, paredes que escondem cômodos, contraste e legibilidade no celular. Para ambientes pequenos, proponha seleção equivalente pela lista e zoom quando necessário, sem deformar a planta para aumentar a área de toque. Não desenhe textos, botões ou cartões do app dentro da ilustração.

Se usar geração de imagem, limite-a a ilustrações ou materiais complementares: ela não serve como prova da geometria ou das medidas. O mapa e suas áreas interativas devem vir da reconstrução verificável das fontes. Preserve a diferença entre fidelidade visual e precisão dimensional.

Economize tokens: evite narrar cada ferramenta, não crie outros agentes e faça uma entrega consolidada com evidências, arquivos e pendências. Ao terminar, diga o que foi confirmado, o que continua estimado e quais conferências faltam. Não declare uma representação “exata” enquanto medidas relevantes ou discrepâncias estiverem em aberto.
