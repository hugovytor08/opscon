# Editor local da planta

## 15/10 — posicionar os móveis reais

Abra **`dist/moveis.html`** no navegador ou entre em **Posicionar móveis** a partir do editor de cômodos. HTML independente, com planta vazia v2 e fogão aprovados embutidos; funciona sem servidor e sem rede.

1. Em **Minhas peças**, toque em **Adicionar à planta** no fogão.
2. Arraste a peça. Use a alça do canto, o controle **Tamanho** ou os botões Menor/Maior para redimensionar. As setas permitem ajustes pequenos.
3. Use **Aproximar item**, roda do mouse/pinça e arraste do fundo para trabalhar de perto; **Enquadrar** recupera a vista inteira.
4. Você pode duplicar, remover, desfazer e refazer. **Importar peça em PNG** aceita PNG/WebP transparentes, até 4 MB/4096 px por imagem. A biblioteca começa só com o fogão real do usuário.
5. **Baixar projeto** guarda posições, tamanhos e peças importadas em `minha-casa-moveis.json`. **Abrir projeto** recupera a edição, inclusive em outro navegador limpo usando este HTML. O fogão embutido é referenciado pelo ID; os PNGs importados acompanham o JSON. **Exportar imagem** baixa uma cópia PNG de 1265 × 1243 para compartilhar.

Rascunho em banco IndexedDB exclusivo `casa-serena-furniture-editor-v1`, sem acessar o armazenamento do app ou do editor anterior. Falha de gravação exibe aviso; o projeto em memória continua exportável. Para outro dispositivo, levar o HTML e o JSON; links de navegação entre modos também precisam do `dist/index.html` no mesmo diretório.

O recorte inicial cobre paredes externas em primeiro plano, com contornos registrados no PNG aprovado. **Respeitar paredes à frente** pode ser desativado para ajuste livre. Paredes internas/portas não têm oclusão completa nesta versão; não é um motor 3D nem verificação de colisão. Âncora e escala são aproximadas e não demonstram que o móvel cabe fisicamente. O fogão tem uma orientação; girar para outra face exige novas vistas da peça.

A montagem usa a imagem aprovada fixa. Edição de proporções no modo **Editar cômodos** é um projeto separado e não deforma automaticamente o PNG. Nenhuma edição deste protótipo altera os dados do Casa Serena.

Fontes novas: `furniture.html`, `furniture.css`, `furniture.mjs`, `furniture-core.mjs`. `build.mjs` gera os dois HTMLs autocontidos; `serve.mjs` serve ambos opcionalmente na porta 8869. Verificação: seis testes novos + cinco de geometria aprovados, 18 cenários Chrome/Playwright aprovados, toque/pinça simulados por eventos do navegador e 360/390/412/1400 px. Evidências em `previews/moveis/qa.json` e `docs/validacao/editor-moveis-2026-10-15.md`. Downloads no teste Windows precisaram de execução do Chrome fora da restrição de arquivos, com perfis isolados. S23 físico não testado.

## Histórico — editor de proporções de 12/10

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
