import { useEffect, useRef, useState } from 'react'
import './Sesion.css'

/**
 * Marca de sesión: quién eres y por dónde se sale. Vive fuera de las pantallas,
 * en una esquina, y solo aparece cuando no estás jugando.
 *
 * Salir borra el guardado de este navegador (la partida sigue en el servidor),
 * así que el botón pide confirmación antes de hacerlo.
 */
export default function Sesion({ sesion, irCuenta, salir }) {
  const [seguro, setSeguro] = useState(false)
  const reloj = useRef(null)

  useEffect(() => () => clearTimeout(reloj.current), [])

  if (!sesion) return null

  const nombre = sesion.usuario.nombre || 'Sin nombre'

  const pulsarSalir = () => {
    if (seguro) {
      clearTimeout(reloj.current)
      salir()
      return
    }
    setSeguro(true)
    // Si no confirma, vuelve a su sitio solo.
    reloj.current = setTimeout(() => setSeguro(false), 4000)
  }

  return (
    <div className="marca">
      <button
        type="button"
        className="marca__quien"
        onClick={irCuenta}
        title="Tu cuenta y tus crónicas cerradas"
      >
        <span className="marca__sello" aria-hidden="true">{[...nombre][0].toUpperCase()}</span>
        <span className="marca__nombre">{nombre}</span>
      </button>

      <span className="marca__raya" aria-hidden="true" />

      <button
        type="button"
        className={'marca__salir' + (seguro ? ' marca__salir--seguro' : '')}
        onClick={pulsarSalir}
      >
        {seguro ? '¿Seguro?' : 'Salir'}
      </button>
    </div>
  )
}
