// La sesión del jugador: el token de acceso y su ficha, en `localStorage`.
//
// El token va en `localStorage` y no en una cookie httpOnly porque el cliente
// y el backend viven en dominios distintos y esto es un juego, no un banco.
// Lo que sí se ha puesto a salvo es la clave de API: ya nunca llega al navegador.

const CLAVE_SESION = 'cronica-cuatro-sendas-sesion'

export function leerSesion() {
  try {
    const s = JSON.parse(localStorage.getItem(CLAVE_SESION) || 'null')
    return s && s.token ? s : null
  } catch {
    return null
  }
}

export function guardarSesion(sesion) {
  try {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))
  } catch { /* sin almacenamiento */ }
}

export function borrarSesion() {
  try {
    localStorage.removeItem(CLAVE_SESION)
  } catch { /* sin almacenamiento */ }
}
