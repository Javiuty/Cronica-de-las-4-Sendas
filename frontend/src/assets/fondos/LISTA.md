# Fondos de escena

Cada imagen se llama `<terreno>-<cielo>.jpg` (minúsculas, sin tildes) y va en esta carpeta.
El juego la elige sola según la escena que devuelve el cronista; si falta una
combinación, usa la más parecida (mismo terreno con otro cielo, luego terreno
vecino) y, si no hay ninguna, el castillo general.

**Formato**: horizontal, 1920×1080 o más (2560×1440 ideal), JPG calidad 80,
sin personajes, sin texto, sin marcos.

**Dónde poner el interés**: durante la partida la imagen se ve sobre todo por
una ventana de piedra en la parte superior de la pantalla, que enseña
aproximadamente el **tercio superior** de la imagen (cielo y horizonte). Pon ahí
lo reconocible: siluetas de torres, copas de árboles, montañas, la luna, el sol
bajo. Lo que quede por debajo asoma solo por los bordes laterales.

## Prompt base (añádelo a cada uno)

> Ilustración digital de fantasía medieval oscura, estilo tinta y color con
> líneas finas y texturas de grabado, paleta apagada de azules profundos y
> grises fríos con toques dorados cálidos, luz atmosférica, gran profundidad,
> sin personajes, sin texto, sin marco, composición horizontal 16:9, con el
> horizonte y las siluetas principales en el tercio superior de la imagen.

Es el mismo estilo del castillo actual (`src/assets/fondo.jpg`); si puedes,
adjúntalo como referencia de estilo.

## Prioridad 1 (las 15 combinaciones más frecuentes)

| Archivo | Escena |
|---|---|
| `campo-dia.jpg` | Campos de labor y caminos de tierra bajo un cielo claro, setos y un pueblo lejano. |
| `campo-atardecer.jpg` | Los mismos campos con el sol bajo, sombras largas, humo de chimeneas al fondo. |
| `campo-noche.jpg` | Camino entre campos a la luz de la luna, una venta con una ventana encendida. |
| `bosque-dia.jpg` | Bosque denso de robles, luz filtrada entre las copas, un sendero que se pierde. |
| `bosque-noche.jpg` | Bosque cerrado de noche, troncos como columnas, apenas un claro con luz de luna. |
| `bosque-niebla.jpg` | Bosque con niebla espesa a media altura, siluetas de árboles que se desvanecen. |
| `piedra-dia.jpg` | Desfiladero rocoso con un castillo o torre en lo alto, camino empedrado. |
| `piedra-noche.jpg` | Murallas y torres de piedra de noche, antorchas en las almenas, cielo estrellado. |
| `piedra-tormenta.jpg` | Ruinas de piedra bajo un cielo de tormenta, relámpago lejano, lluvia oblicua. |
| `piedra-atardecer.jpg` | Ciudad amurallada sobre un risco, sol poniéndose detrás, tejados de pizarra. |
| `pantano-niebla.jpg` | Marismas con agua quieta, juncos, bruma baja y un puente de tablas podrido. |
| `pantano-noche.jpg` | Ciénaga de noche, luces de fuegos fatuos, árboles muertos reflejados en el agua. |
| `yermo-atardecer.jpg` | Páramo seco y pedregoso, horca solitaria, sol rojo sobre el horizonte. |
| `nieve-dia.jpg` | Paso de montaña nevado, pinos cargados de nieve, un refugio de piedra. |
| `arena-dia.jpg` | Dunas y ruinas semienterradas, cielo blanco de calor, caravana lejana. |

## Prioridad 2 (completan los cielos de los terrenos principales)

| Archivo | Escena |
|---|---|
| `campo-amanecer.jpg` | Campos con rocío y niebla baja rosada, gallos, primera luz. |
| `campo-tormenta.jpg` | Trigales agitados por el viento, nubes negras, un rayo cayendo lejos. |
| `campo-niebla.jpg` | Prados con niebla rasa, un cercado de madera y una figura de espantapájaros. |
| `bosque-amanecer.jpg` | Claro del bosque con rayos de sol horizontales entre la bruma. |
| `bosque-atardecer.jpg` | Linde del bosque con luz naranja, hojas doradas, un pozo de piedra. |
| `bosque-tormenta.jpg` | Bosque azotado por la lluvia, ramas rotas, un relámpago tras los árboles. |
| `piedra-amanecer.jpg` | Torre vigía sobre acantilados al amanecer, mar o valle de niebla debajo. |
| `piedra-niebla.jpg` | Cripta o menhires entre niebla espesa, piedras cubiertas de musgo. |
| `pantano-dia.jpg` | Pantano bajo un cielo plomizo, cabañas sobre pilotes, garzas. |
| `pantano-atardecer.jpg` | Ciénaga con el sol bajo reflejado en el agua, nubes de mosquitos. |
| `yermo-dia.jpg` | Llanura agrietada y polvorienta, huesos de animal, torre en ruinas. |
| `yermo-noche.jpg` | Páramo bajo una luna enorme, hoguera de un campamento a lo lejos. |
| `nieve-noche.jpg` | Aldea nevada de noche, luz cálida en las ventanas, aurora tenue. |
| `nieve-tormenta.jpg` | Ventisca en la montaña, apenas se ve un puente de piedra. |
| `arena-noche.jpg` | Desierto de noche con cielo estrellado inmenso, ruinas y una hoguera. |
| `arena-atardecer.jpg` | Dunas rojizas al atardecer, caravana y torre de barro. |

## Prioridad 3 (el resto, por si quieres completar las 42)

`campo-*` y `bosque-*` ya completos con lo anterior. Faltan:
`piedra-` (ninguno), `pantano-amanecer`, `pantano-tormenta`, `yermo-amanecer`,
`yermo-tormenta`, `yermo-niebla`, `nieve-amanecer`, `nieve-atardecer`,
`nieve-niebla`, `arena-amanecer`, `arena-tormenta`, `arena-niebla`.

## Comprobar qué hay cargado

En la consola del navegador, con el juego abierto:

```js
import('/src/juego/fondos.js').then((m) => console.log(m.FONDOS_DISPONIBLES))
```
