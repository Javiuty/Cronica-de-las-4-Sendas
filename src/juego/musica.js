// Música ambiental generada con Web Audio: un bordón grave en re y notas
// sueltas de arpa con eco, en modo dórico. No necesita archivos de audio.
// Para usar una pista propia, sustituye `encender`/`apagar` por un <audio loop>.

// re3 fa3 la3 do4 re4 fa4 sol4 la4 do5 re5
const ESCALA = [146.83, 174.61, 220, 261.63, 293.66, 349.23, 392, 440, 523.25, 587.33]
const VOLUMEN = 0.38

let ctx = null
let master = null
let bus = null
let nodos = []
let temporizadores = []
let activa = false
let sonando = false
let esperandoGesto = false

function crear() {
  const AC = window.AudioContext || window.webkitAudioContext
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = 0.0001
  master.connect(ctx.destination)

  // Eco con realimentación filtrada, a modo de sala de piedra.
  const eco = ctx.createDelay(2)
  eco.delayTime.value = 0.46
  const ecoFiltro = ctx.createBiquadFilter()
  ecoFiltro.type = 'lowpass'
  ecoFiltro.frequency.value = 1600
  const ecoGan = ctx.createGain()
  ecoGan.gain.value = 0.38
  eco.connect(ecoFiltro).connect(ecoGan).connect(eco)
  eco.connect(master)

  bus = ctx.createGain()
  bus.connect(master)
  bus.connect(eco)
}

function bordon(freq, tipo, gan, detune) {
  const o = ctx.createOscillator()
  o.type = tipo
  o.frequency.value = freq
  o.detune.value = detune
  const f = ctx.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 380
  f.Q.value = 0.7
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.045 + Math.random() * 0.02
  const lfoG = ctx.createGain()
  lfoG.gain.value = 140
  lfo.connect(lfoG).connect(f.frequency)
  const g = ctx.createGain()
  g.gain.value = gan
  o.connect(f).connect(g).connect(master)
  o.start()
  lfo.start()
  nodos.push(o, lfo)
}

function arrancarBordon() {
  bordon(73.42, 'triangle', 0.16, -4)
  bordon(73.42, 'sine', 0.14, 5)
  bordon(110, 'triangle', 0.09, 3)
  bordon(146.83, 'sine', 0.05, -2)
}

function nota(freq, dur, vol) {
  const t = ctx.currentTime
  const o = ctx.createOscillator()
  o.type = 'sine'
  o.frequency.value = freq
  const o2 = ctx.createOscillator()
  o2.type = 'triangle'
  o2.frequency.value = freq * 2
  const g2 = ctx.createGain()
  g2.gain.value = 0.18
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.03)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g)
  o2.connect(g2).connect(g)
  g.connect(bus)
  o.start(t)
  o2.start(t)
  o.stop(t + dur + 0.05)
  o2.stop(t + dur + 0.05)
}

function programar() {
  const espera = 2200 + Math.random() * 4200
  temporizadores.push(
    setTimeout(() => {
      if (!activa || !sonando) return
      const i = Math.floor(Math.random() * ESCALA.length)
      nota(ESCALA[i], 2.6 + Math.random() * 1.8, 0.09 + Math.random() * 0.05)
      if (Math.random() < 0.35) {
        const j = Math.max(0, Math.min(ESCALA.length - 1, i + (Math.random() < 0.5 ? -2 : 2)))
        temporizadores.push(setTimeout(() => activa && sonando && nota(ESCALA[j], 2.4, 0.06), 300 + Math.random() * 300))
      }
      programar()
    }, espera),
  )
}

function fundir(objetivo, segundos) {
  const t = ctx.currentTime
  master.gain.cancelScheduledValues(t)
  master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), t)
  master.gain.exponentialRampToValueAtTime(Math.max(0.0001, objetivo), t + segundos)
}

async function encender() {
  activa = true
  if (!ctx) {
    try { crear() } catch { activa = false; return }
  }
  try { await ctx.resume() } catch { /* sin permiso aún */ }
  if (!activa) return
  if (ctx.state !== 'running') {
    // El navegador exige un gesto del usuario: arrancamos en el primero que llegue.
    if (!esperandoGesto) {
      esperandoGesto = true
      const h = () => {
        esperandoGesto = false
        if (activa) encender()
      }
      window.addEventListener('pointerdown', h, { once: true })
      window.addEventListener('keydown', h, { once: true })
    }
    return
  }
  if (!sonando) {
    sonando = true
    arrancarBordon()
    programar()
  }
  fundir(VOLUMEN, 2.5)
}

function apagar() {
  activa = false
  if (!ctx || !sonando) return
  fundir(0.0001, 1.2)
  temporizadores.forEach(clearTimeout)
  temporizadores = []
  setTimeout(() => {
    if (activa) return
    nodos.forEach((n) => { try { n.stop() } catch { /* ya parado */ } })
    nodos = []
    sonando = false
    ctx.suspend().catch(() => {})
  }, 1400)
}

/** Enciende o apaga la música ambiental. Idempotente. */
export function establecerMusica(on) {
  if (on) encender()
  else apagar()
}
