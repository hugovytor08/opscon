# Incremento 0.3.1 — apartamento integrado em Casa

12/10/2026. O usuário autorizou a próxima etapa após a entrega visual do outro agente. Integração local concluída; sem push/deploy executado neste bloco e sem aceite final da V1.

## Comportamento

A área Casa agora usa a isometria dos oito ambientes de `docs/design/apartamento-real`, com regiões selecionáveis, destaque por contorno tracejado e cor, números e lista equivalente com alvos de pelo menos 44 px. Há ampliação com rolagem interna. Mapa/Lista permanece disponível; falha da imagem mostra a lista e mantém cadastro/seleção dos cômodos. Outras áreas não recebem a planta.

O usuário vincula cada região a um cômodo existente pelo diálogo **Vincular ambientes**. Nomes não criam vínculos automaticamente; não há inserção de cômodos, itens ou compras a partir da ilustração. O painel mostra os itens do mesmo ID cadastrado. Duplicidade de vínculo é rejeitada antes da gravação.

Os vínculos são preferências locais em localStorage, separadas por conta vinculada, e não integram a sincronização ou o backup JSON de domínio. Na troca de navegador/aparelho ou após vincular pela primeira vez a conta, configurá-los novamente. A validação inclui a origem do cadastro na auditoria, evitando reusar IDs sequenciais de registros de uma restauração diferente. Falha de armazenamento não confirma os vínculos. Essa limitação é informada no próprio diálogo.

Geometria e móveis continuam estimados; a escala permanece relativa. O layout reconstruído ainda precisa de conferência do usuário e medidas confiáveis. A integração não declara precisão dimensional nem encaixe de móveis.

## Arquivos e atualização

`scripts/prepare-house-map.mjs` copia apenas a isometria autocontida e gera `app/house-map-data.js` com regiões/âncoras. Fotos, vídeos, contatos e planta fotografada não foram copiados para `app` e não são servidos pelo Vercel. Regenerar os recursos de origem e executar `npm.cmd run map:prepare` quando o desenho mudar.

`app/house-map.js` gerencia os vínculos. `app/ui.js` renderiza as regiões e conserva as ações dos cômodos/itens reais. Shell atualizado para cache v9, sem skipWaiting; IndexedDB 2, schema 1 e protocolo remoto 1 mantidos. Nenhuma migração SQL necessária. Para receber a versão após o deploy, fechar todas as janelas do app antigo e reabrir conectado; não limpar os dados do navegador.

## Evidência e limites

`npm.cmd run check` e `git diff --check` passaram. A simulação da ferramenta de push passou sem mutações/rede. `npm.cmd test`: **37/37 passaram**, abrangendo domínio financeiro, Auth, IndexedDB/continuidade, SQL/RLS e os novos ensaios do mapa. Chromium precisou de acesso aos servidores locais fora da restrição de rede do sandbox; nenhuma credencial real foi usada nos testes.

`tests/house-map.test.mjs` verifica base vazia sem cadastros automáticos; associação a nomes distintos dos visuais; seleção por teclado com foco preservado; mesmos dados, geração e fila antes/depois do vínculo; duplicidade, quota, separação de conta e origem dos IDs; seleção equivalente pela lista; ampliação; larguras 320/360/390/412/1200 sem overflow; mapa/vínculo offline após recarga; ausência da planta nas outras cinco áreas; e fallback com imagem 404 que permite cadastrar/selecionar cômodo. Capturas em `docs/validacao/evidencias/mapa-integrado/`, com inspeção visual em 390 e 1200 px.

F014 permanece em andamento. CA-14/20/21/22 continuam parciais: teste físico no S23/Samsung Internet, revisão do apartamento e acessibilidade completa ainda pendentes. Outros requisitos e gates não foram concluídos por esta integração.
