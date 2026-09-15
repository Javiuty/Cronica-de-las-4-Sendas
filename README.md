# Crónica de las Cuatro Sendas

Juego de rol de fantasía medieval narrado por una IA. Eliges entre tres o cuatro opciones, rueda un d20 contra una dificultad y el cronista escribe lo que pasa. Honor, astucia, piedad y codicia suben solos según lo que eliges y, al cerrar el libro, dicen quién eras.

![Una encrucijada en partida: la escena con la tormenta encima, la crónica y las cuatro opciones, y la ficha del personaje](docs/partida.jpg)

## Pantallas

| Menú principal                                 | Creador de personaje                                                        |
| ----------------------------------------------- | --------------------------------------------------------------------------- |
| ![Menú sobre el paisaje con paneles de cristal](docs/menu.jpg) | ![Cuatro paneles de oficio en acordeón, con objeto inicial y nombre](docs/personaje.jpg) |

| Cómo se juega                                       | La tirada                                           |
| ---------------------------------------------------- | --------------------------------------------------- |
| ![Las cinco reglas en un panel de cristal](docs/reglas.jpg) | ![El d20 con el resultado](docs/dado.jpg) |

## Arrancar

Base de datos, backend y frontend se levantan juntos:

```bash
cp .env.example .env     # y rellena JWT_SECRETO y ANTHROPIC_API_KEY
docker compose up --build
```

- Juego: <http://localhost:5173>
- API: <http://localhost:8000/api/salud> · documentación interactiva en <http://localhost:8000/docs>

`JWT_SECRETO` firma las sesiones (`openssl rand -hex 32`). `ANTHROPIC_API_KEY` es la clave del cronista y **vive solo en el servidor**: ya no se incrusta en el bundle del navegador ni se puede gastar desde fuera.

Lo primero que se ve es la pantalla de entrar: sin cuenta no hay crónica, porque el cronista escribe desde el servidor. Ya dentro aparece el menú de siempre (nueva partida, continuar, opciones, reglas). Si el servidor no tiene clave, el cronista avisa de que no tiene con qué escribir.

El navegador pide siempre a `/api`, **del mismo origen**: en desarrollo lo reenvía Vite y en producción nginx. Así no hay CORS que configurar ni una URL de API incrustada en el bundle que cambiar al desplegar.

### Sin Docker

```bash
# Base de datos
docker compose up -d db

# Backend
cd backend
python3 -m venv .venv && ./.venv/bin/pip install -r requirements.txt
cp .env.example .env     # y rellena JWT_SECRETO y ANTHROPIC_API_KEY
./.venv/bin/alembic upgrade head
./.venv/bin/uvicorn app.main:app --reload

# Frontend, en otra terminal
cd frontend && pnpm install && pnpm dev
```

## Desplegar

Pensado para un VPS con **Nginx Proxy Manager** delante. El juego no publica
nada al exterior: NPM lo alcanza por el nombre del contenedor en una red de
Docker compartida.

```bash
docker network create proxy          # una vez, si aún no existe
# y añade esa red al contenedor de NPM

git clone … && cd Cronica-de-las-4-Sendas
cp .env.example .env                 # contraseña de Postgres, JWT_SECRETO y ANTHROPIC_API_KEY
docker compose -f docker-compose.prod.yml up -d --build
```

En NPM, un **Proxy Host**:

| Campo | Valor |
| --- | --- |
| Domain Names | tu dominio |
| Forward Hostname / IP | `web` |
| Forward Port | `80` |
| Block Common Exploits | sí |
| Websockets Support | sí |

Y en la pestaña **Advanced**, esto:

```nginx
proxy_read_timeout 180s;
proxy_send_timeout 180s;
proxy_connect_timeout 30s;
```

Hace falta: NPM no fija ningún timeout, así que rige el de nginx, **60 segundos**.
Escribir una encrucijada tarda entre diez y veinte, y un turno lento al final de
una partida larga puede acercarse de más al límite.

Solo `web` toca la red del proxy; la base de datos y el backend se quedan en la
red interna, sin puerto publicado. `web` sí escucha en `127.0.0.1:8080` del
propio VPS, por si quieres mirar con un túnel SSH; eso no sale a internet.

### DNS: DuckDNS *o* Cloudflare

Son dos capas de DNS y normalmente se usa una:

- **Solo DuckDNS** — `loquesea.duckdns.org`, gratis y siguiendo tu IP aunque
  cambie. Para el certificado, en NPM elige *Use a DNS Challenge* con el
  proveedor **DuckDNS** y tu token. No puedes poner Cloudflare por delante: el
  dominio `duckdns.org` no es tuyo.
- **Dominio propio en Cloudflare** — registro `A` a la IP del VPS, o `CNAME` a
  tu nombre de DuckDNS si la IP se mueve (así combinas los dos: DuckDNS
  persigue la IP y Cloudflare sirve el dominio).

Con Cloudflare, tres cosas:

1. **SSL/TLS en modo *Full (strict)***. En *Flexible* Cloudflare habla HTTP con
   tu servidor y acabas con bucles de redirección.
2. **Certificado por DNS Challenge**, no HTTP. Con la nube naranja activada, el
   reto HTTP-01 de Let's Encrypt no llega a tu NPM. En NPM elige el proveedor
   Cloudflare y pega un API token con permiso `Zone:DNS:Edit`.
3. El plan gratuito **corta a los 100 segundos**. Una encrucijada tarda mucho
   menos, pero si algún día subes el esfuerzo del modelo, tenlo presente.

### Antes de abrirlo al mundo

- **Cambia `POSTGRES_PASSWORD`**: el ejemplo trae `cronica`.
- **Cortafuegos**: solo 80, 443 y SSH. El 81 de NPM, mejor por túnel.
- **Copias**: `docker compose -f docker-compose.prod.yml exec db pg_dump -U cronica cronica > copia.sql`.

Al arrancar, el backend aplica las migraciones pendientes solo, así que
actualizar es `git pull` y volver a levantar.

## Estructura

```
docker-compose.yml        desarrollo: Postgres, backend y el Vite con recarga
docker-compose.prod.yml   despliegue: Postgres, backend y nginx con el juego compilado
.env                      claves y puertos (no va al repositorio)

backend/
  app/
    main.py               la aplicación FastAPI y el CORS
    config.py             ajustes leídos del entorno
    db.py / models.py     motor asíncrono y las tablas (usuarios, partidas)
    schemas.py            contratos de la API (camelCase fuera, snake_case dentro)
    security.py           contraseñas con argon2 y sesiones JWT
    deps.py               sesión de base de datos y jugador de la petición
    routers/
      auth.py             registro, entrada y preferencias
      partidas.py         partida en curso, cierre e historial
      cronista.py         la encrucijada, con su tope por jugador
    cronista/
      prompt.py           el prompt de cada encrucijada (antes en el navegador)
      cliente.py          la llamada al modelo; la clave no sale de aquí
  alembic/                migraciones

frontend/
  src/
    App.jsx               raíz: fondo, cabecera, pantalla según la fase y el dado
    App.css / index.css   estilos (clases; el original usaba estilos inline)
    piedra.css            paneles de cristal oscuro con filo dorado, placas, medallones y botones
                          (conserva las texturas de piedra en SVG, ya sin uso)
    juego/
      datos.js            rasgos, oficios, reglas y textos fijos
      derivados.js        cálculos puros a partir del estado (sellos, umbral, largo…)
      fondos.js           banco de fondos por escena con búsqueda del más parecido
      cronista.js         prepara el estado y se lo pide al backend
      api.js              cliente HTTP del backend
      sesion.js           el token del jugador
      almacen.js          guardado: localStorage y réplica en el servidor
      useCronica.js       hook con toda la lógica de partida, la cuenta y las preferencias
      musica.js           música ambiental generada con Web Audio (sin archivos de audio)
      ambiente.js         sonido de escena (viento, lluvia, truenos, grillos, pájaros) con Web Audio
      imagenes.js         retratos e ilustraciones de objetos por nombre
    componentes/
      Retrato.jsx         retrato de oficio en marco de piedra, con fundido y marcador
      FondoFX.jsx         pavesas, niebla y clima (lluvia, nieve, polvo, relámpagos) en shaders
      Fondo.jsx           fondo de escena con fundido, paralaje y pulso de luz
      Aves.jsx            bandadas cruzando el cielo de día
      Dado.jsx            velo del d20
      Sesion.jsx          marca de sesión en la esquina: quién eres y por dónde se sale
      Iconos.jsx          iconos SVG de las reglas
    pantallas/
      Menu (+ Menu.css, losas de piedra), Reglas, Opciones y Fin (tablillas con placas),
      Cuenta (+ Cuenta.css, entrar, registrarse e historial de crónicas),
      Personaje (+ Personaje.css, paneles de oficio en acordeón), Carga,
      Juego (+ Juego.css, paisaje a pantalla completa, crónica flotante y ficha traslúcida)
```

## Cuenta y partidas guardadas

El juego pide una cuenta (correo, nombre y contraseña) porque el cronista escribe desde el servidor. A cambio, la partida deja de vivir solo en un navegador:

- **La partida en curso** se guarda en Postgres además de en `localStorage`. Al abrir el juego se bajan las dos y gana la más avanzada, así que puedes seguir la crónica desde otro ordenador.
- **Las preferencias** (música, dificultad, duración, sellos, efectos y ambiente) viajan con la cuenta.
- **Las crónicas cerradas** quedan en un historial con su título, su epílogo y cómo acabaron. Se ven en la pantalla *Cuenta*.
- **Salir de la sesión** está en la marca de la esquina superior derecha (pide confirmación, porque borra el guardado de este navegador) y también en la pantalla *Cuenta*. La marca no aparece durante la partida, para no estorbar ni provocar sustos.
- Si el backend no responde, se sigue jugando contra `localStorage` y el guardado sube en cuanto vuelve.

Las contraseñas se guardan con argon2 y la sesión es un JWT de catorce días.

## Backend

FastAPI + SQLAlchemy 2 (asíncrono) + PostgreSQL, en `backend/`.

| Método | Ruta | Qué hace |
| --- | --- | --- |
| `POST` | `/api/auth/registro` · `/api/auth/login` | Crea la cuenta o entra; devuelve el token y la ficha |
| `GET` `PUT` | `/api/auth/yo` · `/api/auth/yo/preferencias` | La ficha del jugador y sus opciones |
| `GET` `PUT` `DELETE` | `/api/partidas/en-curso` | Lee, guarda encima o tira la partida en curso |
| `POST` | `/api/partidas/en-curso/cierre` | Cierra el libro: pasa al historial |
| `GET` | `/api/partidas` | Las crónicas cerradas |
| `POST` | `/api/cronista/encrucijada` | El siguiente fragmento de la crónica |

Dos tablas: `usuarios` y `partidas`. Un jugador tiene como mucho una partida sin terminar, y eso lo sostiene un índice único parcial (`UNIQUE (usuario_id) WHERE NOT terminada`), no solo el código. Los datos del juego (oficios, armas, objetos) siguen en `frontend/src/juego/datos.js`: la base solo guarda lo que cambia al jugar.

El oficio del personaje se guarda por su **clave** (`mercenario`, `ladron`, `fraile`, `cazador`), no por su posición en `OFICIOS`. Así se pueden añadir clases nuevas o reordenar la lista sin que las crónicas ya guardadas cambien de oficio en silencio. La columna `oficio` se sigue escribiendo como respaldo para partidas anteriores, y al cargar manda la clave (`indiceGuardado` en `derivados.js`). `objeto_ini` y `retrato` siguen siendo posicionales: el primero solo se usa en el turno 1 y el segundo indexa variantes de retrato, que se añaden al final.

### Frenos contra el abuso

El cronista cuesta dinero de verdad: unos **0,05 $ por encrucijada** (4.639 tokens
de entrada medidos con `count_tokens`, hasta 0,13 $ si el modelo llena los 4.096
de salida). Sin frenos, una sola cuenta a pleno gas son ~96 $/hora, y las cuentas
son gratis. Hay tres capas:

| Freno | Dónde | Por defecto |
| --- | --- | --- |
| Encrucijadas por jugador y minuto | memoria del proceso | 30 |
| Cuentas nuevas por IP y hora | memoria del proceso | 5 |
| Intentos de entrar por IP cada 5 min | memoria del proceso | 20 |
| **Encrucijadas por día, en todo el servidor** | **base de datos** | **500** |

Los tres primeros filtran la molestia. El que garantiza el gasto es el cuarto:
vive en la tabla `uso_diario`, se incrementa con una sola sentencia atómica (20
peticiones simultáneas dejan el contador exacto) y **no se reinicia al reiniciar
el contenedor**. Al alcanzarlo, la petición se corta en milisegundos sin llegar
a llamar al modelo. Todo se ajusta en el `.env`.

La IP se lee de `CF-Connecting-IP` y `X-Forwarded-For`, que es lo que ponen
Cloudflare y NPM. Son razonables para contar, no son prueba de identidad: quien
tenga muchas IPs se salta los frenos por IP. Por eso el techo del día no depende
de ellos.

> Aun así, **pon un límite de gasto en la consola de Anthropic**. Es el único
> freno que no depende de que este código esté bien.

**El prompt vive en el servidor** (`backend/app/cronista/prompt.py`), no en el navegador. El cliente manda el estado de su partida —validado y con límites de tamaño— y el backend construye la encrucijada. Así nadie puede mandar texto libre al modelo a costa de tu clave. Hay además un tope de 30 peticiones por minuto y jugador.

Migraciones con Alembic; `docker compose up` aplica `alembic upgrade head` antes de arrancar. Para crear una nueva tras tocar `models.py`:

```bash
cd backend && ./.venv/bin/alembic revision --autogenerate -m "lo que cambia"
```

## Personaje

El creador es una pantalla de selección con **cuatro paneles a lo alto**, uno por oficio, con su retrato ilustrado (`frontend/src/assets/personajes/<clave>.jpg`). El elegido se ensancha en acordeón y despliega su ficha: frase, dotación inicial, las tres losetas de objeto y la descripción del elegido. El nombre y los botones van en una banda de piedra abajo. En la partida, el retrato aparece recortado a busto en el panel lateral. Si hay **variantes** (`<clave>-2.jpg`, `<clave>-3.jpg`…), el creador muestra flechas y puntos para elegir entre ellas, y la elegida viaja con la partida. Las miniaturas de la lista de oficios y las losetas de objeto usan las mismas imágenes. El nombre se puede escribir o sacar **al azar** de una lista de nombres masculinos castellanos medievales (`NOMBRES` en `frontend/src/juego/datos.js`). Los objetos iniciales tienen su **ilustración** (`frontend/src/assets/objetos/<nombre-en-minusculas>.jpg`), usada en las tarjetas del creador y en el zurrón. Si falta una imagen, aparece un marcador de piedra con el icono del oficio o el rombo de rareza; basta con soltar el archivo en su carpeta. Listas con nombres, formato y prompts en `frontend/src/assets/personajes/LISTA.md` y `frontend/src/assets/objetos/LISTA.md`.

## Armas

Cada arma puede llevar **ilustración** (`frontend/src/assets/armas/`): por nombre exacto o por palabra clave para las que inventa el cronista ("Hacha de leñador" usa `hacha.jpg`). Lista y prompts en `frontend/src/assets/armas/LISTA.md`. Dos ranuras: **cuerpo a cuerpo** y **a distancia**. Cada arma tiene un bono de +1 a +4 según lo buena que sea (1 improvisada o gastada, 2 arma corriente, 3 fina, 4 excepcional) y solo suma cuando la opción elegida pide su tipo; el cronista etiqueta cada opción con `combate: cuerpo | distancia | ninguno` y la interfaz lo muestra con un icono de espada o arco. Coger un arma nueva sustituye a la de su ranura; perderla, romperla o entregarla la vacía (`quitar_arma: cuerpo | distancia` en los efectos). El prompt exige que todo cambio de inventario, dinero o salud que cuente la prosa aparezca en `efectos`, y el cliente elimina objetos por nombre sin distinguir mayúsculas ni tildes. Las armas iniciales están en `OFICIOS` (`armas: [...]`) y las reglas de normalización en `normalizarArma` de `frontend/src/juego/derivados.js`.

## La pantalla de partida

La ilustración de la escena ocupa toda la pantalla. La crónica flota abajo a la izquierda sobre un degradado que va de transparente a opaco, así el cielo y el horizonte quedan limpios; bajo la columna de la crónica hay además un velo propio que se desvanece hacia arriba y hacia la derecha, para que la cabecera se lea también sobre nieve o arena a mediodía; el registro queda anclado al párrafo más reciente y los anteriores se desvanecen por arriba. La ficha del personaje es un panel traslúcido con desenfoque a la derecha. Todas las pantallas comparten el mismo lenguaje: paneles de cristal oscuro con filo dorado sobre el paisaje, que siempre está vivo (paralaje, pulso de luz, pavesas).

El ambiente responde a la escena que devuelve el cronista (`terreno`, `cielo`):

- **Fondo**: imagen de `frontend/src/assets/fondos/<terreno>-<cielo>.jpg` (o la más parecida), con fundido de 1,6 s al cambiar, **paralaje suave con el ratón** y un **pulso cálido de luz** sobre el horizonte. Lista y prompts en `frontend/src/assets/fondos/LISTA.md`.
- **Luz**: gradación de color y tinte por cielo (amanecer, día, atardecer, noche, tormenta, niebla).
- **Clima en WebGL** (`FondoFX`): lluvia con relámpagos en tormenta, nieve en terreno nevado, polvo en yermo y arena, niebla densa en escenas de niebla, pavesas siempre.
- **Aves** cruzando el cielo en escenas de día (`Aves`).
- **Sonido de ambiente** generado con Web Audio (`frontend/src/juego/ambiente.js`): viento según el terreno, lluvia y truenos en tormenta, grillos de noche, pájaros de día en bosque y campo. Cada capa se funde en 1,6 s. Se apaga en Opciones.

## Zurrón

Hasta 8 objetos, listados con nombre, rareza y nota. Cualquiera puede **entrar en juego** tocándolo antes de elegir una opción: los comunes suman +1 y se gastan; los finos +2 y los arcanos +3, y después su sello queda apagado (una sola vez). Bonos en `BONO_OBJETO` (`frontend/src/juego/datos.js`).

## Opciones de partida

- **Música**: bordón grave y notas de arpa generados en el navegador. Para usar una pista propia, sustituye `frontend/src/juego/musica.js` por un `<audio loop>`.
- **Dificultad**: Clemente (12 de aliento, tiradas −2), Justa (10, sin ajuste) o Cruel (8, tiradas +2).
- **Duración**: Corta (8 encrucijadas), Media (12) o Larga (18).
- **Sonido de ambiente**: viento, lluvia, grillos o pájaros según la escena.
- **Sellos visibles** y **Efectos de fondo** (pavesas, clima y aves).

Las preferencias se guardan en `localStorage` y sobreviven entre sesiones; la partida guardada conserva la dificultad y duración con las que empezó.

## Scripts

Desde `frontend/`:

- `pnpm dev` servidor de desarrollo
- `pnpm build` compila a `dist/`
- `pnpm preview` sirve la compilación
- `pnpm lint` oxlint

Desde la raíz:

- `docker compose up --build` todo el juego, en desarrollo
- `docker compose logs -f backend` los registros del backend
- `docker compose down -v` para y borra también la base de datos
- `docker compose -f docker-compose.prod.yml up -d --build` el despliegue
- `docker compose -f docker-compose.prod.yml exec db pg_dump -U cronica cronica > copia.sql` copia de la base
