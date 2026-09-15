import { IconoAliento, IconoD20, IconoEncrucijada, IconoEspada, IconoSellos } from '../componentes/Iconos'
import { REGLAS } from '../juego/datos'
import './Reglas.css'

const ICONOS_REGLAS = [IconoEncrucijada, IconoD20, IconoEspada, IconoSellos, IconoAliento]

export default function Reglas({ irPersonaje, irMenu }) {
  return (
    <section className="lienzo lienzo--arriba entrar reglas-lienzo">
      <div className="tablilla tablilla--reglas">
        <span className="tablilla__marco" aria-hidden="true" />

        <header className="reglas__cabecera">
          <div className="sobretitulo">Cinco reglas y ninguna más</div>
          <h2 className="tablilla__titulo">Cómo se juega</h2>
          <div className="raya raya--60 raya--panel" />
        </header>

        <ol className="reglas">
          {REGLAS.map((r, i) => {
            const Icono = ICONOS_REGLAS[i]
            return (
              <li key={r.n} className="placa regla" style={{ '--i': i }}>
                <span className="medallon">{Icono && <Icono />}</span>
                <span className="regla__cuerpo">
                  <span className="regla__numero">Regla {r.n}</span>
                  <span className="regla__titulo">{r.t}</span>
                  <span className="regla__texto">{r.d}</span>
                </span>
              </li>
            )
          })}
        </ol>

        <div className="botonera reglas__botonera">
          <button type="button" className="btn-oro" onClick={irPersonaje}>Entendido, a jugar</button>
          <button type="button" className="btn-ghost" onClick={irMenu}>Volver</button>
        </div>
      </div>
    </section>
  )
}
