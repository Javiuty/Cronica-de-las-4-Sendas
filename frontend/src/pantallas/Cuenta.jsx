import { useState } from 'react'
import { OFICIOS } from '../juego/datos'
import './Cuenta.css'

function Campo({ id, etiqueta, tipo = 'text', valor, onChange, autoComplete, nota }) {
  return (
    <label className="campo" htmlFor={id}>
      <span className="campo__etiqueta">{etiqueta}</span>
      <input
        id={id}
        className="campo__caja"
        type={tipo}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
      />
      {nota && <span className="campo__nota">{nota}</span>}
    </label>
  )
}

/** La puerta del juego: sin cuenta no hay crónica, porque el cronista escribe desde el servidor. */
function Portal({ s, entrar, registrarse }) {
  const [modo, setModo] = useState('entrar')
  const [correo, setCorreo] = useState('')
  const [nombre, setNombre] = useState('')
  const [contrasena, setContrasena] = useState('')
  const nuevo = modo === 'nuevo'

  const enviar = (e) => {
    e.preventDefault()
    if (s.cuentaCargando) return
    if (nuevo) registrarse({ correo, nombre, contrasena })
    else entrar({ correo, contrasena })
  }

  return (
    <section className="menu entrar portal">
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
            Entra con tu cuenta: la crónica se guarda y te sigue a cualquier navegador.
          </p>
        </div>
      </div>

      <div className="tablilla tablilla--portal">
        <span className="tablilla__marco" aria-hidden="true" />

        <header className="cuenta__cabecera">
          <div className="sobretitulo">El registro del cronista</div>
          <h2 className="tablilla__titulo">{nuevo ? 'Da tu nombre' : 'Entra'}</h2>
          <div className="raya raya--60 raya--panel" />
        </header>

        <div className="segmentos cuenta__modos" role="group" aria-label="Entrar o crear cuenta">
          <button
            type="button"
            className={'segmento' + (!nuevo ? ' segmento--on' : '')}
            aria-pressed={!nuevo}
            onClick={() => setModo('entrar')}
          >
            Ya tengo cuenta
          </button>
          <button
            type="button"
            className={'segmento' + (nuevo ? ' segmento--on' : '')}
            aria-pressed={nuevo}
            onClick={() => setModo('nuevo')}
          >
            Crear una
          </button>
        </div>

        <form className="cuenta__forma" onSubmit={enviar}>
          <Campo id="cuenta-correo" etiqueta="Correo" tipo="email" valor={correo} onChange={setCorreo} autoComplete="email" />
          {nuevo && (
            <Campo id="cuenta-nombre" etiqueta="Cómo te llamas" valor={nombre} onChange={setNombre} autoComplete="nickname" />
          )}
          <Campo
            id="cuenta-contrasena"
            etiqueta="Contraseña"
            tipo="password"
            valor={contrasena}
            onChange={setContrasena}
            autoComplete={nuevo ? 'new-password' : 'current-password'}
            nota={nuevo ? 'Ocho caracteres o más.' : null}
          />

          {s.cuentaError && <p className="cuenta__error" role="alert">{s.cuentaError}</p>}

          <button type="submit" className="btn-oro cuenta__enviar" disabled={s.cuentaCargando}>
            {s.cuentaCargando ? 'Un momento…' : nuevo ? 'Crear cuenta y entrar' : 'Entrar'}
          </button>
        </form>
      </div>
    </section>
  )
}

/** Lista de crónicas cerradas: lo que queda de cada partida terminada. */
function Cronicas({ cronicas }) {
  if (!cronicas.length) {
    return <p className="cuenta__vacio">Todavía no has cerrado ningún libro. La primera crónica que termine aparecerá aquí.</p>
  }
  return (
    <ul className="cronicas">
      {cronicas.map((c, i) => (
        <li key={c.id} className="placa cronica" style={{ '--i': i }}>
          <span className="cronica__cabeza">
            <span className="cronica__titulo">{c.tituloFinal || 'Sin nombre'}</span>
            <span className={'cronica__marca' + (c.muerto ? ' cronica__marca--muerto' : '')}>
              {c.muerto ? 'Murió' : 'Cerró el libro'}
            </span>
          </span>
          <span className="cronica__linea">
            {c.nombre || 'Sin nombre'} · {(OFICIOS[c.oficio] || OFICIOS[0]).nombre} · {c.turno} encrucijadas
          </span>
          {c.epilogo && <span className="cronica__epilogo">{c.epilogo}</span>}
        </li>
      ))}
    </ul>
  )
}

/** Con sesión abierta: quién eres y qué crónicas has cerrado. */
function Ficha({ s, salir, irMenu }) {
  return (
    <section className="lienzo lienzo--arriba entrar cuenta-lienzo">
      <div className="tablilla tablilla--cuenta">
        <span className="tablilla__marco" aria-hidden="true" />

        <header className="cuenta__cabecera">
          <div className="sobretitulo">Tu nombre en el registro</div>
          <h2 className="tablilla__titulo">{s.sesion.usuario.nombre}</h2>
          <div className="raya raya--60 raya--panel" />
        </header>

        <p className="cuenta__lema">
          {s.sesion.usuario.correo} · tus partidas y tus opciones viajan contigo.
        </p>

        <h3 className="cuenta__seccion">Crónicas cerradas</h3>
        <Cronicas cronicas={s.cronicas} />

        <div className="botonera cuenta__botonera">
          <button type="button" className="btn-ghost" onClick={salir}>Salir de la cuenta</button>
          <button type="button" className="btn-oro" onClick={irMenu}>Volver</button>
        </div>
      </div>
    </section>
  )
}

export default function Cuenta({ s, entrar, registrarse, salir, irMenu }) {
  return s.sesion
    ? <Ficha s={s} salir={salir} irMenu={irMenu} />
    : <Portal s={s} entrar={entrar} registrarse={registrarse} />
}
