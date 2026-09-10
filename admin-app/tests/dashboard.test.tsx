import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from '../src/pages/DashboardPage';

test('renders the operational dashboard with period filter and quick actions', () => {
  render(<MemoryRouter><DashboardPage /></MemoryRouter>);

  expect(screen.getByRole('heading', { name: /visão geral/i })).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: /período do dashboard/i })).toHaveValue('Últimos 30 dias');
  expect(screen.getByRole('link', { name: /nova venda/i })).toHaveAttribute('href', '/admin/vendas');
  expect(screen.getByText(/aguardando aprovação/i)).toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox', { name: /período do dashboard/i }), { target: { value: 'Este mês' } });
  expect(screen.getByRole('combobox', { name: /período do dashboard/i })).toHaveValue('Este mês');
});
