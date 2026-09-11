# Ilustraciones de objetos

Una imagen por objeto inicial, en esta carpeta, con el nombre exacto de abajo
(minúsculas, sin tildes, guiones en vez de espacios). Se usan en las tarjetas
del creador de personaje y en el zurrón durante la partida.

**Formato**: cuadrado, 512×512 o más (768×768 ideal), JPG calidad 85, sin
texto, sin marco. El objeto solo, centrado, ocupando unos dos tercios del
cuadro, sobre fondo oscuro neutro (gris azulado muy oscuro, ligeramente
degradado), con una luz lateral que marque volumen.

## Prompt base (añádelo a cada uno)

> Ilustración de objeto para inventario de juego de rol medieval oscuro,
> estilo tinta y color con líneas finas y texturas de grabado, paleta apagada
> con toques dorados cálidos, objeto centrado y aislado sobre fondo oscuro
> neutro degradado, luz lateral suave, sin texto, sin marco, formato cuadrado.

## Mercenario

| Archivo | Objeto |
|---|---|
| `cota-remendada.jpg` | Cota de malla vieja con parches de cuero y anillas nuevas más brillantes, doblada o colgada. |
| `paga-de-un-muerto.jpg` | Pequeña bolsa de cuero abierta con unas pocas monedas de plata gastadas; una tiene sangre seca. |
| `cuerno-rajado.jpg` | Cuerno de caza de hueso amarillento con una grieta larga y una boquilla de latón. |

## Ladrón de caminos

| Archivo | Objeto |
|---|---|
| `ganzuas-finas.jpg` | Juego de cuatro ganzúas de acero fino unidas por un aro, sobre un paño oscuro. |
| `retrato-robado.jpg` | Miniatura pintada en un marco dorado pequeño: el rostro de una mujer joven, algo desconchado. |
| `llave-sin-puerta.jpg` | Llave grande de hierro negro, muy antigua, con una pequeña gema turbia en la cabeza. |

## Fraile mendicante

| Archivo | Objeto |
|---|---|
| `reliquia-dudosa.jpg` | Hueso de dedo amarillento en un relicario de latón con cristal, atado con un cordón. |
| `libro-de-nombres.jpg` | Libro pequeño de tapas de cuero gastado, cerrado con una cinta roja, esquinas dobladas. |
| `aceite-bendecido.jpg` | Frasco de vidrio grueso y verdoso con tapón de corcho, medio lleno de aceite dorado que parece brillar. |

## Cazador

| Archivo | Objeto |
|---|---|
| `trampa-de-hierro.jpg` | Cepo de hierro abierto con dientes, cadena corta y estaca, algo oxidado. |
| `piel-de-lobo.jpg` | Piel de lobo gris con la cabeza conservada, doblada sobre sí misma. |
| `silbato-de-hueso.jpg` | Silbato tallado en hueso, pequeño, con marcas grabadas y un cordón de cuero. |

## Comprobar qué hay cargado

En la consola del navegador, con el juego abierto:

```js
import('/src/juego/imagenes.js').then((m) => console.log(m.RETRATOS_DISPONIBLES, m.OBJETOS_DISPONIBLES))
```
