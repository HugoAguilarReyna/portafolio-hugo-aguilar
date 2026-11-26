# Revisión de fichas y demos · 2026-11-26

Alcance: catálogo de 19 proyectos y 5 áreas de `dist/content.js`. No se
inventaron URLs ni se cambiaron estados sin una demo verificable.

## Las cinco fichas publicadas con demo montada en la ficha

Estas fichas no tienen una URL independiente porque el tablero se monta dentro
de la ficha. Se añadió el campo `demo` con `modo: 'ficha'`, la fecha de
verificación y una descripción; `demoUrl` sigue en `null` y no se inventó una
ruta autónoma.

| Proyecto | Módulo | Campo |
|---|---|---|
| `comparativo-bancario` | `dist/projects/comparativo-bancario.js` | `demo.modo = ficha` |
| `atlas-vial` | `dist/projects/atlas-vial.js` | `demo.modo = ficha` |
| `marketing-clientes` | `dist/projects/marketing-clientes.js` | `demo.modo = ficha` |
| `pulso-comercial` | `dist/projects/pulso-comercial.js` | `demo.modo = ficha` |
| `atlas-comercial` | `dist/projects/atlas-comercial.js` | `demo.modo = ficha` |

Verificación: `node --test tools/demos-contrato.test.mjs` comprueba el módulo y
el artefacto; `npm run verificar` abre las fichas en escritorio y móvil con API
determinista vacía/error y comprueba que el contenedor de la demo se monta, sin
errores de consola ni respuestas 4xx/5xx inesperadas.

## Los tres proyectos publicados en el incremento

El commit `14a8628` publicó `marketing-clientes`, `vidas-en-transito` y
`orbita`. La revisión contra el artefacto y el contenido deja estas precisiones:

- **Marketing y clientes**: demo montada en la ficha, alimentada por la API de
  marketing; los datos publicados son la muestra del 5 % (13 509 de 270 154
  usuarios) y el tablero declara que no representa el desempeño actual de
  Google. No se añadió una URL independiente.
- **Vidas en tránsito**: demo autónoma en
  `dashboards/vidas-en-transito/index.html`; los archivos de datos y geografía
  viven junto a la página. Se mantiene la separación de fuentes y los límites
  de unidad/cobertura; no se suman fuentes distintas.
- **ORBITA**: demo autónoma en `dashboards/orbita/index.html` sobre un snapshot
  CelesTrak de 12 308 registros con fecha y SHA-256 declarados. No se presenta
  como telemetría en vivo ni como censo orbital; la integración se carga en un
  iframe solo al abrir la ficha.

No se encontraron demos publicadas sin artefacto. Las fichas en `previsto` o
`desarrollo` conservan ese estado y no reciben una demo inventada.
