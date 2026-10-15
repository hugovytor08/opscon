# Referências e sistema visual — incremento 0.3.2

14/10/2026, data local do usuário. Bloco desta sessão: fundação visual e conferência de rascunhos. Não é aceite da reformulação inteira.

## Fontes identificadas antes de alterar o mapa definitivo

| Caminho exato | Função | Constatação |
|---|---|---|
| `C:\Users\hugov\Downloads\WhatsApp Video 2026-10-14 at 21.49.58.mp4` | Linguagem visual, organização, navegação e feedback | Original decodificado em Chromium: 135,281122 s, 392 × 850 px. Contatos extraídos do original, inclusive quadros consecutivos separados por 160 ms, em `tmp/samsung-health-reference/original-transicoes.jpg`; manifesto técnico em `original-auditoria.json`. Não incorporado ao shell ou às fixtures. |
| `C:\Users\hugov\Downloads\minha-planta.json` | Nova geometria fornecida | Exportação válida do editor, schema 1, 8 ambientes, 18 paredes e 14 aberturas. Unidade UR; `scaleToMeters:null`; nenhuma medida linear confirmada. |
| `C:\Users\hugov\Downloads\casa-isometrica.svg` | Isometria correspondente | SVG vetorial, viewBox `157.239 215.948 945.125 824.546`; projeção x = 0,78x − 0,78y + 570; y = 0,45x + 0,45y − z + 90. Idêntico byte a byte ao `renderIso(model,{furniture:false})` do editor. Os móveis contextuais estão ocultos na exportação. |
| `C:\Users\hugov\Downloads\planta-2d.svg` | Apoio superior da nova planta | Original preservado junto do JSON e da isometria. Não usado como calibração física. |
| `C:\opscon\app\assets\ref-casa.png` | Referência de acabamento escolhida pelo usuário | Ilustração com materiais, luz e volumes detalhados; sua geometria não representa o modelo novo. Na resposta de 14/10, o usuário escolheu esta imagem e pediu a opção de ocultar os móveis. |
| `C:\opscon\app\assets\apartamento-real\casa-isometrica.svg` | Mapa atualmente integrado | Continua no app neste incremento, com indicação de aproximação. Não é a referência de acabamento escolhida. Não foi substituído silenciosamente pelo modelo novo. |

As três fontes novas foram copiadas sem alteração para `docs/design/apartamento-real/revisao-2026-10-14/`. `proveniencia.json` registra SHA-256, tamanho, viewBox e correspondência JSON/SVG. Nenhuma área documental ou janela aproximada foi convertida em escala métrica. A escolha do acabamento foi respondida: ilustração histórica `ref-casa.png`, com móveis em camada opcional. Retirar móveis não pode retirar paredes, aberturas, pisos, rótulos ou alvos; instalações fixas precisam permanecer identificáveis. A implementação dessa camada no mapa definitivo continua pendente.

O usuário também pediu retirar a antiga imagem do Início por incompatibilidade com o novo design. `ref-inicio.png` foi retirada de `app/assets` e do shell offline no incremento 0.3.3; a cópia histórica permanece em `docs/design/referencias-historicas/ref-inicio.png`, fora da pasta publicada. O Início usa os cards do novo sistema visual.

## Leitura do vídeo e comparação

O original mostra rolagem de cards de diferentes larguras/densidades no começo; navegação por áreas perto de 55–75 s; detalhe escuro, ação curta e retorno ao resumo perto de 85–100 s; e novos cards por contexto perto de 115–130 s. Ações alteram a informação principal. Não há uso de captura do Samsung Health como interface, imagem de saúde ou indicadores artificiais no Casa Serena.

| Aspecto observado | Aplicação verificável |
|---|---|
| Cards escuros sobre fundo profundo; acentos por assunto | Superfícies `#191e29`/`#242b39`, fundo `#0c1018`, detalhes azul, menta, âmbar e violeta. |
| Hierarquia forte de número, rótulo e contexto | Saldo desconhecido permanece texto; saldo informado ganha destaque. Contagens e compromissos usam registros reais. |
| Composição variada, em vez de painéis iguais | Início com card de dinheiro largo, dois cards menores de compras/pendências, faixa Mercado, vencimentos e próxima ação de Projeto. |
| Navegação compacta persistente | Cinco destinos móveis em barra arredondada; Mercado em menu, desktop e atalho do Início. |
| Ação curta e resultado visível | Despesa/recebimento no Início; conta explícita; pendência ou pagamento indicados no feedback e no resumo de Finanças. |
| Detalhes e mudanças suaves | Entrada de seção 180 ms; sheets 240 ms; feedback 220 ms. São escolhas do Casa Serena, não medições exatas da curva de animação do vídeo. `prefers-reduced-motion` remove movimento. |

Fontes: `system-ui`, Segoe UI/Roboto/sans-serif do aparelho; nenhum arquivo de fonte proprietário ou dependência de rede. Ícones são os símbolos SVG existentes do repositório. Espaços principais 8/12/16/24 px; cards 26 px; sheets 30 px; botões arredondados. Texto normal usa contraste claro e foco explícito; controles móveis verificados em pelo menos 44 px.

Capturas atuais em `docs/validacao/evidencias/reformulacao-0.3.2/`, para comparação local com o vídeo original. A inspeção cobriu Início móvel/desktop, Finanças móvel, Casa e conferência do lote. A composição e o acabamento da planta definitiva ainda não foram comparados com a imagem escolhida pelo usuário.
