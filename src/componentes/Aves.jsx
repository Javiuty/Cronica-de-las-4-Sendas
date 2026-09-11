// Aves que cruzan el cielo en las escenas de día. Bandadas pequeñas de siluetas
// SVG que aletean, con rumbo, altura, tamaño y velocidad al azar.

import { useEffect, useState } from 'react'
import './Aves.css'

const CIELOS_DE_DIA = new Set(['dia', 'amanecer', 'atardecer'])

let contador = 0
function nuevaBandada() {
  const derecha = Math.random() < 0.5
  const n = 1 + Math.floor(Math.random() * 4)
  return {
    id: ++contador,
    derecha,
    y: 6 + Math.random() * 26,                 // % de la altura, zona de cielo
    escala: 0.55 + Math.random() * 0.6,
    dur: 18 + Math.random() * 16,              // segundos de travesía
    aves: Array.from({ length: n }, (_, i) => ({
      dx: i * (16 + Math.random() * 10),
      dy: (i % 2 ? -1 : 1) * i * (5 + Math.random() * 4),
      fase: Math.random(),
    })),
  }
}

export default function Aves({ cielo, activo = true }) {
  const deDia = activo && CIELOS_DE_DIA.has(cielo)
  const [bandadas, setBandadas] = useState([])

  useEffect(() => {
    if (!deDia) return undefined
    let t = 0
    const soltar = () => {
      setBandadas((prev) => [...prev.slice(-3), nuevaBandada()])
      t = setTimeout(soltar, 9000 + Math.random() * 14000)
    }
    t = setTimeout(soltar, 2500 + Math.random() * 4000)
    return () => clearTimeout(t)
  }, [deDia])

  // Cada bandada se retira sola al terminar su travesía.
  const retirar = (id) => setBandadas((prev) => prev.filter((b) => b.id !== id))

  if (!deDia || !bandadas.length) return null
  return (
    <div className="aves" aria-hidden="true">
      {bandadas.map((b) => (
        <div
          key={b.id}
          className={'bandada' + (b.derecha ? ' bandada--derecha' : ' bandada--izquierda')}
          style={{ top: b.y + '%', '--dur': b.dur + 's', '--escala': b.escala }}
          onAnimationEnd={() => retirar(b.id)}
        >
          {b.aves.map((a, i) => (
            <svg key={i} className="ave" viewBox="0 0 40 20" style={{ left: a.dx, top: a.dy, '--fase': a.fase + 's' }}>
              <path className="ave__ala ave__ala--izq" d="M20 12 Q12 4 2 8" />
              <path className="ave__ala ave__ala--der" d="M20 12 Q28 4 38 8" />
            </svg>
          ))}
        </div>
      ))}
    </div>
  )
}
