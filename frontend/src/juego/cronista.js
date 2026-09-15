// El cronista: prepara el estado de la partida, se lo pide al backend y
// devuelve el JSON ya parseado.
//
// El prompt de cada encrucijada y la clave de API viven en el servidor
// (`backend/app/cronista/`). El navegador solo manda lo que pasa en su partida,
// así que la clave ya no viaja en el bundle ni se puede gastar desde fuera.

import * as api from './api'
import { ErrorApi } from './api'
import { OFICIOS } from './datos'
import { armasDe } from './derivados'
import { leerSesion } from './sesion'

export class CronistaNoDisponible extends Error {
  constructor(mensaje) {
    super(mensaje || 'El cronista no responde: entra con tu cuenta y el servidor escribirá la historia.')
    this.name = 'CronistaNoDisponible'
    this.amable = true
  }
}

/** Recorta al límite que acepta el backend, para no fallar por una cadena larga. */
const recortar = (t, n) => String(t ?? '').slice(0, n)

/**
 * Pide al cronista el siguiente fragmento.
 * @param {object} s       estado de la partida en el momento de pedir
 * @param {object|null} eleccion  opción elegida (null en el primer turno)
 * @param {object|null} tirada    resultado del d20 (null en el primer turno)
 * @param {{ largo: number }} ajustes
 * @returns {Promise<{ d: object, turno: number }>}
 */
export async function pedirCronica(s, eleccion, tirada, { largo }) {
  const sesion = leerSesion()
  if (!sesion) throw new CronistaNoDisponible()

  const turno = eleccion ? s.turno + 1 : 1
  const armas = armasDe(s)

  const estado = {
    jugador: recortar((s.nombre || '').trim() || 'sin nombre', 60),
    oficio: recortar((OFICIOS[s.oficio] || OFICIOS[0]).nombre, 60),
    turno,
    vida: s.vida + '/' + s.vidaMax,
    oro: Math.min(99999, Math.max(0, s.oro)),
    armaCuerpo: armas.cuerpo ? recortar(armas.cuerpo.nombre + ' (+' + armas.cuerpo.bono + ')', 120) : 'ninguna',
    armaDistancia: armas.distancia ? recortar(armas.distancia.nombre + ' (+' + armas.distancia.bono + ')', 120) : 'ninguna',
    zurron: s.inv.slice(0, 8).map((o) => recortar(o.nombre, 80)),
    rasgos: s.rasgos,
    lugar: recortar(s.lugar, 120),
    cronica: s.log.slice(-6).map((e) => recortar(e.texto, 4000)),
  }

  let d
  try {
    d = await api.encrucijada(sesion.token, {
      estado,
      eleccion: eleccion
        ? {
            texto: recortar(eleccion.texto, 300),
            rasgo: recortar(eleccion.rasgo, 20),
            riesgo: recortar(eleccion.riesgo, 20),
          }
        : null,
      tirada: tirada
        ? {
            cara: tirada.cara,
            mod: tirada.mod,
            total: tirada.total,
            dif: tirada.dif,
            resultado: tirada.resultado,
            objeto: tirada.objeto,
            combate: tirada.combate,
            arma: tirada.arma,
          }
        : null,
      largo,
    })
  } catch (e) {
    // La sesión ha caducado: se avisa en vez de enseñar un error críptico.
    if (e instanceof ErrorApi && e.estado === 401) {
      const caducada = new CronistaNoDisponible('Tu sesión ha caducado. Vuelve a entrar para seguir la crónica.')
      caducada.sesionCaducada = true
      throw caducada
    }
    throw e
  }

  if (!d) throw new Error('formato')
  return { d, turno }
}
