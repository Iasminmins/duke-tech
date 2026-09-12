import { useEffect, useState } from 'react';

export function usePagination<T>(items: T[], pageSize = 20) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  useEffect(() => { if (page > pageCount) setPage(1); }, [pageCount, page]);
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize);
  return { page, setPage, pageCount, pageItems };
}

type PaginationProps = { page: number; pageCount: number; onChange: (page: number) => void; totalLabel?: string };

export function Pagination({ page, pageCount, onChange, totalLabel }: PaginationProps) {
  if (pageCount <= 1) return null;
  return <nav className="pagination" aria-label="Paginação">
    {totalLabel && <span className="pagination-total muted">{totalLabel}</span>}
    <div className="pagination-controls">
      <button type="button" className="btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>Anterior</button>
      <span className="pagination-status">Página {page} de {pageCount}</span>
      <button type="button" className="btn" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>Próxima</button>
    </div>
  </nav>;
}
