// Cliente del backend. Todo lo que sale del navegador pasa por aquí.

// Mismo origen: en desarrollo lo reenvía Vite y en producción nginx. Solo hace
// falta VITE_API_URL si el backend vive en otro dominio.
const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

export class ErrorApi extends Error {
  constructor(estado, mensaje, amable = false) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.estado = estado
    // `amable` = es un aviso que se puede enseñar tal cual al jugador.
    this.amable = amable
  }
}

/** El mensaje que trae FastAPI, ya sea texto suelto o la lista de errores de validación. */
function detalleDe(datos) {
  const d = datos && datos.detail
  if (!d) return null
  if (typeof d === 'string') return d
  if (Array.isArray(d)) return d.map((x) => x.msg || '').filter(Boolean).join('; ') || null
  return null
}

async function pedir(ruta, { metodo = 'GET', cuerpo, token } = {}) {
  const cabeceras = {}
  if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json'
  if (token) cabeceras.Authorization = 'Bearer ' + token

  let r
  try {
    r = await fetch(BASE + ruta, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    })
  } catch {
    throw new ErrorApi(0, 'No se llegó al servidor. ¿Está levantado el backend?', true)
  }

  if (r.status === 204) return null

  const texto = await r.text()
  let datos = null
  try {
    datos = texto ? JSON.parse(texto) : null
  } catch {
    datos = null
  }

  if (!r.ok) {
    // 503 es «el servidor no tiene clave de API»: es un aviso, no una avería.
    throw new ErrorApi(r.status, detalleDe(datos) || r.statusText || 'error', r.status === 503)
  }
  return datos
}

// ---- Cuentas ----------------------------------------------------------------

export const registro = (datos) => pedir('/auth/registro', { metodo: 'POST', cuerpo: datos })
export const login = (datos) => pedir('/auth/login', { metodo: 'POST', cuerpo: datos })
export const yo = (token) => pedir('/auth/yo', { token })
export const guardarPreferencias = (token, prefs) =>
  pedir('/auth/yo/preferencias', { metodo: 'PUT', cuerpo: prefs, token })

// ---- Partidas ---------------------------------------------------------------

export const leerPartida = (token) => pedir('/partidas/en-curso', { token })
export const guardarPartida = (token, partida) =>
  pedir('/partidas/en-curso', { metodo: 'PUT', cuerpo: partida, token })
export const cerrarPartida = (token, cierre) =>
  pedir('/partidas/en-curso/cierre', { metodo: 'POST', cuerpo: cierre, token })
export const borrarPartida = (token) => pedir('/partidas/en-curso', { metodo: 'DELETE', token })
export const historial = (token) => pedir('/partidas', { token })

// ---- Cronista ---------------------------------------------------------------

export const encrucijada = (token, peticion) =>
  pedir('/cronista/encrucijada', { metodo: 'POST', cuerpo: peticion, token })
