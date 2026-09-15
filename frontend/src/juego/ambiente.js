// Sonido de ambiente generado con Web Audio según la escena: viento, lluvia,
// truenos, grillos de noche y pájaros de día. Sin archivos de audio; cada capa
// se funde en 1,6 s al cambiar de escena.

let ctx = null
let master = null
let capas = {}          // nombre -> { gain, parar() }
let objetivo = null     // { cielo, terreno } deseado
let activo = false
let esperandoGesto = false

const FUNDIDO = 1.6

function crear() {
  const AC = window.AudioContext || window.webkitAudioContext
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = 0.9
  master.connect(ctx.destination)
}

/** Búfer de ruido blanco de 4 s (se reutiliza). */
let bufRuido = null
function ruido() {
  if (bufRuido) return bufRuido
  const n = ctx.sampleRate * 4
  bufRuido = ctx.createBuffer(1, n, ctx.sampleRate)
  const d = bufRuido.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
  return bufRuido
}
function fuenteRuido() {
  const src = ctx.createBufferSource()
  src.buffer = ruido()
  src.loop = true
  src.start()
  return src
}

// ---- Capas -------------------------------------------------------------------

function capaViento(cutoff) {
  const src = fuenteRuido()
  const f = ctx.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = cutoff
  f.Q.value = 0.4
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.08 + Math.random() * 0.05
  const lfoG = ctx.createGain()
  lfoG.gain.value = cutoff * 0.55
  lfo.connect(lfoG).connect(f.frequency)
  lfo.start()
  const gain = ctx.createGain()
  gain.gain.value = 0
  src.connect(f).connect(gain).connect(master)
  return { gain, parar: () => { src.stop(); lfo.stop() } }
}

function capaLluvia() {
  const src = fuenteRuido()
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 900
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 2400
  bp.Q.value = 0.5
  const gain = ctx.createGain()
  gain.gain.value = 0
  src.connect(hp).connect(bp).connect(gain).connect(master)
  return { gain, parar: () => src.stop() }
}

function capaTruenos() {
  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.connect(master)
  let t = 0
  const trueno = () => {
    const src = fuenteRuido()
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 90 + Math.random() * 60
    const env = ctx.createGain()
    const ahora = ctx.currentTime
    const dur = 2.5 + Math.random() * 2.5
    env.gain.setValueAtTime(0.0001, ahora)
    env.gain.exponentialRampToValueAtTime(0.9, ahora + 0.15 + Math.random() * 0.3)
    env.gain.exponentialRampToValueAtTime(0.0001, ahora + dur)
    src.connect(f).connect(env).connect(gain)
    setTimeout(() => src.stop(), (dur + 0.2) * 1000)
    t = setTimeout(trueno, 6000 + Math.random() * 12000)
  }
  t = setTimeout(trueno, 2000 + Math.random() * 5000)
  return { gain, parar: () => clearTimeout(t) }
}

function capaGrillos() {
  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.connect(master)
  const voces = []
  for (let v = 0; v < 2; v++) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 4100 + v * 420 + Math.random() * 80
    const trino = ctx.createOscillator() // modulación rápida del chirrido
    trino.frequency.value = 22 + v * 6
    const trinoG = ctx.createGain()
    trinoG.gain.value = 0.5
    const am = ctx.createGain()
    am.gain.value = 0.5
    trino.connect(trinoG).connect(am.gain)
    const env = ctx.createGain()
    env.gain.value = 0
    osc.connect(am).connect(env).connect(gain)
    osc.start()
    trino.start()
    voces.push({ env })
    // Ráfagas: canta un rato, calla otro
    let t = 0
    const rafaga = () => {
      const ahora = ctx.currentTime
      const dur = 0.6 + Math.random() * 1.2
      env.gain.cancelScheduledValues(ahora)
      env.gain.setValueAtTime(0.0001, ahora)
      env.gain.exponentialRampToValueAtTime(1, ahora + 0.05)
      env.gain.setValueAtTime(1, ahora + dur)
      env.gain.exponentialRampToValueAtTime(0.0001, ahora + dur + 0.08)
      t = setTimeout(rafaga, (dur + 0.4 + Math.random() * 1.6) * 1000)
    }
    t = setTimeout(rafaga, v * 700)
    voces[v].parar = () => { clearTimeout(t); osc.stop(); trino.stop() }
  }
  return { gain, parar: () => voces.forEach((v) => v.parar()) }
}

function capaPajaros() {
  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.connect(master)
  let t = 0
  const canto = () => {
    const notas = 2 + Math.floor(Math.random() * 4)
    const base = 2200 + Math.random() * 1800
    let ahora = ctx.currentTime
    for (let i = 0; i < notas; i++) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      const f0 = base * (0.9 + Math.random() * 0.25)
      osc.frequency.setValueAtTime(f0, ahora)
      osc.frequency.exponentialRampToValueAtTime(f0 * (1.1 + Math.random() * 0.3), ahora + 0.06)
      osc.frequency.exponentialRampToValueAtTime(f0 * 0.95, ahora + 0.13)
      const env = ctx.createGain()
      env.gain.setValueAtTime(0.0001, ahora)
      env.gain.exponentialRampToValueAtTime(0.8, ahora + 0.02)
      env.gain.exponentialRampToValueAtTime(0.0001, ahora + 0.14)
      osc.connect(env).connect(gain)
      osc.start(ahora)
      osc.stop(ahora + 0.16)
      ahora += 0.16 + Math.random() * 0.12
    }
    t = setTimeout(canto, 1500 + Math.random() * 5000)
  }
  t = setTimeout(canto, 800 + Math.random() * 2000)
  return { gain, parar: () => clearTimeout(t) }
}

const FABRICAS = {
  viento: () => capaViento(420),
  vientoBajo: () => capaViento(180),
  lluvia: capaLluvia,
  truenos: capaTruenos,
  grillos: capaGrillos,
  pajaros: capaPajaros,
}

/** Volumen de cada capa para una escena. */
function mezcla({ cielo, terreno }) {
  const m = { viento: 0.12, vientoBajo: 0, lluvia: 0, truenos: 0, grillos: 0, pajaros: 0 }
  if (['yermo', 'arena', 'piedra'].includes(terreno)) m.viento = 0.22
  if (terreno === 'nieve') { m.viento = 0.2; m.vientoBajo = 0.08 }
  if (cielo === 'niebla') { m.viento = 0.06; m.vientoBajo = 0.14 }
  if (cielo === 'tormenta') { m.viento = 0.3; m.lluvia = 0.22; m.truenos = 0.55 }
  if (cielo === 'noche' && terreno !== 'nieve') m.grillos = 0.05
  if (['dia', 'amanecer'].includes(cielo) && ['bosque', 'campo', 'pantano'].includes(terreno)) m.pajaros = 0.06
  if (cielo === 'atardecer' && ['bosque', 'campo'].includes(terreno)) m.pajaros = 0.03
  return m
}

function aplicar() {
  if (!ctx || ctx.state !== 'running' || !objetivo) return
  const m = mezcla(objetivo)
  const ahora = ctx.currentTime
  for (const [nombre, vol] of Object.entries(m)) {
    if (vol > 0 && !capas[nombre]) capas[nombre] = FABRICAS[nombre]()
    const c = capas[nombre]
    if (!c) continue
    c.gain.gain.cancelScheduledValues(ahora)
    c.gain.gain.setValueAtTime(Math.max(0.0001, c.gain.gain.value), ahora)
    c.gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol), ahora + FUNDIDO)
    if (vol === 0) {
      // Retirar la capa cuando termine de apagarse
      const ref = c
      setTimeout(() => {
        if (capas[nombre] === ref && mezcla(objetivo || {})[nombre] === 0) {
          ref.parar()
          delete capas[nombre]
        }
      }, (FUNDIDO + 0.3) * 1000)
    }
  }
}

async function encender() {
  if (!ctx) {
    try { crear() } catch { activo = false; return }
  }
  try { await ctx.resume() } catch { /* aún sin gesto */ }
  if (!activo) return
  if (ctx.state !== 'running') {
    if (!esperandoGesto) {
      esperandoGesto = true
      const h = () => { esperandoGesto = false; if (activo) encender() }
      window.addEventListener('pointerdown', h, { once: true })
      window.addEventListener('keydown', h, { once: true })
    }
    return
  }
  aplicar()
}

function apagar() {
  if (!ctx) return
  const ahora = ctx.currentTime
  for (const c of Object.values(capas)) {
    c.gain.gain.cancelScheduledValues(ahora)
    c.gain.gain.setValueAtTime(Math.max(0.0001, c.gain.gain.value), ahora)
    c.gain.gain.exponentialRampToValueAtTime(0.0001, ahora + 1.0)
  }
  const viejas = capas
  capas = {}
  setTimeout(() => Object.values(viejas).forEach((c) => c.parar()), 1300)
}

/**
 * Enciende o apaga el ambiente y fija la escena actual.
 * `escena`: { cielo, terreno } o null (sin escena no suena nada).
 */
export function establecerAmbiente(on, escena) {
  objetivo = escena && (escena.cielo || escena.terreno) ? { cielo: escena.cielo, terreno: escena.terreno } : null
  const debe = on && !!objetivo
  if (debe && !activo) { activo = true; encender() }
  else if (debe) { if (ctx && ctx.state === 'running') aplicar(); else encender() }
  else if (activo) { activo = false; apagar() }
}
