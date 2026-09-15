// Datos estáticos del juego: rasgos, oficios, tonos, textos fijos y el esquema
// JSON que se le exige al cronista.

export const CLAVE = 'cronica-cuatro-sendas-v2'

// Valores por defecto de la partida.
export const DEFAULTS = {
  // El tono del mundo lo pone el servidor: backend/app/cronista/prompt.py
  umbral: 3,
  dificultad: 'justa',
  duracion: 'media',
  sellosVisibles: true,
  musica: false,
  efectos: true,
  ambiente: true,
}

// Dificultad: ajusta el aliento inicial y el número a igualar en las tiradas.
export const DIFICULTADES = {
  clemente: { nombre: 'Clemente', nota: 'Doce de aliento y tiradas dos puntos más fáciles.', ajuste: -2, vida: 12 },
  justa: { nombre: 'Justa', nota: 'Diez de aliento y las tiradas tal como las dicta el cronista.', ajuste: 0, vida: 10 },
  cruel: { nombre: 'Cruel', nota: 'Ocho de aliento y tiradas dos puntos más duras.', ajuste: 2, vida: 8 },
}
export const ORDEN_DIFICULTADES = ['clemente', 'justa', 'cruel']

// Duración de la crónica en encrucijadas.
export const DURACIONES = {
  corta: { nombre: 'Corta', turnos: 8, nota: 'Ocho encrucijadas: una noche.' },
  media: { nombre: 'Media', turnos: 12, nota: 'Doce encrucijadas: un viaje.' },
  larga: { nombre: 'Larga', turnos: 18, nota: 'Dieciocho encrucijadas: una vida.' },
}
export const ORDEN_DURACIONES = ['corta', 'media', 'larga']

export const RASGOS = [
  { clave: 'honor', nombre: 'Honor', glifo: 'H' },
  { clave: 'astucia', nombre: 'Astucia', glifo: 'A' },
  { clave: 'piedad', nombre: 'Piedad', glifo: 'P' },
  { clave: 'codicia', nombre: 'Codicia', glifo: 'C' },
]

export const RASGOS_CERO = { honor: 0, astucia: 0, piedad: 0, codicia: 0 }

export const ARQUETIPO = {
  honor: 'Caballero de la palabra dada',
  astucia: 'Zorro de los caminos',
  piedad: 'La mano que no golpea',
  codicia: 'Sombra de manos llenas',
}

export const RIESGO = { segura: '#7fae6a', incierta: '#ECD06F', temeraria: '#e08b83' }
export const DIF = { segura: 9, incierta: 13, temeraria: 17 }

export const RESULTADO = {
  exito: { texto: 'Éxito', color: '#8fbf72' },
  coste: { texto: 'Éxito con coste', color: '#ECD06F' },
  fallo: { texto: 'Fallo', color: '#e08b83' },
}

export const RAREZA = {
  comun: { nombre: 'común', borde: 'rgba(223,233,240,.3)', tinta: 'rgba(223,233,240,.8)' },
  fina: { nombre: 'fina', borde: 'rgba(236,208,111,.7)', tinta: '#ECD06F' },
  arcana: { nombre: 'arcana', borde: '#2779a7', tinta: '#7fc0e6' },
}
// Bono de un objeto al entrar en juego. Los comunes se gastan; finos y arcanos
// se quedan pero su sello se apaga (una sola vez).
export const BONO_OBJETO = { comun: 1, fina: 2, arcana: 3 }
export const ZURRON_MAX = 8

export const MARCAS = ['I', 'II', 'III', 'IV', 'V']

// ---- Armas ------------------------------------------------------------------
// Dos ranuras: una para pelear de cerca y otra para lo que se lanza o dispara.
// Cada arma tiene un bono (1 a 4) que solo suma cuando la opción pide su tipo.
export const TIPOS_ARMA = {
  cuerpo: { nombre: 'Cuerpo a cuerpo', corto: 'cuerpo', vacio: 'Las manos desnudas', notaVacio: 'Sirven para poco y para todo.' },
  distancia: { nombre: 'A distancia', corto: 'distancia', vacio: 'Nada que lanzar', notaVacio: 'Ni una piedra a mano.' },
}
export const ORDEN_ARMAS = ['cuerpo', 'distancia']
export const BONO_POR_RAREZA = { comun: 1, fina: 2, arcana: 3 }
export const COMBATES = {
  cuerpo: { nombre: 'cuerpo a cuerpo', corto: 'cuerpo' },
  distancia: { nombre: 'a distancia', corto: 'distancia' },
}

export const TONOS = [
  'Épico y solemne, alto fantasy',
  'Oscuro y sucio, medieval realista',
  'Con humor seco, tipo cuento popular',
  'Onírico y extraño, folclore raro',
]

export const FRASES = [
  'El cronista afila la pluma y mira el camino vacío.',
  'Alguien, en algún sitio, ya sabe tu nombre.',
  'Se reparten las cartas del mundo: tierra, hora y testigo.',
  'La tinta se calienta. Falta poco.',
  'Un perro ladra en un pueblo que aún no existe.',
]

// `clave` es el nombre de archivo de su retrato en src/assets/personajes/.
export const OFICIOS = [
  {
    nombre: 'Mercenario',
    clave: 'mercenario',
    nota: 'Cobras por pelear y a veces cumples.',
    oro: 6,
    armas: [{ nombre: 'Espada mellada', rareza: 'comun', tipo: 'cuerpo', bono: 2, nota: 'Corta si insistes.' }],
    objetos: [
      { nombre: 'Cota remendada', rareza: 'fina', nota: 'Aguanta un golpe más de los que debería. Pesa, y se nota al correr.' },
      { nombre: 'Paga de un muerto', rareza: 'fina', nota: 'Se la debías a su viuda. Todavía puedes elegir qué hacer con ella.' },
      { nombre: 'Cuerno rajado', rareza: 'arcana', nota: 'Suena a leguas y no siempre acude quien esperas.' },
    ],
  },
  {
    nombre: 'Ladrón de caminos',
    clave: 'ladron',
    nota: 'Nadie te ha cogido todavía.',
    oro: 10,
    armas: [
      { nombre: 'Daga corta', rareza: 'comun', tipo: 'cuerpo', bono: 1, nota: 'Sirve para cuerdas y para cuellos.' },
      { nombre: 'Honda de pastor', rareza: 'comun', tipo: 'distancia', bono: 1, nota: 'Piedras hay en todas partes.' },
    ],
    objetos: [
      { nombre: 'Ganzúas finas', rareza: 'fina', nota: 'Abren lo que no es tuyo, si hay tiempo y nadie mira.' },
      { nombre: 'Retrato robado', rareza: 'fina', nota: 'Una cara que alguien echa de menos. Vale más como prueba que como oro.' },
      { nombre: 'Llave sin puerta', rareza: 'arcana', nota: 'Pesa más de lo que mide. Alguna cerradura la reconocerá.' },
    ],
  },
  {
    nombre: 'Fraile mendicante',
    clave: 'fraile',
    nota: 'Pides pan y das consejos.',
    oro: 3,
    armas: [],
    objetos: [
      { nombre: 'Reliquia dudosa', rareza: 'fina', nota: 'Un hueso que la gente teme. Da igual de quién fuera.' },
      { nombre: 'Libro de nombres', rareza: 'fina', nota: 'Apuntas a los muertos que nadie llora. Hay quien pagaría por leerlo.' },
      { nombre: 'Aceite bendecido', rareza: 'arcana', nota: 'Arde sin consumirse. Poco, pero arde.' },
    ],
  },
  {
    nombre: 'Cazador',
    clave: 'cazador',
    nota: 'Sabes esperar y sabes dónde duele.',
    oro: 5,
    armas: [
      { nombre: 'Cuchillo de monte', rareza: 'comun', tipo: 'cuerpo', bono: 1, nota: 'Despieza y, si hace falta, algo más.' },
      { nombre: 'Arco de caza', rareza: 'comun', tipo: 'distancia', bono: 2, nota: 'Tira recto si el viento calla.' },
    ],
    objetos: [
      { nombre: 'Trampa de hierro', rareza: 'fina', nota: 'Cierra sobre lo que pise. No distingue patas de tobillos.' },
      { nombre: 'Piel de lobo', rareza: 'fina', nota: 'Abriga, esconde y da que hablar en las ventas.' },
      { nombre: 'Silbato de hueso', rareza: 'arcana', nota: 'Llama a cosas que no son perros.' },
    ],
  },
]

// Nombres para el botón "Al azar" del creador: masculinos castellanos medievales.
export const NOMBRES = [
  'Nuño', 'Sancho', 'Lope', 'Gonzalo', 'Ordoño', 'Fortún', 'Íñigo', 'Ramiro', 'Bermudo', 'Tello',
  'Pelayo', 'Vela', 'Munio', 'Diego', 'Rodrigo', 'García', 'Ximeno', 'Galindo', 'Ferrán', 'Martín',
  'Álvar', 'Suero', 'Osorio', 'Gutierre', 'Vermudo', 'Fruela', 'Gómez', 'Arias', 'Fáfila', 'Aznar',
  'Ansur', 'Fernán', 'Pero', 'Nuño', 'Beltrán', 'Ruy', 'Gil', 'Domingo', 'Esteban', 'Lorenzo',
]

export const REGLAS = [
  { n: 'I', t: 'Eliges, no escribes', d: 'Cada encrucijada trae tres o cuatro opciones. El cronista las inventa a partir de lo que ha pasado, de tu oficio y de lo que llevas encima.' },
  { n: 'II', t: 'Un d20 contra una dificultad', d: 'Antes de elegir ves la dificultad de cada opción («incierta · dif 13»). Al pulsar rueda un d20: igualarla o superarla es éxito; quedarte a tres o menos es éxito con coste; por debajo, fallo. El cronista narra el resultado, nunca lo contradice.' },
  { n: 'III', t: 'Lo que suma', d: 'El rasgo de la opción suma tantos puntos como veces lo has elegido (hasta +4). Llevas dos armas: una para pelear de cerca y otra para lo que se lanza o dispara; cada una tiene su valor (+1 a +4) y solo suma cuando la opción pide su tipo. Cualquier objeto del zurrón puede entrar en juego: tócalo antes de elegir. Los comunes suman +1 y se gastan; los finos +2 y los arcanos +3, y su sello se apaga.' },
  { n: 'IV', t: 'Los cuatro sellos', d: 'Honor, astucia, piedad y codicia suben solos según lo que eliges. Al alcanzar el umbral se encienden, y al cerrar el libro el cronista te nombra por los que ardieron.' },
  { n: 'V', t: 'Aliento, oro y muerte', d: 'Las heridas bajan el aliento y el oro se gasta de verdad. Si el aliento llega a cero la crónica se cierra ahí. La partida se guarda sola en este navegador.' },
]

export const ESQUEMA = `Devuelve SOLO un objeto JSON valido, sin markdown ni texto alrededor, con esta forma exacta:
{
 "lugar": "nombre corto del lugar (max 4 palabras)",
 "ambiente": "3 a 5 palabras sobre luz, clima u hora",
 "prosa": "4 a 6 frases cortas en segunda persona y espanol actual: donde estas y que ves, quien hay delante con un detalle fisico, que pasa ahora y que hay que decidir",
 "escena": {
   "terreno": "piedra|bosque|campo|pantano|nieve|yermo|arena",
   "cielo": "amanecer|dia|atardecer|noche|tormenta|niebla",
   "estructuras": ["hasta 3 de: taberna|torre|ruina|capilla|puente|campamento|pozo|horca|menhires|arboles|rocas|cercado|agua|hoguera|cripta"]
 },
 "opciones": [
   { "texto": "una accion concreta, max 16 palabras", "rasgo": "honor|astucia|piedad|codicia", "riesgo": "segura|incierta|temeraria", "combate": "cuerpo|distancia|ninguno", "dificultad": 13 }
 ],
 "efectos": { "vida": 0, "oro": 0, "objeto": null, "quitar": null, "arma": null, "quitar_arma": null },
 "fin": false,
 "titulo": null,
 "epilogo": null
}
Reglas: 3 o 4 opciones, cada una de un rasgo distinto. "dificultad" es el numero que el jugador debe igualar o superar con un d20 mas modificadores: 9-11 si es facil, 12-15 si es dudoso, 16-19 si es temerario. El jugador ve ese numero antes de elegir. "efectos" son las consecuencias de la eleccion que el jugador acaba de tomar (vida y oro son incrementos, pueden ser negativos; en el primer turno van a 0). "combate" dice que tipo de arma ayuda en esa opcion: "cuerpo" si es pelear, forzar o amenazar de cerca; "distancia" si es lanzar, disparar o alcanzar algo lejos; "ninguno" si no interviene un arma (hablar, robar, rezar, comerciar). "objeto", si existe, es { "nombre": "max 3 palabras", "rareza": "comun|fina|arcana", "nota": "una frase corta" }. "arma", si existe, es { "nombre": "max 3 palabras", "rareza": "comun|fina|arcana", "tipo": "cuerpo|distancia", "bono": 1, "nota": "una frase corta" }, donde "bono" mide lo buena que es: 1 improvisada o gastada (hoz, palo, cuchillo de cocina, honda), 2 arma de verdad corriente (espada, hacha, lanza, arco de caza), 3 arma fina o de buen acero (ballesta, mandoble, arco largo), 4 excepcional o arcana. "quitar" es el nombre exacto de un objeto del zurron que se pierde, se gasta, se rompe o se entrega. "quitar_arma" es "cuerpo" o "distancia" si el jugador pierde, rompe, entrega o le roban el arma de esa ranura (queda vacia); si en la misma jugada coge otra, usa "arma" y no "quitar_arma". Las armas van siempre en "arma", nunca en "objeto". Nunca inventes objetos que el jugador ya tiene. El jugador lleva una ranura de arma de cuerpo y otra de distancia: si en la escena hay un arma mejor que la que lleva en esa ranura, ofrecer cogerla debe ser una de las opciones del turno, y si la elige devuelvela en "arma" (sustituye a la anterior). Cada arma sirve para cosas distintas: un baston no abre una cerradura ni una daga tumba a un jinete. Si el jugador muere o la historia se cierra, pon "fin": true, "opciones": [], un "titulo" de 2 a 5 palabras y un "epilogo" de 4 a 6 frases que juzgue quien fue segun sus rasgos.`
