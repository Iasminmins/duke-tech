import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return <main className="login-page"><section className="login-card not-found">
    <img className="login-mascot" src={`${import.meta.env.BASE_URL}duke-mascote.webp`} alt="" width="72" height="109" />
    <h1>Página não encontrada</h1>
    <p>O endereço que você abriu não existe ou foi movido.</p>
    <Link className="btn primary" to="/admin">Voltar ao painel</Link>
  </section></main>;
}
