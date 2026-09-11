import { useRef, useState } from 'react'
import { IconoArco, IconoCapucha, IconoCruz, IconoEspada } from '../componentes/Iconos'
import Retrato from '../componentes/Retrato'
import { OFICIOS, RAREZA, TIPOS_ARMA } from '../juego/datos'
import { oficioDe, vidaInicialDe } from '../juego/derivados'
import { imagenObjeto, retratoDe, retratosDe } from '../juego/imagenes'
import './Personaje.css'

const ICONOS_OFICIOS = [IconoEspada, IconoCapucha, IconoCruz, IconoArco]

export default function Personaje({ s, elegirOficio, elegirObjeto, elegirRetrato, setNombre, nombreAzar, comenzar, irMenu }) {
  const of = oficioDe(s)
  const Icono = ICONOS_OFICIOS[s.oficio] || IconoEspada
  const objeto = of.objetos[s.objetoIni] || of.objetos[0]
  const rarezaObjeto = RAREZA[objeto.rareza] || RAREZA.comun
  const variantes = retratosDe(of)
  const indice = Math.min(s.retrato || 0, Math.max(0, variantes.length - 1))
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
  const girarRetrato = (paso) => {
    if (variantes.length < 2) return
    elegirRetrato((indice + paso + variantes.length) % variantes.length)
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
              const mini = retratoDe(x)
              return (
                <li key={x.nombre} className={'placa oficio' + (on ? ' oficio--on' : '')} style={{ '--i': i }}>
                  <button type="button" className="oficio__boton" onClick={() => elegirOficio(i)} aria-pressed={on}>
                    <span className="oficio__mini">
                      {mini ? (
                        <span className="oficio__mini-imagen" style={{ backgroundImage: `url(${mini})` }} />
                      ) : (
                        <span className="oficio__mini-icono">{IconoOf && <IconoOf />}</span>
                      )}
                    </span>
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
          <ul className="dotacion">
            <li className="dotacion__fila"><span>Monedas</span><strong>{of.oro}</strong></li>
            <li className="dotacion__fila"><span>Aliento</span><strong>{vidaInicialDe(s)}</strong></li>
            {['cuerpo', 'distancia'].map((tipo) => {
              const a = (of.armas || []).find((w) => w.tipo === tipo)
              return (
                <li key={tipo} className={'dotacion__fila' + (a ? '' : ' dotacion__fila--vacia')}>
                  <span>{TIPOS_ARMA[tipo].nombre}</span>
                  <strong>{a ? a.nombre + ' +' + a.bono : TIPOS_ARMA[tipo].vacio}</strong>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {/* ---- Retrato ------------------------------------------------------ */}
      <div className="personaje__centro">
        <div className="retrato-marco">
          <Retrato oficio={of} indice={indice} Icono={Icono} variante="cuerpo" />
          <div className="retrato-marco__pie">
            <div className="retrato-marco__oficio">{of.nombre}</div>
            <div className="retrato-marco__nota">{of.nota}</div>
          </div>
          {variantes.length > 1 && (
            <div className="variantes" role="group" aria-label="Variantes del retrato">
              <button type="button" className="variantes__flecha" onClick={() => girarRetrato(-1)} aria-label="Retrato anterior">‹</button>
              <span className="variantes__puntos">
                {variantes.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={'variantes__punto' + (i === indice ? ' variantes__punto--on' : '')}
                    onClick={() => elegirRetrato(i)}
                    aria-label={'Retrato ' + (i + 1)}
                    aria-pressed={i === indice}
                  />
                ))}
              </span>
              <button type="button" className="variantes__flecha" onClick={() => girarRetrato(1)} aria-label="Retrato siguiente">›</button>
            </div>
          )}
        </div>
      </div>

      {/* ---- II · Objeto y III · Nombre ------------------------------------ */}
      <div className="tablilla tablilla--columna personaje__col">
        <span className="tablilla__marco tablilla__marco--fino" aria-hidden="true" />
        <div className="personaje__scroll">
          <div className="sobretitulo sobretitulo--seccion">II · Lo que llevas encima</div>
          <ul className="losetas">
            {of.objetos.map((x, i) => {
              const on = i === s.objetoIni
              const rar = RAREZA[x.rareza] || RAREZA.comun
              const img = imagenObjeto(x.nombre)
              return (
                <li key={x.nombre} className="loseta-item" style={{ '--i': i }}>
                  <button
                    type="button"
                    className={'loseta' + (on ? ' loseta--on' : '')}
                    style={{ '--rareza': rar.tinta }}
                    onClick={() => elegirObjeto(i)}
                    aria-pressed={on}
                    title={x.nombre + ' (' + rar.nombre + '): ' + x.nota}
                  >
                    <span className="loseta__vitrina">
                      {img ? (
                        <span className="loseta__imagen" style={{ backgroundImage: `url(${img})` }} />
                      ) : (
                        <span className="loseta__marcador"><span className="rombo loseta__rombo" /></span>
                      )}
                      <span className="loseta__rareza">{rar.nombre}</span>
                    </span>
                    <span className="loseta__nombre">{x.nombre}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="placa objeto-elegido">
            <span className="objeto-elegido__rombo rombo" style={{ '--rareza': rarezaObjeto.tinta }} aria-hidden="true" />
            <span className="objeto-elegido__cuerpo">
              <span className="objeto-elegido__nombre">{objeto.nombre}</span>
              <span className="objeto-elegido__nota">{objeto.nota}</span>
            </span>
          </div>

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
