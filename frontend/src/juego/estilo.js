// Red de seguridad de estilo: sustituye arcaísmos que el cronista suelta a
// pesar de las instrucciones. Solo palabras y giros con un sustituto seguro
// (sustantivos, adverbios, alguna forma verbal concreta); nunca conjugaciones
// completas, para no romper la gramática.

// [expresión, sustituto]. Se aplican en orden; los giros largos van primero.
const SUSTITUCIONES = [
  [/\bes menester\b/gi, 'hace falta'],
  [/\bha menester\b/gi, 'necesita'],
  [/\bvive dios\b/gi, 'por Dios'],
  [/\bpor doquiera?\b/gi, 'por todas partes'],
  [/\ba fuer de\b/gi, 'como'],
  [/\bam[eé]n de\b/gi, 'además de'],
  [/\bdiz que\b/gi, 'dicen que'],
  [/\bharto (?!de\b)/gi, 'muy '],
  [/\botrora\b/gi, 'antes'],
  [/\botros[ií]\b/gi, 'además'],
  [/\bempero\b/gi, 'pero'],
  [/\basaz\b/gi, 'bastante'],
  [/\bpresto\b/gi, 'rápido'],
  [/\bpardiez\b/gi, 'maldita sea'],
  [/\bmenesteres\b/gi, 'tareas'],
  [/\bmenester\b/gi, 'necesario'],
  [/\bfaltriqueras\b/gi, 'bolsas'],
  [/\bfaltriquera\b/gi, 'bolsa'],
  [/\baljibes\b/gi, 'cisternas'],
  [/\baljibe\b/gi, 'cisterna'],
  [/\bsayos\b/gi, 'túnicas'],
  [/\bsayo\b/gi, 'túnica'],
  [/\bzaguanes\b/gi, 'portales'],
  [/\bzagu[aá]n\b/gi, 'portal'],
  [/\bpostigos\b/gi, 'ventanucos'],
  [/\bpostigo\b/gi, 'ventanuco'],
  [/\bmesnadas\b/gi, 'tropas'],
  [/\bmesnada\b/gi, 'tropa'],
  [/\bhuestes\b/gi, 'ejércitos'],
  [/\bhueste\b/gi, 'ejército'],
  [/\blides\b/gi, 'peleas'],
  [/\blid\b/gi, 'pelea'],
  [/\blidiar\b/gi, 'pelear'],
  [/\byelmos\b/gi, 'cascos'],
  [/\byelmo\b/gi, 'casco'],
  [/\bfementidos?\b/gi, 'traidor'],
  [/\bfementidas?\b/gi, 'traidora'],
  [/\bvusted\b/gi, 'usted'],
  [/\bmancebos\b/gi, 'chicos'],
  [/\bmancebo\b/gi, 'chico'],
  [/\byantar\b/gi, 'comer'],
  [/\botear\b/gi, 'mirar'],
  [/\boteas\b/gi, 'miras'],
  [/\botea\b/gi, 'mira'],
  [/\boteando\b/gi, 'mirando'],
  [/\bpl[aá]ceme\b/gi, 'me alegra'],
  [/\bd[oó]nde quiera\b/gi, 'donde sea'],
  [/\bcuita\b/gi, 'pena'],
  [/\bcuitas\b/gi, 'penas'],
  [/\balbur\b/gi, 'azar'],
  [/\bbald[oó]n\b/gi, 'insulto'],
  [/\bpr[ií]ncipe de las tinieblas\b/gi, 'demonio'],
  [/\bcelada\b/gi, 'trampa'],
  [/\bceladas\b/gi, 'trampas'],
  [/\blas sienes\b/gi, 'la frente'],
  [/\bsus sienes\b/gi, 'su frente'],
  [/\bsienes\b/gi, 'frente'],
  [/\bsien\b/gi, 'frente'],
  [/\bribazos\b/gi, 'terraplenes'],
  [/\bribazo\b/gi, 'terraplén'],
]

/** Copia la mayúscula inicial del original en el sustituto. */
function conservarMayuscula(original, sustituto) {
  if (original[0] && original[0] === original[0].toUpperCase() && original[0] !== original[0].toLowerCase()) {
    return sustituto[0].toUpperCase() + sustituto.slice(1)
  }
  return sustituto
}

/** Devuelve el texto con los arcaísmos sustituidos y la lista de cambios hechos. */
export function pulirTexto(texto) {
  if (!texto || typeof texto !== 'string') return { texto, cambios: [] }
  const cambios = []
  let salida = texto
  for (const [re, sust] of SUSTITUCIONES) {
    salida = salida.replace(re, (m) => {
      cambios.push(m + ' → ' + sust)
      return conservarMayuscula(m, sust)
    })
  }
  return { texto: salida, cambios }
}

/** Pule los campos de texto de una respuesta del cronista (in situ) y devuelve los cambios. */
export function pulirRespuesta(d) {
  const todos = []
  const pulir = (v) => {
    const r = pulirTexto(v)
    todos.push(...r.cambios)
    return r.texto
  }
  if (d.prosa) d.prosa = pulir(d.prosa)
  if (d.epilogo) d.epilogo = pulir(d.epilogo)
  if (d.titulo) d.titulo = pulir(d.titulo)
  if (d.lugar) d.lugar = pulir(d.lugar)
  if (d.ambiente) d.ambiente = pulir(d.ambiente)
  if (Array.isArray(d.opciones)) {
    for (const op of d.opciones) if (op && op.texto) op.texto = pulir(op.texto)
  }
  return todos
}
