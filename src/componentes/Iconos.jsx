// Iconos vectoriales de las reglas, trazados a mano para que hereden el color
// (currentColor) y queden nítidos a cualquier tamaño.

const base = {
  viewBox: '0 0 48 48',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
}

/** Poste indicador con dos tablas: la encrucijada. */
export function IconoEncrucijada() {
  return (
    <svg {...base}>
      <path d="M24 9v33" />
      <path d="M18 42h12" />
      <path d="M24 13h11l4 4-4 4H24z" />
      <path d="M24 25H13l-4 4 4 4h11z" />
      <circle cx="24" cy="8" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Dado de veinte caras visto de frente. */
export function IconoD20() {
  return (
    <svg {...base}>
      <path d="M24 5l16.5 9.5v19L24 43 7.5 33.5v-19z" />
      <path d="M24 5l-9 12.5h18z" />
      <path d="M15 17.5L7.5 14.5M33 17.5l7.5-3M15 17.5l9 17 9-17" />
      <path d="M24 34.5V43M15 17.5L7.5 33.5M33 17.5l7.5 16" />
    </svg>
  )
}

/** Espada en vertical: lo que suma en la tirada. */
export function IconoEspada() {
  return (
    <svg {...base}>
      <path d="M24 4l3.5 5v20h-7V9z" />
      <path d="M24 9v20" strokeOpacity="0.5" />
      <path d="M15 29h18v3H15z" />
      <path d="M22 32h4v7h-4z" />
      <circle cx="24" cy="42" r="2.4" />
    </svg>
  )
}

/** Cuatro sellos en rombo; uno de ellos ya arde. */
export function IconoSellos() {
  return (
    <svg {...base}>
      <path d="M24 6l5 5-5 5-5-5z" fill="currentColor" fillOpacity="0.9" />
      <path d="M11 19l5 5-5 5-5-5z" />
      <path d="M37 19l5 5-5 5-5-5z" />
      <path d="M24 32l5 5-5 5-5-5z" />
      <path d="M24 16v16M16 24h16" strokeOpacity="0.35" strokeDasharray="2 3" />
    </svg>
  )
}

/** Llama sobre monedas: aliento, oro y lo que se pierde. */
export function IconoAliento() {
  return (
    <svg {...base}>
      <path d="M24 5c1.5 5 6.5 7.5 6.5 13.5a6.5 6.5 0 0 1-13 0c0-3 1.5-4.5 2.5-6 .5 2.5 1.5 3.5 3 4 .3-4.5-.5-8 1-11.5z" />
      <path d="M24 22.5a2 2 0 0 0 2-2c0-1.2-.8-2-2-3.3-1.2 1.3-2 2.1-2 3.3a2 2 0 0 0 2 2z" fill="currentColor" fillOpacity="0.55" stroke="none" />
      <ellipse cx="24" cy="32" rx="12" ry="3.5" />
      <path d="M12 32v5c0 1.9 5.4 3.5 12 3.5s12-1.6 12-3.5v-5" />
      <path d="M12 37c0 1.9 5.4 3.5 12 3.5s12-1.6 12-3.5" strokeOpacity="0.5" />
    </svg>
  )
}

/** Lira: la música. */
export function IconoLira() {
  return (
    <svg {...base}>
      <path d="M14 8c-2 6-2 12 0 18 1.5 4.5 5 7.5 10 7.5s8.5-3 10-7.5c2-6 2-12 0-18" />
      <path d="M14 8c3 1 5 3 6 6M34 8c-3 1-5 3-6 6" />
      <path d="M17 12h14" />
      <path d="M20 12v20M24 12v21M28 12v20" strokeOpacity="0.8" />
      <path d="M24 33.5V42M18 42h12" />
    </svg>
  )
}

/** Escudo con muesca: la dificultad. */
export function IconoEscudo() {
  return (
    <svg {...base}>
      <path d="M24 5l14 5v11c0 9-6 16-14 21C16 37 10 30 10 21V10z" />
      <path d="M24 12v22" strokeOpacity="0.55" />
      <path d="M16 19l8-3 8 3" strokeOpacity="0.8" />
      <path d="M31 8l3 6-4 2" strokeOpacity="0.6" />
    </svg>
  )
}

/** Reloj de arena: la duración. */
export function IconoReloj() {
  return (
    <svg {...base}>
      <path d="M15 6h18M15 42h18" />
      <path d="M17 6v5c0 6 7 9 7 13s-7 7-7 13v5M31 6v5c0 6-7 9-7 13s7 7 7 13v5" />
      <path d="M20 12h8l-4 5z" fill="currentColor" fillOpacity="0.55" stroke="none" />
      <path d="M19 40h10l-5-9z" fill="currentColor" fillOpacity="0.55" stroke="none" />
    </svg>
  )
}

/** Pavesas: los efectos de fondo. */
export function IconoPavesas() {
  return (
    <svg {...base}>
      <path d="M24 8c1 6 3 9 9 10-6 1-8 4-9 10-1-6-3-9-9-10 6-1 8-4 9-10z" />
      <path d="M36 26c.5 3 1.5 4.5 4.5 5-3 .5-4 2-4.5 5-.5-3-1.5-4.5-4.5-5 3-.5 4-2 4.5-5z" fill="currentColor" fillOpacity="0.5" stroke="none" />
      <path d="M12 30c.4 2.4 1.2 3.6 3.6 4-2.4.4-3.2 1.6-3.6 4-.4-2.4-1.2-3.6-3.6-4 2.4-.4 3.2-1.6 3.6-4z" fill="currentColor" fillOpacity="0.5" stroke="none" />
      <path d="M8 44c5-4 10-6 16-6s11 2 16 6" strokeOpacity="0.45" />
    </svg>
  )
}

/** Capucha: el ladrón de caminos. */
export function IconoCapucha() {
  return (
    <svg {...base}>
      <path d="M24 5c-9 3-14 11-14 22v13h28V27c0-11-5-19-14-22z" />
      <path d="M15 30c3-6 6-9 9-9s6 3 9 9" />
      <path d="M17 40c2-4 4-6 7-6s5 2 7 6" strokeOpacity="0.6" />
      <path d="M20 26h2M26 26h2" strokeOpacity="0.9" />
    </svg>
  )
}

/** Cruz con cordón: el fraile. */
export function IconoCruz() {
  return (
    <svg {...base}>
      <path d="M10 6c4 6 9 9 14 9s10-3 14-9" strokeOpacity="0.6" />
      <path d="M24 15v27" />
      <path d="M15 24h18" />
      <path d="M21 20h6v4h-6zM21 34h6" strokeOpacity="0.7" />
      <circle cx="24" cy="24" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Arco tensado: combate a distancia. */
export function IconoArco() {
  return (
    <svg {...base}>
      <path d="M14 6c12 6 12 30 0 36" />
      <path d="M14 6l0 36" strokeOpacity="0.55" />
      <path d="M14 24h26" />
      <path d="M40 24l-5-3M40 24l-5 3" />
      <path d="M17 24l-4-2M17 24l-4 2" strokeOpacity="0.7" />
    </svg>
  )
}
