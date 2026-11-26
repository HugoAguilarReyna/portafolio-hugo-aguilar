# Cierre de auditoría del sitio · 2026-11-26

No se desplegó al VPS ni se modificó producción.

## Punto de partida

- `main` comprobado: `3d420a1`.
- `feat/catalogo-ids`: `9d46d93`; solo añade el exportador del catálogo.
- Remote correcto: `https://github.com/HugoAguilarReyna/portafolio-hugo-aguilar.git`.
- El trabajo se hizo en el worktree
  `D:\Portafolio\work\audit-cierre-sitio`, rama
  `audit/cierre-auditoria-2026-11-26`; no se tocó la copia local con cambios
  ajenos.

## Catálogo y demos

- 19 proyectos y 5 áreas; IDs coincidentes con el catálogo del API.
- Las **cinco fichas publicadas** que montan la demo dentro de la ficha
  (`comparativo-bancario`, `atlas-vial`, `marketing-clientes`,
  `pulso-comercial`, `atlas-comercial`) ahora declaran:
  `demo: {modo:'ficha', verificado:'2026-11-26', descripcion}`.
  No se inventó una URL independiente; `demoUrl` permanece `null`.
- Se revisaron los **tres proyectos publicados** en `14a8628`:
  `marketing-clientes`, `vidas-en-transito` y `orbita`. La revisión está en
  `docs/REVISION_FICHAS_2026-11-26.md`.
- Contrato automático: `node --test tools/demos-contrato.test.mjs` (4 pruebas).
- El inventario `docs/EVIDENCIA_PROYECTOS.json` y la matriz CSV se regeneraron
  con `node tools/generar-evidencia.mjs`; `--check` pasa.

## Interfaz de `/agent`

- `dist/dashboards/data-incident-commander/index.html` incorpora el botón
  explícito **«Ejecutar agente»** y un panel de resultado.
- `app.js` llama a `POST /api/v1/incident-commander/runs/{id}/agent` con el
  mismo origen `/api`, sin credenciales en el navegador.
- No hay llamada automática al cargar: el botón está deshabilitado hasta que
  existe un run. Muestra carga, plan, justificación, evidencia, riesgos, traza,
  tokens y el aviso de que la recomendación es consultiva y no ejecuta.
- Maneja 429 con `Retry-After`, 422, 502, 503 y errores de red.
- Prueba de navegador aislada: `npm run verificar:agente` → **15 comprobaciones
  OK** (éxito, sin llamada al cargar, 429 y 503). Se añadió al workflow
  `fichas-browser.yml`.

## Verificación de navegador

- `npm run verificar` abre las 19 fichas en escritorio y móvil, con entrada
  directa y navegación atrás/adelante, y las variantes de API vacía/error/reintento:
  **100/100 casos aprobados** (`artifacts/verificacion-fichas.json`).
- `node tools/generar-evidencia.mjs --check` pasa.
- El resultado se conserva en `artifacts/verificacion-fichas.json`.

## Límites

- No se desplegó al VPS.
- Las pruebas de navegador usan la API determinista vacía/error; no sustituyen
  una prueba de datos reales de producción.
- No se modificaron repositorios de `Dev-HugoAguilar` ni se crearon repos
  alternos.
