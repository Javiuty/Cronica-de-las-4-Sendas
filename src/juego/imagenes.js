// Ilustraciones de oficios y objetos. Se cargan todas las imágenes que haya en
// src/assets/personajes/ y src/assets/objetos/ y se buscan por nombre
// normalizado ("Ganzúas finas" -> "ganzuas-finas"). Si falta una, se devuelve
// null y la interfaz muestra un marcador de piedra.

const retratos = import.meta.glob('../assets/personajes/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' })
const objetos = import.meta.glob('../assets/objetos/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' })

/** "Ganzúas finas" -> "ganzuas-finas" */
export function slug(t) {
  return String(t || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function indexar(mapa) {
  const out = {}
  for (const [ruta, url] of Object.entries(mapa)) {
    const nombre = ruta.split('/').pop().replace(/\.[^.]+$/, '')
    out[slug(nombre)] = url
  }
  return out
}

const RETRATOS = indexar(retratos)
const OBJETOS = indexar(objetos)

/**
 * Retratos de un oficio, en orden: `clave.jpg`, `clave-2.jpg`, `clave-3.jpg`…
 * Lista vacía si no hay ninguno.
 */
export function retratosDe(oficio) {
  if (!oficio) return []
  const base = slug(oficio.clave || oficio.nombre)
  const lista = []
  if (RETRATOS[base]) lista.push(RETRATOS[base])
  for (let i = 2; i < 20; i++) {
    if (RETRATOS[base + '-' + i]) lista.push(RETRATOS[base + '-' + i])
  }
  return lista
}

/** URL del retrato de un oficio (variante `i`, por defecto la primera), o null. */
export function retratoDe(oficio, i = 0) {
  const lista = retratosDe(oficio)
  return lista[i] || lista[0] || null
}

/** URL de la ilustración de un objeto (por nombre), o null. */
export function imagenObjeto(nombre) {
  return OBJETOS[slug(nombre)] || null
}

export const RETRATOS_DISPONIBLES = Object.keys(RETRATOS).sort()
export const OBJETOS_DISPONIBLES = Object.keys(OBJETOS).sort()
