# Prompt para executar a atualização do Meu espaço / Casa Serena

Implemente a reformulação descrita abaixo no repositório `C:\opscon`. A tarefa é entregar código funcionando, testes e evidências. Leia `AGENTS.md` e `docs/produto/plano-reformulacao-2026-10-14.md`, que detalha o comportamento e os critérios desta entrega. Execute em blocos pequenos, preservando mudanças existentes e mantendo o contexto no agente principal. Não crie subagentes sem pedido explícito.

## Intenção do usuário — trate como requisito

Quero que o app tenha aparência e acabamento de um aplicativo da Samsung, inspirado no vídeo do Samsung Health que estou enviando: cards, tipografia, cores, contraste, gráficos, ilustrações, disposição dos menus, separação das áreas e animações. Quero informação bem organizada e facilidade de usar, com poucos toques para registrar uma compra pequena ou uma receita. Cada área deve ter conteúdo próprio e pertencer ao mesmo sistema visual.

As funcionalidades continuam sendo do meu controle pessoal. Não invente funções, indicadores, desafios ou metas só para reproduzir a composição do Samsung Health. Use gráficos somente quando os dados e uma pergunta útil os justificarem. A nova referência visual substitui a obrigação de manter a antiga paleta marfim/verde como tema dominante; preserve o nome do app e os dados.

Mantenha as áreas Início, Casa, Compras, Mercado, Finanças e Projetos. A planta aparece somente em Casa. A entrada manual rápida continua disponível. Smartphone prioritário: Galaxy S23 / Samsung Internet.

## Anexos que você deve identificar antes de aplicá-los

1. **Vídeo de referência Samsung Health:** analisar o original, inclusive navegação e feedback de ações. Nesta máquina: `C:\Users\hugov\Downloads\WhatsApp Video 2026-10-14 at 21.49.58.mp4`. Os quadros em `tmp/samsung-health-reference/`, se disponíveis, são só apoio.
2. **Novo JSON da minha planta:** vou anexá-lo ou informar sua localização. Ele define a geometria final que quero usar. Inspecione seu formato, unidades, coordenadas, cômodos, paredes, aberturas e medidas. Pode ser o projeto exportado pelo editor local. Não use a geometria antiga como substituto silencioso.
3. **Nova planta isométrica correspondente:** vou anexar o arquivo. Identifique se é SVG ou PNG/JPEG/outro formato e qual viewBox/resolução/projeção utiliza. Confira sua correspondência com o JSON.
4. **Imagem de qualidade aprovada que já está no app:** quero **exatamente o mesmo padrão de qualidade gráfica**, mas com formato, proporções e dimensões do meu apartamento fornecidos no novo modelo. Identifique a referência correta entre o mapa integrado e as imagens históricas de Casa, perguntando se necessário. Ela é fonte de acabamento, não de geometria.

Antes de mudar o mapa definitivo, registre os caminhos exatos e a função de cada referência. Se JSON/isometria novos faltarem, peça os arquivos e continue os outros blocos; não invente as medidas. Se existirem apenas unidades relativas, preserve o formato fornecido e explique que medidas físicas não estão verificadas. O modelo atual do repositório tem escala relativa; a área documental e a janela aproximada não autorizam conversão arbitrária para metros.

## Começo do trabalho

Leia o estado atual em `docs/produto/leia-primeiro.md`, o relatório de implementação mais recente, `docs/validacao/incremento-0.3.1.md`, o relatório do editor local e a matriz CA. Confira `git status`, `app/version.json`, `features.json` e só os arquivos necessários a cada bloco. Os 37 testes registrados são evidência histórica; rode a base apropriada ao estado encontrado. Não sobrescreva alterações de outras sessões.

Arquivos centrais: `app/ui.js`, `app/ui.css`, `app/styles.css`, `app/domain.js`, `app/storage.js`, `app/sync.js`, `app/sw.js`, `app/house-map.js`, `app/house-map-data.js`, `scripts/prepare-house-map.mjs`, `docs/design/apartamento-real/` e `supabase/`. O editor da planta é uma ferramenta independente; seus ajustes ainda precisam ser aplicados explicitamente ao recurso integrado.

## 1. Reformular design e uso

Extraia a linguagem do vídeo e produza tokens de superfície, tipografia, cor, espaços, raios, ícones, profundidade e movimento. Aplique um sistema de componentes real às seis áreas. Não entregue somente outra paleta sobre os mesmos blocos genéricos. Não use captura do Samsung Health como interface, nem insira conteúdo de saúde.

Use recursos/fontes disponíveis com licença e shell offline. Anime navegação, detalhes e confirmação de forma curta, respeitando redução de movimento. Preserve foco, rótulos, contraste, alvos de pelo menos 44 px e conteúdo acessível com teclado/barra inferior. Trate carregamento, vazio, erro, edição, pendência, confirmação e conflito.

Ações rápidas para compra/despesa e recebimento devem informar o essencial e atualizar o resultado após salvar, com conta explícita, sem presumir pagamento ou saldo. Possibilite corrigir o que foi registrado. Mantenha Compra ≠ Pagamento e transferência própria ≠ receita/despesa.

## 2. Aplicar a casa correta com o acabamento aprovado

Use o novo JSON para layout e medidas e a isometria correspondente para conferir o resultado. Preserve arquivos anteriores e proveniência. Recalcule pisos/regiões/rótulos da mesma geometria; nada de encaixar regiões antigas sobre a nova imagem.

Reproduza o padrão visual aprovado de volumes, materiais, iluminação, sombras, linhas, detalhes e nitidez. Compare lado a lado. Não simplifique o acabamento para uma planta genérica nem altere parede/janela/proporção para obter uma imagem bonita. Gere arquivo editável e recursos de resolução adequados. Imagem gerada pode apoiar acabamento, mas não comprova exatidão geométrica.

Implemente zoom por pinça, roda e botões, arraste/pan e recentralização. Diferencie toque, arraste e pinch. A imagem e os alvos devem continuar alinhados em qualquer transformação. Não acrescente rotação real ou motor 3D como requisito não solicitado. Mantenha Mapa/Lista e acesso às ações se o mapa falhar.

Ao tocar em um cômodo, abra seu detalhe com **Quero comprar** e **Já comprei**, usando os mesmos itens/IDs. Uma compra registrada muda a categoria do item sem duplicá-lo; entrega/instalação seguem independentes. Não crie itens com base em móveis ilustrados. Preserve os vínculos de cômodos existentes e evolua-os para recuperação por conta/backup; o incremento atual os mantém apenas no navegador.

## 3. Importação em massa a partir de imagens processadas externamente

Implemente o caminho inicial: **foto/print no GPT ou conversa ChatGPT → JSON → colar/abrir no app → revisão → confirmação**. Entregue instruções prontas para um GPT extrator e fixtures, sem integrar API de IA ou contratar serviços. A criação do GPT será na conta do usuário, conforme os recursos disponíveis. O app atual ainda não aceita o contrato novo; implemente-o antes de dizer que aceita.

Consulte `docs/importacao/instrucoes-gpt-extrator.md` e `docs/importacao/contrato-importacao.schema.json`. O contrato é de **rascunho**, com campos desconhecidos nulos, e precisa de validação adicional de negócio. Mudanças necessárias no contrato devem ser versionadas junto com instruções/exemplos/testes. Nunca execute conteúdo do JSON ou de anexos.

Suporte notas de 20+ produtos, comprovantes Pix/pagamentos, contas de água/luz, recebimentos e outros documentos classificáveis. Imagem ilegível/desconhecida vira pendência. GPT não inventa IDs de contas/produtos/cômodos, medidas, datas ou preços. Revise dados essenciais no app e aceite entrada manual curta para um pão/suco.

Tela de revisão: totais, itens, descontos, estabelecimento, datas, conta e destino da movimentação, documentos relacionados, potenciais duplicatas e erros. Permita ajustes em lote/individuais e excluir documentos/linhas. Mostrar exatamente o que será gravado; não registrar nada na simples colagem.

Regras financeiras e de importação obrigatórias:

- Nota detalhada cria uma aquisição com linhas de preço, não uma despesa por item somada a outra pelo total.
- Pix pode ser saída, entrada ou transferência. Nota + Pix da mesma compra, juntos ou separados, devem se conciliar; vincular também a compras/pagamentos já cadastrados. Não duplicar gasto nem pagamento.
- Conta a vencer não significa conta paga. Agendamento/falha/cancelamento não significa pagamento executado. Baixa requer evidência revisada e conta escolhida. Pagamentos parciais e parcelamentos conservam seus vínculos.
- Totais e rateios devem fechar em centavos. Quantidade fracionária e precisão de preço por peso exigem representação decimal/inteiros escalados, sem dinheiro em ponto flutuante. `null` não é zero.
- Detectar reimportação por identificadores estáveis e conteúdo canônico calculados pelo app; novos nomes, recortes, ordem ou batchId não podem criar duplicatas triviais. Sem identificador suficiente, apresentar suspeita à revisão, sem excluir compras legítimas automaticamente.
- Preparar lote e identidade antes de persistir; confirmação do conjunto revisado é atômica com dados, recibos/proveniência e fila. Reenvio/offline/reload/ACK perdido não duplica; servidor valida também. Não gravar o lote como metadata local que some em outro aparelho.
- Entregar correção/cancelamento auditável dos efeitos importados, sem apagar pagamentos independentes; o histórico de preços deve acompanhar a correção.

## 4. Histórico de compras e preços

Entregue consulta por produto e estabelecimento/data: último, menor/maior observado e histórico. Preserve descrição original, marca/variante, embalagem, quantidade/unidade, descontos e estabelecimento/filial. Sugestões de produto/loja precisam de correspondência revisável. Não una automaticamente embalagens/variantes incompatíveis.

Mostre preço por embalagem e preço normalizado por unidade equivalente quando conhecido, por exemplo R$/L para óleo de 900 ml e 1 L. Mostre data e amostra; as comparações valem para os registros do usuário. Não invente série histórica nem use quantidade/preço estimado como preço efetivamente pago. Defina rateio de desconto e tratamento de frete/juros com transparência.

O domínio atual agrega o total em `market.close` e não tem tudo isso. Evolua o modelo em vez de criar uma tela sem dados recuperáveis. Entrada manual e importação devem alimentar a mesma estrutura.

## 5. Compatibilidade, testes e entrega

Preserve IndexedDB/fila offline, reenvio idempotente, política de conflito, Auth/RLS, backup independente e dados existentes. Crie migrações aditivas cliente/servidor e valide modelos antigos/novos; não edite ou reaplique a migração Supabase já instalada. Se precisar de SQL/configuração real, entregue ao usuário os arquivos e passos curtos; não automatize o dashboard.

Preserve RF-01–20, CA-01–22 e F001–20; adicione requisitos `IMP-01…` e tarefas próprias sem reutilizar F020. Registre a expansão de escopo. Nenhum gate/feature pode ser declarado completo sem a evidência correspondente.

Execute os cenários do plano: 20 itens, duplicatas, nota+Pix, entrada/saída/transferência, conta não paga, quantidades/unidades/descontos, correções, limites e JSON hostil, atomicidade, quota, offline/ACK perdido/conflito, RLS, migração/backup/restauração limpa, mapa/gestos, todas as áreas, acessibilidade e telas móveis/desktop. Use dados sintéticos isolados; não exponha documentos pessoais em logs, Git, capturas ou fixtures. Não limpe a base do usuário para testar.

Atualize shell/versionamento e o suporte ao deploy estático Vercel, preservando instalação/atualização. Não publique a versão final nem contrate serviços por conta própria. Entregue alterações locais revisáveis, testes e capturas, passos de Supabase se necessários e instrução de push/deploy de teste. Separe teste Chromium de validação física no S23, que precisa de evidência real.

Ao terminar, informe: o que funciona, o que foi testado, arquivos/fontes de geometria usados, comparação visual com as referências, limitações e pendências. Respostas curtas e sem repetir documentos inteiros. Persistir até concluir o escopo autorizado; não encerrar apenas com um plano ou protótipo visual sem implementação.
