# Recursos e próxima integração

Entrega para revisão em 12/10/2026. Aplicativo, banco, autenticação, sincronização, dados financeiros e deploy não foram alterados. Nenhum push/publicação. F014 e seus CA permanecem em andamento.

## Arquivos

- `planta-2d.svg`: planta superior, nomes, áreas documentais, paredes, janelas e arcos estimados; viewBox `0 0 1240 1180`.
- `geometria.json`: fonte editável da geometria, evidências e classificação de certeza; **UR relativas, scaleToMeters=null**. Não usar para encaixe de móveis.
- `casa-isometrica.svg`: recurso principal; viewBox `0 0 1280 1080`, teto removido, cortes e alturas gráficas convencionais, grupos separados.
- `areas-interativas.json`: oito polígonos e âncoras de rótulos na projeção do SVG. Nenhum ID real do aplicativo foi lido ou vinculado.
- `conferencia.html`: revisão local das duas vistas, rótulos externos por números, seleção equivalente por lista, mobiliário opcional e ampliação. Pode ser aberto localmente, sem servidor ou dependências externas.
- `inventario.csv`, `fichas-comodos.md`, `analise.md`: catálogo, correspondências e limites.
- `evidencias/`: originais intactos, SHA-256, quadros com tempos, contatos, retificação e sobreposição.
- `previews/`: capturas amplas, 360/390/412 px e QA do navegador.

## Coordenadas e IDs

Origem: canto superior esquerdo da moldura retificada; x cresce para a direita e y para baixo. Orientação corresponde à planta do papel. Não há norte geográfico. Modelo: pares `[x,y]` em UR. Projeção:

```text
X = 0,78 x − 0,78 y + 570
Y = 0,45 x + 0,45 y + 90 − z
```

`z` é somente uma altura gráfica relativa. A fórmula, polígonos, viewBox e âncoras estão nos JSON. Não normalizar áreas seletivas em um sistema diferente sem aplicar a mesma transformação.

IDs visuais: `vis-q1`, `vis-q2`, `vis-q3`, `vis-banho`, `vis-sala`, `vis-cozinha`, `vis-servico`, `vis-circulacao`. Todos têm `appRoomId:null`. Na integração futura, mapear explicitamente cômodos existentes a esses IDs, preservando IDs cadastrados e dados. Nomes não devem servir de vínculo automático. Confirmar se circulação e área de serviço serão selecionáveis nos registros existentes; sua representação geométrica não equivale a cadastro.

## Grupos e destaque

No SVG isométrico: `iso-base`, `iso-ambientes`, `iso-estrutura`, `iso-elementos-fixos`, `iso-mobiliario-contextual`. Cada ambiente tem `id="iso-vis-…"`, classe `room`, `data-room-id` e nome acessível em `title`. Estrutura e volumes gráficos não devem interceptar seleção dos pisos. SVGs são autocontidos, sem scripts, imagens externas ou fontes remotas.

Exemplo para SVG embutido, após o mapeamento explícito de IDs:

```js
svg.querySelectorAll('.room').forEach(node => {
  node.classList.toggle('is-selected', node.dataset.roomId === visualRoomId);
});
```

O CSS interno oferece preenchimento sálvia e **contorno tracejado**, além da identificação na lista. Não usar só cor. Se a integração carregar o SVG como `<img>`, CSS externo não alcança seus grupos: embutir o SVG ou renderizar uma camada vetorial de regiões sobre ele. Ao embutir mais de um recurso na mesma página, prefixar apenas atributos `id` e referências internas; preservar `data-room-id`.

Rótulos não foram desenhados no SVG isométrico. A interface pode usar `labelPosition` no mesmo viewBox, convertendo proporcionalmente para as dimensões renderizadas. O HTML de conferência mostra números legíveis e lista equivalente; no celular não tentar acomodar todos os nomes dentro dos ambientes pequenos. Manter zoom e alternativa Mapa/Lista. Alvos como banheiro, serviço e circulação podem ficar abaixo de 44 px; não deformar o mapa para ampliar toque. A lista contém botões com pelo menos 44 px e foco visível.

`iso-mobiliario-contextual` fica visível por padrão: o usuário confirmou as fotos como estado atual. Para inspecionar só a estrutura: mudar `display:inline` para `display:none`, ou usar a opção no HTML de conferência. Essa camada não significa item cadastrado, compra, preço, entrega ou estado financeiro. Sua posição/tamanho é estimada. Não foram replicadas pequenas peças, roupas, cabos ou decoração inventada. Banquetas da sala não foram duplicadas diante da possível correspondência com as guardadas no Quarto 2.

## Regeneração e verificação

Editar primeiro `geometria.json`; `scripts/gerar-recursos.py` lê o modelo existente e regenera ambos os SVGs e as regiões. A geração não sobrescreve o JSON existente. Rodar `scripts/renderizar.cjs` para regenerar HTML/prévias e testar larguras, IDs, rótulos e seleção. `scripts/validar.py` verifica fontes, hashes, referências, geometria, vãos e recursos SVG. O Node/Playwright e Python/Pillow estão no runtime de dependências informado pelo Codex; nenhum pacote foi instalado nesta sessão.

Fluxo local, usando Python com Pillow/NumPy para consolidação e o Node configurado:

```powershell
python scripts/consolidar-evidencias.py
python scripts/gerar-recursos.py
node scripts/renderizar.cjs
python scripts/validar.py
```

Executar com esta pasta como diretório de trabalho, ou usar os caminhos completos dos scripts. Para reextrair os vídeos, `node scripts/extrair-videos.cjs` lê as cópias preservadas. `preparar-fontes.py` é só a etapa inicial de preservação, dependente dos caminhos dos anexos originais; não é necessária para editar o mapa entregue.

## Pendências que continuam explícitas

1. Estado atual **confirmado** pelo usuário: fotos mobiliadas, com chuveiro instalado; vídeo quase vazio só para estrutura. Não continua pendente.
2. Janela da sala informada como **aproximadamente 1,60 m**; está registrada em `reportedReferences` e na abertura `window-sala`, com status estimado e `usedToScaleGeometry:false`. Para escala confiável, medir a parede da janela ou outro comprimento conferido e depois os vãos/paredes críticos. O modelo permanece relativo.
3. Revisar planta 2D com o usuário, principalmente porta de entrada, arcos e vínculo dos três quartos. A planta impressa/fotos sustentam o layout, mas aprovação ainda não foi recebida.
4. Vincular os IDs visuais aos IDs existentes e integrar seleção/Mapa–Lista em outro bloco de trabalho.
5. Testar no Galaxy S23/Samsung Internet e verificar CA-14/CA-20–22 no aplicativo integrado. As capturas locais não substituem esse teste físico.

Recursos prontos para revisão; geometria e mobiliário ainda provisórios nos aspectos listados. Nenhuma declaração de representação exata ou feature concluída.
