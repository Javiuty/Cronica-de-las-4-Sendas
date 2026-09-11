// Efectos de fondo en WebGL: niebla baja generada con ruido, pavesas doradas
// que suben despacio y clima de la escena (lluvia con relámpagos, nieve, niebla
// más densa). Un solo canvas fijo, detrás de la interfaz.
//
// Props:
//   intensidad    0..1  aviva pavesas y niebla (se interpola suavemente)
//   precipitacion 'lluvia' | 'nieve' | null
//   niebla        0..1  niebla extra (escenas con niebla)
//   relampagos    bool  destellos ocasionales (tormenta)

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const N_PAVESAS = 260
const N_GOTAS = 1400

const VERT_QUAD = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const FRAG_NIEBLA = /* glsl */ `
  precision highp float;
  uniform float uTiempo;
  uniform vec2 uRes;
  uniform float uIntensidad;
  uniform float uNieblaExtra;
  uniform float uRelampago;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float ruido(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) { v += a * ruido(p); p = r * p * 2.0 + vec2(1.7, 9.2); a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = vec2(uv.x * uRes.x / uRes.y, uv.y);
    float t = uTiempo * 0.02;
    float n1 = fbm(p * 1.6 + vec2(t * 1.3, -t * 0.4));
    float n2 = fbm(p * 3.1 - vec2(t * 0.7, t * 0.9) + n1 * 0.6);
    float niebla = smoothstep(0.35, 0.85, n1 * 0.65 + n2 * 0.5);
    // Con niebla extra, la bruma sube más y cubre más pantalla
    float baja = smoothstep(0.95 + uNieblaExtra * 0.4, 0.05, uv.y);
    float alfa = niebla * baja * (0.14 + 0.09 * uIntensidad) * (1.0 + uNieblaExtra * 2.4);
    vec3 frio = vec3(0.16, 0.45, 0.62);
    vec3 calido = vec3(0.93, 0.82, 0.44);
    vec3 col = mix(frio, calido, smoothstep(0.4, 0.9, n2) * 0.35);
    col = mix(col, vec3(0.72, 0.76, 0.82), uNieblaExtra * 0.6);
    // Relámpago: destello frío que ilumina toda la capa
    col = mix(col, vec3(0.9, 0.94, 1.0), uRelampago);
    alfa = max(alfa, uRelampago * 0.62);
    gl_FragColor = vec4(col, alfa);
  }
`

const VERT_PAVESAS = /* glsl */ `
  uniform float uTiempo;
  uniform vec2 uRes;
  uniform float uPixelRatio;
  uniform float uIntensidad;
  attribute float semilla;
  attribute float tam;
  varying float vAlfa;
  varying float vSem;

  void main() {
    float vel = 0.02 + semilla * 0.035;
    float y = mod(position.y + 1.0 + uTiempo * vel + semilla * 7.0, 2.4) - 1.2;
    float x = position.x
      + sin(uTiempo * (0.25 + semilla * 0.3) + semilla * 6.2832) * 0.06
      + cos(uTiempo * 0.1 + semilla * 3.0) * 0.02;
    gl_Position = vec4(x, y, 0.0, 1.0);

    float parpadeo = 0.55 + 0.45 * sin(uTiempo * (1.2 + semilla * 2.5) + semilla * 20.0);
    float borde = smoothstep(-1.2, -0.9, y) * smoothstep(1.2, 0.7, y);
    vAlfa = parpadeo * borde * (0.45 + 0.55 * uIntensidad);
    vSem = semilla;
    gl_PointSize = tam * uPixelRatio * (uRes.y / 900.0) * (0.8 + 0.4 * uIntensidad);
  }
`

const FRAG_PAVESAS = /* glsl */ `
  precision highp float;
  varying float vAlfa;
  varying float vSem;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c) * 2.0;
    float nucleo = smoothstep(1.0, 0.0, d);
    nucleo *= nucleo;
    float halo = exp(-d * d * 3.0) * 0.35;
    vec3 col = mix(vec3(1.0, 0.86, 0.5), vec3(0.93, 0.82, 0.44), vSem);
    gl_FragColor = vec4(col, (nucleo + halo) * vAlfa);
  }
`

// Precipitación: el mismo sistema de puntos hace de lluvia (1) o nieve (2).
const VERT_GOTAS = /* glsl */ `
  uniform float uTiempo;
  uniform vec2 uRes;
  uniform float uPixelRatio;
  uniform float uClima;
  uniform float uFuerza;
  attribute float semilla;
  attribute float tam;
  varying float vAlfa;

  void main() {
    float x; float y; float tamano;
    if (uClima > 1.5) {
      // Nieve: cae despacio y se balancea
      float vel = 0.07 + semilla * 0.09;
      y = mod(position.y + 1.2 - uTiempo * vel + semilla * 9.0, 2.4) - 1.2;
      x = mod(position.x + 1.1 + sin(uTiempo * (0.4 + semilla * 0.5) + semilla * 6.2832) * 0.07 - uTiempo * 0.03, 2.2) - 1.1;
      tamano = tam * (0.6 + semilla * 0.5);
      vAlfa = (0.6 + semilla * 0.35) * uFuerza;
    } else {
      // Lluvia: rápida, oblicua, más fina
      float vel = 1.9 + semilla * 1.2;
      y = mod(position.y + 1.2 - uTiempo * vel + semilla * 9.0, 2.4) - 1.2;
      x = mod(position.x + 1.1 - uTiempo * (0.16 + semilla * 0.1), 2.2) - 1.1;
      tamano = tam * (3.0 + semilla * 2.0);
      vAlfa = (0.42 + semilla * 0.3) * uFuerza;
    }
    gl_Position = vec4(x, y, 0.0, 1.0);
    gl_PointSize = tamano * uPixelRatio * (uRes.y / 900.0);
  }
`

const FRAG_GOTAS = /* glsl */ `
  precision highp float;
  uniform float uClima;
  varying float vAlfa;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float a;
    vec3 col;
    if (uClima > 1.5) {
      float d = length(c) * 2.0;
      a = smoothstep(1.0, 0.2, d);
      col = vec3(0.93, 0.95, 1.0);
    } else {
      // Trazo vertical fino, ligeramente inclinado
      float xx = c.x + c.y * 0.2;
      a = smoothstep(0.05, 0.0, abs(xx)) * smoothstep(0.5, 0.0, abs(c.y)) * 1.4;
      col = vec3(0.82, 0.9, 1.0);
    }
    gl_FragColor = vec4(col, a * vAlfa);
  }
`

function crearPuntos(n, tamMin, tamMax, grandes) {
  const pos = new Float32Array(n * 3)
  const sem = new Float32Array(n)
  const tam = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    pos[i * 3] = Math.random() * 2.2 - 1.1
    pos[i * 3 + 1] = Math.random() * 2.4 - 1.2
    pos[i * 3 + 2] = 0
    sem[i] = Math.random()
    tam[i] = grandes && Math.random() < 0.14 ? tamMax * 1.6 + Math.random() * tamMax : tamMin + Math.random() * (tamMax - tamMin)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('semilla', new THREE.BufferAttribute(sem, 1))
  geo.setAttribute('tam', new THREE.BufferAttribute(tam, 1))
  return geo
}

const CLIMA = { lluvia: 1, nieve: 2 }

export default function FondoFX({ intensidad = 0.6, precipitacion = null, niebla = 0, relampagos = false }) {
  const host = useRef(null)
  const ctx = useRef(null)

  useEffect(() => {
    const el = host.current
    if (!el) return undefined

    let rend
    try {
      rend = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' })
    } catch {
      return undefined // sin WebGL: la app sigue con el fondo estático
    }
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)
    rend.setPixelRatio(pixelRatio)
    rend.setClearColor(0x000000, 0)
    rend.domElement.style.cssText = 'display:block;width:100%;height:100%'
    el.appendChild(rend.domElement)

    const escena = new THREE.Scene()
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const uniforms = {
      uTiempo: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uPixelRatio: { value: pixelRatio },
      uIntensidad: { value: intensidad },
      uNieblaExtra: { value: 0 },
      uRelampago: { value: 0 },
      uClima: { value: 0 },
      uFuerza: { value: 0 },
    }
    const material = (vertexShader, fragmentShader, blending) =>
      new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthTest: false, depthWrite: false, blending })

    const capaNiebla = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material(VERT_QUAD, FRAG_NIEBLA, THREE.NormalBlending))
    const pavesas = new THREE.Points(crearPuntos(N_PAVESAS, 2.2, 5.2, true), material(VERT_PAVESAS, FRAG_PAVESAS, THREE.AdditiveBlending))
    const gotas = new THREE.Points(crearPuntos(N_GOTAS, 4, 9, false), material(VERT_GOTAS, FRAG_GOTAS, THREE.NormalBlending))
    gotas.visible = false
    escena.add(capaNiebla, pavesas, gotas)

    // Objetivos y valores actuales, interpolados en el bucle
    const c = {
      objetivo: intensidad, actual: intensidad,
      nieblaObj: niebla, nieblaAct: 0,
      clima: 0, fuerzaObj: 0, fuerzaAct: 0,
      relampagos, relampago: 0, proximoRayo: 0,
      uniforms, gotas,
    }
    ctx.current = c

    const medir = () => {
      const w = el.clientWidth || window.innerWidth
      const h = el.clientHeight || window.innerHeight
      rend.setSize(w, h, false)
      uniforms.uRes.value.set(w * pixelRatio, h * pixelRatio)
    }
    medir()
    window.addEventListener('resize', medir)

    const reloj = new THREE.Timer()
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    const pintar = () => {
      reloj.update()
      const t = reloj.getElapsed()
      // Fundidos en tiempo real (independientes de los fotogramas por segundo)
      const dt = Math.min(0.1, reloj.getDelta())
      const k = (seg) => Math.min(1, dt / seg)
      c.actual += (c.objetivo - c.actual) * k(0.4)
      c.nieblaAct += (c.nieblaObj - c.nieblaAct) * k(0.8)
      c.fuerzaAct += (c.fuerzaObj - c.fuerzaAct) * k(0.6)
      // Relámpagos: uno cada 4 a 11 s, con un par de destellos que decaen rápido
      if (c.relampagos && !reducido) {
        if (t > c.proximoRayo) {
          c.relampago = 0.95 + Math.random() * 0.05
          c.proximoRayo = t + 2.5 + Math.random() * 5
          if (Math.random() < 0.65) setTimeout(() => { c.relampago = Math.max(c.relampago, 0.8) }, 100 + Math.random() * 140)
        }
      }
      c.relampago *= Math.pow(0.02, dt) // se apaga en ~1 s
      uniforms.uIntensidad.value = c.actual
      uniforms.uNieblaExtra.value = c.nieblaAct
      uniforms.uRelampago.value = c.relampago
      uniforms.uClima.value = c.clima
      uniforms.uFuerza.value = c.fuerzaAct
      uniforms.uTiempo.value = t
      gotas.visible = c.fuerzaAct > 0.01
      rend.render(escena, cam)
    }
    const bucle = () => {
      raf = requestAnimationFrame(bucle)
      pintar()
    }
    if (reducido) pintar() // un solo fotograma, sin movimiento
    else bucle()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', medir)
      for (const o of [capaNiebla, pavesas, gotas]) {
        o.geometry.dispose()
        o.material.dispose()
      }
      rend.dispose()
      rend.forceContextLoss()
      if (rend.domElement.parentNode === el) el.removeChild(rend.domElement)
      ctx.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- las props se aplican en el efecto de abajo

  useEffect(() => {
    const c = ctx.current
    if (!c) return
    c.objetivo = intensidad
    c.nieblaObj = niebla
    c.relampagos = relampagos
    const clima = CLIMA[precipitacion] || 0
    if (clima) c.clima = clima // el tipo cambia al instante; la fuerza se funde
    c.fuerzaObj = clima ? 1 : 0
    if (relampagos && !c.proximoRayo) c.proximoRayo = c.uniforms.uTiempo.value + 1.5
  }, [intensidad, precipitacion, niebla, relampagos])

  return <div ref={host} className="fondo-fx" aria-hidden="true" />
}
