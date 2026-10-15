# Primeiro item: fogão Suggar

15/10/2026. Duas fotos enviadas pelo usuário, frontal e superior. Peça para revisão: **fogao-frente-direita-v2.png**, PNG RGBA de 1170 × 1344 px, com fundo transparente e vista elevada da frente/lateral direita. Gerado com ImageGen integrado; prompt final em `prompt-v2.txt`. Dimensões e cômodo não foram exigidos nem inventados.

Preservados: quatro bocas, cinco comandos no tampo horizontal, acabamento preto, porta de forno com vidro, puxador prateado e pés curtos. A lateral não fotografada foi inferida de forma conservadora. O desenho visa combinar com a planta vazia aprovada; a câmera é aproximada, não uma calibração geométrica comprovada.

`fontes/` preserva os dois anexos originais; `item.json` registra hashes, alfa, revisão e pendências. `validar.cjs` confere formato, transparência, margens e integridade das fotos. A transparência original foi mantida: exterior majoritariamente em alfa 0, resíduos de até 1/255 na borda, corpo predominantemente em 252–253/255. Sem recorte ou alteração manual do PNG gerado.

V1 preservada como histórico; V2 eleva a câmera usando `guia-camera.svg/png`. O guia é somente um bloco geométrico de pose, com proporções ilustrativas, sem medidas físicas. A peça é raster e não contém malha 3D. Uma orientação disponível; outras orientações, âncora no piso, encaixe com a planta, escala e oclusão ainda serão preparados na etapa do editor. Não há importação/arraste novo implementado neste bloco.

Atualização posterior em 15/10: usuário aprovou a extração. A peça agora integra o editor LOCAL `../../editor/dist/moveis.html`, com arraste, escala e recorte externo inicial; âncora aproximada `[0.5, 0.7]` no manifesto. Ver `docs/validacao/editor-moveis-2026-10-15.md`. Não foi integrada à aplicação principal; outras vistas, calibração física e oclusão interna completa continuam pendentes.
