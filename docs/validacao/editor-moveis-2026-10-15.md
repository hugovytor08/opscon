# Editor local de móveis — 15/10/2026

O usuário aprovou a extração do fogão e pediu colocação editável na planta. Implementada uma aba **Posicionar móveis**, em `docs/design/apartamento-real/editor/dist/moveis.html`, com base PNG v2 e fogão aprovados embutidos. A aba do editor anterior continua disponível, sem mudar sua geometria ou armazenamento.

## Comportamento entregue

- Biblioteca inicial com o fogão real, sem objetos inseridos automaticamente; adicionar, arrastar, redimensionar proporcionalmente, mover por setas/teclado, duplicar, remover e desfazer/refazer até 30 ações.
- Zoom por controles/roda/pinça; arraste do fundo e enquadramento. No telefone, adicionar/aproximar leva a vista ao item.
- PNG/WebP transparentes importáveis para a biblioteca, sem aceitar URLs remotas ou SVG ativo. Nomes são texto, não HTML. Limites de 24 peças/100 instâncias, 4 MB e 4096 px por imagem; limite agregado permite reabrir o próprio projeto.
- Salvamento local em IndexedDB **exclusivo**; download/upload de projeto JSON preservam IDs, posições, escala e recursos importados. O fogão é recurso embutido, referenciado por ID. Arquivo HTML + JSON permitem continuar em outro dispositivo. Erro de gravação não descarta a edição em memória e mantém exportação disponível.
- Exportação PNG de 1265 × 1243 com móveis e recortes, sem controles de seleção. Projeto e imagem têm finalidades distintas.
- Recorte inicial por quatro paredes externas em primeiro plano. O primeiro cálculo por prismas projetados foi rejeitado na revisão visual porque cortava o piso: o raster generativo não coincide numericamente com o guia. Contornos conservadores registrados diretamente no PNG corrigem a borda da cozinha. Modo livre disponível por item. Oclusão de todas as divisórias internas, portas, orientação adicional e calibração física continuam pendentes.

## Evidência

`node --test docs/design/apartamento-real/editor/furniture-core.test.mjs docs/design/apartamento-real/editor/geometry-core.test.mjs`: **11/11 passaram**. Formato/limites/vínculos válidos, rejeição de projetos incompatíveis e recursos remotos, proporção/âncora, registro do piso, recorte e integridade dos oito ambientes originais.

`node docs/design/apartamento-real/editor/qa-furniture.cjs`: **18/18 cenários passaram**. Mouse, alça, setas/teclado, histórico, duplicar/remover, reload offline, JSON ida/volta, rejeição sem substituir projeto válido, importação de PNG com nome especial, recuperação em navegador limpo com imagem incorporada, composição PNG, recorte/ajuste livre, toque/pinça por CDP, 360/390/412 px sem overflow, falha de gravação com exportação e abertura do editor original. Zero erros de página e zero pedidos HTTP/HTTPS. Testes usam perfis temporários isolados, sem armazenamento real do usuário; sentinela de armazenamento alheio preservada.

Capturas/JSON/PNGs em `docs/design/apartamento-real/editor/previews/moveis/`; `qa.json` registra os cenários, layouts e imagem exportada com 21.653 pixels diferentes da base no cenário com objetos. A contagem comprova composição, não fidelidade de câmera ou metragem. Revisão visual das capturas desktop/móvel e do recorte corrigido realizada. Chrome precisou executar fora da restrição de arquivos para downloads temporários; na execução restrita o navegador cancelava downloads inclusive mínimos Blob/data URL. Não foi necessário alterar o mecanismo do produto ou desabilitar proteção do navegador. Uma espera por opção visível e a seleção após teste de pan foram corrigidas no roteiro, sem mudança no produto por esses dois problemas de teste.

O build confere SHA-256 da base aprovada (`8cff27b8892ae51cf679b6aed5fd8648d19420e95eb652224ad6a82456fe579d`) e do fogão (`e626b9b79c86fbdd4b24e9dd8979818351ca9155d4d38908436ac873d1156971`). Originais preservados. Aprovação visual do fogão registrada no manifesto; medidas/cômodo continuam opcionais/nulos. Âncora normalizada aproximada `[0.5, 0.7]` para esta orientação.

## Limites e continuidade

Editor local pronto para o usuário experimentar, sem integração com a aplicação principal, dados, banco remoto, finanças ou listas. Ajustar cômodos no editor anterior não deforma esta imagem de fundo; os projetos são separados. A câmera raster e a classificação de cômodo por piso são aproximadas. Uma vista por peça; não é modelo 3D girável, nem cálculo de espaço físico. S23 físico e oclusão completa continuam pendentes. CAS-01/F014 e CA/gates não foram concluídos por este protótipo. Sem push/deploy/publicação. Outras alterações do app encontradas na pasta de trabalho pertencem ao trabalho paralelo do usuário e não foram modificadas neste bloco.
