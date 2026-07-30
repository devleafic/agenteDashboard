/**
 * Titulo de pantalla — unico patron, espejo del de adminDashboard.
 *
 * Diferencia estructural con admin: alli hay rutas reales y el titulo
 * se monta por ruta. Aqui las 7 pantallas viven dentro de Home.js y se
 * cambian con un string `page`, asi que este componente se monta por
 * PANTALLA. Solo debe haber uno visible a la vez.
 *
 * Ademas normaliza la semantica: antes ninguna pantalla abria con <h1>
 * (todas usaban <h2>), asi que la ruta principal no tenia encabezado
 * de primer nivel.
 *
 *   <PageTitle lead="Tablero de" accent="Seguimiento" />
 */
const PageTitle = ({ lead, accent, sub, children, className = '' }) => (
  <header className={`bd-page-header ${className}`}>
    <h1 className="bd-page-title">
      {lead}
      {accent ? <> <span className="flame-text">{accent}</span></> : null}
      {children}
    </h1>
    {sub ? <p className="bd-page-sub">{sub}</p> : null}
  </header>
);

export default PageTitle;
