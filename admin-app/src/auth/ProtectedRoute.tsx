import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';

function SessionSkeleton() {
  return (
    <div className="session-boot" role="status" aria-live="polite" aria-label="Carregando sessão">
      <div className="session-boot-mark">D</div>
      <div className="session-boot-bars">
        <span className="skeleton-bar" style={{ width: 160 }} />
        <span className="skeleton-bar" style={{ width: 120 }} />
      </div>
    </div>
  );
}

function SessionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="session-boot session-boot-error" role="alert">
      <div className="session-boot-mark error">!</div>
      <p>{message}</p>
      <button className="btn primary" onClick={onRetry}>Tentar novamente</button>
    </div>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, status, error, retry } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <SessionSkeleton />;
  if (status === 'error') return <SessionError message={error} onRetry={retry} />;
  if (!session) {
    // Preserva a rota de origem para retornar após o login, sem criar loop:
    // só redireciona quando de fato não há sessão (nunca durante o loading).
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
