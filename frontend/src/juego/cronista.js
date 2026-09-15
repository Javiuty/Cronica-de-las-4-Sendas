// El cronista: construye el prompt de cada encrucijada, llama al modelo y
// devuelve el JSON parseado.
//
// Orden de preferencia para hablar con el modelo:
//   1. `window.claude.complete` si existe (el visor de Claude, como el original).
//   2. El SDK de Anthropic directamente desde el navegador, si hay una clave en
//      `VITE_ANTHROPIC_API_KEY`. Solo para desarrollo local: la clave viaja al
//      cliente. Para publicar, sustituye `completar` por una llamada a tu backend.
//   3. Si no hay ninguna de las dos, se lanza un error con un mensaje amable.

import Anthropic from '@anthropic-ai/sdk'
import { ESQUEMA, OFICIOS } from './datos'
import { armasDe } from './derivados'

const MODELO = import.meta.env.VITE_CLAUDE_MODEL || 'claude-opus-5'
const MAX_TOKENS = 4096

export class CronistaNoDisponible extends Error {
  constructor() {
    super('El cronista no responde: este juego necesita ejecutarse dentro del visor de Claude o con una clave de API en VITE_ANTHROPIC_API_KEY para escribir la historia.')
    this.name = 'CronistaNoDisponible'
    this.amable = true
  }
}

let cliente = null
function clienteSdk() {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) return null
  if (!cliente) cliente = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  return cliente
}

async function completar({ system, messages, max_tokens }) {
  if (window.claude && typeof window.claude.complete === 'function') {
    return window.claude.complete({ system, max_tokens, messages })
  }

  const sdk = clienteSdk()
  if (!sdk) throw new CronistaNoDisponible()

  const respuesta = await sdk.beta.messages.create({
    model: MODELO,
    max_tokens,
    system,
    messages,
    // Si el modelo declina la petición, el servidor la reintenta con el
    // modelo de respaldo recomendado en lugar de devolver el rechazo.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    // Esfuerzo medio: margen para cumplir las reglas de estilo sin que la
    // encrucijada tarde demasiado en llegar.
    output_config: { effort: 'medium' },
  })

  if (respuesta.stop_reason === 'refusal') {
    throw new Error('el cronista se negó a escribir esta escena')
  }
  return respuesta.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
}

export function parsear(txt) {
  if (!txt) return null
  const a = txt.indexOf('{')
  const b = txt.lastIndexOf('}')
  if (a < 0 || b < a) return null
  try {
    return JSON.parse(txt.slice(a, b + 1))
  } catch {
    return null
  }
}

// Reglas de estilo: lenguaje de hoy y escenas que se puedan ver.
const ESTILO =
  'COMO ESCRIBES. Espanol de Espana actual y llano: el que usaria hoy alguien contando la escena a un amigo. ' +
  'La ambientacion es medieval; el vocabulario, no. Prohibidos los arcaismos y las palabras rebuscadas: nada de "yantar", "otrora", "doquier", "menester", "vusted", "fementido", "ora... ora", "aljibe", "sayo", "zaguan", "postigo", "ristre", "yelmo" (di "casco"), "cota" (di "cota de malla" solo si hace falta), "faltriquera" (di "bolsa"), "mesnada", "hueste", "lid", "lidiar", "pardiez", "vive Dios", "ribazo" (di "terraplen" o "cuesta"), "sien" (di "frente" o "lado de la cabeza"). ' +
  'Si una palabra no la diria alguien hoy por la calle, cambiala por la normal. ' +
  'Tampoco uses el tratamiento de "vos" ni formas como "habeis", "sois" o "vuestra merced": la gente se habla de tu o de usted. ' +
  'EJEMPLO MAL: "Otrora, en el zaguan de la posada, el mesonero os conmina a yantar antes de partir." ' +
  'EJEMPLO BIEN: "En el portal de la posada, el dueno te dice que comas algo antes de salir. Tiene las manos manchadas de harina y no te quita ojo." ' +
  'Frases cortas, de menos de veinte palabras, con sujeto y verbo claros. Una imagen concreta por frase: cosas que se ven, se oyen, se huelen o se tocan (una puerta que no cierra, barro hasta el tobillo, un hombre que no deja de mirarte las manos). ' +
  'Como mucho una comparacion o metafora por escena; nada de metaforas encadenadas ni frases "bonitas" sin contenido. Sin adornos, sin metadiscurso, sin preguntas retoricas.\n' +
  'COMO CONSTRUYES LA ESCENA. La prosa tiene 4 a 6 frases en este orden: (1) donde estas y que ves, en concreto: el sitio, la hora, la luz, el tiempo. (2) Quien o que hay delante: una o dos personas o cosas con un detalle fisico que las haga reconocibles (ropa, gesto, edad, herramienta). (3) Que esta pasando ahora mismo y por que te afecta. (4) Que hay que decidir en este momento. ' +
  'El lector tiene que poder dibujar la escena al terminar de leer. Si al releer no sabe donde esta o quien le habla, esta mal escrita.\n' +
  'LAS OPCIONES son acciones concretas y visibles ("Empujar la mesa contra la puerta"), no intenciones vagas ("Intentar hacer algo"). Cada una en el mismo espanol llano.\n' +
  'COHERENCIA ENTRE RELATO Y ESTADO. Todo lo que la prosa diga que el jugador gana, pierde, rompe, gasta, entrega, paga, cobra o le roban tiene que aparecer en "efectos" en esta misma respuesta: si pierde o entrega la daga, "quitar_arma": "cuerpo"; si se le rompe el arco, "quitar_arma": "distancia"; si paga tres monedas, "oro": -3; si le hieren, "vida" negativo; si le dan o coge algo, "objeto" o "arma"; si se gasta o pierde un objeto, "quitar" con su nombre exacto. Y al reves: no cambies "efectos" sin que la prosa lo cuente. ' +
  'Antes de responder, repasa la prosa frase a frase buscando cambios de inventario, dinero o salud y comprueba que cada uno esta en "efectos". Solo puedes quitar objetos que esten en "zurron" y armas que esten en "arma_cuerpo" o "arma_distancia" del estado; no describas al jugador usando algo que no lleva.\n'

function sistema({ tono, largo, restantes, tirada, eleccion }) {
  return (
    'Eres el cronista de un juego de rol de fantasia medieval. Escribes en segunda persona ("tu"), en presente. Llamas al jugador por su nombre de vez en cuando, y su oficio tine lo que la gente espera de el. Tono del mundo: ' +
    tono +
    '. El mundo es coherente: la gente tiene intereses, las heridas duelen, el dinero pesa. No moralizas: cuentas lo que pasa.\n' +
    ESTILO +
    'La partida dura ' + largo + ' encrucijadas. ' +
    (restantes <= 0
      ? 'ESTE ES EL CIERRE: pon "fin": true y escribe el epilogo.'
      : restantes <= 2
        ? 'Quedan ' + restantes + ' encrucijadas: empieza a cerrar los hilos abiertos.'
        : 'Quedan ' + restantes + ' encrucijadas.') +
    '\n' +
    (tirada
      ? 'La tirada de d20 ya esta hecha y el jugador la ha visto en pantalla: NARRA su resultado sin contradecirlo. "exito" = consigue lo que pretendia. "coste" = lo consigue pero pierde algo concreto. "fallo" = no lo consigue y la situacion empeora. Ajusta "efectos" en consecuencia.\n'
      : '') +
    (eleccion
      ? ''
      : 'Es el primer turno: inventa un comienzo distinto y concreto, con un lugar, una hora y alguien o algo que exija una decision. No repitas comienzos tipicos.\n') +
    ESQUEMA
  )
}

/**
 * Pide al cronista el siguiente fragmento.
 * @param {object} s       estado de la partida en el momento de pedir
 * @param {object|null} eleccion  opción elegida (null en el primer turno)
 * @param {object|null} tirada    resultado del d20 (null en el primer turno)
 * @param {{ largo: number, tono: string }} ajustes
 * @returns {Promise<{ d: object, turno: number }>}
 */
export async function pedirCronica(s, eleccion, tirada, { largo, tono }) {
  const turno = eleccion ? s.turno + 1 : 1
  const restantes = largo - turno

  const estado = {
    jugador: (s.nombre || '').trim() || 'sin nombre',
    oficio: (OFICIOS[s.oficio] || OFICIOS[0]).nombre,
    turno,
    vida: s.vida + '/' + s.vidaMax,
    oro: s.oro,
    arma_cuerpo: armasDe(s).cuerpo ? armasDe(s).cuerpo.nombre + ' (+' + armasDe(s).cuerpo.bono + ')' : 'ninguna',
    arma_distancia: armasDe(s).distancia ? armasDe(s).distancia.nombre + ' (+' + armasDe(s).distancia.bono + ')' : 'ninguna',
    zurron: s.inv.map((o) => o.nombre),
    rasgos: s.rasgos,
    lugar: s.lugar,
    cronica: s.log.map((e) => e.texto).slice(-6),
    eleccion: eleccion ? eleccion.texto + ' (' + eleccion.rasgo + ', ' + eleccion.riesgo + ')' : null,
    tirada: tirada
      ? {
          d20: tirada.cara,
          modificador: tirada.mod,
          total: tirada.total,
          dificultad: tirada.dif,
          resultado: tirada.resultado,
          objeto_gastado: tirada.objeto,
          combate: tirada.combate,
          arma_usada: tirada.arma,
        }
      : null,
  }

  const txt = await completar({
    system: sistema({ tono, largo, restantes, tirada, eleccion }),
    max_tokens: MAX_TOKENS,
    messages: [
      {
        role: 'user',
        content:
          'Estado actual:\n' + JSON.stringify(estado, null, 1) +
          '\n\nEscribe el siguiente fragmento de la cronica. Recuerda: espanol de hoy, llano y concreto, frases cortas; ni una sola palabra antigua o en desuso (nada de otrora, menester, doquier, yantar, hueste, zaguan, sayo, faltriquera, ribazo, sien ni parecidas). Ambientacion medieval, vocabulario actual.',
      },
    ],
  })

  const d = parsear(txt)
  if (!d) throw new Error('formato')
  return { d, turno }
}
