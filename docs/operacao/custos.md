# Custos e limites consultados — 11/10/2026

Supabase permanece recomendado para banco remoto/Auth/Postgres/RLS. Nenhum projeto/plano foi contratado; limites não são garantia de gratuidade permanente. [Preços oficiais](https://supabase.com/pricing).

| Componente | Condição atual | Efeito e pendência |
|---|---|---|
| Supabase Free | US$0/mês; banco500MB; egress5GB; arquivos1GB; dois projetos ativos;50 mil usuários ativos mensais | Avaliação sem cobrança; medir tráfego dos snapshots, banco/recibos e crescimento. Pausa após1 semana sem atividade; sem backup automático. Não oferece SLA de produção |
| Supabase Pro | A partir de US$25/mês; backups diários retidos7 dias | Referência para decisão futura, não escolhido; add-ons/excedentes/impostos não estimados |
| Auth e e-mail | SMTP padrão restrito à equipe;2 e-mails/hora, sem garantia de entrega | OTP preparado; validar conta pessoal. SMTP de produção precisa fornecedor/domínio e custo verificados antes de configurar. [Fonte](https://supabase.com/docs/guides/auth/auth-smtp) |
| Hospedagem HTTPS | Ainda não selecionada/configurada | Origem estável, cabeçalhos de proteção/cache e publicação somente após gate; nenhum valor mensal presumido |
| Backup independente | JSON exportável, sem fornecedor definido para cópia externa | Guardar fora do aparelho; rotina/cadência/retencão a combinar e testar. Syncronização não substitui backup |
| Dependências de desenvolvimento | PGlite0.5.8 fixado em package-lock, somente testes locais | Não enviado ao app e não requer servidor/assinatura. Node/Chromium/Playwright do runtime local. Manutenção das ferramentas ainda precisa procedimento |

A proposta usa conjunto completo por commit (limite2MB), recibos pequenos com hash e apenas um snapshot atual por usuário. O tráfego efetivo depende de volume/histórico; não há base para estimar duração da franquia. F005 continua em andamento até ambiente, manutenção, backup e volumes serem validados. Serviços pagos exigem decisão expressa.
