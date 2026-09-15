export default function Carga({ s, reintentar, irMenu }) {
  const pct = s.cargaPct + '%'
  return (
    <section className="carga surgir">
      <div className="carga__sello">
        <div className="carga__marco" />
        <div className="carga__aro" />
        <div className="carga__pct">{pct}</div>
      </div>
      <div className="carga__texto">
        <div className="sobretitulo">{s.error ? 'La tinta se ha corrido' : 'Tejiendo el primer día'}</div>
        <p className="carga__frase">{s.cargaFrase}</p>
      </div>
      <div className="carga__barra">
        <div className="carga__progreso" style={{ width: pct }} />
      </div>
      {s.error && (
        <div className="carga__error">
          <div className="error__texto">{s.error}</div>
          <div className="botonera botonera--centrada">
            <button type="button" className="btn-ghost btn-ghost--oro" onClick={reintentar}>Reintentar</button>
            <button type="button" className="btn-ghost" onClick={irMenu}>Volver al menú</button>
          </div>
        </div>
      )}
    </section>
  )
}
