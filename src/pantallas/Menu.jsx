import './Menu.css'

export default function Menu({ haySave, irPersonaje, continuar, irOpciones, irReglas, onAvivar }) {
  const entradas = [
    { titulo: 'Nuevo juego', nota: 'Forja un personaje y sal al camino.', ir: irPersonaje, off: false },
    { titulo: 'Continuar', nota: haySave ? 'Retoma la crónica donde la dejaste.' : 'No hay ninguna crónica guardada.', ir: continuar, off: !haySave },
    { titulo: 'Opciones', nota: 'Sonido, dificultad, duración y sellos.', ir: irOpciones, off: false },
    { titulo: 'Cómo se juega', nota: 'Eliges, rueda un d20, el mundo responde.', ir: irReglas, off: false },
  ]

  const avivar = (on) => () => onAvivar && onAvivar(on)

  return (
    <section className="menu entrar">
      <div className="menu__portada">
        <div className="sobretitulo sobretitulo--ancho">Rol narrativo · Fantasía medieval · Un d20</div>
        <h1 className="menu__titulo">
          Crónica<br />
          <span className="oro">de las cuatro</span><br />
          sendas
        </h1>
        <div className="menu__lema">
          <span className="raya raya--56" />
          <p>
            Elige un oficio y sal al camino. En cada encrucijada decides, rueda un d20 y el mundo responde.
            Honor, astucia, piedad y codicia se encienden con tus actos y, al cerrar el libro, dicen quién fuiste.
          </p>
        </div>
      </div>

      <nav className="menu__losas" aria-label="Menú principal">
        {entradas.map((m, i) => (
          <button
            key={m.titulo}
            type="button"
            className={'losa' + (m.off ? ' losa--off' : '')}
            style={{ '--i': i }}
            onClick={m.ir}
            disabled={m.off}
            onMouseEnter={m.off ? undefined : avivar(true)}
            onMouseLeave={avivar(false)}
            onFocus={m.off ? undefined : avivar(true)}
            onBlur={avivar(false)}
          >
            <span className="losa__marco" aria-hidden="true" />
            <span className="losa__brillo" aria-hidden="true" />
            <span className="losa__rombo" aria-hidden="true" />
            <span className="losa__cuerpo">
              <span className="losa__nombre">{m.titulo}</span>
              <span className="losa__nota">{m.nota}</span>
            </span>
          </button>
        ))}
      </nav>
    </section>
  )
}
