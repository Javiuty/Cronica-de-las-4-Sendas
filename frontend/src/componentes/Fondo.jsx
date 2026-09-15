// Fondo ilustrado de la escena con fundido entre imágenes y un paneo muy lento.
// Recibe la `escena` del cronista ({ terreno, cielo }); sin escena o sin imagen
// para ella, muestra el fondo general.

import { useEffect, useRef, useState } from 'react'
import fondoBase from '../assets/fondo.jpg'
import { elegirFondo } from '../juego/fondos'
import './Fondo.css'

const FUNDIDO_MS = 1700

export default function Fondo({ escena, vivo = false, cielo = null, paralaje = false }) {
  const url = elegirFondo(escena) || fondoBase
  const [capas, setCapas] = useState(() => [{ url, id: 0 }])
  const raiz = useRef(null)

  // Paralaje suave con el ratón: la imagen se desplaza hasta un 1,4 % hacia el cursor.
  useEffect(() => {
    const el = raiz.current
    if (!el) return undefined
    if (!paralaje || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.setProperty('--px', '0px')
      el.style.setProperty('--py', '0px')
      return undefined
    }
    let raf = 0
    let x = 0
    let y = 0
    const mover = (e) => {
      x = (e.clientX / window.innerWidth - 0.5) * 2
      y = (e.clientY / window.innerHeight - 0.5) * 2
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0
          el.style.setProperty('--px', (-x * 1.4) + '%')
          el.style.setProperty('--py', (-y * 1.0) + '%')
        })
      }
    }
    window.addEventListener('pointermove', mover)
    return () => {
      window.removeEventListener('pointermove', mover)
      cancelAnimationFrame(raf)
    }
  }, [paralaje])

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
    <div ref={raiz} className={'fondo' + (vivo ? ' fondo--vivo' : '') + (paralaje ? ' fondo--paralaje' : '') + (cielo ? ' fondo--cielo-' + cielo : '')} aria-hidden="true">
      {capas.map((c) => (
        <div key={c.id} className="fondo__capa" style={{ backgroundImage: `url(${c.url})` }} />
      ))}
      {vivo && <div className="fondo__pulso" />}
    </div>
  )
}
