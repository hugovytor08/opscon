# Instalação e validação no Galaxy S23

Dispositivo informado pelo usuário em 11/10/2026: **Samsung Galaxy S23**, navegador **Samsung Internet**. Versões de Android/One UI/Samsung Internet ainda precisam ser verificadas no aparelho. Testes Chromium desktop são preparação; não equivalem ao teste físico.

O endereço localhost no computador não está publicado e não serve de endereço do telefone. Preparar origem HTTPS estável de teste antes deste roteiro; origem diferente tem outra base local e outra sessão. Nenhuma hospedagem pública foi configurada nesta sessão.

1. No aparelho, registrar as versões do sistema e do Samsung Internet. Abrir a origem HTTPS de teste no Samsung Internet, conferir versão do app e entrar na conta provisionada.
2. Verificar opção de instalação/adicionar à tela inicial oferecida pelo Samsung Internet na versão real. Instalar e abrir pelo ícone; registrar se abriu em janela própria e se a navegação/voltar funciona. Os nomes do menu não são presumidos antes de observar o aparelho.
3. Criar os registros artificiais do roteiro Supabase; aguardar confirmação. Abrir sessão limpa em outro navegador/aparelho e conferir IDs, vínculos e totais. Guardar um backup JSON fora do S23 e restaurá-lo em contexto limpo.
4. Fechar/reabrir com conexão desligada; cadastrar um item, conferir pendência e recarregar. Reconectar; conferir servidor e segundo browser. Enquanto pendente, o registro ainda não é recuperável se o S23 for perdido.
5. Testar seis áreas, mapa/lista, modais, teclado Samsung aberto, botões perto da navegação inferior, zoom, rotação e TalkBack. Verificar foco, contraste e alvos de toque; não liberar com ações encobertas pelo teclado.
6. Com um registro pendente, carregar uma atualização de teste. Fechar todas as janelas antigas e abrir a versão nova; comparar fila, IDs/totais e cache. Não ativar atualização no meio de formulário aberto. Ensaiar falha de download e retorno para build compatível.

Registrar evidências no relatório F016/CA antes de pedir decisão de publicação. Não limpar dados do aparelho em uso para simular perda: usar perfis/aparelhos de teste e cópias verificadas.
