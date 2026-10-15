# Meu espaço / Casa Serena

PWA pessoal para Casa, Compras, Mercado, Finanças e Projetos. Incremento de desenvolvimento 0.3.3: imagem antiga do Início removida; base visual escura, captura rápida e conferência local de rascunhos JSON mantidas. A gravação financeira de lotes ainda não está disponível. A V1 continua em andamento. Dados em IndexedDB, fila Supabase e backup independente preservados. Casa inclui o mapa estimado anterior; **Vincular ambientes** ainda guarda os vínculos somente no navegador. Referência de acabamento escolhida: ilustração antiga de Casa, com móveis ocultáveis na futura integração. Relatório em `docs/validacao/incremento-0.3.3.md`; backlog em `docs/produto/backlog-reformulacao.json`.

## Subir no GitHub

Git e GitHub CLI já estão instalados nesta máquina. Crie um **repositório vazio, preferencialmente privado**, na sua conta GitHub; não adicione README, licença ou gitignore pelo site.

No PowerShell, dentro da pasta do projeto:

```powershell
cd C:\opscon
gh auth login --hostname github.com --git-protocol https --web
gh auth setup-git
git config user.name "SEU NOME"
git config user.email "SEU EMAIL DE COMMIT OU NOREPLY DO GITHUB"
npm run github:push -- https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git --dry-run
npm run github:push -- https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
```

Substitua os exemplos pelos seus dados. Faça o login diretamente no navegador; não copie tokens para o chat. A ferramenta valida sintaxe e padrões comuns de credenciais, inclui alterações não ignoradas, cria o commit se necessário e faz push sem force. Ela preserva a branch atual (`master` neste checkout). Se o remoto já tiver histórico e não houver commit local, interrompe antes de alterar o repositório. A simulação não altera Git nem acessa o remoto.

`node_modules`, `tmp`, `output`, `.env`, chaves privadas e configuração local do Vercel ficam ignorados. A chave Supabase em `app/config.js` é pública; o banco exige autenticação e RLS. A verificação de padrões não substitui revisar os arquivos antes de tornar um repositório público.

## Deploy de teste no Vercel

1. Na sua conta Vercel, importe o repositório GitHub.
2. Mantenha **Root Directory na raiz do repositório** e selecione a branch enviada. O `vercel.json` define **Framework: Other**, sem instalação/build e **Output Directory: app**. Não são necessárias variáveis de ambiente para este incremento.
3. Faça o deploy e copie a URL HTTPS estável do projeto, por exemplo `https://SEU-PROJETO.vercel.app/`.
4. No Supabase, abra **Authentication → URL Configuration**. Defina **Site URL** com essa URL e adicione a mesma URL, incluindo `/` final, em **Redirect URLs**. Preserve os retornos locais se ainda for testar no computador. Não reaplique a migração SQL já instalada.
5. Abra essa URL no **Samsung Internet do Galaxy S23**, solicite um novo link de acesso e abra o link mais recente no mesmo navegador. Depois teste a instalação da PWA e o uso offline.

Use a mesma URL estável nos testes: cada origem tem seus próprios dados locais e verificador de login. Registros locais do computador não aparecem automaticamente no telefone; precisam estar confirmados na nuvem ou ser restaurados de um backup JSON. Mantenha um backup independente antes do teste.

Referências: [configuração Vercel](https://vercel.com/docs/project-configuration/vercel-json), [retornos de autenticação Supabase](https://supabase.com/docs/guides/auth/redirect-urls).

## Desenvolvimento e validação

```powershell
npm ci
npm run check
npm test
node scripts/serve.mjs --port=8767
```

Os testes de navegador requerem Playwright e Chrome disponíveis; em outra máquina, configure `CASA_PLAYWRIGHT_MODULE` e `CASA_CHROME_PATH`. A PWA em execução não depende desses pacotes. Os detalhes de aceite pendentes estão em [docs/validacao/matriz-ca.md](docs/validacao/matriz-ca.md).
