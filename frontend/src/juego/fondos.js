// Banco de fondos por escena. Cada imagen en src/assets/fondos/ se llama
// `<terreno>-<cielo>.jpg` (p. ej. bosque-noche.jpg). Si falta la combinación
// exacta se busca la más parecida; si no hay nada, se devuelve null y la app
// usa el fondo general.

const archivos = import.meta.glob('../assets/fondos/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const FONDOS = {}
for (const [ruta, url] of Object.entries(archivos)) {
  const nombre = ruta.split('/').pop().replace(/\.[^.]+$/, '')
  FONDOS[normalizar(nombre)] = url
}

/** minúsculas y sin tildes: "Día" -> "dia" */
export function normalizar(t) {
  return String(t || '').normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase()
}

export const TERRENOS = ['piedra', 'bosque', 'campo', 'pantano', 'nieve', 'yermo', 'arena']
export const CIELOS = ['amanecer', 'dia', 'atardecer', 'noche', 'tormenta', 'niebla']

// Cielos que pueden sustituir a otro cuando falta su imagen, por orden de parecido.
const VECINOS_CIELO = {
  dia: ['amanecer', 'atardecer', 'niebla', 'tormenta', 'noche'],
  amanecer: ['atardecer', 'dia', 'niebla', 'noche', 'tormenta'],
  atardecer: ['amanecer', 'dia', 'noche', 'niebla', 'tormenta'],
  noche: ['tormenta', 'atardecer', 'niebla', 'amanecer', 'dia'],
  tormenta: ['noche', 'niebla', 'dia', 'atardecer', 'amanecer'],
  niebla: ['dia', 'amanecer', 'tormenta', 'noche', 'atardecer'],
}
// Terrenos parecidos, por si falta el terreno entero.
const VECINOS_TERRENO = {
  piedra: ['yermo', 'campo', 'nieve', 'arena', 'bosque', 'pantano'],
  bosque: ['pantano', 'campo', 'piedra', 'nieve', 'yermo', 'arena'],
  campo: ['bosque', 'yermo', 'piedra', 'arena', 'pantano', 'nieve'],
  pantano: ['bosque', 'campo', 'piedra', 'yermo', 'nieve', 'arena'],
  nieve: ['piedra', 'yermo', 'campo', 'bosque', 'arena', 'pantano'],
  yermo: ['arena', 'piedra', 'campo', 'nieve', 'bosque', 'pantano'],
  arena: ['yermo', 'campo', 'piedra', 'nieve', 'bosque', 'pantano'],
}

/** URL del fondo que mejor encaja con la escena, o null si no hay ninguno útil. */
export function elegirFondo(escena) {
  if (!escena) return null
  const t = normalizar(escena.terreno)
  const c = normalizar(escena.cielo)
  if (!t && !c) return null
  const buscar = (terreno, cielo) => FONDOS[terreno + '-' + cielo] || null

  if (buscar(t, c)) return buscar(t, c)
  for (const v of VECINOS_CIELO[c] || CIELOS) if (buscar(t, v)) return buscar(t, v)
  for (const tt of VECINOS_TERRENO[t] || TERRENOS) {
    if (buscar(tt, c)) return buscar(tt, c)
    for (const v of VECINOS_CIELO[c] || CIELOS) if (buscar(tt, v)) return buscar(tt, v)
  }
  return null
}

export const FONDOS_DISPONIBLES = Object.keys(FONDOS).sort()
