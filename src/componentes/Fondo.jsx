// Fondo ilustrado de la escena con fundido entre imágenes y un paneo muy lento.
// Recibe la `escena` del cronista ({ terreno, cielo }); sin escena o sin imagen
// para ella, muestra el fondo general.

import { useEffect, useState } from 'react'
import fondoBase from '../assets/fondo.jpg'
import { elegirFondo } from '../juego/fondos'
import './Fondo.css'

const FUNDIDO_MS = 1800

export default function Fondo({ escena, vivo = false, cielo = null }) {
  const url = elegirFondo(escena) || fondoBase
  const [capas, setCapas] = useState(() => [{ url, id: 0 }])

  // Estado derivado de la prop: si cambia la imagen, apilamos una capa nueva
  // encima; la anterior se queda debajo mientras dura el fundido.
  const ultima = capas[capas.length - 1]
  if (ultima.url !== url) {
    setCapas([ultima, { url, id: ultima.id + 1 }])
  }

  useEffect(() => {
    if (capas.length < 2) return undefined
    const t = setTimeout(() => setCapas((prev) => prev.slice(-1)), FUNDIDO_MS)
    return () => clearTimeout(t)
  }, [capas])

  return (
    <div className={'fondo' + (vivo ? ' fondo--vivo' : '') + (cielo ? ' fondo--cielo-' + cielo : '')} aria-hidden="true">
      {capas.map((c) => (
        <div key={c.id} className="fondo__capa" style={{ backgroundImage: `url(${c.url})` }} />
      ))}
    </div>
  )
}
