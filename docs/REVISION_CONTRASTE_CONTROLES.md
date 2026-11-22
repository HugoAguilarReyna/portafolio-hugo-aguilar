# Contraste de controles

Se revisaron las reglas de botones y estados seleccionados en las hojas CSS de
los tableros publicados. Atlas vial tenía un reset (`button:not(.at-btn)`) con
mayor especificidad que algunos colores de control: podía imponer texto oscuro
sobre el fondo oscuro del segmento seleccionado. Se reduce su prioridad con
`:where`, conservando la herencia para botones sin estilo propio.

Marketing clientes tenía un reset similar; se reduce su prioridad también.
El reset de Incident Commander es un selector de etiqueta y no presenta esa
prioridad sobre los estados de clase. No se modifican sus colores.

Atlas comercial comparte los nombres de clases del segmentado con Atlas vial.
Se fija un par completo de colores en cada raíz de tablero: texto #2348c0 sobre
blanco y borde azul. El alcance incluye controles con y sin cápsula; no cambia
el comportamiento de selección ni de navegación. El azul/blanco supera 4.5:1.

La comprobación de navegador carga los estilos reales en ambos órdenes y revisa
los estados normal, hover y foco a 390 y 1440 px. Es una regresión de los controles
afectados, no una certificación de accesibilidad de todas las pantallas ni estados
de datos. Las otras fichas mantienen la batería de navegación existente.

Para desplegar en este VPS, conservar el override local de Gaza:

```bash
bash /opt/portafolio/compose-portafolio-actual.sh build web
bash /opt/portafolio/compose-portafolio-actual.sh up -d --no-build --no-deps --wait web
```
