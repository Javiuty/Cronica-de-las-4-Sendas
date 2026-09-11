# Crónica de las Cuatro Sendas

Juego de rol de fantasía medieval narrado por una IA. Eliges entre tres o cuatro opciones, rueda un d20 contra una dificultad y el cronista escribe lo que pasa. Honor, astucia, piedad y codicia suben solos según lo que eliges y, al cerrar el libro, dicen quién eras.

Portado a **React 19 + Vite** desde el prototipo en formato `.dc.html` que sigue en `src/resources/` como referencia.

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
    modelos.js            carga de figuras GLB con caché (GLTFLoader + meshopt)
    figuras3d.js          personaje 3D paramétrico (cuerpo entero) y objetos, en Three.js
  componentes/
    Figura3D.jsx          lienzo WebGL: personaje (cuerpo o busto) u objeto, girando despacio
    FondoFX.jsx           pavesas, niebla y clima (lluvia, nieve, relámpagos) en shaders
    Fondo.jsx             fondo de escena con fundido y paneo (imágenes por terreno-cielo)
    Dado.jsx              velo del d20
    Iconos.jsx            iconos SVG de las reglas
  pantallas/
    Menu (+ Menu.css, losas de piedra), Reglas, Opciones y Fin (tablillas con placas),
    Personaje (+ Personaje.css, creador con aspecto personalizable), Carga,
    Juego (+ Juego.css, crónica y ficha en tablillas)
```

## Personaje

Un oficio puede tener **figura propia en GLB** (campo `modelo` en `OFICIOS`, en `src/juego/datos.js`): se carga con caché, se escala a la altura común y se usa tanto en el creador como en el retrato. Ahora mismo ningún oficio la usa: todos van con el personaje paramétrico para compartir estilo. Para los oficios con figura propia el editor de aspecto se oculta.

Las figuras pueden traer esqueleto y animaciones: se reproduce la que se llame `Idle` (o la primera). Escala, apoyo y encuadre del retrato se calculan solos al cargar.

### Añadir un personaje de Mixamo

1. En [mixamo.com](https://www.mixamo.com) elige un personaje y una animación (por ejemplo **Idle** o **Breathing Idle**).
2. Descarga con: Format **FBX Binary**, Skin **With Skin**, Frames per second **30**, Keyframe Reduction **none**.
3. Importa al juego (convierte a GLB, optimiza y lo deja en su carpeta):

   ```bash
   pnpm importar:fbx ladron "C:/Descargas/Ladron Idle.fbx"
   ```

4. Añade en `OFICIOS` (`src/juego/datos.js`) el `import` y `modelo: { url }` que el script imprime al terminar.

Opcionales en `modelo`: `rotY` (radianes, si no mira al frente), `offsetY`, `alto` y `cabeza` (metros, para forzar la medida), `animacion` (nombre del clip).

Otros GLB (Sketchfab, Blender): optimízalos antes de meterlos en `src/assets/characters/<oficio>/`:

```bash
pnpm exec gltf-transform optimize origen.glb destino.glb --compress meshopt --texture-compress webp --texture-size 2048
```

Los oficios sin figura propia usan personajes 3D de cuerpo entero construidos por parámetros (sin modelos externos): cara con mandíbula, orejas, nariz, ojos y cejas; pecho y cintura; brazos y piernas cilíndricos; faldón y capa trapezoidal; sombra en el suelo y ciclo de reposo por partes (respiración, cabeza, brazos, capa). Ajustes: piel, peinado (6), color de pelo, color de ojos, barba (4), tocado (5), ropa y capa. Cada oficio trae un aspecto por defecto y el jugador puede cambiar tono de piel, peinado, color de pelo, barba, tocado, color de ropa y capa, o pedir uno al azar. El aspecto se guarda con la partida y se usa en el retrato del panel lateral. Paletas y presets en `src/juego/datos.js`; la geometría en `construirPersonaje` de `src/juego/figuras3d.js`.

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
- `pnpm importar:fbx <carpeta> <archivo.fbx>` importa un personaje FBX (Mixamo) como GLB optimizado
