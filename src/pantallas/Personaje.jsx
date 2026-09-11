import { useRef, useState } from 'react'
import Figura3D from '../componentes/Figura3D'
import { IconoArco, IconoCapucha, IconoCruz, IconoEspada } from '../componentes/Iconos'
import { BARBAS, CAPAS, COLORES_PELO, OFICIOS, OJOS, PELOS, PIELES, RAREZA, ROPAS, TOCADOS } from '../juego/datos'
import { aparienciaDe, oficioDe, vidaInicialDe } from '../juego/derivados'
import './Personaje.css'

const ICONOS_OFICIOS = [IconoEspada, IconoCapucha, IconoCruz, IconoArco]

function Muestras({ colores, valor, elegir, etiqueta, conNinguna = false }) {
  return (
    <span className="muestras" role="group" aria-label={etiqueta}>
      {conNinguna && (
        <button
          type="button"
          className={'muestra muestra--ninguna' + (valor === null ? ' muestra--on' : '')}
          aria-pressed={valor === null}
          aria-label="Sin capa"
          title="Sin capa"
          onClick={() => elegir(null)}
        />
      )}
      {colores.map((c) => (
        <button
          key={c}
          type="button"
          className={'muestra' + (c === valor ? ' muestra--on' : '')}
          aria-pressed={c === valor}
          aria-label={c}
          style={{ background: `linear-gradient(160deg, ${c} 0%, ${c} 55%, rgba(0,0,0,.35) 100%)`, backgroundColor: c }}
          onClick={() => elegir(c)}
        />
      ))}
    </span>
  )
}

function Segmentos({ lista, valor, elegir, etiqueta }) {
  return (
    <span className="segmentos segmentos--mini" role="group" aria-label={etiqueta}>
      {lista.map((x) => (
        <button
          key={x.clave}
          type="button"
          className={'segmento' + (x.clave === valor ? ' segmento--on' : '')}
          aria-pressed={x.clave === valor}
          onClick={() => elegir(x.clave)}
        >
          {x.nombre}
        </button>
      ))}
    </span>
  )
}

function Fila({ etiqueta, children }) {
  return (
    <div className="aspecto__fila">
      <span className="aspecto__etiqueta">{etiqueta}</span>
      <span className="aspecto__control">{children}</span>
    </div>
  )
}

export default function Personaje({ s, elegirOficio, elegirObjeto, setApariencia, aparienciaAzar, setNombre, comenzar, irMenu }) {
  const of = oficioDe(s)
  const ap = aparienciaDe(s)
  const [faltaNombre, setFaltaNombre] = useState(false)
  const inputNombre = useRef(null)

  const partir = () => {
    if (!(s.nombre || '').trim()) {
      setFaltaNombre(false)
      // Reinicia la animación aunque ya estuviera marcado
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
  const objeto = of.objetos[s.objetoIni] || of.objetos[0]
  const conModelo = !!of.modelo
  const dotacion = [of.oro + ' monedas', ...((of.armas && of.armas.length) ? of.armas.map((a) => a.nombre + ' +' + a.bono) : ['sin arma']), 'aliento ' + vidaInicialDe(s)]

  return (
    <section className="personaje entrar">
      {/* ---- I · Oficio y III · Objeto ------------------------------------ */}
      <div className="tablilla tablilla--columna personaje__col personaje__col--izq">
        <span className="tablilla__marco tablilla__marco--fino" aria-hidden="true" />
        <div className="personaje__scroll">
          <div className="sobretitulo sobretitulo--seccion">I · Tu oficio</div>
          <ul className="oficios">
            {OFICIOS.map((x, i) => {
              const on = i === s.oficio
              const Icono = ICONOS_OFICIOS[i]
              return (
                <li key={x.nombre} className={'placa oficio' + (on ? ' oficio--on' : '')} style={{ '--i': i }}>
                  <button type="button" className="oficio__boton" onClick={() => elegirOficio(i)} aria-pressed={on}>
                    <span className="medallon medallon--menor">{Icono && <Icono />}</span>
                    <span className="oficio__cuerpo">
                      <span className="oficio__nombre">{x.nombre}</span>
                      <span className="oficio__nota">{x.nota}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="sobretitulo sobretitulo--seccion personaje__seccion">III · Lo que llevas encima</div>
          <div className="objetos">
            {of.objetos.map((x, i) => {
              const on = i === s.objetoIni
              const rar = RAREZA[x.rareza] || RAREZA.comun
              return (
                <button
                  key={i}
                  type="button"
                  className={'placa objeto' + (on ? ' objeto--on' : '')}
                  onClick={() => elegirObjeto(i)}
                  aria-pressed={on}
                >
                  <span className="objeto__vitrina">
                    <Figura3D modo="objeto" clave={x.nombre} className="objeto__figura" />
                  </span>
                  <span className="objeto__rareza" style={{ color: rar.tinta }}>
                    {x.rareza === 'comun' ? 'común' : x.rareza}
                  </span>
                  <span className="objeto__nombre">{x.nombre}</span>
                </button>
              )
            })}
          </div>
          <p className="objeto__nota">{objeto.nota}</p>
          <div className="dotacion__fichas">
            {dotacion.map((d) => (
              <span key={d} className="chip">{d}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Figura, nombre y botones ------------------------------------- */}
      <div className="personaje__centro">
        <div className="vitrina">
          <div className="vitrina__marco" />
          <div className="vitrina__suelo" />
          <Figura3D
            modo="avatar"
            encuadre="cuerpo"
            datos={{ apariencia: ap, oficio: of.nombre, modelo: of.modelo || null }}
            className="vitrina__figura"
          />
        </div>
        <div className="nombre">
          <div className="sobretitulo sobretitulo--seccion sobretitulo--centrado">Tu nombre</div>
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
          <div className="nombre__aviso" id="aviso-nombre" role="alert" aria-live="polite">
            {faltaNombre ? 'El cronista necesita un nombre que escribir.' : ''}
          </div>
        </div>
        <div className="botonera botonera--pegada personaje__botonera">
          <button type="button" className="btn-oro btn-oro--ancho" onClick={partir}>Partir al camino</button>
          <button type="button" className="btn-ghost" onClick={irMenu}>Atrás</button>
        </div>
      </div>

      {/* ---- II · Aspecto ------------------------------------------------- */}
      <div className="tablilla tablilla--columna personaje__col personaje__col--der">
        <span className="tablilla__marco tablilla__marco--fino" aria-hidden="true" />
        <div className="personaje__scroll">
          <div className="aspecto__cabecera">
            <div className="sobretitulo sobretitulo--seccion">II · Tu aspecto</div>
            {!conModelo && (
              <button type="button" className="btn-ghost btn-ghost--mini" onClick={aparienciaAzar} title="Aspecto al azar">
                Al azar
              </button>
            )}
          </div>
          {conModelo ? (
            <div className="placa aspecto__fijo">
              <span className="aspecto__fijo-titulo">Figura tallada</span>
              <span className="aspecto__fijo-texto">
                Este oficio tiene su propia figura, con ropa y armas ya labradas. Su aspecto no se cambia aquí.
              </span>
            </div>
          ) : (
            <>
          <Fila etiqueta="Piel">
            <Muestras colores={PIELES} valor={ap.piel} elegir={(v) => setApariencia({ piel: v })} etiqueta="Tono de piel" />
          </Fila>
          <Fila etiqueta="Pelo">
            <Segmentos lista={PELOS} valor={ap.pelo} elegir={(v) => setApariencia({ pelo: v })} etiqueta="Peinado" />
          </Fila>
          <Fila etiqueta="Color">
            <Muestras colores={COLORES_PELO} valor={ap.colorPelo} elegir={(v) => setApariencia({ colorPelo: v })} etiqueta="Color de pelo" />
          </Fila>
          <Fila etiqueta="Ojos">
            <Muestras colores={OJOS} valor={ap.ojos || OJOS[0]} elegir={(v) => setApariencia({ ojos: v })} etiqueta="Color de ojos" />
          </Fila>
          <Fila etiqueta="Barba">
            <Segmentos lista={BARBAS} valor={ap.barba} elegir={(v) => setApariencia({ barba: v })} etiqueta="Barba" />
          </Fila>
          <Fila etiqueta="Tocado">
            <Segmentos lista={TOCADOS} valor={ap.tocado} elegir={(v) => setApariencia({ tocado: v })} etiqueta="Tocado" />
          </Fila>
          <Fila etiqueta="Ropa">
            <Muestras colores={ROPAS} valor={ap.ropa} elegir={(v) => setApariencia({ ropa: v })} etiqueta="Color de ropa" />
          </Fila>
          <Fila etiqueta="Capa">
            <Muestras colores={CAPAS} valor={ap.capa ?? null} elegir={(v) => setApariencia({ capa: v })} etiqueta="Color de capa" conNinguna />
          </Fila>
          <p className="aspecto__nota">
            {ap.tocado === 'capucha' || ap.tocado === 'yelmo'
              ? 'El tocado cubre el pelo; la capucha toma el color de la capa.'
              : 'Cada oficio trae un aspecto; cámbialo a tu gusto o déjalo al azar.'}
          </p>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
