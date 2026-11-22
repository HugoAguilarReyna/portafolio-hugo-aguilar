# Despliegue integrado

Un solo host público sirve el sitio estático y la API bajo `/api`. Dos
contenedores, sin puertos de base de datos expuestos.

```
navegador ──▶ web (nginx) ─┬─▶ /            dist/  (sitio estático)
                           └─▶ /api/  ─────▶ api (FastAPI :8000) ──▶ MongoDB Atlas
```

| Servicio | Imagen | Publica | Healthcheck |
|---|---|---|---|
| `web` | `nginx:1.27-alpine` + `dist/` | `${SITE_HOST_PORT}` → 80 | `GET /healthz` |
| `api` | `python:3.12-slim` + `app/` + `data/snapshots` | nada (solo interno) | `GET /api/v1/health/ready` |
| `mongo-local` | `mongo:7` (perfil `mongo-local`) | nada (solo interno) | `ping` |

## Requisitos

1. Docker Engine 24+ con Compose v2.
2. Los dos repositorios clonados como hermanos:

   ```bash
   git clone https://github.com/Dev-HugoAguilar/portafolio-hugo-aguilar.git
   git clone https://github.com/HugoAguilarReyna/portfolio-api.git
   ```

   Si la carpeta de la API no está al lado, define `PORTFOLIO_API_CONTEXT`.
3. MongoDB Atlas accesible (o el perfil `mongo-local` para probar sin Atlas).

## Puesta en marcha

```bash
cd portafolio-hugo-aguilar
cp deploy/.env.example deploy/.env      # completa MONGODB_URI
docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build
docker compose -f deploy/docker-compose.yml ps        # ambos "healthy"
curl -i http://127.0.0.1:8080/api/v1/health/ready     # {"status":"ready",...}
curl -i http://127.0.0.1:8080/                        # HTML del sitio
```

El sitio resuelve la base de la API con `dist/config.js`: por omisión `/api`,
es decir, el mismo origen servido por el proxy. No hay ninguna URL local
compilada en el artefacto publicado, así que el mismo `dist/` funciona en
producción y en local.

## Datos

* **Esquema (índices):** la API llama a `ensure_indexes` al arrancar; también
  puede ejecutarse a mano con `python -m scripts.create_indexes`. Es idempotente
  y no borra datos.
* **Datos reales:** se cargan con los importadores del repositorio de la API,
  cada uno documentado en su README (`scripts/importar_cnbv --descargar`,
  `scripts/importar_atlas_vial`, `scripts/importar_marketing`,
  `scripts/importar_m5`). Se ejecutan **una vez** contra la base destino y son
  idempotentes por versión.
* **Datos de prueba:** el perfil `datos` crea índices y carga el dataset
  sintético de demostración. Apúntalo solo a una base de prueba:

  ```bash
  docker compose -f deploy/docker-compose.yml --env-file deploy/.env \
    --profile datos run --rm datos
  ```

* **MongoDB local (sin Atlas):** `--profile mongo-local up -d mongo-local` y usa
  `MONGODB_URI=mongodb://mongo-local:27017/hugo_portfolio_test`. Es solo para
  pruebas: nunca en producción.

## Lo que este paquete no hace

* No configura DNS ni certificados TLS: el proxy del host (o el balanceador del
  proveedor) termina el TLS y redirige 80 → 443.
* No crea usuarios, reglas de red ni copias de seguridad de Atlas.
* No fusiona ni despliega nada por sí solo: exige Docker y el `MONGODB_URI`
  reales, que no viven en el repositorio.
