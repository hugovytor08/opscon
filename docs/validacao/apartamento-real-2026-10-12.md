# Apartamento real — recursos para revisão

12/10/2026, data local do usuário. Bloco de F014: reconstrução visual editável, sem integração ao aplicativo.

Consolidados 18 originais (15 fotos de ambientes, uma planta, dois vídeos), preservados byte a byte e identificados por SHA-256. Vídeos de 3,911 s e 31,201 s decodificados e analisados por 29 quadros regulares/de transição; fontes/tempos e confiança estão no catálogo. Oito ambientes correspondem à planta; áreas documentais somam 53,05 m², sem cotas lineares ou calibração dimensional.

Entregues `docs/design/apartamento-real/`: inventário, fichas, análise, contatos, retificação, sobreposição de traçado, SVG superior, SVG isométrico, modelo JSON relativo, oito regiões e rótulos, documento de integração, HTML local de conferência e prévias. SVGs autocontidos; IDs visuais sem vínculo automático; mobiliário contextual separado e visível após confirmação do usuário de que as fotos representam o estado atual. A primeira planta foi apresentada durante a sessão antes da revisão final da isometria.

Evidência: `evidencias/validacao.json` verifica integridade dos 18 originais, 29 quadros/tempos, referências, polígonos sem sobreposição, cobertura do perímetro, vãos nas paredes/ambientes, escala explicitamente relativa e igualdade das oito regiões seletivas com os pisos projetados do SVG. `previews/qa-navegador.json` registra 360/390/412/1200 px sem overflow, IDs duplicados ou colisão de rótulos; seleção equivalente das duas vistas e alternância da camada de móveis funcionam. Prévia ampla e celular foram inspecionadas visualmente.

O usuário definiu fotos como estado atual, vídeo completo como referência estrutural, e esclareceu referência de aproximadamente 1,60 m como largura da janela da sala. Essa referência é estimada e não aplicada como escala global. Ainda não há confirmação dimensional ou aprovação da planta reconstruída. Porta de entrada/sentidos reais e escala precisam de conferência. Nenhum teste físico no Galaxy S23/Samsung Internet ou ensaio do aplicativo integrado foi realizado neste bloco. Testes de domínio do aplicativo não foram repetidos: código executável, esquema, banco e dados não foram alterados; houve teste de integridade específico dos recursos.

Próximo: conferir a planta 2D, obter medida linear confiável para escala e depois vincular os recursos aos IDs existentes em Casa preservando Mapa/Lista. F014 permanece `in_progress`; CA-14/CA-20–22 e gates continuam abertos. Nenhuma publicação, push, deploy ou cadastro de cômodo.
