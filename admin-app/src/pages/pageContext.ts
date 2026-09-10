export type PageContext = { title: string; subtitle: string };

const contexts: Array<[string, PageContext]> = [
  ['/admin/clientes', { title: 'Clientes', subtitle: 'Gestão de clientes' }],
  ['/admin/aparelhos', { title: 'Aparelhos', subtitle: 'Dispositivos e histórico de reparos' }],
  ['/admin/comandas', { title: 'Comandas', subtitle: 'Fila de reparos e atendimentos' }],
  ['/admin/agenda', { title: 'Agenda', subtitle: 'Entregas e compromissos' }],
  ['/admin/estoque', { title: 'Estoque', subtitle: 'Controle de inventário' }],
  ['/admin/produtos', { title: 'Produtos', subtitle: 'Catálogo e peças da assistência' }],
  ['/admin/vendas', { title: 'Vendas', subtitle: 'Vendas e pagamentos' }],
  ['/admin/financeiro', { title: 'Financeiro', subtitle: 'Fluxo financeiro' }],
  ['/admin/relatorios', { title: 'Relatórios', subtitle: 'Indicadores da operação' }],
  ['/admin/usuarios', { title: 'Usuários', subtitle: 'Equipe e permissões' }],
  ['/admin/configuracoes', { title: 'Configurações', subtitle: 'Preferências da loja' }],
];

export function getPageContext(pathname: string): PageContext {
  if (pathname === '/admin') return { title: 'Visão geral', subtitle: 'Operação em tempo real' };
  return contexts.find(([path]) => pathname.startsWith(path))?.[1] || { title: 'Gestão', subtitle: 'Operação em tempo real' };
}
