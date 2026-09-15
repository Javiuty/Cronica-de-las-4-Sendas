"""El prompt de cada encrucijada.

Puerto literal de lo que hasta ahora construía `src/juego/cronista.js` en el
navegador. Vive aquí, y no en el cliente, por dos razones: la clave de API se
queda en el servidor, y nadie puede mandar un texto cualquiera al modelo a
costa de esa clave — el cliente solo envía el estado de su partida.

Las cadenas van sin tildes a propósito, igual que en el original.
"""

import json

from ..schemas import CronicaIn

# Tono del mundo: es `DEFAULTS.tono` del cliente. No lo elige el jugador.
TONO = (
    "oscuro y realista: la gente es dura, el mundo es sucio y nadie regala nada; "
    "pero se cuenta con las palabras de hoy, sin lenguaje antiguo"
)

# Reglas de estilo: lenguaje de hoy y escenas que se puedan ver.
ESTILO = (
    "COMO ESCRIBES. Espanol de Espana actual y llano: el que usaria hoy alguien contando la escena a un amigo. "
    'La ambientacion es medieval; el vocabulario, no. Prohibidos los arcaismos y las palabras rebuscadas: nada de "yantar", "otrora", "doquier", "menester", "vusted", "fementido", "ora... ora", "aljibe", "sayo", "zaguan", "postigo", "ristre", "yelmo" (di "casco"), "cota" (di "cota de malla" solo si hace falta), "faltriquera" (di "bolsa"), "mesnada", "hueste", "lid", "lidiar", "pardiez", "vive Dios", "ribazo" (di "terraplen" o "cuesta"), "sien" (di "frente" o "lado de la cabeza"). '
    "Si una palabra no la diria alguien hoy por la calle, cambiala por la normal. "
    'Tampoco uses el tratamiento de "vos" ni formas como "habeis", "sois" o "vuestra merced": la gente se habla de tu o de usted. '
    'EJEMPLO MAL: "Otrora, en el zaguan de la posada, el mesonero os conmina a yantar antes de partir." '
    'EJEMPLO BIEN: "En el portal de la posada, el dueno te dice que comas algo antes de salir. Tiene las manos manchadas de harina y no te quita ojo." '
    "Frases cortas, de menos de veinte palabras, con sujeto y verbo claros. Una imagen concreta por frase: cosas que se ven, se oyen, se huelen o se tocan (una puerta que no cierra, barro hasta el tobillo, un hombre que no deja de mirarte las manos). "
    'Como mucho una comparacion o metafora por escena; nada de metaforas encadenadas ni frases "bonitas" sin contenido. Sin adornos, sin metadiscurso, sin preguntas retoricas.\n'
    "COMO CONSTRUYES LA ESCENA. La prosa tiene 4 a 6 frases en este orden: (1) donde estas y que ves, en concreto: el sitio, la hora, la luz, el tiempo. (2) Quien o que hay delante: una o dos personas o cosas con un detalle fisico que las haga reconocibles (ropa, gesto, edad, herramienta). (3) Que esta pasando ahora mismo y por que te afecta. (4) Que hay que decidir en este momento. "
    "El lector tiene que poder dibujar la escena al terminar de leer. Si al releer no sabe donde esta o quien le habla, esta mal escrita.\n"
    'LAS OPCIONES son acciones concretas y visibles ("Empujar la mesa contra la puerta"), no intenciones vagas ("Intentar hacer algo"). Cada una en el mismo espanol llano.\n'
    'COHERENCIA ENTRE RELATO Y ESTADO. Todo lo que la prosa diga que el jugador gana, pierde, rompe, gasta, entrega, paga, cobra o le roban tiene que aparecer en "efectos" en esta misma respuesta: si pierde o entrega la daga, "quitar_arma": "cuerpo"; si se le rompe el arco, "quitar_arma": "distancia"; si paga tres monedas, "oro": -3; si le hieren, "vida" negativo; si le dan o coge algo, "objeto" o "arma"; si se gasta o pierde un objeto, "quitar" con su nombre exacto. Y al reves: no cambies "efectos" sin que la prosa lo cuente. '
    'Antes de responder, repasa la prosa frase a frase buscando cambios de inventario, dinero o salud y comprueba que cada uno esta en "efectos". Solo puedes quitar objetos que esten en "zurron" y armas que esten en "arma_cuerpo" o "arma_distancia" del estado; no describas al jugador usando algo que no lleva.\n'
)

ESQUEMA = """Devuelve SOLO un objeto JSON valido, sin markdown ni texto alrededor, con esta forma exacta:
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
Reglas: 3 o 4 opciones, cada una de un rasgo distinto. "dificultad" es el numero que el jugador debe igualar o superar con un d20 mas modificadores: 9-11 si es facil, 12-15 si es dudoso, 16-19 si es temerario. El jugador ve ese numero antes de elegir. "efectos" son las consecuencias de la eleccion que el jugador acaba de tomar (vida y oro son incrementos, pueden ser negativos; en el primer turno van a 0). "combate" dice que tipo de arma ayuda en esa opcion: "cuerpo" si es pelear, forzar o amenazar de cerca; "distancia" si es lanzar, disparar o alcanzar algo lejos; "ninguno" si no interviene un arma (hablar, robar, rezar, comerciar). "objeto", si existe, es { "nombre": "max 3 palabras", "rareza": "comun|fina|arcana", "nota": "una frase corta" }. "arma", si existe, es { "nombre": "max 3 palabras", "rareza": "comun|fina|arcana", "tipo": "cuerpo|distancia", "bono": 1, "nota": "una frase corta" }, donde "bono" mide lo buena que es: 1 improvisada o gastada (hoz, palo, cuchillo de cocina, honda), 2 arma de verdad corriente (espada, hacha, lanza, arco de caza), 3 arma fina o de buen acero (ballesta, mandoble, arco largo), 4 excepcional o arcana. "quitar" es el nombre exacto de un objeto del zurron que se pierde, se gasta, se rompe o se entrega. "quitar_arma" es "cuerpo" o "distancia" si el jugador pierde, rompe, entrega o le roban el arma de esa ranura (queda vacia); si en la misma jugada coge otra, usa "arma" y no "quitar_arma". Las armas van siempre en "arma", nunca en "objeto". Nunca inventes objetos que el jugador ya tiene. El jugador lleva una ranura de arma de cuerpo y otra de distancia: si en la escena hay un arma mejor que la que lleva en esa ranura, ofrecer cogerla debe ser una de las opciones del turno, y si la elige devuelvela en "arma" (sustituye a la anterior). Cada arma sirve para cosas distintas: un baston no abre una cerradura ni una daga tumba a un jinete. Si el jugador muere o la historia se cierra, pon "fin": true, "opciones": [], un "titulo" de 2 a 5 palabras y un "epilogo" de 4 a 6 frases que juzgue quien fue segun sus rasgos."""


def sistema(peticion: CronicaIn) -> str:
    """El prompt de sistema del turno."""
    turno = peticion.estado.turno
    restantes = peticion.largo - turno

    if restantes <= 0:
        cierre = 'ESTE ES EL CIERRE: pon "fin": true y escribe el epilogo.'
    elif restantes <= 2:
        cierre = f"Quedan {restantes} encrucijadas: empieza a cerrar los hilos abiertos."
    else:
        cierre = f"Quedan {restantes} encrucijadas."

    sobre_tirada = (
        'La tirada de d20 ya esta hecha y el jugador la ha visto en pantalla: NARRA su resultado sin contradecirlo. "exito" = consigue lo que pretendia. "coste" = lo consigue pero pierde algo concreto. "fallo" = no lo consigue y la situacion empeora. Ajusta "efectos" en consecuencia.\n'
        if peticion.tirada
        else ""
    )
    sobre_comienzo = (
        ""
        if peticion.eleccion
        else "Es el primer turno: inventa un comienzo distinto y concreto, con un lugar, una hora y alguien o algo que exija una decision. No repitas comienzos tipicos.\n"
    )

    return (
        'Eres el cronista de un juego de rol de fantasia medieval. Escribes en segunda persona ("tu"), en presente. Llamas al jugador por su nombre de vez en cuando, y su oficio tine lo que la gente espera de el. Tono del mundo: '
        + TONO
        + ". El mundo es coherente: la gente tiene intereses, las heridas duelen, el dinero pesa. No moralizas: cuentas lo que pasa.\n"
        + ESTILO
        + f"La partida dura {peticion.largo} encrucijadas. "
        + cierre
        + "\n"
        + sobre_tirada
        + sobre_comienzo
        + ESQUEMA
    )


def usuario(peticion: CronicaIn) -> str:
    """El mensaje de usuario: el estado de la partida, tal cual lo ve el cronista."""
    e = peticion.estado
    estado = {
        "jugador": e.jugador,
        "oficio": e.oficio,
        "turno": e.turno,
        "vida": e.vida,
        "oro": e.oro,
        "arma_cuerpo": e.arma_cuerpo,
        "arma_distancia": e.arma_distancia,
        "zurron": e.zurron,
        "rasgos": e.rasgos.model_dump(),
        "lugar": e.lugar,
        "cronica": e.cronica,
        "eleccion": (
            f"{peticion.eleccion.texto} ({peticion.eleccion.rasgo}, {peticion.eleccion.riesgo})"
            if peticion.eleccion
            else None
        ),
        "tirada": (
            {
                "d20": peticion.tirada.cara,
                "modificador": peticion.tirada.mod,
                "total": peticion.tirada.total,
                "dificultad": peticion.tirada.dif,
                "resultado": peticion.tirada.resultado,
                "objeto_gastado": peticion.tirada.objeto,
                "combate": peticion.tirada.combate,
                "arma_usada": peticion.tirada.arma,
            }
            if peticion.tirada
            else None
        ),
    }

    return (
        "Estado actual:\n"
        + json.dumps(estado, ensure_ascii=False, indent=1)
        + "\n\nEscribe el siguiente fragmento de la cronica. Recuerda: espanol de hoy, llano y concreto, frases cortas; ni una sola palabra antigua o en desuso (nada de otrora, menester, doquier, yantar, hueste, zaguan, sayo, faltriquera, ribazo, sien ni parecidas). Ambientacion medieval, vocabulario actual."
    )
