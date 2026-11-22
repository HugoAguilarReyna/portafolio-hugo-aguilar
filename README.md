# Portafolio de datos · Hugo Aguilar

Sitio integrador del portafolio: **20 fichas** de proyecto organizadas en **cinco
categorías oficiales**, cada una con su estado, su categoría visible y el enlace a
su repositorio público.

[![Integridad](https://github.com/HugoAguilarReyna/portafolio-hugo-aguilar/actions/workflows/tests.yml/badge.svg)](https://github.com/HugoAguilarReyna/portafolio-hugo-aguilar/actions/workflows/tests.yml)
[![Sitio](https://img.shields.io/badge/sitio-est%C3%A1tico-2f855a)](#ejecutar)

> **Alcance.** Sitio estático: HTML, CSS y JavaScript sin compilación ni backend.
> No usa analítica ni cookies propias. La portada carga fuentes de Google Fonts; las demos conectadas consultan la API y el LLM es opcional.

**Estados**: `Publicado` — terminado, documentado y verificable · `En desarrollo` — versión en construcción; la ficha detalla la demo y evaluación disponibles · `Próximamente` — caso definido y pendiente de desarrollo (*roadmap*).

---

## 01 · Dashboards y visualización

`Etiqueta: Visualización`

| # | Proyecto | Estado | Categoría | Repositorio |
|---|---|---|---|---|
| 1 | Banca múltiple mexicana — Comparativo financiero | Publicado | Finanzas | [`mexican-banking-analytics`](https://github.com/Dev-HugoAguilar/mexican-banking-analytics) |
| 2 | Atlas vial · Ciudad de México | Publicado | Movilidad | [`cdmx-traffic-atlas`](https://github.com/Dev-HugoAguilar/cdmx-traffic-atlas) |
| 3 | Marketing y clientes | En desarrollo | Marketing | [`ga4-marketing-analytics`](https://github.com/Dev-HugoAguilar/ga4-marketing-analytics) |
| 4 | Pulso comercial · Walmex | Publicado | Finanzas | [`walmex-financial-pulse`](https://github.com/Dev-HugoAguilar/walmex-financial-pulse) |
| 5 | Vidas en tránsito | En desarrollo | Ciencia de datos · Observatorio humanitario | [`vidas-en-transito`](https://github.com/Dev-HugoAguilar/vidas-en-transito) |
| 6 | Observatorio financiero de México | Próximamente | Finanzas | Sin repositorio (Roadmap) |
| 7 | ORBITA — Inteligencia orbital | En desarrollo | Ingeniería de datos y visualización | [`orbita-orbital-intelligence`](https://github.com/Dev-HugoAguilar/orbita-orbital-intelligence) |

## 02 · Ciencia de datos y Machine Learning

`Etiqueta: Ciencia de datos`

| # | Proyecto | Estado | Categoría | Repositorio |
|---|---|---|---|---|
| 1 | Walmart M5 — Planeación de demanda y evaluación de pronósticos | Publicado | Demanda | [`demand-forecasting-m5`](https://github.com/Dev-HugoAguilar/demand-forecasting-m5) |
| 2 | Clientes y campañas — Segmentación, propensión e incrementalidad | Publicado | Marketing | [`customer-growth-intelligence`](https://github.com/Dev-HugoAguilar/customer-growth-intelligence) |
| 3 | Clientes en movimiento | Publicado | Marketing | [`customer-growth-intelligence`](https://github.com/Dev-HugoAguilar/customer-growth-intelligence) |
| 4 | Gaza · Vidas y territorio | Publicado | Observatorio humanitario | [`gaza-humanitarian-observatory`](https://github.com/Dev-HugoAguilar/gaza-humanitarian-observatory) |
| 5 | RetailOps Unified | Publicado | Machine Learning | [`retailops-unified`](https://github.com/Dev-HugoAguilar/retailops-unified) |

## 03 · Ingeniería de datos

`Etiqueta: Ingeniería de datos`

| # | Proyecto | Estado | Categoría | Repositorio |
|---|---|---|---|---|
| 1 | Modernización SAS → Python | Próximamente | Arquitectura & ETL | Sin repositorio (Roadmap) |

## 04 · IA generativa y LLMs

`Etiqueta: IA generativa`

| # | Proyecto | Estado | Categoría | Repositorio |
|---|---|---|---|---|
| 1 | Briefing con evidencia · Banco de México | En desarrollo | RAG / Finanzas | [`banxico-evidence-briefing`](https://github.com/Dev-HugoAguilar/banxico-evidence-briefing) |
| 2 | Copiloto NL-to-SQL · indicadores económicos de México | En desarrollo | NL-to-SQL | [`nl2sql-economic-copilot`](https://github.com/Dev-HugoAguilar/nl2sql-economic-copilot) |

## 05 · Agentes y sistemas de decisión

`Etiqueta: Agentes`

| # | Proyecto | Estado | Categoría | Repositorio |
|---|---|---|---|---|
| 1 | Data Incident Commander | En desarrollo | Data Reliability | [`data-incident-commander`](https://github.com/Dev-HugoAguilar/data-incident-commander) |
| 2 | The Ripple Room — disrupciones de semiconductores | En desarrollo | Simulación / Supply Chain | [`ripple-room-supply-chain`](https://github.com/Dev-HugoAguilar/ripple-room-supply-chain) |
| 3 | Kilómetro Cero — control de red de envíos | En desarrollo | Logística | [`kilometro-cero-logistics`](https://github.com/Dev-HugoAguilar/kilometro-cero-logistics) |
| 4 | DockMind — pronóstico y planificación de inventario | En desarrollo | Operaciones | [`dockmind-demand-planning`](https://github.com/Dev-HugoAguilar/dockmind-demand-planning) |
| 5 | Analista asistido por IA | Próximamente | Agentes | Sin repositorio (Roadmap) |

## Infraestructura compartida

| Repositorio | Qué contiene |
|---|---|
| [`portfolio-api`](https://github.com/HugoAguilarReyna/portfolio-api) | API FastAPI + MongoDB Atlas; incluye consultas LLM consultivas opcionales para las demos. |
| [`portafolio-hugo-aguilar`](https://github.com/HugoAguilarReyna/portafolio-hugo-aguilar) | Este sitio integrador: galería, fichas, interfaces y artefactos publicados de las demos. |

## Estado de publicación

Comprobado el **21 de noviembre de 2026** con una petición `HEAD` a cada URL: los dos
repositorios de infraestructura responden **HTTP 200** y son públicos —
[`portafolio-hugo-aguilar`](https://github.com/HugoAguilarReyna/portafolio-hugo-aguilar)
(este sitio) y [`portfolio-api`](https://github.com/HugoAguilarReyna/portfolio-api)
(la API). El resto de enlaces de la tabla apunta a repositorios de cada proyecto y no
se volvió a comprobar en esa fecha; si alguno cambia de nombre o deja de ser público,
el enlace falla y la ficha se queda sin destino hasta corregirlo.

Los tres casos **Próximamente** —Observatorio financiero de México, Modernización
SAS → Python y Analista asistido por IA— no tienen repositorio todavía: solo
tienen caso definido. Cuando se publiquen se añadirá su enlace a la tabla y su
`codigoUrl` en el contenido; el sitio solo dibuja un enlace cuando el repositorio
existe, de modo que una fila nunca apunta a un destino inexistente.

## Stack tecnológico

- ✅ **Demostrado** — la tecnología se importa o se configura en un repositorio público enlazado en esta tabla.
- ◐ **Documentado** — aparece en el diseño o en un caso de roadmap, sin repositorio público.

### Ciencia de datos y Machine Learning

| Tecnología | Nivel | Dónde se demuestra |
|---|---|---|
| Python | ✅ | 15 repositorios: [`portfolio-api`](https://github.com/HugoAguilarReyna/portfolio-api), [`demand-forecasting-m5`](https://github.com/Dev-HugoAguilar/demand-forecasting-m5), [`customer-growth-intelligence`](https://github.com/Dev-HugoAguilar/customer-growth-intelligence) y el resto de pipelines |
| Pandas | ✅ | [`customer-growth-intelligence`](https://github.com/Dev-HugoAguilar/customer-growth-intelligence), [`dockmind-demand-planning`](https://github.com/Dev-HugoAguilar/dockmind-demand-planning) |
| NumPy | ✅ | [`customer-growth-intelligence`](https://github.com/Dev-HugoAguilar/customer-growth-intelligence), [`demand-forecasting-m5`](https://github.com/Dev-HugoAguilar/demand-forecasting-m5), [`dockmind-demand-planning`](https://github.com/Dev-HugoAguilar/dockmind-demand-planning) |
| SciPy | ✅ | [`customer-growth-intelligence`](https://github.com/Dev-HugoAguilar/customer-growth-intelligence) (potencia estadística y corrección de Holm) |
| Scikit-learn | ✅ | [`customer-growth-intelligence`](https://github.com/Dev-HugoAguilar/customer-growth-intelligence) (K-Means y propensión), [`dockmind-demand-planning`](https://github.com/Dev-HugoAguilar/dockmind-demand-planning) (Ridge y Random Forest multisalida) |
| LightGBM | ✅ | [`demand-forecasting-m5`](https://github.com/Dev-HugoAguilar/demand-forecasting-m5) (modelo global por horizonte), [`portfolio-api`](https://github.com/HugoAguilarReyna/portfolio-api) |
| Validación cruzada y selección de modelo | ✅ | [`demand-forecasting-m5`](https://github.com/Dev-HugoAguilar/demand-forecasting-m5): cortes de desarrollo para elegir por WAPE y cortes reservados para evaluar; [`customer-growth-intelligence`](https://github.com/Dev-HugoAguilar/customer-growth-intelligence): validación temporal y de estabilidad entre semillas |
| Pipelines de datos analíticos | ✅ | [`portfolio-api`](https://github.com/HugoAguilarReyna/portfolio-api) (ingesta idempotente con revisiones por hash), [`demand-forecasting-m5`](https://github.com/Dev-HugoAguilar/demand-forecasting-m5) (importar → entrenar → pronosticar → agregar) |

### IA generativa y LLMs

| Capacidad | Nivel | Dónde se demuestra |
|---|---|---|
| Integración de modelos de lenguaje por API | ✅ | [`portfolio-api`](https://github.com/HugoAguilarReyna/portfolio-api) (cliente compartido, configuración solo en servidor), [`portafolio-hugo-aguilar`](https://github.com/HugoAguilarReyna/portafolio-hugo-aguilar/tree/main/dist/dashboards) (seis interfaces que llaman a la API del mismo origen) |
| Diseño de prompts contextuales | ✅ | Briefing Banxico envía la pregunta y los fragmentos recuperados; NL-to-SQL solicita un plan JSON limitado al catálogo; las consultas consultivas de los otros tableros reciben el escenario activo. Las llamadas son explícitas y opcionales. |
| Arquitecturas RAG | ✅ | Briefing Banxico: corpus versionado, recuperación léxica, citas verificadas y abstención. **Sin embeddings**: la recuperación no es vectorial. |
| Sistemas de decisión supervisados | ✅ | Data Incident Commander conserva un flujo determinista y una pausa de aprobación humana; el LLM da una recomendación consultiva de una sola llamada. Kilómetro Cero, The Ripple Room y DockMind también conservan sus motores deterministas. **No son agentes autónomos ni ejecutan acciones con el LLM.** |
| Validación de entradas y salidas | ✅ | NL-to-SQL valida el plan antes de construir SQL de solo lectura; Banxico valida citas; Incident Commander, Kilómetro Cero, Ripple Room y DockMind limitan las respuestas al catálogo y al contexto permitido. |

### Ingeniería de datos, bases de datos y cloud

| Tecnología | Nivel | Dónde se demuestra |
|---|---|---|
| SAS → Python: macros y reportes regulatorios (CNBV / banca) | ◐ | Caso de roadmap *Modernización SAS → Python* (sin repositorio) |
| SQL | ✅ | [`nl2sql-economic-copilot`](https://github.com/Dev-HugoAguilar/nl2sql-economic-copilot) (plantillas parametrizadas sobre SQLite en solo lectura), [`portfolio-api`](https://github.com/HugoAguilarReyna/portfolio-api) (agregaciones y consultas) |
| MongoDB Atlas | ✅ | [`portfolio-api`](https://github.com/HugoAguilarReyna/portfolio-api) (pymongo, índices, importadores idempotentes con revisiones por hash), [`demand-forecasting-m5`](https://github.com/Dev-HugoAguilar/demand-forecasting-m5) |
| SQLite | ✅ | [`nl2sql-economic-copilot`](https://github.com/Dev-HugoAguilar/nl2sql-economic-copilot) (base derivada abierta en modo lectura) |
| BigQuery | ✅ | [`ga4-marketing-analytics`](https://github.com/Dev-HugoAguilar/ga4-marketing-analytics), [`portfolio-api`](https://github.com/HugoAguilarReyna/portfolio-api) (extracción de la muestra pública de GA4) |
| Docker | ✅ | [`portfolio-api`](https://github.com/HugoAguilarReyna/portfolio-api) (`Dockerfile`) |
| Docker Compose | ✅ | [`deploy/docker-compose.yml`](deploy/docker-compose.yml) (sitio + API con un solo origen público) y el `docker-compose.yml` del monorepo de trabajo, que no se publica |
| FastAPI | ✅ | [`portfolio-api`](https://github.com/HugoAguilarReyna/portfolio-api) y los servicios de dominio de varios repositorios |
| Pydantic | ✅ | [`portfolio-api`](https://github.com/HugoAguilarReyna/portfolio-api), [`demand-forecasting-m5`](https://github.com/Dev-HugoAguilar/demand-forecasting-m5), [`data-incident-commander`](https://github.com/Dev-HugoAguilar/data-incident-commander), [`banxico-evidence-briefing`](https://github.com/Dev-HugoAguilar/banxico-evidence-briefing), [`nl2sql-economic-copilot`](https://github.com/Dev-HugoAguilar/nl2sql-economic-copilot) |
| APIs REST | ✅ | [`portfolio-api`](https://github.com/HugoAguilarReyna/portfolio-api) (`/api/v1/…`) y las aplicaciones que la consumen |
| Git | ✅ | Los repositorios enlazados, con commits convencionales |

### Business Intelligence y visualización

| Tecnología | Nivel | Dónde se demuestra |
|---|---|---|
| D3.js | ✅ | 10 repositorios: [`vidas-en-transito`](https://github.com/Dev-HugoAguilar/vidas-en-transito), [`dockmind-demand-planning`](https://github.com/Dev-HugoAguilar/dockmind-demand-planning), [`cdmx-traffic-atlas`](https://github.com/Dev-HugoAguilar/cdmx-traffic-atlas), [`banxico-evidence-briefing`](https://github.com/Dev-HugoAguilar/banxico-evidence-briefing) y el resto |
| React | ✅ | [`cdmx-traffic-atlas`](https://github.com/Dev-HugoAguilar/cdmx-traffic-atlas), [`mexican-banking-analytics`](https://github.com/Dev-HugoAguilar/mexican-banking-analytics), [`ga4-marketing-analytics`](https://github.com/Dev-HugoAguilar/ga4-marketing-analytics), [`walmex-financial-pulse`](https://github.com/Dev-HugoAguilar/walmex-financial-pulse), [`demand-forecasting-m5`](https://github.com/Dev-HugoAguilar/demand-forecasting-m5) |
| Vite | ✅ | Los cuatro tableros React (`cdmx-traffic-atlas`, `mexican-banking-analytics`, `ga4-marketing-analytics`, `walmex-financial-pulse`) con build verificado en CI; `demand-forecasting-m5` incluye la fuente de su interfaz, sin build en CI |
| HTML5 / CSS3 moderno | ✅ | Todos los sitios: sistema visual propio, sin frameworks de UI |
| MapLibre GL · Three.js · SGP4 | ✅ | [`kilometro-cero-logistics`](https://github.com/Dev-HugoAguilar/kilometro-cero-logistics) (mapa vectorial), [`orbita-orbital-intelligence`](https://github.com/Dev-HugoAguilar/orbita-orbital-intelligence) (Tierra 3D y propagación orbital) |
| Playwright · jsdom | ✅ | Verificadores de navegador de los repositorios y pruebas de interfaz en CI |

## Ejecutar

```bash
git clone https://github.com/HugoAguilarReyna/portafolio-hugo-aguilar.git
cd portafolio-hugo-aguilar
python -m http.server 8000 --directory dist
```

Abre <http://127.0.0.1:8000/>. Las rutas son *hash*
(`#/area/<id>/<proyecto>`), así que el sitio funciona desde cualquier servidor de
archivos. El integrador no necesita compilación. Las demos conectadas necesitan la API; las autocontenidas funcionan sin ella.

Los cuatro tableros conectados resuelven la API en tiempo de ejecución con
`dist/config.js`: por omisión `/api` (mismo origen, detrás del proxy). Para
apuntarlos a una API local, define `window.PORTFOLIO_API_BASE` antes de ese
archivo —por ejemplo con un `config.local.js` no versionado— con el valor
`http://127.0.0.1:8010/api`. El artefacto publicado no contiene ninguna URL de
API local.

## Despliegue integrado

El sitio y la API se ejecutan juntos con dos contenedores y un solo origen
público (`/api` lo publica nginx). El paquete está en `deploy/`:

```bash
git clone https://github.com/HugoAguilarReyna/portfolio-api.git   # hermana del sitio
cp deploy/.env.example deploy/.env                               # completa MONGODB_URI
docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build
curl -i http://127.0.0.1:8080/api/v1/health/ready
```

`deploy/LEEME.md` documenta los requisitos (MongoDB Atlas, dominio, TLS), el
procedimiento de datos y lo que el paquete **no** resuelve. `deploy/.env.example`
enumera las variables sin secretos.

## Estructura

```text
dist/                  Sitio servible
  index.html           Documento único del sitio
  config.js            Base de la API en tiempo de ejecución (`/api`)
  app.js               Navegación, vistas y renderizado
  content.js           Contenido: áreas, fichas, estados, categorías y enlaces
  style.css            Sistema visual
  projects/            Módulos que montan cada demo en su ficha
  dashboards/          Demos publicadas (una carpeta por proyecto)
  img/                 Capturas de tarjeta y ficha
deploy/
  docker-compose.yml   Sitio + API + MongoDB local (perfiles de prueba)
  Dockerfile.sitio     Imagen de nginx con `dist/` y el proxy `/api`
  nginx.conf           Raíz web, caché y enrutado `/api`
  .env.example         Variables del despliegue (sin secretos)
  LEEME.md             Procedimiento, requisitos y límites
tools/
  verificar-taxonomia.mjs        Comprueba categorías, estados, enlaces y roadmap
  verificar-fichas.mjs           Fichas, navegación, estados y peticiones de API
  verificar-config-produccion.mjs Build de producción: URL relativa y Gaza
  verificar-produccion.mjs       Comportamiento: ninguna petición a una API local
```

## Verificación

```bash
node tools/verificar-taxonomia.mjs
```

La taxonomía se verifica en un navegador real: orden de las cinco áreas, sus etiquetas, el
recuento de casos por estado, las fichas de cada área, los 17 enlaces a
repositorio, los 12 enlaces a demo, el tratamiento de *roadmap* y la ausencia de
desbordes a 390 px. La última ejecución local se hizo sobre el commit indicado en el PR, no en GitHub Actions.

La integración continua ejecuta la comprobación de sintaxis del JavaScript del
sitio, la validación de la taxonomía (5 áreas, etiquetas, estados y URL de
repositorio) y el escaneo de credenciales.

## Evidencia por repositorio

Lo que ejecuta la integración continua de cada proyecto. Los resultados y sus
ejecuciones viven en cada repositorio y en sus PR; aquí solo se declara el
alcance, sin duplicar cifras que caducan:

| Repositorio | Qué ejecuta su CI |
|---|---|
| `portfolio-api` | `pytest` con dos jobs: dominio sin MongoDB e integración con MongoDB efímero |
| `customer-growth-intelligence` | `pytest` de artefactos y plantillas |
| `vidas-en-transito` | `pytest` de contrato de datos y no redistribución |
| `gaza-humanitarian-observatory` | `pytest` de contrato y guarda de la lista nominal |
| `nl2sql-economic-copilot`, `banxico-evidence-briefing`, `data-incident-commander` | `pytest` del dominio |
| `demand-forecasting-m5` | `pytest` de contratos y lógica pura, más `compileall` |
| `dockmind-demand-planning` | `npm ci`, simulación de 36 escenarios e interfaz en jsdom |
| `ripple-room-supply-chain`, `kilometro-cero-logistics` | `pytest` de invariantes de la simulación |
| cuatro tableros React | `npm ci`, `tsc`, build y comprobación del artefacto |
| `retailops-unified`, `orbita-orbital-intelligence` | integridad del artefacto, procedencia y escaneo de credenciales |

## Stack del portafolio y evidencia técnica

Este repositorio contiene **el sitio integrador**. La barra *Languages* de GitHub
describe únicamente los archivos de este repositorio: los bundles generados de las
demos y su HTML pesan mucho más que las utilidades de verificación, así que la
barra no representa el stack del trabajo. Los pipelines, modelos y APIs se
documentan en los repositorios enlazados.

| Capacidad | Tecnologías | Proyecto | Evidencia directa |
|---|---|---|---|
| Machine Learning y evaluación | Python, LightGBM, scikit-learn, Pandas, NumPy | `demand-forecasting-m5` | [`lib/app/comercial/modelo.py`](https://github.com/Dev-HugoAguilar/demand-forecasting-m5/blob/main/lib/app/comercial/modelo.py) |
| Segmentación y experimentación | scikit-learn, SciPy, pandas | `customer-growth-intelligence` | [`pipeline/src`](https://github.com/Dev-HugoAguilar/customer-growth-intelligence/tree/main/pipeline/src) |
| Pronóstico y artefactos `joblib` | scikit-learn, joblib | `dockmind-demand-planning` | [`pipeline/train_models.py`](https://github.com/Dev-HugoAguilar/dockmind-demand-planning/blob/main/pipeline/train_models.py) |
| Ingeniería de datos | Python, importer idempotente, índices | `portfolio-api` | [`app/cnbv`](https://github.com/HugoAguilarReyna/portfolio-api/tree/main/app/cnbv) y [`app/db/indexes.py`](https://github.com/HugoAguilarReyna/portfolio-api/blob/main/app/db/indexes.py) |
| APIs y almacenamiento | FastAPI, Pydantic, MongoDB | `portfolio-api` | [`app/main.py`](https://github.com/HugoAguilarReyna/portfolio-api/blob/main/app/main.py) |
| Dominio instalable | Python, SQLite, pydantic-settings | `nl2sql-economic-copilot` | [`src/app/nl_sql`](https://github.com/Dev-HugoAguilar/nl2sql-economic-copilot/tree/main/src/app/nl_sql) |
| Visualización e interfaces | React, Vite, TypeScript, D3.js, SVG | `cdmx-traffic-atlas`, `vidas-en-transito` | [`app/src`](https://github.com/Dev-HugoAguilar/cdmx-traffic-atlas/tree/main/app/src) y [`web/hexmap.js`](https://github.com/Dev-HugoAguilar/vidas-en-transito/blob/main/web/hexmap.js) |
| Simulación y decisiones supervisadas | Python, reglas deterministas, aprobación humana | `data-incident-commander`, `ripple-room-supply-chain` | [`service.py`](https://github.com/Dev-HugoAguilar/data-incident-commander/blob/main/src/app/incident_commander/service.py) y [`simulation.py`](https://github.com/Dev-HugoAguilar/ripple-room-supply-chain/blob/main/source/simulation.py) |
| Verificación | pytest, jsdom, Playwright | varios | [`qa/`](https://github.com/Dev-HugoAguilar/dockmind-demand-planning/tree/main/qa) y [`tools/verificar-taxonomia.mjs`](tools/verificar-taxonomia.mjs) |

**Nivel de cada tecnología**: *implementada* cuando hay código ejecutable en el
repositorio enlazado; *documentada históricamente* cuando el repositorio la
declara sin pipeline reproducible (RetailOps: la inferencia está publicada y el
entrenamiento original sigue pendiente); *propuesta* en los casos de roadmap.
## Límites

- El integrador es estático. Las demos autocontenidas funcionan con archivos del mismo origen; los cuatro tableros y M5 necesitan la API y sus datos, y no muestran cifras si falta.
- Algunas demos se montan dentro de la ficha y no se abren fuera del sitio; la
  tarjeta ofrece el enlace directo cuando existe una demo publicada.
- Dos fichas comparten repositorio (*Clientes y campañas* y *Clientes en
  movimiento* documentan dos enfoques del mismo trabajo).
- Los tres casos *Próximamente* no tienen repositorio: solo tienen caso definido.
- El contenido de las fichas describe lo que cada repositorio demuestra; las
  tecnologías sin repositorio público están marcadas como experiencia profesional
  en la sección de stack.
- No hay analítica ni seguimiento de usuarios.

## Seguridad y contribución

El repositorio no contiene credenciales ni datos personales. Ver
[`SECURITY.md`](SECURITY.md) y [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Arquitectura: qué se ejecuta y qué necesita backend

No todas las piezas de este repositorio funcionan igual. Conviene distinguirlas
antes de abrir una demo:

| Tipo | Proyectos | Qué necesita |
|---|---|---|
| **Integrador estático** | este repositorio | Solo un servidor de archivos. Navegación por rutas *hash*. |
| **Demos autocontenidas** | `retailops-unified`, `orbita-orbital-intelligence`, `kilometro-cero-logistics`, `ripple-room-supply-chain`, `dockmind-demand-planning`, `vidas-en-transito`, `gaza-humanitarian-observatory` | Servidor de archivos. Datos, estilos y lógica viajan dentro del artefacto. |
| **Tableros que requieren la API** | Banca múltiple, Atlas vial, Marketing y clientes, Pulso comercial (Walmex) | `portfolio-api` en ejecución y MongoDB con los datos importados. |
| **Servicios de dominio** | `nl2sql-economic-copilot`, `banxico-evidence-briefing`, `data-incident-commander` | `pip install -e .` en su repositorio; no usan la API HTTP. |
| **Entrenamiento y actualización de datos** | `demand-forecasting-m5`, `customer-growth-intelligence`, `dockmind-demand-planning` | CSV externos (M5, Complete Journey, Criteo), MongoDB local para el flujo completo; M5 incluye un recorrido pequeño sin MongoDB. |

### Configuración de la API

El artefacto publicado usa `/api` en el mismo origen mediante `dist/config.js`.
El proxy nginx lo reenvía al servicio de API. Al servir solo `dist/` con Python,
las demos que necesitan backend requieren configurar `PORTFOLIO_API_BASE` con
una API local y autorizar el origen en su configuración CORS. El puerto 8010 es
un ejemplo de desarrollo, no el destino de los visitantes del sitio publicado.

## Estado editorial de las fichas

Cada ficha declara problema, destinatario, contribución, fuentes, método,
resultados y limitaciones. Los cuatro tableros conservan además un bloque
dinámico de hallazgos que se calcula contra la API con los filtros activos; si la
API no responde, el bloque informa el error en lugar de dejar un «Calculando…»
indefinido. Los proyectos sin adaptador no muestran ese bloque.

Los tres casos **Próximamente** describen alcance previsto y validaciones futuras,
sin resultados ejecutados. El estándar completo está en
[`docs/ESTANDAR_EDITORIAL.md`](docs/ESTANDAR_EDITORIAL.md) y la evidencia por
afirmación en [`docs/MATRIZ_EVIDENCIA_PROYECTOS.csv`](docs/MATRIZ_EVIDENCIA_PROYECTOS.csv).


## Verificación de fichas en navegador

```bash
npm ci
npx playwright install chromium
npm run verificar                 # 104 casos con la API simulada
npm run verificar:config          # build de producción: URL /api y Gaza
npm run verificar:produccion      # comportamiento: ninguna petición a una API local
npm run verificar:real            # + fase real aislada (requiere API y datos)
```

`npm run verificar` administra su servidor estático en el puerto 8000 (`PORT`
para cambiarlo) y verifica las 20 fichas en escritorio y móvil, la navegación
SPA y los estados de error, vacío y reintento de los cuatro tableros. La batería
predeterminada usa respuestas interceptadas con contratos explícitos y se
informa como **simulada**; no certifica la API real.

`npm run verificar:real` añade 8 casos contra una API con datos reales, en un
navegador aparte. Antes de ejecutarlos se comprueba CORS: si el origen del sitio
no está en `ALLOWED_ORIGINS` de la API, la fase se informa como bloqueada con el
motivo, en lugar de agotar la espera. Cada caso registra URL, estado HTTP y la
cabecera CORS efectiva de cada petición.

El workflow `Fichas y estados en navegador` ejecuta la batería en cada PR y
conserva `artifacts/verificacion-fichas.json` y
`artifacts/verificacion-produccion.json` incluso cuando falla un caso; el
workflow `Despliegue integrado` construye las dos imágenes y levanta el stack
completo. [Alcance y reproducción](docs/CORRECCION_HALLAZGOS_2026-11-19.md).



## Inventario de evidencia y procedencia

`dist/content.js` es la fuente de estados, código, demos, resultados declarados y
límites. `node tools/generar-evidencia.mjs` genera la matriz CSV y
`docs/EVIDENCIA_PROYECTOS.json`. CI usa `--check` para impedir que queden obsoletos.
Este inventario no sustituye la evaluación ni certifica cifras de los modelos.

Gaza se reconstruyó desde el commit indicado en
`dist/dashboards/gaza-observatorio/provenance.json`, ejecutando el constructor
público y su comparación idempotente. La verificación exige las secciones
agregadas, ausencia de marcas nominales, presupuesto de tamaño y SHA-256 exacto.
No se aumenta el umbral para aceptar el artefacto nominal.

Las demos con nombres estables se revalidan con `no-cache`; solo los bundles con
hash en `assets/` reciben `immutable`. Nginx comprime HTML, CSS, JS y JSON.
Esto reduce transferencia, pero no sustituye separar datos pesados de los HTML.

La API de esta corrección cambia el modo LLM de Banxico a selección de citas
literales por fragmento. Desplegar el sitio y la API desde las ramas compatibles:
la verificación literal no certifica relevancia, exhaustividad ni validez del corpus.


La prueba de portada (`tools/verificar-destacados.mjs`) forma parte de
`npm run verificar` y comprueba tres casos, enlaces, navegación y ancho de 390 px.
El diagnóstico piloto de recuperación, con sus fallos publicados, vive en
`banxico-evidence-briefing/research`; no debe confundirse con sus pruebas unitarias.


## Integración de las fases F1, F2 y F3 ya publicadas

Esta corrección parte de `portfolio-api` en `f7b5099` y del sitio en `abdce09`.
Se conservan las cuotas compartidas por IP y globales, los 51 casos de NL-to-SQL,
los 32 de Banxico y el agente de Incident Commander con herramientas de solo
lectura, presupuesto y máximo de pasos. El evaluador simulado de citas de F2 se
adapta al contrato literal de esta corrección. No se ejecutan proveedores reales.

Las interfaces conservan sus recorridos. El endpoint `/agent` no se presenta como
una reparación autónoma: la evaluación del backend usa un doble simulado y no
modifica el flujo de aprobación ni despacha acciones externas. El código de las
tres capacidades recientes se enlaza a la API canónica desde las fichas.
