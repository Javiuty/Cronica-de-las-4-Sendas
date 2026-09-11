// Constructores de las figuras 3D (bustos de oficio y objetos) con Three.js.
// Cada función recibe un THREE.Group vacío y le añade las piezas.

import * as THREE from 'three'

export const ORO = '#ECD06F'
export const AZUL = '#2779a7'

const M = {
  piel: 0xb98a63, tela: 0x2b3a48, telaB: 0x1d2a36, cuero: 0x5a4331, metal: 0x8e9aa6,
  metalOsc: 0x59636d, oro: 0xd8b447, madera: 0x6b4f34, hueso: 0xd8cdb4, tinta: 0x141d26,
  vidrio: 0x7fb7d6, rojo: 0x7E2B2B, verde: 0x4a5c39, papel: 0xd9cba8, sal: 0xe8e2d2,
}

const mk = (c, rough) =>
  new THREE.MeshStandardMaterial({
    color: c,
    roughness: rough === undefined ? 0.72 : rough,
    metalness: rough !== undefined && rough < 0.4 ? 0.75 : 0.12,
    flatShading: true,
  })

function box(w, h, d, c, x, y, z, r) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mk(c, typeof r === 'number' ? r : undefined))
  m.position.set(x, y, z)
  return m
}
function cyl(rt, rb, h, c, x, y, z, seg, r) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 10), mk(c, r))
  m.position.set(x, y, z)
  return m
}
function sph(rad, c, x, y, z, r) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(rad, 1), mk(c, r))
  m.position.set(x, y, z)
  return m
}
function cone(rad, h, c, x, y, z, seg, r) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(rad, h, seg || 8), mk(c, r))
  m.position.set(x, y, z)
  return m
}
function torus(rad, tub, c, x, y, z, r) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(rad, tub, 8, 18), mk(c, r))
  m.position.set(x, y, z)
  return m
}

/** Oscurece o aclara un color (hex string o número). */
function sombrear(c, f) {
  return new THREE.Color(c).multiplyScalar(f).getHex()
}

/** Prisma trapezoidal: ancho arriba `wt`, abajo `wb`, alto `h`, fondo `d` (fondo también se estrecha con `dt`/`db`). */
function prisma(wt, wb, h, dt, db, c, x, y, z, r) {
  const g = new THREE.BufferGeometry()
  const ht = wt / 2, hb = wb / 2, zt = dt / 2, zb = db / 2, hh = h / 2
  // 8 vértices: 0-3 abajo, 4-7 arriba
  const v = [
    -hb, -hh, -zb,  hb, -hh, -zb,  hb, -hh, zb,  -hb, -hh, zb,
    -ht,  hh, -zt,  ht,  hh, -zt,  ht,  hh, zt,  -ht,  hh, zt,
  ]
  const idx = [
    0, 2, 1, 0, 3, 2,       // base
    4, 5, 6, 4, 6, 7,       // tapa
    3, 7, 6, 3, 6, 2,       // frente (+z)
    1, 5, 4, 1, 4, 0,       // detrás
    0, 4, 7, 0, 7, 3,       // izquierda
    2, 6, 5, 2, 5, 1,       // derecha
  ]
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  const m = new THREE.Mesh(g, mk(c, r))
  m.position.set(x, y, z)
  return m
}

/**
 * Personaje de cuerpo entero a partir de su aspecto y su oficio.
 * `ap`: { piel, pelo, colorPelo, ojos, barba, tocado, ropa, capa }.
 * La figura mide ~3.3 unidades y queda centrada en el origen.
 * Devuelve una función `animar(t)` con el ciclo de reposo.
 */
export function construirPersonaje(g, ap, oficio) {
  const c = new THREE.Group()
  c.position.y = -1.65
  g.add(c)

  const piel = ap.piel || '#b98a63'
  const pielOsc = sombrear(piel, 0.72)
  const pelo = ap.colorPelo || '#4a2f1d'
  const ojos = ap.ojos || '#2b2118'
  const ropa = ap.ropa || '#2b3a48'
  const ropaOsc = sombrear(ropa, 0.78)
  const calzas = sombrear(ropa, 0.55)
  const capucha = ap.capa || 0x233240

  // Sombra en el suelo
  const sombra = new THREE.Mesh(
    new THREE.CircleGeometry(0.62, 18),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.38, depthWrite: false }),
  )
  sombra.rotation.x = -Math.PI / 2
  sombra.scale.set(1.15, 0.45, 1)
  sombra.position.y = 0.005
  c.add(sombra)

  // ---- Piernas y botas --------------------------------------------------------
  for (const x of [-0.24, 0.24]) {
    c.add(cyl(0.16, 0.14, 0.9, calzas, x, 0.65, 0, 8))
    c.add(cyl(0.19, 0.17, 0.34, M.cuero, x, 0.32, 0, 8))
    c.add(box(0.34, 0.16, 0.5, M.cuero, x, 0.08, 0.07))
    c.add(box(0.36, 0.05, 0.52, sombrear(M.cuero, 0.7), x, 0.025, 0.07))
  }

  // ---- Torso: pecho ancho, cintura estrecha, faldón --------------------------
  const pecho = prisma(1.16, 0.92, 0.95, 0.62, 0.52, ropa, 0, 1.98, 0)
  c.add(pecho)
  c.add(prisma(0.94, 1.12, 0.42, 0.54, 0.64, ropaOsc, 0, 1.13, 0)) // faldón
  c.add(box(0.98, 0.12, 0.58, M.cuero, 0, 1.36, 0))
  c.add(box(0.16, 0.16, 0.05, M.oro, 0, 1.36, 0.31, 0.25))
  // Cuello de la prenda
  c.add(box(0.5, 0.1, 0.4, ropaOsc, 0, 2.47, 0.02))

  // ---- Hombros y brazos ---------------------------------------------------------
  const brazos = []
  for (const lado of [-1, 1]) {
    const brazo = new THREE.Group()
    brazo.position.set(lado * 0.66, 2.42, 0)
    brazo.add(sph(0.19, ropa, 0, 0, 0))                          // hombro
    brazo.add(cyl(0.14, 0.12, 0.5, ropa, 0, -0.32, 0, 8))        // brazo
    brazo.add(cyl(0.12, 0.13, 0.5, ropaOsc, 0, -0.78, 0, 8))     // antebrazo (manga)
    brazo.add(box(0.2, 0.22, 0.2, piel, 0, -1.08, 0.02))         // mano
    brazo.rotation.z = lado * 0.1
    c.add(brazo)
    brazos.push(brazo)
  }

  // ---- Cabeza --------------------------------------------------------------------
  const cabeza = new THREE.Group()
  cabeza.position.set(0, 2.62, 0)
  c.add(cyl(0.15, 0.17, 0.22, piel, 0, 2.55, 0, 8))              // cuello
  cabeza.add(box(0.64, 0.5, 0.62, piel, 0, 0.48, 0))             // cráneo
  cabeza.add(prisma(0.6, 0.46, 0.3, 0.6, 0.5, piel, 0, 0.08, 0)) // mandíbula
  cabeza.add(box(0.06, 0.16, 0.12, piel, -0.35, 0.36, -0.02))    // orejas
  cabeza.add(box(0.06, 0.16, 0.12, piel, 0.35, 0.36, -0.02))
  cabeza.add(box(0.1, 0.16, 0.1, pielOsc, 0, 0.3, 0.34))         // nariz
  for (const x of [-0.15, 0.15]) {
    cabeza.add(box(0.15, 0.09, 0.03, 0xf1eee6, x, 0.4, 0.315))   // blanco del ojo
    cabeza.add(box(0.07, 0.07, 0.03, ojos, x, 0.4, 0.33))        // pupila
    const ceja = box(0.17, 0.04, 0.03, pelo, x, 0.5, 0.32)       // ceja
    ceja.rotation.z = -x * 0.6
    cabeza.add(ceja)
  }
  cabeza.add(box(0.16, 0.03, 0.03, pielOsc, 0, 0.14, 0.31))      // boca
  c.add(cabeza)

  // ---- Pelo (oculto bajo capucha o yelmo) ----------------------------------------
  const sinPelo = ap.tocado === 'capucha' || ap.tocado === 'yelmo'
  if (!sinPelo) {
    switch (ap.pelo) {
      case 'corto':
        cabeza.add(box(0.68, 0.2, 0.68, pelo, 0, 0.78, -0.02))
        cabeza.add(box(0.68, 0.42, 0.14, pelo, 0, 0.5, -0.3))
        cabeza.add(box(0.05, 0.3, 0.2, pelo, -0.335, 0.34, -0.12))
        cabeza.add(box(0.05, 0.3, 0.2, pelo, 0.335, 0.34, -0.12))
        break
      case 'melena':
        cabeza.add(box(0.72, 0.2, 0.7, pelo, 0, 0.78, -0.02))
        cabeza.add(box(0.74, 0.9, 0.22, pelo, 0, 0.26, -0.32))
        cabeza.add(box(0.1, 0.78, 0.6, pelo, -0.37, 0.3, -0.06))
        cabeza.add(box(0.1, 0.78, 0.6, pelo, 0.37, 0.3, -0.06))
        break
      case 'coleta': {
        cabeza.add(box(0.68, 0.2, 0.68, pelo, 0, 0.78, -0.02))
        cabeza.add(box(0.68, 0.42, 0.14, pelo, 0, 0.5, -0.3))
        cabeza.add(torus(0.07, 0.025, M.cuero, 0, 0.42, -0.4))
        const cola = cyl(0.07, 0.04, 0.85, pelo, 0, 0.02, -0.46, 6)
        cola.rotation.x = 0.28
        cabeza.add(cola)
        break
      }
      case 'trenza': {
        cabeza.add(box(0.7, 0.2, 0.7, pelo, 0, 0.78, -0.02))
        cabeza.add(box(0.7, 0.5, 0.16, pelo, 0, 0.45, -0.32))
        cabeza.add(box(0.08, 0.5, 0.5, pelo, -0.36, 0.42, -0.1))
        cabeza.add(box(0.08, 0.5, 0.5, pelo, 0.36, 0.42, -0.1))
        for (let i = 0; i < 5; i++) cabeza.add(sph(0.085 - i * 0.008, pelo, (i % 2) * 0.04 - 0.02, 0.12 - i * 0.17, -0.42 - i * 0.03))
        break
      }
      case 'tonsura':
        cabeza.add(box(0.1, 0.24, 0.62, pelo, -0.33, 0.36, 0))
        cabeza.add(box(0.1, 0.24, 0.62, pelo, 0.33, 0.36, 0))
        cabeza.add(box(0.68, 0.24, 0.14, pelo, 0, 0.36, -0.3))
        break
      default:
        break
    }
  }
  // ---- Barba ---------------------------------------------------------------------
  if (ap.barba === 'perilla') cabeza.add(box(0.2, 0.2, 0.1, pelo, 0, 0.02, 0.3))
  if (ap.barba === 'bigote' || ap.barba === 'poblada') cabeza.add(box(0.4, 0.07, 0.08, pelo, 0, 0.2, 0.33))
  if (ap.barba === 'poblada') {
    cabeza.add(box(0.56, 0.3, 0.24, pelo, 0, 0.0, 0.24))
    cabeza.add(box(0.62, 0.3, 0.4, pelo, 0, 0.1, 0.1))
  }
  // ---- Tocado --------------------------------------------------------------------
  switch (ap.tocado) {
    case 'capucha':
      cabeza.add(prisma(0.5, 0.84, 0.42, 0.44, 0.78, capucha, 0, 0.92, -0.08))  // coronilla
      cabeza.add(prisma(0.84, 0.96, 0.5, 0.78, 0.9, capucha, 0, 0.46, -0.08))    // lados
      cabeza.add(box(0.98, 0.3, 0.86, capucha, 0, -0.18, -0.06))                 // caída sobre los hombros
      cabeza.add(box(0.7, 0.2, 0.1, sombrear(capucha, 0.6), 0, 0.68, 0.28))      // sombra del borde sobre la frente
      break
    case 'sombrero':
      cabeza.add(cyl(0.76, 0.76, 0.06, M.cuero, 0, 0.82, 0, 12))
      cabeza.add(prisma(0.56, 0.7, 0.36, 0.56, 0.7, M.cuero, 0, 1.02, 0))
      cabeza.add(box(0.72, 0.06, 0.72, sombrear(M.cuero, 0.6), 0, 0.86, 0))
      break
    case 'yelmo':
      cabeza.add(box(0.72, 0.6, 0.7, M.metal, 0, 0.6, 0, 0.3))
      cabeza.add(box(0.74, 0.1, 0.06, M.tinta, 0, 0.42, 0.35))
      cabeza.add(box(0.08, 0.34, 0.1, M.metal, 0, 0.3, 0.36, 0.3))
      cabeza.add(box(0.1, 0.16, 0.6, M.rojo, 0, 0.98, -0.04))   // cresta
      break
    case 'venda':
      cabeza.add(box(0.7, 0.09, 0.05, capucha, 0, 0.6, 0.32))
      cabeza.add(box(0.7, 0.09, 0.05, capucha, 0, 0.6, -0.32))
      cabeza.add(box(0.05, 0.09, 0.66, capucha, -0.34, 0.6, 0))
      cabeza.add(box(0.05, 0.09, 0.66, capucha, 0.34, 0.6, 0))
      break
    default:
      break
  }
  // ---- Capa ----------------------------------------------------------------------
  let capa = null
  if (ap.capa) {
    capa = new THREE.Group()
    capa.position.set(0, 2.42, -0.28)
    capa.add(prisma(1.2, 1.5, 1.95, 0.1, 0.12, ap.capa, 0, -0.98, -0.1))
    capa.add(box(0.54, 0.16, 0.5, ap.capa, -0.56, 0.02, 0.18))
    capa.add(box(0.54, 0.16, 0.5, ap.capa, 0.56, 0.02, 0.18))
    capa.add(sph(0.07, M.oro, -0.42, -0.02, 0.55, 0.3))
    capa.add(sph(0.07, M.oro, 0.42, -0.02, 0.55, 0.3))
    c.add(capa)
  }

  // ---- Señas del oficio ---------------------------------------------------------
  const derecha = brazos[1]
  switch (oficio) {
    case 'Mercenario':
      c.add(box(0.46, 0.22, 0.62, M.metal, -0.68, 2.46, 0, 0.32))
      c.add(box(0.46, 0.22, 0.62, M.metal, 0.68, 2.46, 0, 0.32))
      derecha.add(cyl(0.04, 0.04, 0.28, M.cuero, 0, -0.98, 0.12, 6))              // empuñadura
      derecha.add(sph(0.06, M.oro, 0, -0.82, 0.12, 0.3))                           // pomo
      derecha.add(box(0.36, 0.06, 0.08, M.metalOsc, 0, -1.14, 0.12, 0.3))          // guarda
      derecha.add(box(0.08, 1.2, 0.03, M.metal, 0, -1.78, 0.12, 0.3))              // hoja, punta al suelo
      c.add(box(1.02, 0.42, 0.6, M.metal, 0, 2.02, 0.02, 0.3)) // peto
      break
    case 'Ladrón de caminos':
      derecha.add(box(0.05, 0.55, 0.02, M.metal, 0, -0.72, 0.24, 0.3))
      derecha.add(box(0.2, 0.05, 0.06, M.metalOsc, 0, -0.98, 0.24, 0.3))
      c.add(box(0.24, 0.26, 0.14, M.cuero, -0.4, 1.2, 0.3))
      c.add(box(0.3, 0.34, 0.06, M.cuero, 0.34, 1.9, 0.3, 0.5)) // correa cruzada
      break
    case 'Fraile mendicante':
      c.add(cyl(0.015, 0.015, 0.5, M.oro, 0, 2.3, 0.33, 6, 0.3))
      c.add(box(0.06, 0.3, 0.04, M.oro, 0, 2.0, 0.34, 0.3))
      c.add(box(0.2, 0.06, 0.04, M.oro, 0, 2.08, 0.34, 0.3))
      c.add(cyl(0.035, 0.035, 0.7, 0x9a8c6a, 0.3, 1.0, 0.32, 6))
      c.add(sph(0.06, 0x9a8c6a, 0.3, 0.66, 0.32))
      c.add(sph(0.05, 0x9a8c6a, 0.3, 1.34, 0.32))
      break
    case 'Cazador': {
      const arco = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.035, 6, 20, Math.PI), mk(M.madera))
      arco.position.set(0.18, 1.9, -0.42)
      arco.rotation.set(0, 0, Math.PI / 2 + 0.15)
      c.add(arco)
      const cuerda = box(0.012, 1.9, 0.012, 0xd8cdb4, -0.77, 1.9, -0.42)
      cuerda.rotation.z = 0.15
      c.add(cuerda)
      c.add(cyl(0.11, 0.11, 0.8, M.cuero, -0.36, 1.9, -0.5, 8))
      for (let i = 0; i < 3; i++) {
        c.add(cyl(0.012, 0.012, 0.5, M.madera, -0.42 + i * 0.06, 2.45, -0.5 + (i % 2) * 0.05, 4))
        c.add(box(0.06, 0.1, 0.03, 0x7E2B2B, -0.42 + i * 0.06, 2.72, -0.5 + (i % 2) * 0.05))
      }
      c.add(box(0.05, 0.42, 0.03, M.metal, -0.5, 1.12, 0.32, 0.3))
      c.add(box(0.14, 0.05, 0.05, M.metalOsc, -0.5, 1.36, 0.32, 0.3))
      const banda = box(0.12, 1.5, 0.05, M.cuero, 0.1, 1.95, 0.32)
      banda.rotation.z = 0.6
      c.add(banda)
      break
    }
    default:
      break
  }

  // ---- Ciclo de reposo -------------------------------------------------------------
  const fase = Math.random() * Math.PI * 2
  return function animar(t) {
    const r = t + fase
    const resp = Math.sin(r * 1.5)
    pecho.scale.set(1 + resp * 0.012, 1 + resp * 0.02, 1 + resp * 0.012)
    cabeza.rotation.y = Math.sin(r * 0.45) * 0.16
    cabeza.rotation.x = Math.sin(r * 0.7) * 0.03
    cabeza.rotation.z = Math.sin(r * 0.33) * 0.03
    brazos[0].rotation.z = -0.1 - Math.sin(r * 1.5) * 0.02
    brazos[1].rotation.z = 0.1 + Math.sin(r * 1.5) * 0.02
    brazos[0].rotation.x = Math.sin(r * 0.6) * 0.03
    brazos[1].rotation.x = -Math.sin(r * 0.6 + 1) * 0.03
    if (capa) capa.rotation.x = -0.04 + Math.sin(r * 0.8) * 0.025
  }
}

export const OBJETO = {
  'Cota remendada'(g) {
    g.add(box(1.0, 1.1, 0.5, M.metal, 0, 0, 0, 0.3))
    g.add(box(0.34, 0.3, 0.52, M.metalOsc, -0.3, 0.2, 0, 0.35))
    g.add(box(0.26, 0.24, 0.52, M.cuero, 0.28, -0.2, 0))
    g.add(box(1.05, 0.12, 0.52, M.metalOsc, 0, -0.48, 0, 0.35))
  },
  'Paga de un muerto'(g) {
    for (let i = 0; i < 5; i++) {
      g.add(cyl(0.34 - i * 0.01, 0.34 - i * 0.01, 0.07, M.oro, (i % 2) * 0.04 - 0.02, -0.3 + i * 0.08, 0, 16, 0.25))
    }
    g.add(cyl(0.3, 0.3, 0.07, M.oro, 0.42, -0.28, 0.3, 16, 0.25))
    g.add(box(0.5, 0.34, 0.3, M.cuero, -0.35, 0.35, 0))
  },
  'Cuerno rajado'(g) {
    const c = cone(0.34, 1.5, M.hueso, 0, 0, 0, 10)
    c.rotation.z = 0.5
    g.add(c)
    g.add(torus(0.2, 0.04, M.oro, 0.32, -0.5, 0, 0.3))
    g.add(box(0.03, 0.9, 0.03, M.tinta, -0.14, 0.16, 0.28))
  },
  'Ganzúas finas'(g) {
    for (let i = 0; i < 4; i++) {
      const p = cyl(0.02, 0.02, 1.1, M.metal, -0.2 + i * 0.14, 0, i * 0.03, 6, 0.3)
      p.rotation.z = (i - 1.5) * 0.12
      g.add(p)
      g.add(box(0.06, 0.12, 0.04, M.metal, -0.2 + i * 0.14 + (i - 1.5) * 0.07, 0.58, i * 0.03, 0.3))
    }
    g.add(torus(0.16, 0.03, M.metalOsc, 0, -0.66, 0, 0.3))
  },
  'Retrato robado'(g) {
    g.add(box(0.9, 1.2, 0.06, M.papel, 0, 0, 0))
    g.add(box(1.0, 1.3, 0.04, M.oro, 0, 0, -0.04, 0.3))
    g.add(sph(0.16, M.piel, 0, 0.22, 0.05))
    g.add(box(0.34, 0.3, 0.04, 0x50343f, 0, -0.18, 0.05))
  },
  'Llave sin puerta'(g) {
    g.add(cyl(0.03, 0.03, 1.2, M.metalOsc, 0, 0, 0, 8, 0.3))
    g.add(torus(0.24, 0.05, M.metalOsc, 0, 0.7, 0, 0.3))
    g.add(box(0.22, 0.1, 0.05, M.metalOsc, 0.12, -0.46, 0, 0.3))
    g.add(box(0.16, 0.1, 0.05, M.metalOsc, 0.09, -0.62, 0, 0.3))
    g.add(sph(0.07, M.vidrio, 0, 0.7, 0, 0.2))
  },
  'Reliquia dudosa'(g) {
    const h = cyl(0.12, 0.12, 1.0, M.hueso, 0, 0, 0, 8)
    h.rotation.z = 0.3
    g.add(h)
    g.add(sph(0.2, M.hueso, 0.16, 0.52, 0))
    g.add(sph(0.2, M.hueso, -0.16, -0.52, 0))
    g.add(torus(0.16, 0.03, M.oro, 0, 0, 0, 0.3))
  },
  'Libro de nombres'(g) {
    g.add(box(0.9, 1.15, 0.22, 0x4a2f28, 0, 0, 0))
    g.add(box(0.84, 1.08, 0.24, M.papel, 0.04, 0, 0))
    g.add(box(0.9, 1.15, 0.06, 0x4a2f28, 0, 0, 0.1))
    g.add(box(0.1, 0.5, 0.02, M.oro, -0.3, 0, 0.14, 0.3))
    g.add(box(0.16, 0.3, 0.03, M.rojo, 0.3, -0.7, 0.05))
  },
  'Aceite bendecido'(g) {
    g.add(cyl(0.26, 0.36, 0.9, M.vidrio, 0, -0.15, 0, 12, 0.15))
    g.add(cyl(0.12, 0.14, 0.3, M.vidrio, 0, 0.42, 0, 10, 0.15))
    g.add(cyl(0.15, 0.15, 0.1, M.cuero, 0, 0.6, 0, 10))
    g.add(cyl(0.24, 0.34, 0.5, M.oro, 0, -0.35, 0, 12, 0.3))
  },
  'Trampa de hierro'(g) {
    // Dos medias mandíbulas dentadas abiertas sobre una base
    g.add(cyl(0.62, 0.62, 0.06, M.metalOsc, 0, -0.45, 0, 16, 0.35))
    for (const lado of [-1, 1]) {
      const mandibula = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 6, 16, Math.PI), mk(M.metal, 0.3))
      mandibula.position.set(0, -0.3, 0)
      mandibula.rotation.set(Math.PI / 2, 0, lado > 0 ? 0 : Math.PI)
      mandibula.rotation.x = lado * 1.15
      g.add(mandibula)
      for (let i = 0; i < 5; i++) {
        const a = (i / 4) * Math.PI
        const diente = cone(0.045, 0.16, M.metal, Math.cos(a) * 0.5, -0.3 + Math.sin(a) * 0.5 * Math.sin(lado * 1.15) * lado, Math.sin(a) * 0.5 * Math.cos(1.15) * lado, 4, 0.3)
        g.add(diente)
      }
    }
    g.add(box(0.14, 0.14, 0.14, M.metalOsc, 0, -0.32, 0, 0.35))
    g.add(cyl(0.02, 0.02, 0.7, M.metalOsc, 0.45, -0.2, 0.3, 6, 0.3))
  },
  'Piel de lobo'(g) {
    g.add(box(1.3, 0.9, 0.12, 0x6d6a5c, 0, -0.1, 0, 0.95))
    g.add(box(0.5, 0.35, 0.14, 0x6d6a5c, 0, 0.5, 0, 0.95))
    g.add(box(0.14, 0.18, 0.1, 0x6d6a5c, -0.2, 0.74, 0, 0.95))
    g.add(box(0.14, 0.18, 0.1, 0x6d6a5c, 0.2, 0.74, 0, 0.95))
    g.add(box(0.07, 0.05, 0.04, 0xd8b447, -0.1, 0.52, 0.08, 0.2))
    g.add(box(0.07, 0.05, 0.04, 0xd8b447, 0.1, 0.52, 0.08, 0.2))
    g.add(box(0.3, 0.6, 0.1, 0x6d6a5c, -0.62, -0.55, 0, 0.95))
    g.add(box(0.3, 0.6, 0.1, 0x6d6a5c, 0.62, -0.55, 0, 0.95))
    g.add(box(1.0, 0.16, 0.13, 0x8a8778, 0, -0.1, 0.01, 0.95))
  },
  'Silbato de hueso'(g) {
    const cuerpo = cyl(0.13, 0.17, 1.3, M.hueso, 0, 0, 0, 10)
    cuerpo.rotation.z = 0.45
    g.add(cuerpo)
    g.add(sph(0.2, M.hueso, 0.3, 0.6, 0))
    g.add(box(0.1, 0.06, 0.2, M.tinta, -0.02, 0.05, 0))
    g.add(box(0.1, 0.06, 0.2, M.tinta, 0.12, -0.25, 0))
    g.add(torus(0.12, 0.025, M.cuero, -0.35, -0.72, 0))
    g.add(cyl(0.015, 0.015, 0.9, M.cuero, -0.55, -0.35, 0, 6))
  },
}

/** Vacía un grupo liberando geometrías y materiales. */
export function vaciar(grp) {
  while (grp.children.length) {
    const c = grp.children.pop()
    if (c.userData.compartido) continue // clon de un modelo en caché: no destruir sus recursos
    c.traverse((o) => {
      if (o.geometry) o.geometry.dispose()
      if (o.material) o.material.dispose()
    })
  }
}
