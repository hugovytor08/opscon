# Editor local da planta

12/10/2026. Primeira versão focada no formato e nas proporções dos oito ambientes do apartamento.

## Usar

Abra `dist/index.html` no navegador, com dois cliques no arquivo ou pela opção Abrir arquivo do navegador. O HTML contém o desenho e todo o código; não exige instalação nem conexão. Também está disponível em `http://127.0.0.1:8869/` enquanto o servidor local estiver ativo.

1. Selecione um ambiente pelo campo Ambiente ou pelos botões numerados.
2. Arraste os círculos para mover paredes ou os quadrados para ajustar cantos. Largura/Profundidade também podem ser ajustadas pelos campos e botões de porcentagem.
3. Confira a isometria. No celular, alterne entre as duas vistas; use ampliação e arraste a vista ampliada para deslocá-la.
4. Use Desfazer/Refazer para experimentar. Voltar à planta inicial também pode ser desfeito. Nome e outras opções contém nome visual e camada de móveis.
5. Clique **Baixar projeto** para guardar `minha-planta.json`. **Abrir projeto** recupera esse JSON. Exportar desenhos fornece planta/isometria SVG e regiões JSON da versão editada.

100% significa a proporção do desenho inicial, não uma medida em metros. Os campos mudam as bordas direita/inferior; o arraste permite ajustar outros lados. A edição atua nos alinhamentos das paredes existentes: ambientes que compartilham essas linhas acompanham o ajuste. Limites impedem cruzar a linha vizinha. A malha mantém as ligações e oito IDs visuais; acrescentar novos recuos, novas paredes ou novos ambientes fica para outra versão.

As áreas em m² continuam sendo as transcritas do papel. Não são recalculadas como medidas físicas do desenho editado. A janela de aproximadamente 1,60 m continua registrada como referência original, sem calibrar automaticamente o modelo.

## Salvar e preservar

O rascunho e até 30 passos de desfazer/refazer ficam na chave exclusiva `casa-serena-plan-editor-v1` do navegador/endereço usado. Abrir por HTML local e abrir por URL podem ter armazenamentos diferentes; use Baixar/Abrir projeto para transferir. Se o navegador impedir gravação, o aviso permanece e a exportação do trabalho em memória continua disponível. Guardar o JSON permite recuperar os ajustes sem depender desse navegador.

`../geometria.json`, fotos, vídeos e SVGs originais não são sobrescritos. O editor usa uma cópia embutida. Não altera cômodos cadastrados, vínculos do mapa, registros financeiros, IndexedDB ou Supabase. A integração existente 0.3.1 continua usando seus recursos atuais.

Depois de editar, envie o JSON para revisão e aplicação ao mapa do Casa Serena em outra etapa. A exportação preserva os IDs visuais, coordenadas relativas, evidências e elementos da fonte; acrescenta metadados de edição. As regiões exportadas correspondem ao viewBox da isometria exportada.

## Manutenção e testes

Arquivos-fonte: `index.html`, `editor.css`, `editor.mjs` e `geometry-core.mjs`. `build.mjs` valida a fonte e gera o HTML independente em `dist/`; não instala dependências e não publica.

```powershell
node docs/design/apartamento-real/editor/build.mjs
node --test docs/design/apartamento-real/editor/geometry-core.test.mjs
node docs/design/apartamento-real/editor/serve.mjs
```

O servidor serve apenas o HTML, em 127.0.0.1:8869. Encerre-o com Ctrl+C no terminal quando terminar. Para QA automatizado, `qa.cjs` usa Chrome/Playwright do runtime local; testes e capturas ficam em `previews/`. O servidor local precisa estar ativo para esse percurso. A versão HTML foi testada também sem rede.

Evidência: cinco testes de geometria e doze cenários no navegador passaram; 360/390/412/1400 px sem overflow ou IDs duplicados. Inclui toque simulado, importação inválida, desfazer, recarga, falha de quota e exportação. Samsung Internet no Galaxy S23 físico e conferência dimensional do apartamento ainda pendentes. O editor não é uma ferramenta de levantamento técnico.
