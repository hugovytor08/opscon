# Preparação da reformulação — 14/10/2026

Pedido: plano de implementação e prompt para outro agente executar nova direção visual, aplicação da planta fornecida e importação em lote de dados extraídos de imagens.

Produzidos:

- `docs/produto/plano-reformulacao-2026-10-14.md`: seis blocos de entrega, fontes, critérios visuais, geometria, gestos, separação de itens por cômodo, importação e preços, migrações e matriz IMP-01–07.
- `docs/produto/prompt-agente-reformulacao-2026-10-14.md`: instruções de implementação com referências, limites e critérios de conclusão.
- `docs/importacao/instrucoes-gpt-extrator.md`, `contrato-importacao.schema.json` e `exemplo-lote.json`: kit proposto de extração/revisão, sem declarar compatibilidade com o app atual.
- Atualização de `leia-primeiro.md` para preservar a nova direção e suas dependências.

Inspecionados o relatório do incremento 0.3.1 e do editor, modelo geométrico relativo atual, comandos de Mercado/finanças e validação SQL. Não foi reaplicada migração nem alterado código executável, dados, versão, features ou configuração de deploy por este planejamento. As alterações anteriores no workspace foram preservadas. Nenhum push/deploy ou criação de GPT/API foi executado.

Validação dos documentos: JSONs parseados, estrutura/campos/restrições do exemplo conferidos por verificador local e seis casos negativos rejeitados (centavos fracionários, campo inesperado, data inválida, versão desconhecida, decimal com vírgula e excesso de documentos). Conferidos total das linhas, valor do Pix correspondente e ausência de pagamento na conta de água do exemplo. São testes do material de planejamento; não são testes do importador, nem certificação por validador completo de JSON Schema. O executor deve usar validação completa e as regras de negócio ao implementar. Não foram instaladas dependências.

Os 37 testes do app citados são históricos do incremento 0.3.1; não repetidos porque este bloco só preparou documentos. Nenhum requisito/gate marcado completo. Novo JSON e isometria finais precisam ser anexados ou localizados pelo executor; o modelo anterior não tem escala métrica verificada.

Referências oficiais de imagem/limitações consultadas via habilidade OpenAI Docs e registradas no plano. O fluxo proposto não promete leitura perfeita de toda imagem nem disponibilidade de GPT personalizado na conta do usuário.
