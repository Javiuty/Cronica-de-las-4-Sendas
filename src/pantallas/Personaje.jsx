import { useRef, useState } from 'react'
import { IconoArco, IconoCapucha, IconoCruz, IconoEspada } from '../componentes/Iconos'
import { OFICIOS, RAREZA, TIPOS_ARMA } from '../juego/datos'
import { oficioDe, vidaInicialDe } from '../juego/derivados'
import { imagenArma, imagenObjeto, retratoDe, retratosDe } from '../juego/imagenes'
import './Personaje.css'

const ICONOS_OFICIOS = [IconoEspada, IconoCapucha, IconoCruz, IconoArco]

export default function Personaje({ s, elegirOficio, elegirObjeto, elegirRetrato, setNombre, nombreAzar, comenzar, irMenu }) {
  const of = oficioDe(s)
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
      {/* ---- Cuatro paneles: el elegido se ensancha y despliega su ficha -------- */}
      <div className="paneles">
        {OFICIOS.map((x, i) => {
          const on = i === s.oficio
          const Icono = ICONOS_OFICIOS[i]
          const url = on ? retratoDe(x, indice) : retratoDe(x)
          return (
            <div key={x.nombre} className={'panel' + (on ? ' panel--on' : '')} style={{ '--i': i }}>
              <span className="panel__piedra" aria-hidden="true" />
              <div className="panel__hueco">
                <div className="panel__retrato">
                  {url ? (
                    <div key={url} className="panel__imagen" style={{ backgroundImage: `url(${url})` }} />
                  ) : (
                    <div className="panel__marcador"><Icono /></div>
                  )}
                  <div className="panel__pie">
                    <div className="panel__nombre">{x.nombre}</div>
                    {!on && <div className="panel__nota">{x.nota}</div>}
                  </div>
                  {on && variantes.length > 1 && (
                    <div className="variantes" role="group" aria-label="Variantes del retrato">
                      <button type="button" className="variantes__flecha" onClick={() => girarRetrato(-1)} aria-label="Retrato anterior">‹</button>
                      <span className="variantes__puntos">
                        {variantes.map((_, k) => (
                          <button
                            key={k}
                            type="button"
                            className={'variantes__punto' + (k === indice ? ' variantes__punto--on' : '')}
                            onClick={() => elegirRetrato(k)}
                            aria-label={'Retrato ' + (k + 1)}
                            aria-pressed={k === indice}
                          />
                        ))}
                      </span>
                      <button type="button" className="variantes__flecha" onClick={() => girarRetrato(1)} aria-label="Retrato siguiente">›</button>
                    </div>
                  )}
                </div>

                {on ? (
                  <div className="ficha">
                    <p className="ficha__frase">{x.nota}</p>

                    <div className="sobretitulo sobretitulo--seccion ficha__seccion">Lo que llevas al partir</div>
                    <ul className="dotacion">
                      <li className="dotacion__fila"><span>Monedas</span><strong>{x.oro}</strong></li>
                      <li className="dotacion__fila"><span>Aliento</span><strong>{vidaInicialDe(s)}</strong></li>
                      {['cuerpo', 'distancia'].map((tipo) => {
                        const a = (x.armas || []).find((w) => w.tipo === tipo)
                        const img = a ? imagenArma(a.nombre) : null
                        return (
                          <li key={tipo} className={'dotacion__fila' + (a ? '' : ' dotacion__fila--vacia')}>
                            <span>{TIPOS_ARMA[tipo].nombre}</span>
                            <strong className="dotacion__valor">
                              {img && <span className="dotacion__arma" style={{ backgroundImage: `url(${img})` }} aria-hidden="true" />}
                              {a ? a.nombre + ' +' + a.bono : TIPOS_ARMA[tipo].vacio}
                            </strong>
                          </li>
                        )
                      })}
                    </ul>

                    <div className="sobretitulo sobretitulo--seccion ficha__seccion">Lo que llevas encima</div>
                    <ul className="losetas">
                      {x.objetos.map((o, k) => {
                        const elegido = k === s.objetoIni
                        const rar = RAREZA[o.rareza] || RAREZA.comun
                        const img = imagenObjeto(o.nombre)
                        return (
                          <li key={o.nombre} className="loseta-item" style={{ '--i': k }}>
                            <button
                              type="button"
                              className={'loseta' + (elegido ? ' loseta--on' : '')}
                              style={{ '--rareza': rar.tinta }}
                              onClick={() => elegirObjeto(k)}
                              aria-pressed={elegido}
                              title={o.nombre + ' (' + rar.nombre + '): ' + o.nota}
                            >
                              <span className="loseta__vitrina">
                                {img ? (
                                  <span className="loseta__imagen" style={{ backgroundImage: `url(${img})` }} />
                                ) : (
                                  <span className="loseta__marcador"><span className="rombo loseta__rombo" /></span>
                                )}
                                <span className="loseta__rareza">{rar.nombre}</span>
                              </span>
                              <span className="loseta__nombre">{o.nombre}</span>
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
                  </div>
                ) : (
                  <button type="button" className="panel__elegir" onClick={() => elegirOficio(i)} aria-label={'Elegir ' + x.nombre} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ---- Banda inferior: nombre y botones ---------------------------------- */}
      <div className="tablilla banda">
        <span className="tablilla__marco tablilla__marco--fino" aria-hidden="true" />
        <div className="banda__contenido">
          <button type="button" className="btn-ghost banda__atras" onClick={irMenu}>Atrás</button>
          <div className="nombre">
            <div className="nombre__fila">
              <span className={'nombre__etiqueta' + (faltaNombre ? ' nombre__etiqueta--aviso' : '')} id="aviso-nombre" role={faltaNombre ? 'alert' : undefined}>
                {faltaNombre ? 'El cronista necesita un nombre' : 'Tu nombre'}
              </span>
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
          </div>
          <button type="button" className="btn-oro banda__partir" onClick={partir}>Partir al camino</button>
        </div>
      </div>
    </section>
  )
}
