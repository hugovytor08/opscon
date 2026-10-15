# Dos móveis reais às peças da planta

15/10/2026. O usuário aprovou a aparência da planta vazia v2 e pediu orientação para fotografar seus itens e preencher a planta conforme suas escolhas. Este documento define a próxima etapa; importação e arraste de novos objetos ainda não estão implementados no editor.

## Primeiro item

Começar com um móvel simples e representativo, como sofá, mesa ou estante. Validar uma peça colocada na planta antes de fotografar todos os itens.

Enviar por móvel:

1. Foto de frente, com o móvel inteiro e seus pés/base visíveis.
2. Foto na diagonal, mostrando frente e lateral; mostrar o tampo/assento quando possível.
3. Foto da lateral. Acrescentar traseira se ela aparecer nas posições desejadas, e detalhes de acabamento quando necessários.
4. Nome do item. Cômodo e largura × profundidade × altura em centímetros são opcionais: fotos bastam para iniciar a ilustração, com escala aproximada. Medidas ajudam a calibrar o posicionamento; cômodo serve apenas para organização e não restringe onde o objeto poderá ser colocado.

Usar luz uniforme e a câmera principal em 1×, evitando grande-angular e contraluz. Enquadrar o objeto inteiro, sem filtros ou modo retrato; retirar, quando possível, objetos que escondam seu formato. Não é necessário recortar o fundo nem deixar a casa vazia.

Exemplo de mensagem:

```text
Item: sofá verde
Cômodo: sala
Largura: ___ cm
Profundidade: ___ cm
Altura: ___ cm
Observação: quero poder encostá-lo em qualquer uma das paredes.
```

## Peça digital para a vista atual

A solução proposta para a câmera fixa da v2 é uma ilustração do móvel em PNG com fundo realmente transparente. Fotos orientam forma, cor e material; a planta aprovada orienta câmera, luz e acabamento. Gerar a peça isolada, sem o chão da foto, paredes, objetos vizinhos ou texto.

Cada móvel precisa ter largura/profundidade/altura declaradas, uma área ocupada no piso e uma âncora na base. Essa referência permite posicionar e dimensionar a peça. A planta atual usa escala relativa; calibrar uma dimensão real do imóvel antes de usar o editor para verificar se um móvel cabe fisicamente.

Para virar o objeto em passos de 90°, preparar quatro vistas coerentes: frente, lado direito, trás e lado esquerdo, sempre vistas pela mesma câmera elevada da planta. Girar o PNG no plano da tela não equivale a girar o móvel sobre o piso. As partes que não aparecem nas fotos são inferidas e devem ser revisadas pelo usuário.

Uma ilustração com aparência tridimensional não contém uma malha 3D. Rotação contínua, câmera livre e vistas arbitrárias exigiriam modelos 3D dos objetos e uma cena 3D da casa; essa alternativa amplia a implementação e a reconstrução das peças.

## Adaptação posterior do editor

Biblioteca de itens com miniaturas, adicionar ao cômodo, arrastar, virar em passos de 90°, ajustar escala, duplicar, remover e desfazer. Guardar posição/orientação dos itens separados da planta e exportar um projeto recuperável contendo os recursos necessários.

A base aprovada é um PNG único. Preparar camadas ou máscaras alinhadas à geometria para que as paredes escondam corretamente os móveis atrás delas, e ordenar itens pela posição no piso. Validar esse encaixe com o primeiro móvel, inclusive junto a uma parede, antes de ampliar a biblioteca. Reutilizar os oito IDs dos ambientes e preservar as fotografias originais.

## Próximo bloco verificável

Primeiro item recebido: fogão, fotos frontal e superior, sem medidas. Peça transparente produzida em `itens/fogao-suggar-001/`, com uma orientação elevada de frente/lateral direita. Evidência em `docs/validacao/primeiro-item-fogao-2026-10-15.md`. Próximo: revisão visual, escala/âncora e encaixe na planta; depois preparar as demais orientações e o fluxo de posicionamento no editor. Não há recurso importado no app nem editor alterado neste bloco.

Atualização: fogão aprovado e primeiro fluxo de posicionamento entregue em `editor/dist/moveis.html`. Já permite adicionar, mover, redimensionar, importar outras peças transparentes e recuperar o projeto. Registro de piso/âncora e recortes externos aproximados. Próximos itens podem ser enviados para ampliar a biblioteca; novas orientações e oclusão interna completa continuam como próximas melhorias. Evidência em `docs/validacao/editor-moveis-2026-10-15.md`.
