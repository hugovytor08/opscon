# Reconstrução do apartamento — entrega para revisão

12/10/2026, data da sessão informada pelo usuário. Escopo: análise e recursos visuais. Nenhuma integração, publicação, push, criação de cômodos ou alteração de dados do aplicativo foi executada.

## Acervo e método

18 originais: 16 JPG (15 fotos de ambientes e uma planta fotografada), dois MP4. Todos foram copiados sem recompressão para `evidencias/originais/`; `inventario.csv` conserva caminho original, cópia, ID e SHA-256. Não há duplicatas exatas. Vistas próximas da sala (IMG-001/003) e banheiro (IMG-004/005) foram mantidas: apresentam enquadramento ou estado diferentes, não são substitutas.

As fotos recebidas foram examinadas em conjunto. A identificação indicada pelo usuário é a fonte dos nomes Quarto 1/2/3; ela prevalece sobre associações por mobiliário. Nenhuma foto contém EXIF DateTimeOriginal. Datas das fotos permanecem desconhecidas. Os nomes dos MP4 contêm 12/10/2026 e horários, mas não comprovam a data das cenas.

Vídeos decodificados no Chrome por HTMLVideoElement, sem áudio: VID-001 tem **3,910589 s**, VID-002 **31,201056 s**, ambos 478 × 850. Foram examinados quadros sequenciais a cada 2 s, finais e nove quadros adicionais de transição do vídeo completo: 29 quadros no total. Isso é análise visual por amostragem, não uma inspeção de todos os frames. `evidencias/videos.json` registra duração, resolução, tempos exatos, arquivos e trechos. Os títulos mm:ss nas folhas de contato são abreviados; IDs e timeSeconds distinguem subsegundos.

## Percursos e correspondências

| Fonte / trecho | Evidência espacial | Confiança / limite |
|---|---|---|
| VID-001 00:00–00:03,911 | Quarto 1: janela, tapete, cama e parede da entrada; corresponde a IMG-008/009. | Alta pelo pacote identificado e elementos repetidos. |
| VID-002 00:00–00:02 | Sala, sofá, janela e aproximação da abertura da cozinha. | Alta; IMG-001/002 conferem janela e abertura. |
| VID-002 00:02–00:06 | Atravessa sala→cozinha; bancada escura, piso e azulejo; aproxima-se da área de serviço. | Alta; IMG-011–013 e planta. |
| VID-002 00:06–00:10 | Área de serviço: janela alta, tanque parcial, varal; retorno pela cozinha. | Alta para ambiente e ligação; posição do tanque estimada. |
| VID-002 00:12–00:17 | Retorno à sala e corredor interno; soleiras e portas. | Alta para sala↔circulação; amostras 13/15/16/17 s. |
| VID-002 00:18–00:20 | Banheiro: vaso, box, janela vertical e ponto de chuveiro sem aparelho. | Alta; corresponde a IMG-004, não ao estado instalado de IMG-005. |
| VID-002 00:21–00:23 | Primeiro quarto depois do banheiro, associado ao Quarto 2 pela posição no percurso. | Média; vídeo não contém identificação verbal analisada. |
| VID-002 00:24–00:26 | Quarto 1, janela e duas paredes; posição na extremidade do corredor. | Média; conferência com IMG-008/009 e planta. |
| VID-002 00:27–00:31,201 | Retorno e terceiro quarto, associado ao Quarto 3; móvel escuro parcial. | Média; móveis podem ter mudado, não sustentam sozinhos a identificação. |

As associações inferidas dos três últimos quartos não substituem as fotos nomeadas. A geometria dos quartos usa IMG-016 e os respectivos pacotes de fotos. Não foi inferido norte, andar ou endereço a partir das vistas externas.

## Planta, áreas e retificação

IMG-016: quadro de áreas no terço central e desenho no terço inferior. O documento declara sala 16,32; dormitório 1 8,80; dormitório 2 7,54; dormitório 3 8,10; cozinha 4,40; serviço 2,20; circulação 2,43; banho 3,26 m². A soma é **53,05 m²**, igual ao total impresso. São transcrições do documento, não medições do apartamento.

Não foram identificadas cotas lineares, escala nominal, norte, varanda ou pilares independentes. Móveis esquemáticos do papel não foram usados como evidência de mobiliário atual. A janela da área de serviço atende o conjunto cozinha/serviço; não se inventou janela própria da cozinha.

Retificação visual usando quatro pontos aproximados da moldura impressa: (119,873), (701,868), (728,1362), (96,1404) na imagem original 900 × 1600; destino (0,0), (1200,0), (1200,1000), (0,1000). `retificacao.json` registra os coeficientes, e `planta-retificada.png` conserva o resultado. A proporção de destino e os pontos são estimados; papel, lente e traçado continuam sujeitos a distorção residual. `planta-sobreposta.png` permite comparar limites reconstruídos e papel retificado.

As coordenadas UR são relativas a essa retificação. A geometria foi digitizada seguindo eixos das paredes; espessura 14 UR é convenção gráfica estimada. **Não existe conversão UR→m.** O usuário informou aproximadamente 1,60 m e esclareceu que é a largura da janela da sala, não a parede. A referência foi registrada e indicada como aproximada na planta, mas não aplicada como fator dimensional: o valor é aproximado, e o papel retificado não é um levantamento calibrado. Áreas documentais não determinam comprimento, largura ou pé-direito. Malha de piso, altura de paredes, cortes, móveis e louças são convenções de representação; não comprovam contagem de peças ou encaixe de móveis.

## Decisões rastreáveis

| Elemento | Fonte e região / tempo | Decisão |
|---|---|---|
| Perímetro, divisórias e três quartos | IMG-016, desenho inferior inteiro | Traçado relativo; orientação do papel preservada. |
| Sala aberta à circulação | IMG-016, faixa central; VID-002 00:15–00:17 | Sem porta inventada entre sala e corredor. |
| Portas dos quartos e banheiro | IMG-016, arcos; IMG-007/009/010/015, regiões das portas | Existência observada; posições, larguras e arcos estimados. |
| Porta de entrada | IMG-016, extremidade direita inferior da sala | Abertura e sentido derivados somente do papel; foto de confirmação ainda ausente. |
| Sala→cozinha | IMG-001, abertura à direita; VID-002 00:02–00:04 | Passagem livre, sem folha de porta. |
| Cozinha→serviço | IMG-013, centro ao fundo; VID-002 00:06–00:10 | Passagem livre entre dois ambientes, mantendo divisória. |
| Janelas dos quartos | IMG-008/014/006; símbolos laterais em IMG-016 | Quarto 1/3 na lateral esquerda do papel; Quarto 2 na direita. Posições relativas estimadas. |
| Janela da sala | IMG-002, parede à direita; IMG-016, parede superior da sala | Uma janela, sem criar segunda janela a partir de vistas inversas. |
| Banheiro | IMG-004/005, box ao fundo e janela; IMG-010, pia/espelho junto da porta; confirmação do usuário | Vaso e pia de um lado, box na extremidade oposta à porta; uma janela no box. Chuveiro instalado de IMG-005 adotado no estado atual. |
| Bancada da cozinha | IMG-011, fundo; IMG-012, direita; VID-002 00:04 | Bancada escura e cuba; posição aproximada. Sem gabinetes inventados sob a bancada. |
| Tanque da área de serviço | VID-002 00:06, parcial inferior esquerdo; símbolo em IMG-016 | Volume simplificado; posição e dimensão estimadas. |
| Mobiliário contextual | IMG-001/002, IMG-006–009, IMG-011–015; confirmação do usuário | Grupo separado, visível por padrão no estado atual confirmado. Presença observada, posição e tamanho estimados. Objetos pequenos não modelados. |

## Estado temporal e divergências

O vídeo completo mostra quartos quase vazios, cozinha sem os eletrodomésticos das fotos e banheiro sem aparelho de chuveiro. IMG-004 também mostra o ponto sem aparelho; IMG-005 mostra chuveiro instalado e tapete. IMG-010 completa pia/espelho/porta. As fotos dos quartos mostram cama/tapete, estação de computador e objetos guardados. Não há data de captura comprovada que permita ordenar essas cenas. Luz do dia/noite e ordem de envio não foram usados como cronologia.

O usuário confirmou que as fotos mostram o estado atual e autorizou usar o vídeo completo como referência da estrutura. Assim, o modelo principal inclui mobiliário observado nas fotos e chuveiro instalado de IMG-005. A confirmação escolhe o estado representado, sem atribuir datas de captura ausentes às fotos. Os estados do vídeo/IMG-004 continuam preservados no acervo, sem substituir a versão instalada.

Não foi detectada evidência suficiente de mudança estrutural em relação ao papel. Isso não comprova ausência de reformas ou exatidão dimensional. As divergências demonstráveis são de ocupação e instalação do chuveiro. Cabos, cortina provisória, varal, espelho e objetos pequenos não foram modelados. Móveis são simplificados em camada separada; banquetas da sala não foram repetidas para evitar supor peças diferentes das guardadas no Quarto 2. Posição/dimensão de cada volume continua estimada.

Não se incorporaram os sofás, armários, camas duplas, decoração ou eletrodomésticos da referência fictícia do protótipo. Dela foram usadas somente família de cores e composição simples.

## Classificação de certeza

- **Confirmado por medida:** nenhuma dimensão linear medida ou calibrada disponível.
- **Observado sem medida:** existência dos ambientes, conexões, janelas, revestimentos, bancada, box e louças, com referências de fonte.
- **Estimado:** coordenadas digitizadas, espessuras, larguras de vãos, arcos, posição/tamanho de móveis e altura visual dos volumes.
- **Não identificado:** pé-direito, norte geográfico, cotas exatas, data das fotos, ordem temporal dos estados e confirmação fotográfica da porta de entrada.

## Esclarecimentos do usuário e conferências que faltam

1. Estado atual: **respondido**. O usuário confirmou as fotos mobiliadas como atuais; vídeo completo usado para estrutura. Mobiliário separado e visível por padrão.
2. Referência linear: **respondido e esclarecido**. Aproximadamente 1,60 m refere-se à janela da sala, não à parede inteira. Valor registrado como estimado, não calibrado. Para escala confiável ainda é necessária medida conferida da parede ou de outro comprimento conhecido, além dos vãos/paredes críticos antes de qualquer planejamento de encaixe.

A planta 2D foi apresentada durante a sessão antes da revisão final da isometria. O estado atual foi confirmado; a aprovação do usuário sobre o layout reconstruído continua pendente. Esta entrega é editável e pronta para revisão, sem alegação de precisão dimensional ou aceite integrado de F014.
