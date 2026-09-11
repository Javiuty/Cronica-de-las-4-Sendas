import { IconoArco, IconoCapucha, IconoCruz, IconoEspada } from '../componentes/Iconos'
import Retrato from '../componentes/Retrato'
import { BONO_OBJETO, COMBATES, MARCAS, ORDEN_ARMAS, RAREZA, RIESGO, TIPOS_ARMA, ZURRON_MAX } from '../juego/datos'
import {
  ajusteDe, armasDe, combateDe, dificultadDe, lecturaSellos, marcadorDe, oficioDe, riesgoDe, sellosDe,
} from '../juego/derivados'
import { imagenArma, imagenObjeto } from '../juego/imagenes'
import './Juego.css'

const ICONO_COMBATE = { cuerpo: IconoEspada, distancia: IconoArco }
const ICONO_OFICIO = { mercenario: IconoEspada, ladron: IconoCapucha, fraile: IconoCruz, cazador: IconoArco }

export default function Juego({ s, logRef, elegir, invocar, reintentar, abandonar }) {
  const of = oficioDe(s)
  const prosa = s.prosa || ''
  const capitular = prosa.charAt(0)
  const resto = prosa.slice(1)
  const hayOpciones = s.opciones.length > 0 && !s.cargando
  const sellos = sellosDe(s)
  const ajuste = ajusteDe(s)
  const armas = armasDe(s)

  return (
    <section className="juego">
      {/* Degradado que asienta el texto sobre el paisaje: transparente arriba, opaco abajo */}
      <div className="juego__degradado" aria-hidden="true" />

      {/* ---- Crónica flotante, abajo a la izquierda --------------------------- */}
      <div className="cronica">
        <header className="cronica__cabecera">
          <div className="cronica__lugar">{s.lugar || 'El umbral'}</div>
          <div className="cronica__meta">
            <span>{s.ambiente || ''}</span>
            <span className="cronica__marcador">{marcadorDe(s)}</span>
          </div>
        </header>

        <div ref={logRef} className="cronica__log">
          <p className="cronica__prosa entrar" key={prosa}>
            <span className="cronica__capitular">{capitular}</span>
            {resto}
          </p>
          {s.log.slice().reverse().map((e, i) => (
            <p key={s.log.length - 1 - i} className="cronica__pasado">{e.texto}</p>
          ))}
        </div>

        {s.cargando && (
          <div className="cronica__pluma">
            <span className="rombo rombo--latido" />
            El cronista moja la pluma…
          </div>
        )}

        {s.error && (
          <div className="cronica__error">
            {s.error}
            <div>
              <button type="button" className="btn-ghost btn-ghost--mini btn-error" onClick={reintentar}>Reintentar</button>
            </div>
          </div>
        )}

        {hayOpciones && (
          <div className="opciones">
            {s.opciones.map((op, i) => {
              const r = riesgoDe(op)
              const color = RIESGO[r]
              const combate = combateDe(op)
              const Icono = ICONO_COMBATE[combate]
              const arma = combate !== 'ninguno' ? armas[combate] : null
              return (
                <button key={i} type="button" className="opcion" style={{ '--i': i }} onClick={() => elegir(i)}>
                  <span className="opcion__marca">{MARCAS[i] || '·'}</span>
                  <span className="opcion__texto">{op.texto}</span>
                  <span className="opcion__etiquetas">
                    {Icono && (
                      <span
                        className={'opcion__combate' + (arma ? ' opcion__combate--armado' : '')}
                        title={
                          COMBATES[combate].nombre +
                          (arma ? ': ' + arma.nombre + ' suma +' + arma.bono : ': sin arma de este tipo, sin bono')
                        }
                      >
                        <Icono />
                        {arma ? '+' + arma.bono : COMBATES[combate].corto}
                      </span>
                    )}
                    <span className="opcion__etiqueta" style={{ color, borderColor: color }}>
                      {r + ' · dif ' + dificultadDe(op, ajuste)}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ---- Ficha traslúcida, a la derecha ------------------------------------ */}
      <aside className="lateral">
        <div className="lateral__scroll">
          <div className="placa heroe">
            <div className="heroe__retrato">
              <Retrato oficio={of} indice={s.retrato || 0} Icono={ICONO_OFICIO[of.clave]} variante="busto" className="heroe__figura" />
            </div>
            <div className="heroe__datos">
              <div className="heroe__nombre">{(s.nombre || '').trim() || 'Sin nombre'}</div>
              <div className="heroe__oficio">{of.nombre}</div>
            </div>
          </div>

          <div>
            <div className="lateral__etiqueta">Aliento</div>
            <div className="vida">
              <div className="vida__relleno" style={{ width: Math.round((s.vida / s.vidaMax) * 100) + '%' }} />
            </div>
            <div className="vida__texto">
              <span>Aliento {s.vida}/{s.vidaMax}</span>
              <span className="oro">{s.oro} monedas</span>
            </div>
          </div>

          <div>
            <div className="lateral__etiqueta">Los cuatro sellos</div>
            <div className="sellos">
              {sellos.map((x) => (
                <div key={x.clave} className="sello">
                  <div className={'placa sello__caja' + (x.on ? ' sello__caja--on' : '')}>
                    <div className="sello__relleno" style={{ height: x.pct + '%' }} />
                    <div className="sello__glifo">{x.glifo}</div>
                  </div>
                  <div className="sello__nombre">{x.nombre}</div>
                </div>
              ))}
            </div>
            <div className="lateral__lectura">{lecturaSellos(s)}</div>
          </div>

          <div>
            <div className="lateral__etiqueta">Armas</div>
            <div className="armas">
              {ORDEN_ARMAS.map((tipo) => {
                const a = armas[tipo]
                const t = TIPOS_ARMA[tipo]
                const Icono = ICONO_COMBATE[tipo]
                const rar = a ? RAREZA[a.rareza] || RAREZA.comun : null
                const img = a ? imagenArma(a.nombre) : null
                return (
                  <div
                    key={tipo}
                    className={'placa arma' + (a ? ' arma--con' : ' arma--sin')}
                    title={a ? t.nombre + ': suma +' + a.bono + ' cuando la opción pide ' + COMBATES[tipo].nombre : t.nombre + ': ninguna'}
                  >
                    {img ? (
                      <span className="arma__imagen" style={{ backgroundImage: `url(${img})`, '--rareza': rar.tinta }} aria-hidden="true" />
                    ) : (
                      <span className="arma__icono"><Icono /></span>
                    )}
                    <span className="arma__cuerpo">
                      <span className="arma__tipo">{t.nombre}</span>
                      <span className="arma__nombre" style={a ? { color: rar.tinta } : undefined}>{a ? a.nombre : t.vacio}</span>
                      <span className="arma__nota">{a ? a.nota || '' : t.notaVacio}</span>
                    </span>
                    <span className={'arma__bono' + (a ? '' : ' arma__bono--nulo')}>{a ? '+' + a.bono : '—'}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <div className="lateral__etiqueta lateral__etiqueta--fila">
              <span>Zurrón</span>
              <span className="lateral__contador">{s.inv.length} / {ZURRON_MAX}</span>
            </div>
            {s.inv.length === 0 ? (
              <div className="placa zurron__vacio">Nada más que polvo y migas.</div>
            ) : (
              <ul className="zurron">
                {s.inv.map((o) => {
                  const rar = RAREZA[o.rareza] || RAREZA.comun
                  const bono = BONO_OBJETO[o.rareza] || 1
                  const gastado = s.gastados.includes(o.nombre)
                  const armado = s.usando === o.nombre
                  const consumible = bono === 1
                  const estado = gastado ? 'Apagado' : armado ? 'En juego' : 'Usar +' + bono
                  const titulo = gastado
                    ? o.nombre + ': su sello ya se apagó.'
                    : o.nombre + ': suma +' + bono + ' en la próxima tirada' + (consumible ? ' y se gasta.' : '; después su sello se apaga.')
                  const img = imagenObjeto(o.nombre)
                  return (
                    <li key={o.nombre} className={'placa objeto-z' + (armado ? ' objeto-z--armado' : '') + (gastado ? ' objeto-z--gastado' : '')}>
                      <button
                        type="button"
                        className="objeto-z__boton"
                        onClick={() => invocar(o.nombre)}
                        disabled={gastado || s.cargando}
                        aria-pressed={armado}
                        title={titulo}
                      >
                        {img ? (
                          <span className="objeto-z__imagen" style={{ backgroundImage: `url(${img})`, '--rareza': rar.tinta }} aria-hidden="true" />
                        ) : (
                          <span className="objeto-z__rombo" style={{ '--rareza': rar.tinta }} aria-hidden="true" />
                        )}
                        <span className="objeto-z__cuerpo">
                          <span className="objeto-z__cabecera">
                            <span className="objeto-z__nombre" style={{ color: gastado ? undefined : rar.tinta }}>{o.nombre}</span>
                            <span className="objeto-z__rareza">{rar.nombre}</span>
                          </span>
                          {o.nota && <span className="objeto-z__nota">{o.nota}</span>}
                        </span>
                        <span className={'objeto-z__estado' + (armado ? ' objeto-z__estado--on' : '')}>{estado}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            <div className="lateral__nota">
              {s.usando
                ? 'Entra en juego «' + s.usando + '»: suma +' + (BONO_OBJETO[(s.inv.find((o) => o.nombre === s.usando) || {}).rareza] || 1) + ' en la próxima tirada.'
                : 'Toca un objeto para que entre en juego en la próxima tirada. Los comunes se gastan; los finos y arcanos se apagan.'}
            </div>
          </div>

          <button type="button" className="btn-ghost btn-salir" onClick={abandonar}>Guardar y salir al menú</button>
        </div>
      </aside>
    </section>
  )
}
