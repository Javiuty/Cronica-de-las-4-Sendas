import { sellosDe } from '../juego/derivados'
import './Fin.css'

export default function Fin({ s, irPersonaje, irMenu }) {
  const sellos = sellosDe(s)
  return (
    <section className="lienzo lienzo--arriba fin-lienzo">
      <div className="tablilla tablilla--fin">
        <span className="tablilla__marco" aria-hidden="true" />

        <header className="fin__cabecera">
          <div className="sobretitulo">{s.muerto ? 'Aquí acaba' : 'El cronista cierra el libro'}</div>
          <h2 className="tablilla__titulo fin__titulo">{s.tituloFinal || 'Sin nombre en el margen'}</h2>
          <div className="raya raya--64 raya--fin" />
        </header>

        <p className="fin__epilogo">{s.epilogo}</p>

        <ul className="fin__sellos">
          {sellos.map((x, i) => (
            <li key={x.clave} className={'placa fin__sello' + (x.on ? ' fin__sello--on' : '')} style={{ '--i': i }}>
              <span className="fin__glifo">{x.glifo}</span>
              <span className="fin__nombre">{x.nombre}</span>
              <span className="fin__valor">{x.valor}</span>
            </li>
          ))}
        </ul>

        <div className="botonera botonera--envuelta fin__botonera">
          <button type="button" className="btn-oro" onClick={irPersonaje}>Otra crónica</button>
          <button type="button" className="btn-ghost" onClick={irMenu}>Menú principal</button>
        </div>
      </div>
    </section>
  )
}
