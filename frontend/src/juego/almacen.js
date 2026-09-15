// Dónde se guarda la partida.
//
// `localStorage` sigue siendo la copia de trabajo: es síncrona, sobrevive a que
// el backend esté caído y permite jugar sin cuenta, igual que antes. Si hay
// sesión abierta, cada guardado se replica al servidor con un pequeño rebote,
// y al volver se coge la versión más avanzada de las dos.

import * as api from './api'
import { ErrorApi } from './api'
import { CLAVE } from './datos'
import { leerSesion } from './sesion'

const CLAVE_PREFS = 'cronica-cuatro-sendas-prefs'
const REBOTE = 1200

export const PREFS = ['optDificultad', 'optDuracion', 'optSellos', 'optMusica', 'optEfectos', 'optAmbiente']

// Los campos de la partida que se guardan, y solo esos.
const CAMPOS = [
  'turno', 'vida', 'vidaMax', 'oro', 'inv', 'armas', 'rasgos', 'lugar', 'ambiente',
  'prosa', 'opciones', 'log', 'escena', 'gastados', 'full', 'nombre', 'oficio',
  'objetoIni', 'retrato', 'optDificultad', 'optDuracion', 'optSellos',
]

/** La partida reducida a lo que se guarda. Vale igual para el disco y para la API. */
export function instantanea(s) {
  const out = {}
  for (const k of CAMPOS) out[k] = s[k]
  return out
}

/** Lo que devuelve el servidor, recortado a la forma del guardado. */
function desdeApi(p) {
  if (!p) return null
  const out = {}
  for (const k of CAMPOS) if (p[k] !== undefined && p[k] !== null) out[k] = p[k]
  return out
}

// ---- localStorage -----------------------------------------------------------

export function tieneSave() {
  try { return !!localStorage.getItem(CLAVE) } catch { return false }
}

export function leerSave() {
  try { return JSON.parse(localStorage.getItem(CLAVE) || 'null') } catch { return null }
}

function escribirLocal(datos) {
  try { localStorage.setItem(CLAVE, JSON.stringify(datos)) } catch { /* sin almacenamiento */ }
}

function borrarLocal() {
  try { localStorage.removeItem(CLAVE) } catch { /* sin almacenamiento */ }
}

export function leerPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem(CLAVE_PREFS) || '{}')
    const out = {}
    PREFS.forEach((k) => { if (p[k] !== undefined) out[k] = p[k] })
    return out
  } catch { return {} }
}

function escribirPrefsLocal(p) {
  try { localStorage.setItem(CLAVE_PREFS, JSON.stringify(p)) } catch { /* sin almacenamiento */ }
}

// ---- Réplica en el servidor -------------------------------------------------

let temporizador = null
let pendiente = null

async function volcar() {
  const datos = pendiente
  const sesion = leerSesion()
  pendiente = null
  if (!datos || !sesion) return
  try {
    await api.guardarPartida(sesion.token, datos)
  } catch {
    // La copia local ya está escrita: el siguiente guardado lo reintenta.
  }
}

/** Manda ya lo que hubiera pendiente (al salir al menú o cerrar la pestaña). */
export function volcarYa() {
  clearTimeout(temporizador)
  return volcar()
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => { volcarYa() })
}

// ---- Lo que usa la partida --------------------------------------------------

export function guardar(s) {
  const datos = instantanea(s)
  escribirLocal(datos)
  if (!leerSesion()) return
  pendiente = datos
  clearTimeout(temporizador)
  temporizador = setTimeout(volcar, REBOTE)
}

/** Cierra el libro: fuera del guardado y, si hay cuenta, al historial de crónicas. */
export function cerrar(partida, { muerto, tituloFinal, epilogo }) {
  clearTimeout(temporizador)
  pendiente = null
  borrarLocal()
  const sesion = leerSesion()
  if (!sesion) return
  // El PUT deja la fila con el último turno; el POST la manda al historial.
  api.guardarPartida(sesion.token, partida)
    .then(() => api.cerrarPartida(sesion.token, { muerto, tituloFinal, epilogo }))
    .catch(() => {})
}

export function guardarPrefs(s, replicar = true) {
  const p = {}
  PREFS.forEach((k) => { p[k] = s[k] })
  escribirPrefsLocal(p)
  // `replicar` en falso mientras se bajan las del servidor: si no, las de este
  // navegador pisarían las de la cuenta nada más abrir.
  if (!replicar) return
  const sesion = leerSesion()
  if (sesion) api.guardarPreferencias(sesion.token, p).catch(() => {})
}

/**
 * Al entrar o al abrir el juego con sesión: baja lo del servidor y lo concilia
 * con lo que hubiera en este navegador. Gana la partida más avanzada.
 * @returns {Promise<{ partida: object|null, preferencias: object }>}
 */
export async function sincronizar(sesion) {
  if (!sesion) return { partida: leerSave(), preferencias: leerPrefs() }

  let delServidor = null
  let preferencias = leerPrefs()
  try {
    const [partida, ficha] = await Promise.all([
      api.leerPartida(sesion.token),
      api.yo(sesion.token),
    ])
    delServidor = desdeApi(partida)
    if (ficha && ficha.preferencias && Object.keys(ficha.preferencias).length) {
      preferencias = {}
      PREFS.forEach((k) => { if (ficha.preferencias[k] !== undefined) preferencias[k] = ficha.preferencias[k] })
      escribirPrefsLocal(preferencias)
    }
  } catch (e) {
    // Token caducado: que lo sepa quien llama, para cerrar la sesión.
    if (e instanceof ErrorApi && e.estado === 401) throw e
    return { partida: leerSave(), preferencias }
  }

  const local = leerSave()
  const elegida =
    local && delServidor ? ((local.turno || 0) >= (delServidor.turno || 0) ? local : delServidor)
      : (local || delServidor)

  if (elegida) escribirLocal(elegida)
  else borrarLocal()

  // Si en este navegador se había avanzado más, se sube.
  if (elegida && elegida === local && delServidor) {
    api.guardarPartida(sesion.token, elegida).catch(() => {})
  }

  return { partida: elegida, preferencias }
}

/** Al salir de la cuenta: el guardado de este navegador era de esa cuenta. */
export function olvidarLocal() {
  clearTimeout(temporizador)
  pendiente = null
  borrarLocal()
}
