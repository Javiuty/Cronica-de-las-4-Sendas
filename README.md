# Crónica de las Cuatro Sendas

Juego de rol de fantasía medieval narrado por una IA. Eliges entre tres o cuatro opciones, rueda un d20 contra una dificultad y el cronista escribe lo que pasa. Honor, astucia, piedad y codicia suben solos según lo que eliges y, al cerrar el libro, dicen quién eras.

![Una encrucijada en partida: la escena con la tormenta encima, la crónica y las cuatro opciones, y la ficha del personaje](docs/partida.jpg)

## Pantallas

| Menú principal                                 | Creador de personaje                                                        |
| ----------------------------------------------- | --------------------------------------------------------------------------- |
| ![Menú con las losas de piedra](docs/menu.jpg) | ![Oficio, retrato y objeto inicial, con nombre al azar](docs/personaje.jpg) |

| Cómo se juega                                       | La tirada                                           |
| ---------------------------------------------------- | --------------------------------------------------- |
| ![Las cinco reglas en una tablilla](docs/reglas.jpg) | ![El d20 de piedra con el resultado](docs/dado.jpg) |

## Arrancar

```bash
pnpm install
cp .env.example .env.local   # y rellena VITE_ANTHROPIC_API_KEY
pnpm dev
```

Sin clave, el menú, las opciones, las reglas y la creación de personaje funcionan igual, pero al partir al camino el cronista avisa de que no puede escribir.

Si el juego se ejecuta dentro del visor de Claude (`window.claude.complete` disponible), usa ese canal y no necesita clave.

> La clave de API se incrusta en el bundle del navegador. Vale para jugar en local; para publicar, cambia `completar` en `src/juego/cronista.js` por una petición a un backend propio que guarde la clave.

## Estructura

```
src/
  App.jsx                 raíz: fondo, cabecera, pantalla según la fase y el dado
  App.css / index.css     estilos (clases; el original usaba estilos inline)
  piedra.css              texturas de piedra en SVG, tablillas, placas y botones
  juego/
    datos.js              rasgos, oficios, tonos, reglas, esquema JSON del cronista
    derivados.js          cálculos puros a partir del estado (sellos, umbral, largo…)
    fondos.js             banco de fondos por escena con búsqueda del más parecido
    cronista.js           prompt de cada encrucijada y llamada al modelo
    useCronica.js         hook con toda la lógica de partida, el guardado local y las preferencias
    musica.js             música ambiental generada con Web Audio (sin archivos de audio)
    imagenes.js           retratos e ilustraciones de objetos por nombre
  componentes/
    Retrato.jsx           retrato de oficio en marco de piedra, con fundido y marcador
    FondoFX.jsx           pavesas, niebla y clima (lluvia, nieve, relámpagos) en shaders
    Fondo.jsx             fondo de escena con fundido y paneo (imágenes por terreno-cielo)
    Dado.jsx              velo del d20
    Iconos.jsx            iconos SVG de las reglas
  pantallas/
    Menu (+ Menu.css, losas de piedra), Reglas, Opciones y Fin (tablillas con placas),
    Personaje (+ Personaje.css, oficio, retrato y objeto), Carga,
    Juego (+ Juego.css, crónica y ficha en tablillas)
```

## Personaje

Cada oficio tiene un **retrato ilustrado** (`src/assets/personajes/<clave>.jpg`) que se muestra en el creador dentro de un marco de piedra y, recortado a busto, en el panel de partida. Si hay **variantes** (`<clave>-2.jpg`, `<clave>-3.jpg`…), el creador muestra flechas y puntos para elegir entre ellas, y la elegida viaja con la partida. Las miniaturas de la lista de oficios y las losetas de objeto usan las mismas imágenes. El nombre se puede escribir o sacar **al azar** de una lista de nombres castellanos medievales (`NOMBRES` en `src/juego/datos.js`). Los objetos iniciales tienen su **ilustración** (`src/assets/objetos/<nombre-en-minusculas>.jpg`), usada en las tarjetas del creador y en el zurrón. Si falta una imagen, aparece un marcador de piedra con el icono del oficio o el rombo de rareza; basta con soltar el archivo en su carpeta. Listas con nombres, formato y prompts en `src/assets/personajes/LISTA.md` y `src/assets/objetos/LISTA.md`.

## Armas

Dos ranuras: **cuerpo a cuerpo** y **a distancia**. Cada arma tiene un bono de +1 a +4 según lo buena que sea (1 improvisada o gastada, 2 arma corriente, 3 fina, 4 excepcional) y solo suma cuando la opción elegida pide su tipo; el cronista etiqueta cada opción con `combate: cuerpo | distancia | ninguno` y la interfaz lo muestra con un icono de espada o arco. Coger un arma nueva sustituye a la de su ranura; perderla, romperla o entregarla la vacía (`quitar_arma: cuerpo | distancia` en los efectos). El prompt exige que todo cambio de inventario, dinero o salud que cuente la prosa aparezca en `efectos`, y el cliente elimina objetos por nombre sin distinguir mayúsculas ni tildes. Las armas iniciales están en `OFICIOS` (`armas: [...]`) y las reglas de normalización en `normalizarArma` de `src/juego/derivados.js`.

## Fondos de escena y clima

El cronista devuelve en cada turno una `escena` (`terreno`, `cielo`, `estructuras`). Con ella:

- **Fondo**: se elige una imagen de `src/assets/fondos/<terreno>-<cielo>.jpg` (o la más parecida si falta) y se funde con la anterior con un paneo lento. Sin imágenes, se usa el castillo general. La lista de combinaciones, prioridades y prompts está en `src/assets/fondos/LISTA.md`.
- **Tinte de luz** según el cielo (amanecer, día, atardecer, noche, tormenta, niebla), en CSS.
- **Clima en WebGL** (`FondoFX`): lluvia y relámpagos en tormenta, nieve en terreno nevado, niebla más densa en escenas con niebla.

## Zurrón

Hasta 8 objetos, listados con nombre, rareza y nota. Cualquiera puede **entrar en juego** tocándolo antes de elegir una opción: los comunes suman +1 y se gastan; los finos +2 y los arcanos +3, y después su sello queda apagado (una sola vez). Bonos en `BONO_OBJETO` (`src/juego/datos.js`).

## Opciones de partida

- **Música**: bordón grave y notas de arpa generados en el navegador. Para usar una pista propia, sustituye `src/juego/musica.js` por un `<audio loop>`.
- **Dificultad**: Clemente (12 de aliento, tiradas −2), Justa (10, sin ajuste) o Cruel (8, tiradas +2).
- **Duración**: Corta (8 encrucijadas), Media (12) o Larga (18).
- **Sellos visibles** y **Efectos de fondo** (pavesas y niebla WebGL).

Las preferencias se guardan en `localStorage` y sobreviven entre sesiones; la partida guardada conserva la dificultad y duración con las que empezó.

## Scripts

- `pnpm dev` servidor de desarrollo
- `pnpm build` compila a `dist/`
- `pnpm preview` sirve la compilación
- `pnpm lint` oxlint
