# Casa Serena — protótipo interativo v0.2

Abra `index.html` em um servidor HTTP local. Exemplo, a partir desta pasta:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Depois, acesse `http://127.0.0.1:8765/`. A prévia foi verificada no navegador do Codex em largura móvel e desktop. Os dados existem apenas na memória da página e voltam ao estado inicial ao recarregar. Não há autenticação, banco de dados, envio de informações ou pagamento externo.

## O que experimentar

- **Início:** alternar o foco do cartão principal, guardar uma ideia só com o nome e abrir Mercado pelo atalho.
- **Casa:** selecionar Sala/Quarto/Cozinha no mapa ou na lista; abrir Sofá e Luminária nos mesmos registros de Compras.
- **Compras:** alternar detalhe de itens, comparar duas referências de luminária e simular compra sem pagamento automático; consultar parcelas do sofá.
- **Mercado:** adicionar um produto, marcar no carrinho, conferir subtotal parcial, fechar pelo total real e reutilizar a lista preservando a compra anterior.
- **Finanças:** mudar o período, expandir a composição e confirmar uma parcela do sofá, vendo saldo e obrigação se atualizarem.
- **Projetos:** conferir capa da viagem, próxima ação, tarefas e progresso independente da estimativa financeira.
- **Busca e Novo:** procurar registros das áreas e acessar as ações principais. No celular, Mercado fica no menu do cabeçalho e no atalho do Início; a barra inferior tem cinco destinos.

As transições de seleção, cartões, progresso, carrinho, abertura de modais e entrada de páginas são discretas. A opção do sistema operacional `prefers-reduced-motion` desativa o movimento.

## Relação com o guia aprovado

O protótipo usa recortes **das ilustrações** de D1, D2, D3 e M5 do `Guia_visual_Casa_Serena_referencias_aprovadas.pdf`, fornecido pelo usuário. As capturas inteiras não compõem a interface. Os módulos seguem a anatomia da proposta v1.2 §8: Início editorial; Casa espacial; Compras com lista visual e detalhe; Mercado com lista operacional; Finanças com período, cifras e agenda; Projetos com capa temática e trilha de tarefas.

Este é material de revisão de produto e design. Ainda faltam comparação fina lado a lado com **todas** as referências D1–D5/M1–M6, estados completos de erro/carregamento, acessibilidade medida e teste de uso com Vytor antes de encerrar F004. O mapa é visual e seus cômodos são selecionáveis por zonas; não existe planta 3D editável.
