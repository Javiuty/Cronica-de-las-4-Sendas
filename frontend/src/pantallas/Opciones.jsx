import { IconoEscudo, IconoLira, IconoPavesas, IconoReloj, IconoSellos } from '../componentes/Iconos'
import { DIFICULTADES, DURACIONES, ORDEN_DIFICULTADES, ORDEN_DURACIONES } from '../juego/datos'
import { ambienteDe, dificultadClaveDe, duracionClaveDe, efectosDe, musicaDe, sellosVisiblesDe } from '../juego/derivados'
import './Opciones.css'

function Ajuste({ i, Icono, nombre, nota, children }) {
  return (
    <li className="placa ajuste" style={{ '--i': i }}>
      <span className="medallon medallon--menor"><Icono /></span>
      <span className="ajuste__texto">
        <span className="ajuste__nombre">{nombre}</span>
        <span className="ajuste__nota">{nota}</span>
      </span>
      <span className="ajuste__control">{children}</span>
    </li>
  )
}

function Interruptor({ on, onClick, etiqueta }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={etiqueta}
      className={'interruptor' + (on ? ' interruptor--on' : '')}
      onClick={onClick}
    >
      <span className="interruptor__pista"><span className="interruptor__bola" /></span>
      <span className="interruptor__texto">{on ? 'Sí' : 'No'}</span>
    </button>
  )
}

function Segmentos({ orden, tabla, valor, elegir, etiqueta }) {
  return (
    <span className="segmentos" role="group" aria-label={etiqueta}>
      {orden.map((k) => (
        <button
          key={k}
          type="button"
          className={'segmento' + (k === valor ? ' segmento--on' : '')}
          aria-pressed={k === valor}
          onClick={() => elegir(k)}
        >
          {tabla[k].nombre}
        </button>
      ))}
    </span>
  )
}

export default function Opciones({ s, elegirDificultad, elegirDuracion, toggleSellos, toggleMusica, toggleEfectos, toggleAmbiente, irMenu }) {
  const musica = musicaDe(s)
  const ambiente = ambienteDe(s)
  const dificultad = dificultadClaveDe(s)
  const duracion = duracionClaveDe(s)
  const sellos = sellosVisiblesDe(s)
  const efectos = efectosDe(s)

  return (
    <section className="lienzo lienzo--arriba entrar opciones-lienzo">
      <div className="tablilla tablilla--opciones">
        <span className="tablilla__marco" aria-hidden="true" />

        <header className="opciones__cabecera">
          <div className="sobretitulo">Ajustes de la partida</div>
          <h2 className="tablilla__titulo">Opciones</h2>
          <div className="raya raya--60 raya--panel" />
        </header>

        <ul className="ajustes">
          <Ajuste i={0} Icono={IconoLira} nombre="Música" nota={musica ? 'Un bordón grave y notas de arpa acompañan el camino.' : 'El camino se anda en silencio.'}>
            <Interruptor on={musica} onClick={toggleMusica} etiqueta="Música" />
          </Ajuste>

          <Ajuste i={1} Icono={IconoPavesas} nombre="Sonido de ambiente" nota={ambiente ? 'Viento, lluvia, grillos o pájaros según la escena.' : 'Sin sonido de escena.'}>
            <Interruptor on={ambiente} onClick={toggleAmbiente} etiqueta="Sonido de ambiente" />
          </Ajuste>

          <Ajuste i={2} Icono={IconoEscudo} nombre="Dificultad" nota={DIFICULTADES[dificultad].nota}>
            <Segmentos orden={ORDEN_DIFICULTADES} tabla={DIFICULTADES} valor={dificultad} elegir={elegirDificultad} etiqueta="Dificultad" />
          </Ajuste>

          <Ajuste i={3} Icono={IconoReloj} nombre="Duración" nota={DURACIONES[duracion].nota}>
            <Segmentos orden={ORDEN_DURACIONES} tabla={DURACIONES} valor={duracion} elegir={elegirDuracion} etiqueta="Duración" />
          </Ajuste>

          <Ajuste i={4} Icono={IconoSellos} nombre="Sellos visibles" nota={sellos ? 'Ves cómo sube cada rasgo turno a turno.' : 'Solo se encienden al alcanzar el umbral.'}>
            <Interruptor on={sellos} onClick={toggleSellos} etiqueta="Sellos visibles" />
          </Ajuste>

          <Ajuste i={5} Icono={IconoPavesas} nombre="Efectos de fondo" nota={efectos ? 'Pavesas y niebla animadas tras la interfaz.' : 'Desactivados: menos carga gráfica.'}>
            <Interruptor on={efectos} onClick={toggleEfectos} etiqueta="Efectos de fondo" />
          </Ajuste>
        </ul>

        <div className="botonera opciones__botonera">
          <button type="button" className="btn-oro" onClick={irMenu}>Volver</button>
        </div>
      </div>
    </section>
  )
}
