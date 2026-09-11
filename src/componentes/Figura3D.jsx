// Figura 3D girando despacio. Dos modos:
//  - modo="avatar": personaje de cuerpo entero a partir de `datos`
//    ({ apariencia, oficio }). `encuadre` "cuerpo" (entero) o "busto" (retrato).
//  - modo="objeto": objeto del zurrón por `clave`.

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { AZUL, OBJETO, ORO, construirPersonaje, vaciar } from '../juego/figuras3d'
import { cargarModelo, instanciar } from '../juego/modelos'

const CAMARA = {
  cuerpo: { pos: [0, 0.1, 6.2], mira: [0, -0.05, 0], base: 0.95 },
  busto: { pos: [0, 1.22, 2.7], mira: [0, 1.2, 0], base: 1 },
  objeto: { pos: [0, 0.22, 5.9], mira: [0, -0.05, 0], base: 1.18 },
}

export default function Figura3D({ modo = 'avatar', clave = '', datos = null, encuadre = 'cuerpo', className = '', style }) {
  const host = useRef(null)
  const ctx = useRef(null)
  const firma = datos ? JSON.stringify(datos) : ''
  const vista = modo === 'objeto' ? 'objeto' : encuadre

  // Montaje: renderer, cámara, luces y bucle de animación.
  useEffect(() => {
    const el = host.current
    if (!el) return undefined

    const rend = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    rend.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    rend.domElement.style.cssText = 'display:block;width:100%;height:100%'
    // Si el navegador pierde el contexto, permitir que se restaure (Three lo reinicia).
    const alPerder = (e) => e.preventDefault()
    rend.domElement.addEventListener('webglcontextlost', alPerder)
    el.appendChild(rend.domElement)

    const sc = new THREE.Scene()
    const cam = new THREE.PerspectiveCamera(34, 1, 0.1, 60)

    const key = new THREE.DirectionalLight(0xffe9b8, 2.1)
    key.position.set(2.4, 3, 3.2)
    const rim = new THREE.DirectionalLight(new THREE.Color(AZUL), 2.4)
    rim.position.set(-3, 1.4, -2.4)
    const fill = new THREE.DirectionalLight(new THREE.Color(ORO), 0.9)
    fill.position.set(-1.4, -1.6, 2)
    const cielo = new THREE.HemisphereLight(0xbfd3ea, 0x4a3a2a, 0.55) // suaviza las texturas de los GLB
    sc.add(key, rim, fill, cielo, new THREE.AmbientLight(0x3a4a5a, 1.0))

    const grp = new THREE.Group()
    sc.add(grp)

    const c = { rend, sc, cam, grp, t: 0, pop: 1, base: 1, vista: 'cuerpo', cabezaY: null, mezclador: null, animar: null }
    const reloj = new THREE.Timer()
    ctx.current = c

    c.medir = () => {
      const w = el.clientWidth || 200
      const h = el.clientHeight || 200
      rend.setSize(w, h, false)
      cam.aspect = w / h
      const v = CAMARA[c.vista] || CAMARA.cuerpo
      const z = w / h < 1 ? v.pos[2] / Math.max(0.55, w / h) : v.pos[2]
      // En busto, la cámara apunta a la altura real de la cabeza de la figura actual.
      const dy = c.vista === 'busto' && c.cabezaY !== null ? c.cabezaY - v.mira[1] : 0
      cam.position.set(v.pos[0], v.pos[1] + dy, z)
      cam.lookAt(v.mira[0], v.mira[1] + dy, v.mira[2])
      cam.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(() => c.medir())
    ro.observe(el)

    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      c.t += 0.01
      reloj.update()
      if (c.mezclador) c.mezclador.update(reloj.getDelta())
      if (c.animar) c.animar(reloj.getElapsed())
      grp.rotation.y = Math.sin(c.t * 0.55) * 0.62
      grp.position.y = c.animar ? 0 : Math.sin(c.t * 0.9) * 0.045
      if (c.pop < 1) {
        c.pop = Math.min(1, c.pop + 0.07)
        const e = 1 - Math.pow(1 - c.pop, 3)
        grp.scale.setScalar(c.base * (0.82 + e * 0.18))
      }
      rend.render(sc, cam)
    }
    loop()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      vaciar(grp)
      rend.domElement.removeEventListener('webglcontextlost', alPerder)
      rend.dispose()
      // Libera el contexto WebGL de inmediato: el navegador limita cuántos hay vivos.
      rend.forceContextLoss()
      if (rend.domElement.parentNode === el) el.removeChild(rend.domElement)
      ctx.current = null
    }
  }, [])

  // Encuadre de cámara.
  useEffect(() => {
    const c = ctx.current
    if (!c) return
    c.vista = vista
    c.base = (CAMARA[vista] || CAMARA.cuerpo).base
    c.medir()
  }, [vista])

  // Reconstruye la figura cuando cambian sus datos.
  useEffect(() => {
    const c = ctx.current
    if (!c) return
    vaciar(c.grp)
    if (c.mezclador) { c.mezclador.stopAllAction(); c.mezclador = null }
    c.animar = null
    let vivo = true
    const aparecer = () => {
      c.pop = 0
      c.grp.scale.setScalar(c.base * 0.82)
    }
    if (modo === 'objeto') {
      const fn = OBJETO[clave]
      if (fn) fn(c.grp)
      aparecer()
    } else if (datos && datos.modelo) {
      // Figura propia en GLB: se carga (con caché) y se escala a la altura de las paramétricas (3.3).
      const m = datos.modelo
      cargarModelo(m.url)
        .then((modelo) => {
          if (!vivo || !ctx.current) return
          // Clon con esqueleto, escalado a 3.3 y apoyado en y = -1.65 como las paramétricas.
          const { clon, mezclador, cabezaY } = instanciar(modelo, m, 3.3, -1.65)
          c.cabezaY = cabezaY
          c.mezclador = mezclador
          c.medir()
          c.grp.add(clon)
          aparecer()
        })
        .catch((err) => console.warn('No se pudo cargar el modelo', m.url, err))
    } else if (datos) {
      c.cabezaY = null
      c.medir()
      c.animar = construirPersonaje(c.grp, datos.apariencia || {}, datos.oficio || '')
      aparecer()
    }
    return () => { vivo = false }
  }, [modo, clave, firma]) // eslint-disable-line react-hooks/exhaustive-deps -- `firma` resume `datos`

  return <div ref={host} className={('figura3d ' + className).trim()} style={style} aria-hidden="true" />
}
