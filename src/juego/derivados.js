// Valores calculados a partir del estado. Puros: sin efectos ni hooks.

import { ARQUETIPO, BONO_POR_RAREZA, DEFAULTS, DIF, DIFICULTADES, DURACIONES, OFICIOS, PRESETS_APARIENCIA, RASGOS, RIESGO, TIPOS_ARMA } from './datos'

export const dificultadClaveDe = (s) => (DIFICULTADES[s.optDificultad] ? s.optDificultad : DEFAULTS.dificultad)
export const duracionClaveDe = (s) => (DURACIONES[s.optDuracion] ? s.optDuracion : DEFAULTS.duracion)
export const largoDe = (s) => DURACIONES[duracionClaveDe(s)].turnos
export const ajusteDe = (s) => DIFICULTADES[dificultadClaveDe(s)].ajuste
export const vidaInicialDe = (s) => DIFICULTADES[dificultadClaveDe(s)].vida
export const umbralDe = () => DEFAULTS.umbral
export const tonoDe = () => DEFAULTS.tono
export const sellosVisiblesDe = (s) => (s.optSellos === null || s.optSellos === undefined ? DEFAULTS.sellosVisibles : s.optSellos)
export const efectosDe = (s) => (s.optEfectos === null || s.optEfectos === undefined ? DEFAULTS.efectos : s.optEfectos)
export const musicaDe = (s) => (s.optMusica === null || s.optMusica === undefined ? DEFAULTS.musica : s.optMusica)
export const oficioDe = (s) => OFICIOS[s.oficio] || OFICIOS[0]
export const aparienciaDe = (s) => s.apariencia || PRESETS_APARIENCIA[s.oficio] || PRESETS_APARIENCIA[0]

/** Número a igualar con el d20, ya con el ajuste de dificultad de la partida. */
export function dificultadDe(op, ajuste = 0) {
  const r = RIESGO[op.riesgo] ? op.riesgo : 'incierta'
  return Math.max(6, Math.min(22, (Number(op.dificultad) || DIF[r] || 13) + ajuste))
}

/** Tipo de combate que pide una opción: 'cuerpo', 'distancia' o 'ninguno'. Acepta sinónimos del modelo. */
export function combateDe(op) {
  const c = String(op.combate || op.alcance || '').toLowerCase()
  if (c === 'cuerpo' || c === 'melee' || c === 'cerca') return 'cuerpo'
  if (c === 'distancia' || c === 'ranged' || c === 'lejos') return 'distancia'
  return 'ninguno'
}

/** Arma con tipo y bono válidos (1..4). Acepta armas antiguas sin tipo ni bono. */
export function normalizarArma(a) {
  if (!a || !a.nombre) return null
  const t = String(a.tipo || '').toLowerCase()
  const tipo = t === 'distancia' || t === 'ranged' ? 'distancia' : 'cuerpo'
  const rareza = BONO_POR_RAREZA[a.rareza] ? a.rareza : 'comun'
  const bono = Math.max(1, Math.min(4, Math.round(Number(a.bono)) || BONO_POR_RAREZA[rareza]))
  return { nombre: String(a.nombre), rareza, tipo, bono, nota: a.nota || '' }
}

export const ARMAS_VACIAS = { cuerpo: null, distancia: null }
export const armasDe = (s) => s.armas || ARMAS_VACIAS
export const armaPara = (s, combate) => (TIPOS_ARMA[combate] ? armasDe(s)[combate] || null : null)

export function riesgoDe(op) {
  return RIESGO[op.riesgo] ? op.riesgo : 'incierta'
}

export function arquetipo(s) {
  const r = s.rasgos
  let mejor = 'honor'
  RASGOS.forEach((x) => {
    if (r[x.clave] > r[mejor]) mejor = x.clave
  })
  return ARQUETIPO[mejor]
}

export function lecturaSellos(s) {
  const r = s.rasgos
  const u = umbralDe(s)
  const vivos = RASGOS.filter((x) => r[x.clave] >= u)
  if (!vivos.length) return 'Ningún sello ha prendido todavía. El cronista aún no sabe qué eres.'
  if (vivos.length === 1) return 'Un sello arde: ' + vivos[0].nombre.toLowerCase() + '. El cronista empieza a tener una opinión.'
  return vivos.map((x) => x.nombre.toLowerCase()).join(' y ') + ' arden a la vez. Eres más de una cosa.'
}

/** Los cuatro sellos con su valor, si están encendidos y su porcentaje de relleno. */
export function sellosDe(s) {
  const u = umbralDe(s)
  const visibles = sellosVisiblesDe(s)
  return RASGOS.map((x) => {
    const valor = s.rasgos[x.clave] || 0
    const on = valor >= u
    const pct = visibles ? Math.min(100, Math.round((valor / (u + 3)) * 100)) : on ? 100 : 0
    return { clave: x.clave, nombre: x.nombre, glifo: x.glifo, valor, on, pct }
  })
}

export function marcadorDe(s) {
  return s.fase === 'juego'
    ? 'Encrucijada ' + Math.max(1, s.turno) + ' de ' + largoDe(s)
    : 'Antes de la primera línea'
}
