# Primeiro componente gráfico — fogão

15/10/2026. O usuário enviou fotos frontal e superior do fogão após o acordo de que medidas/cômodo são opcionais para iniciar a ilustração. Foi produzido um recurso independente, sem alterar o editor ou inserir objetos no aplicativo.

Entrega: `docs/design/apartamento-real/itens/fogao-suggar-001/fogao-frente-direita-v2.png`, **1170 × 1344 px**, PNG RGBA, SHA-256 `e626b9b79c86fbdd4b24e9dd8979818351ca9155d4d38908436ac873d1156971`. ImageGen integrado, fundo transparente solicitado nas duas gerações. Prompt integral, fotos preservadas e metadados na mesma pasta. V1 histórica; V2 ajusta a câmera para uma vista mais elevada, orientada pelo guia geométrico e pela planta aprovada.

## Evidências

- Revisão visual: quatro bocas em grade 2 × 2, cinco botões no tampo, corpo preto, puxador prateado, forno envidraçado, pés curtos; nenhum objeto extra ou piso. Lateral inferida; traseira não fornecida. Inscrições pequenas são ilustrativas.
- `node docs/design/apartamento-real/itens/fogao-suggar-001/validar.cjs`: passou. Formato PNG e canal alfa reais; 798.238 pixels totalmente transparentes, 750.883 pixels com alfa ≥ 250. Silhueta com alfa > 8 contida em x=171–992/y=29–1331, dentro do canvas. Resíduos externos de até 1/255 tolerados; corpo predominantemente com alfa 252–253/255. Alfa do gerador preservado, sem pós-processamento de imagem.
- As duas cópias de fotos têm hashes idênticos aos anexos. Hash da planta de estilo permanece `8cff27b8892ae51cf679b6aed5fd8648d19420e95eb652224ad6a82456fe579d`.
- Checagens iniciais que exigiam grande quantidade de pixels em alfa exatamente 255 e borda estritamente zero foram restritivas para a saída do gerador; histograma inspecionado e critérios corrigidos explicitamente para quase opacidade ≥ 250 e resíduos ≤ 1/255. Não houve alteração do PNG para fazer a verificação passar.

O asset aguarda revisão visual do usuário. Medidas, cômodo e âncora não foram presumidos; campos correspondentes são nulos/pendentes em `item.json`. Uma orientação disponível. Câmera conferida visualmente, sem promessa de alinhamento pixel a pixel; encaixe na planta, escala e oclusão ainda não executados. CAS-01/F014 permanecem pendentes de integração. Nenhum executável, armazenamento, dado pessoal, push ou deploy alterado neste bloco; testes funcionais do app não se aplicam à criação deste recurso.

**Atualização posterior:** o usuário aprovou a extração e pediu colocação editável. Editor local implementado e testado, com âncora aproximada, tamanho ajustável e recorte externo inicial. Manifesto atualizado; medidas/cômodo permanecem nulos. Ver `docs/validacao/editor-moveis-2026-10-15.md` para o estado atual. Aprovação visual e protótipo local não concluem integração de CAS-01/F014.
