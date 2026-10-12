import { readFile, writeFile } from 'node:fs/promises';
const features = JSON.parse(await readFile(new URL('../features.json', import.meta.url), 'utf8'));
const updates = {
  F001: 'Galaxy S23/Samsung Internet identificados pelo usuário. Escrita offline e recuperação por conta preservadas; versões reais do sistema/browser e rotina de cartão seguem pendentes.',
  F002: 'Proposta concreta de cartão/fatura preparada em docs/produto/politica-cartao-proposta.md, com alocação revisável, sem inferir pagamento. Não congelada nem aprovada; demais políticas A/B ainda abertas.',
  F003: 'Protocolo snapshot/CAS documentado e implementado: fila atômica, UUID/base duráveis, recibos, proteção de geração, conflito conservador e migração inicial. Falta completar domínio A e validar recuperação Auth no fornecedor.',
  F005: 'Supabase Free avaliado nas fontes oficiais em 11/10/2026. Projeto de teste azqlukwlcotyhildfvwt fornecido pelo usuário; migração aplicada pelo dashboard. Hospedagem HTTPS/SMTP/backup administrativo/medição de volumes seguem pendentes; nenhum plano pago contratado.',
  F006: 'Incremento 0.3.0: IndexedDB2/fila atômicos, Auth PKCE/OTP, refresh/logout, sync/CAS/recibos/conflito/recuperação/quota. SQL e ensaio Supabase passaram; RLS, rollback e HTTP401 sem sessão comprovados. Conta provisionada; entrada/recuperação integrada pendentes. Em12/10, erro de link passou a ter aviso persistente/ação de recuperação, limpeza query/hash e shell de callback offline;14 testes de navegador afetados passaram. Prévia8767 reiniciada com HTTP200. Git iniciado, commit pendente;33 testes haviam passado antes dessa correção.',
  F015: 'Backup JSONv1 independente restaurado em contexto Chromium limpo com IDs/totais iguais; inválido e quota não produzem base parcial. Faltam modelo A completo, CSV/configurações/anexos e procedimento final no S23.',
  F016: 'Auditoria iniciada: matriz-ca.md cobre CA01–22 e riscos transversais com estados/evidências/lacunas/próximos testes. Testes locais ampliados, nenhum CA aprovado; depende de conclusão A/B/C, Supabase real e telefone físico.',
};
for (const feature of features) {
  if (updates[feature.id]) {
    feature.progress_note = updates[feature.id];
    feature.evidence_paths = ['docs/validacao/matriz-ca.md', 'docs/validacao/incremento-0.3.0.md'];
  }
  if (feature.id === 'F016') feature.status = 'in_progress';
}
await writeFile(new URL('../features.json', import.meta.url), JSON.stringify(features, null, 2) + '\n');
