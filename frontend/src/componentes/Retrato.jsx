// Retrato ilustrado de un oficio dentro de un marco de piedra. Funde entre
// imágenes al cambiar de oficio o de variante; sin imagen, muestra el icono del
// oficio grabado.
//
// variante: 'cuerpo' (creador, vertical 3:4) | 'busto' (panel de partida, cuadrado)
// indice: qué retrato usar cuando el oficio tiene varios (clave.jpg, clave-2.jpg…)

import { useEffect, useState } from 'react'
import { retratoDe } from '../juego/imagenes'
import './Retrato.css'

const FUNDIDO_MS = 900

export default function Retrato({ oficio, indice = 0, Icono, variante = 'cuerpo', className = '' }) {
  const url = retratoDe(oficio, indice)
  const [capas, setCapas] = useState(() => [{ url, id: 0 }])

  // Estado derivado de las props: apilamos la imagen nueva sobre la anterior mientras dura el fundido.
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
    <div className={('retrato retrato--' + variante + ' ' + className).trim()} aria-hidden="true">
      <span className="retrato__piedra" />
      <div className="retrato__hueco">
        {capas.map((c) =>
          c.url ? (
            <div key={c.id} className="retrato__imagen" style={{ backgroundImage: `url(${c.url})` }} />
          ) : (
            <div key={c.id} className="retrato__marcador">
              {Icono && <Icono />}
              {variante === 'cuerpo' && <span className="retrato__aviso">Retrato por llegar</span>}
            </div>
          ),
        )}
        <span className="retrato__brillo" />
      </div>
    </div>
  )
}
