// Toda la lógica de la partida en un hook: fases, tiradas, inventario, la
// cuenta del jugador, el guardado (local y en el servidor, ver almacen.js) y la
// conversación con el cronista.

import { useCallback, useEffect, useRef, useState } from 'react'
import * as api from './api'
import { ErrorApi } from './api'
import { cerrar, guardar, guardarPrefs, instantanea, leerPrefs, leerSave, olvidarLocal, sincronizar, tieneSave, volcarYa } from './almacen'
import { BONO_OBJETO, FRASES, NOMBRES, OFICIOS, RASGOS_CERO } from './datos'
import { ARMAS_VACIAS, ajusteDe, ambienteDe, armaPara, armasDe, arquetipo, combateDe, dificultadDe, efectosDe, indiceGuardado, largoDe, musicaDe, normalizarArma, sellosVisiblesDe, vidaInicialDe } from './derivados'
import { pedirCronica } from './cronista'
import { pulirRespuesta } from './estilo'
import { establecerMusica } from './musica'
import { borrarSesion, guardarSesion, leerSesion } from './sesion'

export const ESTADO_INICIAL = {
  fase: 'menu', turno: 0, vida: 10, vidaMax: 10, oro: 8,
  inv: [], armas: { ...ARMAS_VACIAS }, rasgos: { ...RASGOS_CERO },
  lugar: '', ambiente: '', prosa: '', opciones: [], log: [], full: [],
  escena: null, cargando: false, error: null, epilogo: '', tituloFinal: '', muerto: false,
  haySave: false, dado: null, usando: null, gastados: [],
  nombre: '', oficioClave: '', oficio: 0, objetoIni: 0, retrato: 0,
  optDificultad: null, optDuracion: null, optSellos: null, optMusica: null, optEfectos: null, optAmbiente: null,
  cargaPct: 0, cargaFrase: FRASES[0],
  sesion: null, cuentaCargando: false, cuentaError: null, cronicas: [],
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
  const [s, setS] = useState(() => {
    const sesion = leerSesion()
    // Sin cuenta no hay crónica: la puerta del juego es la pantalla de entrar.
    return { ...ESTADO_INICIAL, ...leerPrefs(), haySave: tieneSave(), sesion, fase: sesion ? 'menu' : 'cuenta' }
  })
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
  // Sin cuenta se pueden guardar preferencias desde el primer momento; con
  // cuenta hay que esperar a bajar las del servidor para no pisarlas.
  const prefsListas = useRef(!leerSesion())

  useEffect(() => () => {
    clearInterval(intDado.current)
    clearInterval(intCarga.current)
  }, [])

  // Guardado automático mientras se juega y no hay petición en curso.
  useEffect(() => {
    if (s.fase === 'juego' && !s.cargando) guardar(s)
  }, [s])

  // Al cerrar el libro: fuera del guardado y, con cuenta, al historial. Va en un
  // efecto y no en `aplicar` porque aquí el estado ya trae el último turno.
  const cerrado = useRef(false)
  useEffect(() => {
    if (s.fase !== 'fin') {
      cerrado.current = false
      return
    }
    if (cerrado.current) return
    cerrado.current = true
    cerrar(instantanea(s), { muerto: s.muerto, tituloFinal: s.tituloFinal, epilogo: s.epilogo })
  }, [s.fase, s.muerto, s.tituloFinal, s.epilogo]) // eslint-disable-line react-hooks/exhaustive-deps

  // Con sesión abierta: se baja la partida y las preferencias del servidor y se
  // concilian con las de este navegador (gana la partida más avanzada).
  useEffect(() => {
    const sesion = leerSesion()
    if (!sesion) return undefined
    let vivo = true
    sincronizar(sesion)
      .then(({ partida, preferencias }) => {
        prefsListas.current = true
        if (vivo) patch({ haySave: !!partida, ...preferencias })
      })
      .catch((e) => {
        prefsListas.current = true
        if (e instanceof ErrorApi && e.estado === 401) {
          borrarSesion()
          olvidarLocal()
          if (vivo) patch({ sesion: null, haySave: false, fase: 'cuenta' })
        }
      })
    return () => { vivo = false }
  }, [patch])

  // Preferencias persistentes y música.
  useEffect(() => {
    guardarPrefs(s, prefsListas.current)
  }, [s.optDificultad, s.optDuracion, s.optSellos, s.optMusica, s.optEfectos, s.optAmbiente]) // eslint-disable-line react-hooks/exhaustive-deps
  const musica = musicaDe(s)
  useEffect(() => { establecerMusica(musica) }, [musica])

  // ---- navegación -----------------------------------------------------------

  const irMenu = () => {
    if (s.fase === 'juego') guardar(s)
    volcarYa()
    patch({ fase: 'menu', error: null, haySave: tieneSave() })
  }
  const irPersonaje = () => patch({ fase: 'personaje', error: null })
  const irOpciones = () => patch({ fase: 'opciones' })
  const irReglas = () => patch({ fase: 'reglas' })

  // ---- personaje y opciones -------------------------------------------------

  const setNombre = (e) => patch({ nombre: e.target.value })
  const nombreAzar = () => patch((prev) => {
    const posibles = NOMBRES.filter((n) => n !== prev.nombre)
    return { nombre: posibles[Math.floor(Math.random() * posibles.length)] }
  })
  const elegirOficio = (i) => patch({ oficio: i, oficioClave: (OFICIOS[i] || OFICIOS[0]).clave, objetoIni: 0, retrato: 0 })
  const elegirRetrato = (i) => patch({ retrato: i })
  const elegirObjeto = (i) => patch({ objetoIni: i })
  const elegirDificultad = (k) => patch({ optDificultad: k })
  const elegirDuracion = (k) => patch({ optDuracion: k })
  const toggleSellos = () => patch((prev) => ({ optSellos: !sellosVisiblesDe(prev) }))
  const toggleMusica = () => patch((prev) => ({ optMusica: !musicaDe(prev) }))
  const toggleEfectos = () => patch((prev) => ({ optEfectos: !efectosDe(prev) }))
  const toggleAmbiente = () => patch((prev) => ({ optAmbiente: !ambienteDe(prev) }))

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
    const tituloFinal = d.titulo || arquetipo(prev)
    const epilogo = d.epilogo || (muerto ? 'Aquí se detiene la mano que escribía. Nadie recogió el cuerpo, pero la crónica quedó.' : '')

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
      tituloFinal,
      epilogo,
    })
  }

  const pedir = async (snap, eleccion, tirada) => {
    ultima.current = { eleccion, tirada }
    try {
      const { d, turno } = await pedirCronica(snap, eleccion, tirada, { largo: largoDe(snap) })
      // Red de seguridad: arcaísmos que se hayan colado pese a las instrucciones
      const cambios = pulirRespuesta(d)
      if (cambios.length && import.meta.env.DEV) console.info('[cronista] arcaísmos sustituidos:', cambios.join(', '))
      aplicar(d, turno)
    } catch (e) {
      pararTodo()
      const msg = e && e.amable ? e.message : 'La tinta se corrió (' + ((e && e.message) || 'error') + '). Puedes reintentar.'
      if (e && e.sesionCaducada) {
        // La partida queda guardada en local; al volver a entrar se concilia.
        borrarSesion()
        patch({ dado: null, cargando: false, error: null, sesion: null, fase: 'cuenta', cuentaError: msg })
        return
      }
      patch({ dado: null, cargando: false, error: msg })
    }
  }

  // ---- acciones de partida --------------------------------------------------

  const comenzar = () => {
    // Solo local: el guardado del servidor se sobrescribe con el primer PUT.
    olvidarLocal()
    const of = OFICIOS[s.oficio] || OFICIOS[0]
    const ob = of.objetos[s.objetoIni] || of.objetos[0]
    const vida = vidaInicialDe(s)
    const nuevo = {
      ...s,
      fase: 'carga', oficioClave: of.clave, turno: 0, vida, vidaMax: vida, oro: of.oro,
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
    // El oficio se resuelve por su clave: así una partida vieja sigue siendo
    // del oficio que era aunque OFICIOS haya cambiado de orden.
    d.oficio = indiceGuardado(d)
    d.oficioClave = OFICIOS[d.oficio].clave
    if (!d.gastados) d.gastados = []
    if (!d.full) d.full = []
    delete d.apariencia
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
    volcarYa()
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

  // ---- cuenta ---------------------------------------------------------------

  /** Guarda la sesión, baja lo que hubiera en el servidor y vuelve al menú. */
  const asentarSesion = async (sesion) => {
    guardarSesion(sesion)
    let bajado = { partida: null, preferencias: {} }
    try {
      bajado = await sincronizar(sesion)
    } catch { /* se entra igual: la partida local sigue ahí */ }
    prefsListas.current = true
    patch({
      sesion, cuentaCargando: false, cuentaError: null, fase: 'menu',
      haySave: !!bajado.partida, ...bajado.preferencias,
    })
  }

  const conCuenta = (llamada) => async (datos) => {
    patch({ cuentaCargando: true, cuentaError: null })
    try {
      const r = await llamada(datos)
      await asentarSesion({ token: r.token, usuario: r.usuario })
    } catch (e) {
      patch({ cuentaCargando: false, cuentaError: (e && e.message) || 'No se pudo completar.' })
    }
  }

  const registrarse = conCuenta(api.registro)
  const entrar = conCuenta(api.login)

  const salir = () => {
    borrarSesion()
    // El guardado de este navegador era de esa cuenta; queda en el servidor.
    olvidarLocal()
    patch({ sesion: null, cronicas: [], cuentaError: null, haySave: false, fase: 'cuenta' })
  }

  const irCuenta = () => {
    patch({ fase: 'cuenta', cuentaError: null })
    const sesion = leerSesion()
    if (!sesion) return
    api.historial(sesion.token)
      .then((cronicas) => patch({ cronicas: cronicas || [] }))
      .catch(() => {})
  }

  return {
    s, logRef,
    irMenu, irPersonaje, irOpciones, irReglas, irCuenta,
    registrarse, entrar, salir,
    setNombre, nombreAzar, elegirOficio, elegirObjeto, elegirRetrato, elegirDificultad, elegirDuracion, toggleSellos, toggleMusica, toggleEfectos, toggleAmbiente,
    comenzar, continuar, abandonar, reintentar, elegir, invocar,
  }
}
