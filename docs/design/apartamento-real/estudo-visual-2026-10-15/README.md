# Apartamento vazio — estudo visual

15/10/2026. O usuário aprovou a aparência de **apartamento-sem-moveis-v2.png** (1265 × 1243 px) e passou à orientação sobre fotografar os móveis. ImageGen integrado; prompt integral em `v2/prompt-v2.txt`. A imagem segue a planta 2D reenviada e as novas fotos da janela e da porta. The Office/Drawbotics é referência de acabamento, luz e sombras.

## V2: correções solicitadas

- Paredes com a mesma altura, vista ortográfica elevada e teto removido.
- Janelas de correr de alumínio, duas folhas, trilhos e peitoril de alvenaria; vãos preservados da planta. Após a geração, o usuário confirmou o mesmo acabamento e vãos menores no banheiro e na área de serviço; a v2 já segue essa interpretação.
- Porta de entrada de madeira mel, com frisos curvo/horizontais e ferragem metálica.
- Oito ambientes vazios; sem móveis, louças, bancadas, aparelhos ou decoração.

`v2/preparar-guia.cjs` gera `guia-estrutura.html` e `guia-estrutura.png` a partir de `../geometria.json` (relativo a esta pasta). Usa WebGL com teste de profundidade, sem variar alturas por parede. Alturas em UR são convenções de ilustração, não medidas reais. As novas referências estão em `v2/fontes/`; a referência de acabamento permanece em `fontes/referencia-design.png`.

`v2/integridade-guia.json` registra os oito pisos, 18 paredes e 14 aberturas. `resultado-v2.json` registra hashes, dimensões, verificações e limites. Integridade das fontes e reprodução idêntica do guia passaram; correspondência do render com o guia foi revista visualmente. O PNG não é levantamento métrico nem modelo 3D e precisa de registro geométrico antes de receber áreas selecionáveis ou objetos precisos.

## Histórico e continuidade

**V1 rejeitada pelo usuário:** paredes com alturas incoerentes e janelas parecendo painéis azuis. `apartamento-sem-moveis-v1.png`, `estrutura-vazia.svg`, `estrutura-vazia.png`, `preparar.cjs`, `prompt-v1.txt` e metadados permanecem somente como histórico. Preservar os cortes de altura do SVG anterior foi uma decisão inadequada para o resultado solicitado.

V2 aprovada visualmente pelo usuário. Nenhuma imagem foi integrada ou publicada no app; editor e dados preservados. O roteiro da próxima etapa está em `../guia-fotos-moveis.md`: começar com um item fotografado e medido, gerar peças transparentes com orientações coerentes e validar escala/oclusão antes de ampliar a biblioteca e adaptar o editor. Manter câmera, luz e âncora no piso coerentes com a base aprovada.
