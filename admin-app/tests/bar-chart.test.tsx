import { fireEvent, render, screen } from '@testing-library/react';
import { BarChart } from '../src/components/ui/charts/BarChart';

const data = [
  { label: '10/09', values: { in: 120, out: 40 } },
  { label: '11/09', values: { in: 80, out: 60 } },
];
const series = [
  { key: 'in', label: 'Entradas', color: 'var(--green)' },
  { key: 'out', label: 'Saídas', color: 'var(--red)' },
];

test('renders a legend for two series and exposes the data as a table', () => {
  render(<BarChart data={data} series={series} formatValue={value => `R$ ${value}`} />);

  expect(screen.getAllByText('Entradas').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Saídas').length).toBeGreaterThan(0);

  fireEvent.click(screen.getByText('Ver dados em tabela'));
  const table = screen.getByRole('table');
  expect(table).toHaveTextContent('10/09');
  expect(table).toHaveTextContent('R$ 120');
  expect(table).toHaveTextContent('R$ 60');
});

test('shows the empty state instead of an empty chart', () => {
  render(<BarChart data={[]} series={series} emptyLabel="Sem movimentações." />);
  expect(screen.getByText('Sem movimentações.')).toBeInTheDocument();
});
