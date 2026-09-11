# Ilustraciones de armas

Van en esta carpeta, con el nombre exacto (minúsculas, sin tildes, guiones en
vez de espacios). Se usan en la ficha del oficio del creador y en las dos
ranuras de armas de la partida. Si falta la imagen, se muestra el icono de
espada o arco.

**Búsqueda**: primero por nombre exacto (`espada-mellada.jpg`); si no existe,
por palabra clave dentro del nombre que invente el cronista: "Hacha de leñador"
usa `hacha.jpg`, "Ballesta de caza" usa `ballesta.jpg`. Orden de prioridad:
ballesta, arco, honda, jabalina, espada, daga, cuchillo, hacha, maza, martillo,
lanza, baston, hoz, piedra.

**Formato**: cuadrado, 1024×1024, JPG calidad 85, sin texto, sin marco. El arma
sola, en diagonal o apoyada, ocupando unos dos tercios del cuadro, sobre fondo
oscuro neutro degradado, con luz lateral. Mismo estilo que los objetos.

## Prompt base (añádelo a cada uno)

> Ilustración de arma para inventario de juego de rol medieval oscuro, estilo
> tinta y color con líneas finas y texturas de grabado, paleta apagada con
> toques dorados cálidos, arma centrada y aislada sobre fondo oscuro neutro
> degradado, luz lateral suave, sin texto, sin marco, formato cuadrado.

## Armas iniciales

| Archivo | Arma |
|---|---|
| `espada-mellada.jpg` | Espada de una mano con la hoja mellada y algo oxidada, empuñadura de cuero gastado, pomo de hierro. |
| `daga-corta.jpg` | Daga corta de hoja ancha, guarda sencilla, vaina de cuero al lado. |
| `honda-de-pastor.jpg` | Honda de cuero trenzado con la bolsa y dos piedras redondas. |
| `cuchillo-de-monte.jpg` | Cuchillo de monte de hoja gruesa y mango de asta, funda de cuero. |
| `arco-de-caza.jpg` | Arco de caza de madera curvada, cuerda tensa, dos flechas con plumas cruzadas delante. |

## Banco genérico por palabra clave

| Archivo | Arma |
|---|---|
| `espada.jpg` | Espada de acero corriente, recta, guarda cruzada. |
| `daga.jpg` | Daga fina de doble filo. |
| `cuchillo.jpg` | Cuchillo de cocina o de trabajo, hoja gastada. |
| `hacha.jpg` | Hacha de leñador de una mano, mango de madera. |
| `maza.jpg` | Maza de hierro con cabeza estrellada, mango corto. |
| `martillo.jpg` | Martillo de herrero pesado, cabeza cuadrada. |
| `lanza.jpg` | Lanza corta con punta de hierro en forma de hoja. |
| `baston.jpg` | Bastón de madera nudosa con la punta herrada. |
| `hoz.jpg` | Hoz de segar, hoja curva oxidada, mango de madera. |
| `arco.jpg` | Arco largo de tejo con la cuerda tensa. |
| `ballesta.jpg` | Ballesta de madera y hierro con una saeta cargada. |
| `honda.jpg` | Honda sencilla de cuerda con una piedra. |
| `jabalina.jpg` | Jabalina ligera de madera con punta metálica. |
| `piedra.jpg` | Piedra de río del tamaño de un puño, con aristas. |

## Comprobar qué hay cargado

```js
import('/src/juego/imagenes.js').then((m) => console.log(m.ARMAS_DISPONIBLES))
```
