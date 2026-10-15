# Planta vazia — correção visual de 15/10/2026

Bloco de CAS-01/F014, somente imagem-base. O usuário **rejeitou a v1** por paredes de alturas incoerentes, janelas semelhantes a painéis azuis e qualidade abaixo da referência de The Office/Drawbotics. A revisão visual anterior foi insuficiente e não representa aprovação. V1, seu SVG e suas fontes permanecem preservados como histórico.

O usuário reenviou a planta 2D e fotos da janela de correr de alumínio e da porta de entrada em madeira. A correção usa o traçado relativo do documento em `docs/design/apartamento-real/geometria.json`, SHA-256 `a15719bb55eb8ad0f9dd6e5d359304339bf13b9055c4862c16dc7029fff2c8e9`, para voltar à distribuição do papel. Não usa a deformação do SVG de 14/10 como autoridade nesta versão. Medidas e altura real do pé-direito continuam sem verificação de campo.

Entregue `docs/design/apartamento-real/estudo-visual-2026-10-15/apartamento-sem-moveis-v2.png`, **1265 × 1243 px**, PNG gerado com ImageGen integrado, SHA-256 `8cff27b8892ae51cf679b6aed5fd8648d19420e95eb652224ad6a82456fe579d`. Referências arquivadas, prompt integral e gerador estrutural estão em `v2/`. O acabamento do escritório orienta materiais, luz e sombras; sua arquitetura e mobiliário não entram na planta.

## Correção e evidência

- Guia estrutural WebGL com teste de profundidade: oito polígonos de ambientes preservados; 18 paredes com topo único de 290 UR, peitoril de 112 UR e verga de 240 UR. São convenções ilustrativas, não metros medidos. Vista ortográfica elevada permite ver os ambientes sem cortar paredes em alturas diferentes.
- Seis vãos de janelas: alvenaria abaixo do peitoril e acima da verga, esquadrias de duas folhas com montante central e trilhos. O usuário confirmou após a geração: mesmo acabamento de alumínio, com vãos menores no banheiro e na área de serviço. A v2 já segue essa interpretação; PNG preservado, sem nova geração. Dimensões exatas continuam sem medida de campo.
- Entrada com madeira mel, desenho curvo, frisos horizontais, olho mágico e ferragem metálica; portas internas brancas. Todos os ambientes vazios, inclusive sem louças, bancadas, eletrodomésticos e box.
- Integridade passou: coordenadas dos oito pisos e 14 aberturas idênticas à fonte; aberturas pertencem às respectivas paredes; todas as janelas em paredes exteriores; cópias dos três novos anexos idênticas por hash. Regenerar o guia após a revisão do código produziu PNG idêntico. Fonte original preservada.
- Revisão visual do PNG: distribuição e adjacências dos oito ambientes conferidas com papel e guia, topos contínuos, seis janelas com esquadrias/peitoris, porta de entrada reconhecível, nenhum móvel, equipamento, texto ou marca observado. Ver `resultado-v2.json` e `v2/integridade-guia.json`.

O PNG é uma ilustração generativa, conferida visualmente. A identidade numérica comprovada no guia não garante precisão métrica ou registro pixel a pixel no render. Antes de integrar regiões selecionáveis e objetos arrastáveis, conferir esse registro.

**V2 aprovada visualmente pelo usuário**, que respondeu “excelente trabalho” e passou à preparação dos móveis. Aprovação de aparência, sem aceite dimensional ou integrado: CAS-01 não está concluída; nenhum CA/gate aprovado. Roteiro de fotos, medidas, peças transparentes com orientações e adaptação posterior documentado em `docs/design/apartamento-real/guia-fotos-moveis.md`. Editor, execução do app, PNG, dados, banco e autenticação preservados; sem push ou deploy. Testes funcionais do app não se aplicam a este bloco de documentação. Próxima evidência: primeiro móvel fotografado/medido e sua peça conferida na planta, incluindo escala e oclusão por paredes.
