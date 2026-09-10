import { getPageContext } from '../src/pages/pageContext';

test('returns contextual copy for internal modules', () => {
  expect(getPageContext('/admin/clientes')).toEqual({ title: 'Clientes', subtitle: 'Gestão de clientes' });
  expect(getPageContext('/admin/financeiro')).toEqual({ title: 'Financeiro', subtitle: 'Fluxo financeiro' });
  expect(getPageContext('/admin/usuarios')).toEqual({ title: 'Usuários', subtitle: 'Equipe e permissões' });
});
