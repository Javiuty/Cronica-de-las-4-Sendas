#!/usr/bin/env node
// Importa un personaje FBX (p. ej. de Mixamo, descargado "With Skin") al juego:
//   1. FBX -> GLB con fbx2gltf (esqueleto, animaciones y texturas incluidos)
//   2. Optimiza con gltf-transform (meshopt + texturas WebP)
//   3. Lo deja en src/assets/characters/<carpeta>/<carpeta>.glb
//
// Uso:  pnpm importar:fbx <carpeta> <archivo.fbx> [más.fbx ...]
//   pnpm importar:fbx ladron "C:/Descargas/Ladron Idle.fbx"
//
// Si pasas varios FBX (mismo personaje con distintas animaciones de Mixamo),
// el primero aporta la malla y todos aportan sus animaciones, renombradas según
// el nombre de archivo (sin extensión).

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import convertir from 'fbx2gltf'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const [, , carpeta, ...fbxs] = process.argv

if (!carpeta || !fbxs.length) {
  console.error('Uso: pnpm importar:fbx <carpeta> <archivo.fbx> [más.fbx ...]')
  process.exit(1)
}
for (const f of fbxs) {
  if (!existsSync(f)) {
    console.error('No existe:', f)
    process.exit(1)
  }
}

const destinoDir = path.join(raiz, 'src', 'assets', 'characters', carpeta)
const destino = path.join(destinoDir, `${carpeta}.glb`)
mkdirSync(destinoDir, { recursive: true })
const tmp = mkdtempSync(path.join(tmpdir(), 'fbx-'))
const gltfTransform = path.join(raiz, 'node_modules', '.bin', process.platform === 'win32' ? 'gltf-transform.CMD' : 'gltf-transform')
const mb = (p) => (statSync(p).size / 1048576).toFixed(2) + ' MB'

try {
  // 1. Convertir cada FBX
  const glbs = []
  for (const f of fbxs) {
    const nombre = path.basename(f, path.extname(f))
    const salida = path.join(tmp, nombre + '.glb')
    process.stdout.write(`Convirtiendo ${path.basename(f)} (${mb(f)})… `)
    await convertir(f, salida, ['--khr-materials-unlit=false', '--anim-framerate', 'bake30'])
    console.log('ok', mb(salida))
    glbs.push({ nombre, ruta: salida })
  }

  // 2. Si hay varios, fusionar animaciones en el primero
  let fuente = glbs[0].ruta
  if (glbs.length > 1) {
    const fusion = path.join(tmp, 'fusion.glb')
    // `merge` junta los documentos; `join`/`prune` posteriores en optimize limpian duplicados.
    execFileSync(gltfTransform, ['merge', ...glbs.map((g) => g.ruta), fusion, '--partition', 'false'], { stdio: 'inherit' })
    fuente = fusion
    console.log('Animaciones fusionadas:', glbs.map((g) => g.nombre).join(', '))
    console.log('Aviso: revisa en el juego que las animaciones apunten al mismo esqueleto; si no, importa un solo FBX "With Skin" con la animación deseada.')
  }

  // 3. Optimizar
  process.stdout.write('Optimizando… ')
  execFileSync(
    gltfTransform,
    ['optimize', fuente, destino, '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', '2048', '--simplify', 'false'],
    { stdio: ['ignore', 'ignore', 'inherit'] },
  )
  console.log('ok', mb(destino))
  console.log('\nListo:', path.relative(raiz, destino))
  console.log(`Añade en OFICIOS (src/juego/datos.js):\n  import ${carpeta}Glb from '../assets/characters/${carpeta}/${carpeta}.glb?url'\n  modelo: { url: ${carpeta}Glb }`)
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
