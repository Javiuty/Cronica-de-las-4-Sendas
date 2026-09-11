import { useRef, useState } from 'react'
import { IconoArco, IconoCapucha, IconoCruz, IconoEspada } from '../componentes/Iconos'
import Retrato from '../componentes/Retrato'
import { OFICIOS, RAREZA } from '../juego/datos'
import { oficioDe, vidaInicialDe } from '../juego/derivados'
import { imagenObjeto } from '../juego/imagenes'
import './Personaje.css'

const ICONOS_OFICIOS = [IconoEspada, IconoCapucha, IconoCruz, IconoArco]

export default function Personaje({ s, elegirOficio, elegirObjeto, setNombre, nombreAzar, comenzar, irMenu }) {
  const of = oficioDe(s)
  const Icono = ICONOS_OFICIOS[s.oficio] || IconoEspada
  const objeto = of.objetos[s.objetoIni] || of.objetos[0]
  const dotacion = [
    of.oro + ' monedas',
    ...((of.armas && of.armas.length) ? of.armas.map((a) => a.nombre + ' +' + a.bono) : ['sin arma']),
    'aliento ' + vidaInicialDe(s),
  ]
  const [faltaNombre, setFaltaNombre] = useState(false)
  const inputNombre = useRef(null)

  const partir = () => {
    if (!(s.nombre || '').trim()) {
      setFaltaNombre(false)
      requestAnimationFrame(() => setFaltaNombre(true))
      inputNombre.current?.focus()
      return
    }
    comenzar()
  }
  const cambiarNombre = (e) => {
    if (faltaNombre && e.target.value.trim()) setFaltaNombre(false)
    setNombre(e)
  }

  return (
    <section className="personaje entrar">
      {/* ---- I · Oficio --------------------------------------------------- */}
      <div className="tablilla tablilla--columna personaje__col">
        <span className="tablilla__marco tablilla__marco--fino" aria-hidden="true" />
        <div className="personaje__scroll">
          <div className="sobretitulo sobretitulo--seccion">I · Tu oficio</div>
          <ul className="oficios">
            {OFICIOS.map((x, i) => {
              const on = i === s.oficio
              const IconoOf = ICONOS_OFICIOS[i]
              return (
                <li key={x.nombre} className={'placa oficio' + (on ? ' oficio--on' : '')} style={{ '--i': i }}>
                  <button type="button" className="oficio__boton" onClick={() => elegirOficio(i)} aria-pressed={on}>
                    <span className="medallon medallon--menor">{IconoOf && <IconoOf />}</span>
                    <span className="oficio__cuerpo">
                      <span className="oficio__nombre">{x.nombre}</span>
                      <span className="oficio__nota">{x.nota}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="sobretitulo sobretitulo--seccion personaje__seccion">Lo que llevas al partir</div>
          <div className="dotacion__fichas">
            {dotacion.map((d) => (
              <span key={d} className="chip">{d}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Retrato ------------------------------------------------------ */}
      <div className="personaje__centro">
        <div className="retrato-marco">
          <Retrato oficio={of} Icono={Icono} variante="cuerpo" />
          <div className="retrato-marco__pie">
            <div className="retrato-marco__oficio">{of.nombre}</div>
            <div className="retrato-marco__nota">{of.nota}</div>
          </div>
        </div>
      </div>

      {/* ---- II · Objeto y nombre ------------------------------------------ */}
      <div className="tablilla tablilla--columna personaje__col">
        <span className="tablilla__marco tablilla__marco--fino" aria-hidden="true" />
        <div className="personaje__scroll">
          <div className="sobretitulo sobretitulo--seccion">II · Lo que llevas encima</div>
          <ul className="objetos">
            {of.objetos.map((x, i) => {
              const on = i === s.objetoIni
              const rar = RAREZA[x.rareza] || RAREZA.comun
              const img = imagenObjeto(x.nombre)
              return (
                <li key={x.nombre} className={'placa objeto' + (on ? ' objeto--on' : '')} style={{ '--i': i }}>
                  <button type="button" className="objeto__boton" onClick={() => elegirObjeto(i)} aria-pressed={on}>
                    <span className="objeto__vitrina" style={{ '--rareza': rar.tinta }}>
                      {img ? (
                        <span className="objeto__imagen" style={{ backgroundImage: `url(${img})` }} />
                      ) : (
                        <span className="objeto__marcador"><span className="rombo objeto__rombo" /></span>
                      )}
                    </span>
                    <span className="objeto__cuerpo">
                      <span className="objeto__cabecera">
                        <span className="objeto__nombre">{x.nombre}</span>
                        <span className="objeto__rareza" style={{ color: rar.tinta }}>{rar.nombre}</span>
                      </span>
                      <span className="objeto__nota">{x.nota}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="objeto__elegido">
            Llevarás <strong>{objeto.nombre}</strong>. Los demás se quedan en casa.
          </p>

          <div className="sobretitulo sobretitulo--seccion personaje__seccion">III · Tu nombre</div>
          <div className="nombre">
            <div className="nombre__fila">
            <input
              ref={inputNombre}
              className={'nombre__input' + (faltaNombre ? ' nombre__input--error' : '')}
              value={s.nombre}
              onChange={cambiarNombre}
              onKeyDown={(e) => { if (e.key === 'Enter') partir() }}
              placeholder="Cómo te llaman"
              maxLength={24}
              aria-label="Tu nombre"
              aria-invalid={faltaNombre}
              aria-describedby={faltaNombre ? 'aviso-nombre' : undefined}
            />
            <button
              type="button"
              className="btn-ghost btn-ghost--mini nombre__azar"
              onClick={() => { setFaltaNombre(false); nombreAzar() }}
              title="Un nombre al azar"
            >
              Al azar
            </button>
            </div>
            <div className="nombre__aviso" id="aviso-nombre" role="alert" aria-live="polite">
              {faltaNombre ? 'El cronista necesita un nombre que escribir.' : ''}
            </div>
          </div>

          <div className="botonera botonera--pegada personaje__botonera">
            <button type="button" className="btn-oro btn-oro--ancho" onClick={partir}>Partir al camino</button>
            <button type="button" className="btn-ghost" onClick={irMenu}>Atrás</button>
          </div>
        </div>
      </div>
    </section>
  )
}
