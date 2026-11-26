# Estándar editorial de las fichas

## Ocho apartados obligatorios

1. **Resumen** — dos o tres frases: problema, entrega y utilidad.
2. **Problema** — la dificultad concreta y qué decisión permite analizar.
3. **Destinatario** — roles y situaciones de uso.
4. **Mi contribución** — lo diseñado, implementado, modelado o validado por el
   autor; separa datos y librerías de terceros.
5. **Fuentes y datos** — origen, enlace, unidad, cobertura, periodo, corte,
   licencia y naturaleza: observada, sintética, derivada o hipotética.
6. **Método y decisiones técnicas** — criterios y arquitectura; el detalle extenso
   vive en la documentación del repositorio del proyecto.
7. **Resultados** — entrega funcional y resultados medidos con su universo y
   evidencia. Si falta evaluación, se declara.
8. **Limitaciones** — restricciones del caso y su consecuencia interpretativa.

**Tecnologías** se agrupan por función y solo se listan si el código o la
configuración del repositorio las respaldan.

## Reglas de redacción

- Lenguaje concreto; sin adjetivos promocionales vacíos.
- La utilidad va antes que la lista de tecnologías.
- Datos reales, sintéticos, derivados e hipotéticos se declaran por separado.
- Se distingue **funcionalidad implementada** de **cobertura de datos**, de
  **evaluación técnica** y de **impacto empresarial**. Las tres primeras no
  prueban la cuarta.
- No se inventan métricas, validaciones, fuentes ni mejoras comerciales.
- No se repiten párrafos entre proyectos.
- Una diferencia puntual de métrica no demuestra superioridad estadística.

## Contrato técnico de la ficha

- `hallazgos: ''` reserva el contenedor dinámico y **solo** debe usarse en los
  cuatro tableros con adaptador (Banca, Atlas vial, Marketing, Walmex).
- En el resto, `hallazgos: null` omite el bloque; los resultados estáticos van en
  `resultados`.
- Un `demoUrl: null` es válido cuando la demo se monta dentro de la ficha.
- Esa demo montada debe declarar `demo: {modo:'ficha', verificado:'AAAA-MM-DD',
  descripcion}`. No se inventa una URL independiente si no existe.
- Un enlace a repositorio solo se declara si el repositorio existe.

## Casos de roadmap

Los casos **Próximamente** describen alcance previsto y validaciones futuras. No
llevan resultados, métricas ni tecnologías no implementadas, y sus limitaciones
son propias: no heredan las de otro proyecto.

## Estados

`Publicado` (terminado y verificable) · `En desarrollo` (en construcción, sin
resultados publicados) · `Próximamente` (caso definido, pendiente).
