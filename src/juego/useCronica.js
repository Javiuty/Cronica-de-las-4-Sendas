// Toda la lógica de la partida en un hook: fases, tiradas, inventario,
// guardado en localStorage y la conversación con el cronista.

import { useCallback, useEffect, useRef, useState } from 'react'
import { BARBAS, BONO_OBJETO, CAPAS, CLAVE, COLORES_PELO, FRASES, OFICIOS, OJOS, PELOS, PIELES, PRESETS_APARIENCIA, RASGOS_CERO, ROPAS, TOCADOS } from './datos'
import { ARMAS_VACIAS, ajusteDe, armaPara, armasDe, arquetipo, combateDe, dificultadDe, efectosDe, largoDe, musicaDe, normalizarArma, sellosVisiblesDe, tonoDe, vidaInicialDe } from './derivados'
import { pedirCronica } from './cronista'
import { pulirRespuesta } from './estilo'
import { establecerMusica } from './musica'

const CLAVE_PREFS = 'cronica-cuatro-sendas-prefs'

export const ESTADO_INICIAL = {
  fase: 'menu', turno: 0, vida: 10, vidaMax: 10, oro: 8,
  inv: [], armas: { ...ARMAS_VACIAS }, rasgos: { ...RASGOS_CERO },
  lugar: '', ambiente: '', prosa: '', opciones: [], log: [], full: [],
  escena: null, cargando: false, error: null, epilogo: '', tituloFinal: '', muerto: false,
  haySave: false, dado: null, usando: null, gastados: [],
  nombre: '', oficio: 0, objetoIni: 0, apariencia: { ...PRESETS_APARIENCIA[0] },
  optDificultad: null, optDuracion: null, optSellos: null, optMusica: null, optEfectos: null,
  cargaPct: 0, cargaFrase: FRASES[0],
}

const PREFS = ['optDificultad', 'optDuracion', 'optSellos', 'optMusica', 'optEfectos']

// ---- localStorage -----------------------------------------------------------

function tieneSave() {
  try { return !!localStorage.getItem(CLAVE) } catch { return false }
}
function leerSave() {
  try { return JSON.parse(localStorage.getItem(CLAVE) || 'null') } catch { return null }
}
function borrarSave() {
  try { localStorage.removeItem(CLAVE) } catch { /* sin almacenamiento */ }
}
function guardar(s) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({
      turno: s.turno, vida: s.vida, vidaMax: s.vidaMax, oro: s.oro, inv: s.inv,
      armas: s.armas, rasgos: s.rasgos, lugar: s.lugar, ambiente: s.ambiente,
      prosa: s.prosa, opciones: s.opciones, log: s.log, escena: s.escena, gastados: s.gastados,
      full: s.full, nombre: s.nombre, oficio: s.oficio, objetoIni: s.objetoIni, apariencia: s.apariencia,
      optDificultad: s.optDificultad, optDuracion: s.optDuracion, optSellos: s.optSellos,
    }))
  } catch { /* sin almacenamiento */ }
}

// Preferencias (música, dificultad, etc.) que sobreviven entre sesiones.
function leerPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem(CLAVE_PREFS) || '{}')
    const out = {}
    PREFS.forEach((k) => { if (p[k] !== undefined) out[k] = p[k] })
    return out
  } catch { return {} }
}
function guardarPrefs(s) {
  try {
    const p = {}
    PREFS.forEach((k) => { p[k] = s[k] })
    localStorage.setItem(CLAVE_PREFS, JSON.stringify(p))
  } catch { /* sin almacenamiento */ }
}

const d20 = () => 1 + Math.floor(Math.random() * 20)

/** Clave de comparación para nombres: minúsculas, sin tildes ni espacios sobrantes. */
const llave = (t) => String(t || '').normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase()
/** Acepta un valor suelto o una lista; descarta vacíos. */
const listar = (v) => (Array.isArray(v) ? v : [v]).filter((x) => x !== null && x !== undefined && x !== '')
/** 'cuerpo' | 'distancia' a partir de lo que diga el modelo (acepta sinónimos). */
function ranuraDe(t) {
  const k = llave(t)
  if (['cuerpo', 'melee', 'cerca', 'mano'].includes(k)) return 'cuerpo'
  if (['distancia', 'ranged', 'lejos'].includes(k)) return 'distancia'
  return null
}

/** Ranuras de arma con las que empieza un oficio. */
function armasIniciales(of) {
  const armas = { ...ARMAS_VACIAS }
  for (const a of of.armas || []) {
    const n = normalizarArma(a)
    if (n && !armas[n.tipo]) armas[n.tipo] = n
  }
  return armas
}

// ---- hook -------------------------------------------------------------------

export function useCronica() {
  const [s, setS] = useState(() => ({ ...ESTADO_INICIAL, ...leerPrefs(), haySave: tieneSave() }))
  const patch = useCallback((p) => {
    setS((prev) => ({ ...prev, ...(typeof p === 'function' ? p(prev) : p) }))
  }, [])

  // Espejo del estado para leerlo desde callbacks asíncronos (respuesta del cronista).
  const estadoRef = useRef(s)
  useEffect(() => { estadoRef.current = s }, [s])

  const logRef = useRef(null)
  const intDado = useRef(null)
  const intCarga = useRef(null)
  const ultima = useRef({ eleccion: null, tirada: null })

  useEffect(() => () => {
    clearInterval(intDado.current)
    clearInterval(intCarga.current)
  }, [])

  // El registro baja al final cada vez que llega prosa nueva.
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [s.prosa])

  // Guardado automático mientras se juega y no hay petición en curso.
  useEffect(() => {
    if (s.fase === 'juego' && !s.cargando) guardar(s)
  }, [s])

  // Preferencias persistentes y música.
  useEffect(() => { guardarPrefs(s) }, [s.optDificultad, s.optDuracion, s.optSellos, s.optMusica, s.optEfectos]) // eslint-disable-line react-hooks/exhaustive-deps
  const musica = musicaDe(s)
  useEffect(() => { establecerMusica(musica) }, [musica])

  // ---- navegación -----------------------------------------------------------

  const irMenu = () => {
    if (s.fase === 'juego') guardar(s)
    patch({ fase: 'menu', error: null, haySave: tieneSave() })
  }
  const irPersonaje = () => patch({ fase: 'personaje', error: null })
  const irOpciones = () => patch({ fase: 'opciones' })
  const irReglas = () => patch({ fase: 'reglas' })

  // ---- personaje y opciones -------------------------------------------------

  const setNombre = (e) => patch({ nombre: e.target.value })
  const elegirOficio = (i) => patch({ oficio: i, objetoIni: 0, apariencia: { ...(PRESETS_APARIENCIA[i] || PRESETS_APARIENCIA[0]) } })
  const setApariencia = (cambio) => patch((prev) => ({ apariencia: { ...prev.apariencia, ...cambio } }))
  const aparienciaAzar = () => {
    const al = (lista) => lista[Math.floor(Math.random() * lista.length)]
    patch({
      apariencia: {
        piel: al(PIELES), pelo: al(PELOS).clave, colorPelo: al(COLORES_PELO), ojos: al(OJOS), barba: al(BARBAS).clave,
        tocado: al(TOCADOS).clave, ropa: al(ROPAS), capa: Math.random() < 0.25 ? null : al(CAPAS),
      },
    })
  }
  const elegirObjeto = (i) => patch({ objetoIni: i })
  const elegirDificultad = (k) => patch({ optDificultad: k })
  const elegirDuracion = (k) => patch({ optDuracion: k })
  const toggleSellos = () => patch((prev) => ({ optSellos: !sellosVisiblesDe(prev) }))
  const toggleMusica = () => patch((prev) => ({ optMusica: !musicaDe(prev) }))
  const toggleEfectos = () => patch((prev) => ({ optEfectos: !efectosDe(prev) }))

  // ---- animaciones ----------------------------------------------------------

  const animarCarga = () => {
    clearInterval(intCarga.current)
    let n = 0
    intCarga.current = setInterval(() => {
      n++
      setS((prev) => {
        if (prev.fase !== 'carga') return prev
        const pct = Math.min(94, prev.cargaPct + (prev.cargaPct < 55 ? 4 : 2))
        const frase = n % 22 === 0 ? FRASES[Math.floor(Math.random() * FRASES.length)] : prev.cargaFrase
        return { ...prev, cargaPct: pct, cargaFrase: frase }
      })
    }, 130)
  }

  const girar = (tirada) => {
    clearInterval(intDado.current)
    let n = 0
    intDado.current = setInterval(() => {
      n++
      if (n > 12) {
        clearInterval(intDado.current)
        setS((prev) => (prev.dado ? { ...prev, dado: { ...prev.dado, cara: tirada.cara, girando: false } } : prev))
        return
      }
      setS((prev) => (prev.dado ? { ...prev, dado: { ...prev.dado, cara: d20() } } : prev))
    }, 75)
  }

  const pararTodo = () => {
    clearInterval(intDado.current)
    clearInterval(intCarga.current)
  }

  // ---- cronista -------------------------------------------------------------

  const aplicar = (d, turno) => {
    clearInterval(intCarga.current)
    const prev = estadoRef.current
    const ef = d.efectos || {}
    const vida = Math.max(0, Math.min(prev.vidaMax, prev.vida + (Number(ef.vida) || 0)))
    const oro = Math.max(0, prev.oro + (Number(ef.oro) || 0))
    // Lo que se pierde: objetos por nombre (tolerante a mayúsculas y tildes) y armas por ranura.
    const aQuitar = listar(ef.quitar).map(llave)
    let inv = prev.inv.filter((o) => !aQuitar.includes(llave(o.nombre)))
    const armas = { ...armasDe(prev) }
    for (const t of listar(ef.quitar_arma)) {
      const ranura = ranuraDe(t)
      if (ranura) armas[ranura] = null
    }
    // Si el cronista puso el nombre de un arma en "quitar", también vale.
    for (const ranura of ['cuerpo', 'distancia']) {
      if (armas[ranura] && aQuitar.includes(llave(armas[ranura].nombre))) armas[ranura] = null
    }
    if (ef.objeto && ef.objeto.nombre && inv.length < 8 && !inv.some((o) => llave(o.nombre) === llave(ef.objeto.nombre))) {
      inv.push(ef.objeto)
    }
    const nueva = normalizarArma(ef.arma)
    if (nueva) armas[nueva.tipo] = nueva // sustituye a la de su ranura
    const muerto = vida <= 0
    const fin = !!d.fin || muerto
    const opciones = fin ? [] : Array.isArray(d.opciones) ? d.opciones.slice(0, 4) : []

    if (fin) borrarSave()

    patch({
      turno, vida, oro, inv, armas,
      lugar: d.lugar || prev.lugar,
      ambiente: d.ambiente || prev.ambiente,
      prosa: d.prosa || '',
      opciones,
      escena: d.escena || prev.escena,
      cargando: false, error: null, dado: null, cargaPct: 100,
      fase: fin ? 'fin' : 'juego',
      muerto,
      haySave: fin ? false : prev.haySave,
      tituloFinal: d.titulo || arquetipo(prev),
      epilogo: d.epilogo || (muerto ? 'Aquí se detiene la mano que escribía. Nadie recogió el cuerpo, pero la crónica quedó.' : ''),
    })
  }

  const pedir = async (snap, eleccion, tirada) => {
    ultima.current = { eleccion, tirada }
    try {
      const { d, turno } = await pedirCronica(snap, eleccion, tirada, { largo: largoDe(snap), tono: tonoDe(snap) })
      // Red de seguridad: arcaísmos que se hayan colado pese a las instrucciones
      const cambios = pulirRespuesta(d)
      if (cambios.length && import.meta.env.DEV) console.info('[cronista] arcaísmos sustituidos:', cambios.join(', '))
      aplicar(d, turno)
    } catch (e) {
      pararTodo()
      const msg = e && e.amable ? e.message : 'La tinta se corrió (' + ((e && e.message) || 'error') + '). Puedes reintentar.'
      patch({ dado: null, cargando: false, error: msg })
    }
  }

  // ---- acciones de partida --------------------------------------------------

  const comenzar = () => {
    borrarSave()
    const of = OFICIOS[s.oficio] || OFICIOS[0]
    const ob = of.objetos[s.objetoIni] || of.objetos[0]
    const vida = vidaInicialDe(s)
    const nuevo = {
      ...s,
      fase: 'carga', turno: 0, vida, vidaMax: vida, oro: of.oro,
      inv: [ob], armas: armasIniciales(of),
      rasgos: { ...RASGOS_CERO },
      lugar: 'El umbral', ambiente: 'antes de la primera línea', prosa: '', opciones: [],
      log: [], full: [], escena: null, cargando: true, error: null, epilogo: '', tituloFinal: '',
      muerto: false, haySave: false, dado: null, usando: null, gastados: [], cargaPct: 0,
    }
    setS(nuevo)
    animarCarga()
    pedir(nuevo, null, null)
  }

  const continuar = () => {
    const d = leerSave()
    if (!d) return irPersonaje()
    if (!d.gastados) d.gastados = []
    if (!d.full) d.full = []
    if (!d.apariencia) d.apariencia = { ...(PRESETS_APARIENCIA[d.oficio] || PRESETS_APARIENCIA[0]) }
    if (!d.armas) {
      // Partidas anteriores: una o dos armas sin tipo. Van a la ranura que les toque.
      d.armas = { ...ARMAS_VACIAS }
      for (const a of [d.arma, d.armaSec]) {
        const n = normalizarArma(a)
        if (n && !d.armas[n.tipo]) d.armas[n.tipo] = n
      }
      delete d.arma
      delete d.armaSec
    }
    patch({ fase: 'juego', cargando: false, error: null, muerto: false, epilogo: '', tituloFinal: '', dado: null, usando: null, ...d })
  }

  const abandonar = () => {
    guardar(s)
    patch({ fase: 'menu', haySave: true })
  }

  const reintentar = () => {
    const snap = { ...s, cargando: true, error: null }
    setS(snap)
    if (snap.fase === 'carga') animarCarga()
    pedir(snap, ultima.current.eleccion, ultima.current.tirada)
  }

  const jugar = (op) => {
    if (!op || s.cargando) return
    const rasgos = { ...s.rasgos }
    if (rasgos[op.rasgo] !== undefined) rasgos[op.rasgo] += 1

    const dif = dificultadDe(op, ajusteDe(s))
    const base = op.rasgo ? Math.min(4, s.rasgos[op.rasgo] || 0) : 0
    const notas = []
    let mod = base
    if (base) notas.push('+' + base + ' ' + op.rasgo)
    const combate = combateDe(op)
    const arma = armaPara(s, combate)
    if (arma) {
      mod += arma.bono
      notas.push('+' + arma.bono + ' ' + arma.nombre.toLowerCase())
    }
    const invocado = s.usando ? s.inv.find((o) => o.nombre === s.usando) : null
    const bonoObjeto = invocado ? BONO_OBJETO[invocado.rareza] || 1 : 0
    if (invocado) {
      mod += bonoObjeto
      notas.push('+' + bonoObjeto + ' ' + invocado.nombre.toLowerCase())
    }
    // Los comunes se consumen; finos y arcanos se quedan con el sello apagado.
    const consumido = invocado && (BONO_OBJETO[invocado.rareza] || 1) === 1
    const cara = d20()
    const total = cara + mod
    const resultado = total >= dif ? 'exito' : total >= dif - 3 ? 'coste' : 'fallo'
    const tirada = { cara, mod, total, dif, resultado, notas: notas.join(' · '), objeto: invocado ? invocado.nombre : null, combate, arma: arma ? arma.nombre : null }

    const siguiente = {
      ...s,
      rasgos,
      log: s.log.concat([{ texto: s.prosa }, { texto: '— ' + op.texto }]).slice(-6),
      full: s.full.concat([s.prosa, '— ' + op.texto]),
      inv: consumido ? s.inv.filter((o) => o.nombre !== invocado.nombre) : s.inv,
      gastados: invocado && !consumido ? s.gastados.concat([invocado.nombre]) : s.gastados,
      cargando: true, error: null, usando: null,
      dado: { ...tirada, girando: true, cara: d20() },
    }
    setS(siguiente)
    girar(tirada)
    pedir(siguiente, op, tirada)
  }

  const elegir = (i) => jugar(s.opciones[i])

  const invocar = (nombre) => {
    const o = s.inv.find((x) => x.nombre === nombre)
    if (!o || s.cargando) return
    if (s.gastados.includes(nombre)) return
    patch({ usando: s.usando === nombre ? null : nombre })
  }

  return {
    s, logRef,
    irMenu, irPersonaje, irOpciones, irReglas,
    setNombre, elegirOficio, elegirObjeto, setApariencia, aparienciaAzar, elegirDificultad, elegirDuracion, toggleSellos, toggleMusica, toggleEfectos,
    comenzar, continuar, abandonar, reintentar, elegir, invocar,
  }
}
