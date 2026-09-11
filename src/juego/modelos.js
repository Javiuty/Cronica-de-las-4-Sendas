// Carga de modelos glTF/GLB con caché compartida. Cada Figura3D clona la escena
// cargada (con SkeletonUtils, que respeta esqueletos); geometrías y materiales se
// comparten y no se destruyen al desmontar. Los .glb del proyecto están
// optimizados con meshopt (EXT_meshopt_compression).
//
// Cada modelo se mide al cargar: altura, punto de apoyo y altura de la cabeza,
// para escalarlo y encuadrarlo sin configuración manual.

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { clone as clonarEsqueleto } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { OFICIOS } from './datos'

const cache = new Map()
let loader = null

function medir(escena) {
  escena.updateMatrixWorld(true)
  const caja = new THREE.Box3().setFromObject(escena)
  const tam = new THREE.Vector3()
  caja.getSize(tam)
  const centro = new THREE.Vector3()
  caja.getCenter(centro)
  return { alto: tam.y || 1, minY: caja.min.y, maxY: caja.max.y, centroX: centro.x, centroZ: centro.z }
}

export function cargarModelo(url) {
  if (!cache.has(url)) {
    if (!loader) {
      loader = new GLTFLoader()
      loader.setMeshoptDecoder(MeshoptDecoder)
    }
    cache.set(
      url,
      new Promise((resolver, rechazar) => {
        loader.load(
          url,
          (gltf) => {
            gltf.scene.traverse((o) => {
              if (o.isMesh || o.isSkinnedMesh) o.frustumCulled = false // gira cerca del borde del encuadre
            })
            resolver({ escena: gltf.scene, animaciones: gltf.animations || [], medidas: medir(gltf.scene) })
          },
          undefined,
          rechazar,
        )
      }),
    )
  }
  return cache.get(url)
}

/**
 * Instancia un modelo cargado: clon con esqueleto, escalado a `altoObjetivo` y
 * apoyado en `sueloY`. Devuelve el clon, su mezclador de animaciones (o null) y la
 * altura de la cabeza ya en coordenadas de escena.
 */
export function instanciar(modelo, cfg, altoObjetivo, sueloY) {
  const clon = clonarEsqueleto(modelo.escena)
  clon.traverse((o) => { o.userData.compartido = true })

  const m = modelo.medidas
  const alto = cfg.alto || m.alto
  const k = altoObjetivo / alto
  clon.scale.setScalar(k)
  clon.position.set(-m.centroX * k, sueloY - m.minY * k + (cfg.offsetY || 0), -m.centroZ * k)
  clon.rotation.y = cfg.rotY || 0

  let mezclador = null
  if (modelo.animaciones.length) {
    mezclador = new THREE.AnimationMixer(clon)
    const clip =
      (cfg.animacion && modelo.animaciones.find((a) => a.name === cfg.animacion)) ||
      modelo.animaciones.find((a) => /idle|reposo|espera|breath/i.test(a.name)) ||
      modelo.animaciones[0]
    const accion = mezclador.clipAction(clip)
    accion.play()
    // Desfase aleatorio para que dos figuras iguales no respiren al unísono.
    accion.time = Math.random() * clip.duration
  }

  const cabezaModelo = cfg.cabeza !== undefined ? cfg.cabeza : m.maxY - alto * 0.07
  const cabezaY = sueloY + (cabezaModelo - m.minY) * k + (cfg.offsetY || 0)
  return { clon, mezclador, cabezaY }
}

/** Empieza a descargar los modelos de los oficios para que estén listos al llegar al creador. */
export function precargarModelos() {
  OFICIOS.forEach((of) => {
    if (of.modelo) cargarModelo(of.modelo.url).catch(() => {})
  })
}
