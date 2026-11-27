/* ==========================================================================
   CONTENIDO DEL PORTAFOLIO — Hugo César Aguilar Reyna
   --------------------------------------------------------------------------
   Aquí se edita el contenido de las áreas y de las fichas de cada proyecto.
   La aplicación de cada proyecto vive en su propio módulo dentro de
   dist/projects/ (ver projects.js).
   app.js se encarga de la presentación, la navegación y las interacciones.

   NAVEGACIÓN (rutas hash)
     #portafolio                          galería con las cuatro áreas
     #/area/<id>                          proyectos del área
     #/area/<id>/<proyecto>               proyecto integrado y su aplicación

   ESTRUCTURA DE UN ÁREA
     id            identificador corto y estable (se usa en la ruta #/area/<id>)
     numero        orden visible dentro de la galería
     nombre        nombre del área profesional
     etiqueta      texto corto para el filtro y la franja de acceso rápido
     resumen       una línea: qué tipo de trabajo incluye el área
     alcance       lista de temas y técnicas que abarca
     ilustracion   qué escena conceptual dibujar (scenes.js)
     escenaAlt     descripción de esa escena para lectores de pantalla
     catalogo      'tableros' para presentar el área como catálogo de tableros
                   (título en azul, «Explorar tableros» en lugar del alcance)
     proyectos     lista de casos; puede haber varios por área

   ESTRUCTURA DE UN PROYECTO (modelo reutilizable)
     id            obligatorio y estable: identifica la ruta y su módulo en
                   dist/projects/. Debe coincidir con el que registra el módulo.
     titulo        obligatorio
     estado        'previsto' | 'desarrollo' | 'publicado'
     descripcion   obligatorio: qué hace o hará el caso
     destinatario  para quién es
     problema      qué problema resuelve
     contribucion  qué hice yo (solo en casos reales)
     fuentes       datos y fuentes utilizadas
     metodo        método y decisiones técnicas
     resultados    resultados medidos (nunca inventados)
     limitaciones  límites conocidos
     tecnologias   lista de tecnologías
     tecnologiasGrupos  mismas tecnologías agrupadas por función:
                   [{ funcion, items: [...] }]; si existe, la ficha dibuja la
                   lista agrupada en lugar de las etiquetas sueltas
     capturas      lista de imágenes del proyecto (archivos reales)
     captura       captura real y completa del tablero que la ficha del área
                   muestra arriba, sin recorte (ruta dentro de dist/)
     capturaAlt    texto alternativo de esa captura: describe la vista real
     resumen       descripción breve para la ficha del área (si falta, se usa
                   `descripcion`)
     categoria     categoría corta de la ficha («Dashboard financiero»)
     meta          metadato de apoyo («CNBV · Visualización…»); la ficha del
                   área ya no lo muestra, se conserva como dato del proyecto
     enlaces       lista de {texto, url} adicionales
     demoUrl       ruta relativa de la demo publicada (dentro de dist/). La
                   tarjeta ofrece «Abrir demo» en pestaña nueva; la ficha del
                   proyecto sigue montando la aplicación dentro del sitio
     codigoUrl     URL del repositorio público o, si el código no se publica,
                   la carpeta del artefacto publicado. La tarjeta ofrece el
                   enlace en pestaña nueva
     codigoEtiqueta texto del enlace anterior. Por omisión «Código»; se usa
                   «Demo publicada» cuando el destino es la carpeta del
                   artefacto y no el código fuente
     resumenMetricas si existe, la ficha muestra estas cifras clave en un bloque
                   «Métricas clave» antes de los apartados
     metodoEnDetalle si es true, el apartado «Método y decisiones técnicas» se
                   dibuja dentro de un bloque plegable (<details>); el resto de
                   apartados —incluidas las limitaciones— sigue visible

   Los campos vacíos (null, '', [] ) NO se muestran en la interfaz: no se
   rellenan con texto ficticio. Para publicar un caso real basta con completar
   sus campos; la vista del proyecto los muestra automáticamente.

   Las aplicaciones se montan dentro de la vista del proyecto: la ficha nunca
   saca al visitante. Las tarjetas sí ofrecen enlaces explícitos y opcionales a
   la demo publicada y al repositorio, siempre en pestaña nueva con
   rel="noopener noreferrer". Un campo vacío no dibuja ningún enlace.
   ========================================================================== */

window.PORTAFOLIO = {
  actualizado: '2026-11-21',

  estados: {
    previsto: {
      etiqueta: 'Próximamente',
      detalle: 'El caso está definido y pendiente de desarrollo.'
    },
    desarrollo: {
      etiqueta: 'En desarrollo',
      detalle: 'El caso sigue en desarrollo; la ficha detalla la demo y la evaluación disponibles.'
    },
    publicado: {
      etiqueta: 'Publicado',
      detalle: 'El caso está terminado, documentado y verificable.'
    }
  },

  areas: [
    {
      id: 'dashboards',
      numero: '01',
      nombre: 'Dashboards y visualización',
      etiqueta: 'Visualización',
      descripcion: 'Explora los proyectos y sus aplicaciones interactivas.',
      resumen: 'Explorar datos con filtros, mapas, redes y vistas interactivas que se entienden sin manual.',
      alcance: ['D3.js', 'React', 'Vite', 'Power BI', 'Plotly', 'Streamlit', 'HTML5/CSS3', 'MapLibre', 'SVG', 'Filtros', 'Mapas', 'Redes', 'Exploración interactiva'],
      ilustracion: 'dashboards',
      escenaAlt: 'Ilustración conceptual: un indicador, unas barras y una serie temporal que responden al mismo periodo.',
      /* Esta área se presenta como catálogo de tableros: sin la etiqueta
         «Área NN / Portafolio», con el título en azul y una sección
         «Explorar tableros» en lugar del alcance. */
      catalogo: 'tableros',
      proyectos: [
        {
          id: 'comparativo-bancario',
          titulo: 'Banca múltiple mexicana — Comparativo financiero',
          resultados: 'Cobertura verificada: 7 boletines de la CNBV (octubre 2023 a octubre 2024), 56 248 hechos conciliados celda por celda, 158 conceptos y 50 instituciones. Los hallazgos por filtro se calculan contra la API para el corte seleccionado.',
          estado: 'publicado',
          descripcion: 'Compara saldos y resultados de las instituciones de banca múltiple con cifras publicadas por la CNBV: ranking por institución, evolución temporal, dispersión ROA–ROE y tabla de detalle, todo con un mismo estado de filtros.',
          destinatario: 'Pensado para quien necesita leer el sector bancario mexicano sin descargar y reconstruir a mano los boletines mensuales.',
          problema: 'La CNBV publica un boletín estadístico por mes con 158 conceptos financieros por institución. Comparar bancos y periodos exige trabajo manual y es fácil equivocarse: sumar el agregado del sector con las instituciones, mezclar saldos con resultados acumulados o comparar contra el periodo equivocado.',
          contribucion: 'Diseñé e implementé el backend de datos (importador idempotente con control de revisiones por hash, modelo de hechos y API de consulta) y este módulo de visualización con React, TypeScript y D3.',
          fuentes: 'CNBV, Boletín Estadístico de Banca Múltiple (sector 40 del Portafolio de Información): 7 boletines importados, 56 248 hechos, 158 conceptos y 50 instituciones.',
          metodo: 'Importación idempotente con SHA-256 y revisiones; hechos normalizados en MongoDB y agregaciones en el servidor. Interfaz con estado único en Zustand, consultas con claves completas en TanStack Query, tabla con TanStack Table y controles Radix. La columna «Sistema» es el agregado publicado y nunca se suma con las instituciones; los flujos acumulados solo se comparan con el mismo corte del año anterior; los meses sin boletín se marcan como huecos, no se interpolan. Metodología y calidad de datos: 56 248 hechos conciliados celda por celda contra los archivos originales sin discrepancias; 7 periodos disponibles (oct 2023 – oct 2024); 66 pruebas de navegador (escritorio y móvil) verifican que ranking, serie, dispersión y tabla responden al mismo estado de selección, incluida la prueba visual de la paleta, de los desplegables y de las unidades, y la de navegación del portafolio.',
          hallazgos: '',
          limitaciones: 'Solo banca múltiple: no incluye banca de desarrollo, sofomes ni otras entidades. Los conceptos acumulados no se comparan con saldos puntuales. La cobertura depende de los boletines importados (7 periodos, octubre 2023 a octubre 2024) y un mes sin boletín se marca como hueco, no se interpola. La columna «Sistema» es el agregado publicado y nunca se suma con las instituciones. Los importes son nominales, sin ajuste por inflación.',
          tecnologias: ['React', 'TypeScript', 'D3.js', 'Zustand', 'TanStack Query', 'TanStack Table', 'Radix UI', 'Playwright', 'FastAPI', 'MongoDB'],
          /* Mismas tecnologías, agrupadas por la función que cumplen en el módulo. */
          tecnologiasGrupos: [
            { funcion: 'Interfaz y visualización', items: ['React', 'TypeScript', 'D3.js'] },
            { funcion: 'Estado y consultas', items: ['Zustand', 'TanStack Query'] },
            { funcion: 'Tablas y controles', items: ['TanStack Table', 'Radix UI'] },
            { funcion: 'API y almacenamiento', items: ['FastAPI', 'MongoDB'] },
            { funcion: 'Pruebas de interacción', items: ['Playwright'] }
          ],
          capturas: ['img/comparativo-completo.webp'],
          /* Captura real del tablero con dos instituciones seleccionadas: es la
             imagen completa que encabeza la ficha del área. */
          captura: 'img/comparativo-completo.webp',
          capturaAlt: 'Captura del tablero «Comparativo financiero» con BBVA México y Santander seleccionados: los cuatro indicadores del periodo y el ranking de participación por institución. BBVA aparece en azul, Santander en violeta y el Sistema como referencia.',
          resumen: 'Explora la participación, el crecimiento y la rentabilidad de los bancos en México con datos públicos de la CNBV.',
          categoria: 'Finanzas',
          meta: 'CNBV · Visualización interactiva',
          demoUrl: null,
          codigoUrl: 'https://github.com/Dev-HugoAguilar/mexican-banking-analytics',
          enlaces: [
            {
              texto: 'Portafolio de Información de la CNBV',
              url: 'https://portafolioinfo.cnbv.gob.mx/Paginas/Inicio.aspx'
            }
          ]
        },
        {
          id: 'atlas-vial',
          titulo: 'Atlas vial · Ciudad de México',
          resultados: 'Cobertura verificada: hechos de tránsito 2024 de la SSC CDMX georreferenciados por alcaldía, con 1 654 registros sin edad y 1 005 sin sexo mostrados como «Sin dato». Los hallazgos por filtro se calculan contra la API.',
          estado: 'publicado',
          descripcion: 'Explora la distribución territorial y temporal de los hechos de tránsito registrados por la SSC, las personas afectadas y los vehículos involucrados mediante mapas y filtros conectados.',
          destinatario: 'Pensado para quien necesita leer los hechos de tránsito de la Ciudad de México sin descargar cinco archivos, cruzarlos a mano y reconstruir los mapas en una hoja de cálculo.',
          resumen: 'Mapa, series y desgloses de los hechos de tránsito de 2024 registrados por la SSC en la Ciudad de México, con datos abiertos y filtros conectados.',
          categoria: 'Movilidad',
          meta: 'SSC · CDMX · Visualización interactiva',
          capturas: ['img/atlas-vial-completo.jpg'],
          captura: 'img/atlas-vial-completo.jpg',
          capturaAlt: 'Captura del tablero «Atlas vial · Ciudad de México» con el mapa de las 16 alcaldías, el panel de resumen del filtro y la línea temporal de los hechos de tránsito de 2024.',
          demoUrl: null,
          codigoUrl: 'https://github.com/Dev-HugoAguilar/cdmx-traffic-atlas',
          problema: 'La SSC publica los hechos de tránsito de 2024 en cinco archivos separados de unas 30 655 filas cada uno. Para responder preguntas elementales —dónde ocurren, a qué hora, quiénes resultan afectados— hay que descargarlos, adivinar la codificación y el separador, cruzar cinco tablas por folio y reconstruir los mapas a mano. El riesgo no es solo el esfuerzo: al sumar desgloses de personas se cuentan dos veces las mismas víctimas y al unir archivos por folio se multiplican los hechos.',
          contribucion: 'Diseñé y construí el proceso de datos (descarga desde el catálogo oficial, validación, normalización y publicación atómica en MongoDB), la API de consulta y este tablero con tres vistas conectadas por un mismo estado de filtros. La interfaz está escrita en React, TypeScript y D3; el backend, en Python y FastAPI.',
          fuentes: 'Secretaría de Seguridad Ciudadana de la Ciudad de México, conjunto «Hechos de tránsito registrados por la SSC 2024 (serie de datos ampliada, no comparativa)», catálogo de datos abiertos de la CDMX, licencia CC-BY-4.0-ESP. Cobertura de los eventos: 1 de enero a 31 de diciembre de 2024. Cinco recursos: hechos, personas por sexo, por edad y por tipo de persona, y vehículos. Límites de las alcaldías: conjunto «Límite de Alcaldías», CC-BY-4.0-ESP, a partir del Marco Geoestadístico 2020 del INEGI.',
          metodo: 'Importación idempotente: el proceso resuelve el catálogo oficial, descarga con validación condicional (ETag / Last-Modified), calcula el SHA-256 de cada archivo, procesa en una carpeta temporal, valida y publica de forma atómica; si algo falla, la versión anterior sigue publicada. La versión publicada tiene 30 655 hechos con folio único, y la validación comprueba que los cinco recursos cubren exactamente el mismo conjunto de folios, de modo que el cruce es 1:1 y ninguna cifra se multiplica. Normalización documentada: reparación de la codificación dañada («VehÃculo» → «Vehículo», «BOTÃ“N» → «BOTÓN»), resolución del encabezado «condicion_persona» duplicado en el archivo de tipo de persona (primera columna: consecuencia; segunda: tipo de persona) sin sobrescribir datos, y homologación de los textos de alcaldía, día, vialidad e intersección. Cada registro conserva su alcaldía de texto y su pertenencia espacial calculada con los polígonos oficiales: los 1 053 desajustes entre ambos se informan y no se corrigen a la fuerza.',
          hallazgos: '',
          limitaciones: 'Los archivos de personas y vehículos traen un registro por folio —la persona y el vehículo principales del expediente—, no todas las víctimas ni todos los vehículos: por eso se presentan como «hechos con registro de…» y su cobertura se muestra siempre. No se suman los desgloses de sexo, edad y tipo de persona entre sí, ni se cruzan entre ellos, porque unirlos por folio inventaría combinaciones. 1 654 hechos no tienen edad registrada y 1 005 no tienen sexo: se muestran como «Sin dato», nunca como cero. Tres hechos (0,01 %) no tienen coordenadas utilizables y 1 no tiene una alcaldía reconocible: se conservan en los totales, se cuentan aparte y no se reasignan al mapa. El conjunto es anual y la propia fuente advierte que no es comparativo: no se usan series históricas ni tasas por población o viajes, porque no hay denominadores publicados. La fuente no registra la causa del hecho y el semáforo describe la intersección, no el estado del semáforo en el momento.',
          tecnologias: ['React', 'TypeScript', 'D3.js', 'Zustand', 'TanStack Query', 'Radix UI', 'FastAPI', 'MongoDB', 'Playwright', 'Python'],
          tecnologiasGrupos: [
            { funcion: 'Interfaz y visualización', items: ['React', 'TypeScript', 'D3.js'] },
            { funcion: 'Estado, consultas y controles', items: ['Zustand', 'TanStack Query', 'Radix UI'] },
            { funcion: 'API, datos y publicación', items: ['FastAPI', 'MongoDB', 'Python'] },
            { funcion: 'Verificación', items: ['Playwright'] }
          ],
          enlaces: [
            {
              texto: 'Hechos de tránsito registrados por la SSC 2024 (catálogo de datos abiertos de la CDMX)',
              url: 'https://datos.cdmx.gob.mx/dataset/hechos-de-transito-registrados-por-la-ssc-2024-serie-de-datos-ampliada-no-comparativa'
            }
          ]
        },
        {
          id: 'marketing-clientes',
          resumen: 'Explora adquisicion, conversion y retorno de usuarios a partir de eventos de comercio electronico de una muestra publica y ofuscada de Google Analytics 4.',
          titulo: 'Marketing y clientes',
          resultados: 'Cobertura verificada: muestra del 5 % de usuarios de GA4 (13 509 de 270 154), periodo del 1 de noviembre de 2020 al 31 de enero de 2021. Los hallazgos por filtro se calculan contra la API.',
          estado: 'publicado',
          descripcion: 'Explora adquisición, conversión y retorno de usuarios a partir de eventos de comercio electrónico.',
          destinatario: 'Profesionales de marketing, analítica y comercio electrónico que necesitan explorar adquisición, conversión y retorno de usuarios desde una misma aplicación, con métricas consistentes y filtros conectados.',
          categoria: 'Marketing',
          meta: 'GA4 · BigQuery → MongoDB · Visualización interactiva',
          capturas: ['img/marketing-clientes-resumen.webp'],
          captura: 'img/marketing-clientes-resumen.webp',
          capturaAncho: 1600,
          capturaAlto: 1726,
          capturaRatio: '1600 / 1726',
          capturaAlt: 'Captura del tablero «Marketing y clientes» en su vista Resumen: ocho indicadores del periodo (210 672 eventos, 13 509 usuarios, 17 906 sesiones, 261 compras), el bloque de muestra y cobertura con la población de 270 154 usuarios, la serie diaria de usuarios y el diagrama de la adquisición a la compra con sus tres columnas.',
          demoUrl: null,
          codigoUrl: 'https://github.com/Dev-HugoAguilar/ga4-marketing-analytics',
          hallazgos: '',
          notaEstado: 'Versión publicada en MongoDB Atlas y servida solo desde ahí: muestra determinista del 5 % de usuarios (13 509 de 270 154) del periodo 1 nov 2020 – 31 ene 2021. Las cuatro vistas se recalculan sobre la misma muestra, y el panel de cobertura del tablero permite auditar población, proporción, método de selección y consistencia entre cada indicador y su gráfica.',
          problema: 'Identificar qué fuentes atraen compradores, dónde se reduce el avance hacia la compra y qué grupos regresan requiere conectar eventos, usuarios y sesiones. Una lectura incorrecta puede duplicar transacciones, sumar usuarios que aparecen en varios días o interpretar como abandono una diferencia entre etapas.',
          contribucion: 'Diseñé e implementé el flujo completo: revisión del esquema de GA4, extracción y limpieza de datos, selección reproducible de usuarios, preparación de resultados y publicación por versiones en MongoDB Atlas. Desarrollé la API y las cuatro vistas del tablero con React, TypeScript y D3, incluyendo visualizaciones interactivas, filtros compartidos y exportación de resultados agrupados.',
          fuentes: 'Muestra pública y ofuscada de comercio electrónico de Google Analytics 4: bigquery-public-data.ga4_obfuscated_sample_ecommerce, tablas events_*. El periodo observado va del 1 de noviembre de 2020 al 31 de enero de 2021. El demo usa una selección reproducible del 5 % de los usuarios: 13 509 personas de una población original de 270 154. Los resultados describen exclusivamente la muestra publicada y no representan el desempeño comercial actual de Google.',
          metodo: 'La preparación se ejecuta fuera de Atlas y conserva los archivos originales y un manifiesto que permite reproducir los resultados. Las compras se deduplican por usuario y transacción, y los usuarios se cuentan de forma distinta dentro de cada selección, sin sumar los conteos diarios. El embudo considera sesiones que completan los pasos en orden dentro de una ventana de 24 horas; las cohortes parten de la primera actividad observada y distinguen las semanas sin seguimiento suficiente de una retención igual a cero. Atlas almacena agregaciones y el detalle mínimo necesario para resolver las visualizaciones y los filtros disponibles; la API consulta la versión publicada sin depender de BigQuery durante el uso del tablero. Los resultados se concilian antes de publicar y la exportación entrega datos agrupados con su cobertura y sus filtros. Fórmulas, campos, predicado de muestreo y verificación: «Metodología y datos».',
          limitaciones: 'Los resultados corresponden a una muestra histórica del 5 % de usuarios y no se extrapolan a la población original; la fuente está ofuscada y puede contener información desconocida o valores de marcador. El canal describe la adquisición del usuario según su primera actividad observada: no constituye atribución por sesión ni evidencia del efecto causal de la publicidad, y el embudo aplica una ventana analítica de 24 horas. Las compras por categoría pueden solaparse; la afinidad corresponde al periodo completo publicado y es independiente de los filtros. El modelo compacto permite explorar resultados agrupados, pero no consultar eventos individuales.',
          tecnologias: ['React', 'TypeScript', 'D3.js', 'Zustand', 'TanStack Query', 'Radix UI', 'FastAPI', 'MongoDB Atlas', 'BigQuery', 'Python', 'Playwright'],
          tecnologiasGrupos: [
            { funcion: 'Interfaz y visualización', items: ['React', 'TypeScript', 'D3.js'] },
            { funcion: 'Estado, consultas y controles', items: ['Zustand', 'TanStack Query', 'Radix UI'] },
            { funcion: 'Datos y publicación', items: ['BigQuery', 'Python', 'FastAPI', 'MongoDB'] },
            { funcion: 'Verificación', items: ['Playwright'] }
          ],
          enlaces: [
            {
              texto: 'Conjunto de muestra de GA4 en BigQuery (Google for Developers)',
              url: 'https://developers.google.com/analytics/bigquery/web-ecommerce-demo-dataset'
            },
            {
              texto: 'Esquema de BigQuery Export de GA4',
              url: 'https://support.google.com/analytics/answer/7029846'
            }
          ]
        },
        {
          id: 'pulso-comercial',
          resumen: 'Analiza ventas, crecimiento y desempeno comercial de Walmart de Mexico y Centroamerica con los comunicados trimestrales oficiales.',
          titulo: 'Pulso comercial · Walmex',
          resultados: 'Cobertura verificada: 15 trimestres del 1T23 al 3T26 y 16 documentos oficiales; tráfico y ticket solo desde 2024, con 10 de 15 trimestres y los huecos marcados como «no publicado».',
          estado: 'publicado',
          descripcion: 'Analiza ventas, crecimiento y desempeño comercial de Walmart de México y Centroamérica con los comunicados trimestrales oficiales.',
          destinatario: 'Pensado para analistas, equipos comerciales e inversores que necesitan leer el pulso de la operación trimestre a trimestre sin descargar y rearmar cada comunicado.',
          categoria: 'Finanzas',
          meta: 'Walmex · reportes trimestrales · puente, áreas, calendario, trayectoria, brechas e índice · React + D3 · MongoDB Atlas',
          captura: 'img/pulso-comercial-resumen.webp',
          capturaAncho: 1600,
          capturaAlto: 1726,
          capturaRatio: '1600 / 1726',
          capturaAlt: 'Captura del tablero «Pulso comercial · Walmex» en su vista Resumen comercial completa: cabecera con el último trimestre publicado, controles de rango y trimestre, tres indicadores con su tendencia —ingresos consolidados, crecimiento anual y brecha entre mercados—, el puente de origen del crecimiento con los totales de 3T25 y 3T26 y la aportación de cada mercado, las áreas de mezcla del negocio y el calendario comercial de círculos proporcionales.',
          demoUrl: null,
          codigoUrl: 'https://github.com/Dev-HugoAguilar/walmex-financial-pulse',
          hallazgos: '',
          notaEstado: 'Primera versión publicada con datos oficiales del 1T23 al 3T26 (15 trimestres). Se sirve solo desde MongoDB Atlas y declara la fuente, la base de comparación y la unidad de cada cifra. El comercio electrónico y el detalle por tienda no se publican porque la empresa no los reporta con cobertura y definición comparables en todo el periodo.',
          problema: 'Leer el desempeño comercial de Walmart de México y Centroamérica trimestre a trimestre exige abrir quince comunicados, separar ventas netas de ingresos totales, distinguir el importe nominal de la variación a moneda constante y no confundir el acumulado del año con el trimestre. Mezclar unidades, sumar porcentajes o comparar mercados sin mirar su base produce conclusiones que los propios reportes no sostienen.',
          contribucion: 'Investigué y descargué los documentos oficiales, construí el modelo de datos y el proceso de preparación y validación fuera de Atlas, y desarrollé la API y este tablero con React, TypeScript y D3. La interfaz reparte nueve visualizaciones propias en tres vistas —puente de origen del crecimiento, áreas apiladas y calendario de círculos proporcionales; trayectoria explorable de tráfico y ticket, barras de ventaja y brechas históricas; aportación al crecimiento, índice base 100 con la base elegida sobre la línea temporal y matriz de pulso con foco vinculado—, con el estado en la URL, un panel contextual expandible y exportación de los resultados agrupados.',
          fuentes: 'Walmart de México y Centroamérica (Walmex), comunicados trimestrales de resultados y «Estados Financieros» publicados en walmex.mx. Cubre del 1T23 al 3T26: 15 trimestres y 16 documentos oficiales (un comunicado y un libro de estados financieros por trimestre, más el histórico de ventas). La fecha de publicación de cada documento se toma del propio comunicado.',
          metodo: 'La preparación se ejecuta fuera de Atlas con los PDF y hojas oficiales: de «Estados Financieros» se toman los importes por región y del comunicado las variaciones de tráfico y ticket. Antes de publicar se comprueba que México + Centroamérica sume el consolidado, que ventas netas más otros ingresos sume el total y que la variación calculada con importes coincida con la publicada. Las participaciones del incremento de ingresos se calculan con los importes aditivos de cada mercado en el mismo trimestre, de modo que suman el consolidado; no se promedian tasas ni se reparten puntos entre mercados. Atlas guarda solo hechos agrupados (trimestre × mercado × indicador × base) y el catálogo; la API lee esa versión y no descarga documentos. La identidad tráfico × ticket se contrasta con las unidades iguales y no se presenta como descomposición exacta del crecimiento: su producto no reproduce las unidades iguales en todos los trimestres.',
          limitaciones: 'No hay detalle por tienda, formato, producto ni cliente, ni metas de la empresa: el tablero compara cada trimestre con el mismo trimestre del año anterior. El comercio electrónico (ventas netas y GMV) queda fuera porque la definición cambia entre trimestres y no cubre todo el periodo. Tráfico y ticket solo se publican en los comunicados desde 2024, así que la vista de motores cubre 10 de los 15 trimestres y los huecos se muestran como «no publicado», nunca como cero. Los importes son millones de pesos nominales del trimestre; las variaciones a moneda constante solo existen para Centroamérica. No se suman porcentajes ni se reconstruyen importes a partir de tasas de crecimiento. La diferencia entre el crecimiento nominal y el de ventas a unidades iguales mezcla aperturas, cierres y efecto de precio, y la empresa no publica ese desglose: no se descompone.',
          tecnologias: ['React', 'TypeScript', 'D3.js', 'FastAPI', 'Python', 'MongoDB Atlas', 'pdfplumber', 'openpyxl', 'Playwright'],
          tecnologiasGrupos: [
            { funcion: 'Interfaz y visualización', items: ['React', 'TypeScript', 'D3.js'] },
            { funcion: 'Datos y publicación', items: ['Python', 'pdfplumber', 'openpyxl', 'FastAPI'] },
            { funcion: 'Persistencia', items: ['MongoDB Atlas'] },
            { funcion: 'Verificación', items: ['Playwright'] }
          ],
          enlaces: [
            { texto: 'Comunicados a la BMV (Walmex)', url: 'https://www.walmex.mx/comunicados-y-eventos/comunicados-a-bmv.html' },
            { texto: 'Información financiera trimestral (Walmex)', url: 'https://www.walmex.mx/informacion-financiera/' }
          ]
        },
        {
          id: 'vidas-en-transito',
          titulo: 'Vidas en tránsito — Muertes, desapariciones y movilidad migrante',
          estado: 'publicado',
          notaEstado:
            "Demo publicada. El tablero se sirve como página autónoma dentro de la ficha, con sus archivos de datos junto a ella y sin servicios externos. Publicado como demo autocontenida con los cortes y límites de datos indicados.",
          descripcion:
            "Observatorio de muertes y desapariciones en tránsito, violencia documentada y evidencia territorial. Reúne fuentes con unidades, periodos y coberturas diferentes; por eso presenta sus cifras por separado y explica qué puede leerse de cada una. El explorador de desapariciones del EAAF permite abrir los agregados publicados por banco o mecanismo, año y entidad de México*. La vista Atención y perfiles explora las combinaciones de motivos registradas, la coaparición de violencias y perpetradores en una misma fila y la cobertura del campo de violencia por año. Estos registros describen lo consignado en las fuentes; no representan por sí solos a toda la población migrante.",
          destinatario:
            "Equipos de análisis humanitario, periodismo de datos y política pública que necesitan consultar registros sobre movilidad y violencia sin confundir eventos, filas de atención, incidentes documentados, personas únicas ni ubicaciones.",
          resumen:
            "Observatorio de muertes y desapariciones en tránsito, violencia documentada y evidencia territorial. Reúne fuentes con unidades, periodos y coberturas diferentes; por eso presenta sus cifras por separado y explica qué puede leerse de cada una.",
          categoria: 'Ciencia de datos · Observatorio humanitario',
          meta: 'UPMRIP · ICIJ/CLIP · OIM DTM · EAAF · REDODEM · Visualización interactiva',
          capturas: ['img/vidas-en-transito-resumen.jpg'],
          captura: 'img/vidas-en-transito-resumen.jpg',
          capturaAncho: 1600,
          capturaAlto: 1726,
          capturaRatio: '1600 / 1726',
          capturaAjuste: 'tablero',
          capturaAlt:
            'Captura del tablero «Vidas en tránsito» servido en local: la cabecera con el corte de cada fuente, el esquema por países del corredor centroamericano descrito por OIM DTM y el inicio de las vistas de UPMRIP, ICIJ/CLIP y OIM DTM con sus notas de cobertura.',
          demoUrl: 'dashboards/vidas-en-transito/index.html',
          codigoUrl: 'https://github.com/Dev-HugoAguilar/vidas-en-transito',
          hallazgos: null,
          problema:
            "Las fuentes disponibles observan fenómenos distintos: eventos administrativos relacionados con personas migrantes que declararon victimización, incidentes documentados por una investigación periodística, registros de atención de organizaciones y elementos de una capa geográfica parcial de servicios. Mezclarlos puede llevar a conclusiones erróneas: interpretar un registro administrativo como un censo de delitos o de personas migrantes; contar una fila de incidente como una persona fallecida; leer un dato faltante como cero; confundir la entidad donde se registró un caso con el lugar del hecho; o presentar una capa parcial como un directorio vigente de albergues. El tablero mantiene separadas las unidades y coberturas, hace visibles los datos faltantes y añade notas para delimitar cada interpretación.",
          contribucion:
            "Integré en una sola página seis vistas del tablero y conservé las visualizaciones previas del proyecto. Añadí paneles basados en UPMRIP, ICIJ/CLIP, OIM DTM y REDODEM, con tablas accesibles, filtros, selección de elementos y notas sobre unidad, periodo, cobertura y límites. El tablero incorpora: movilidad registrada por UPMRIP, con series anuales y cortes disponibles y desgloses por edad, sexo registrado, nacionalidad, delito y entidad de registro; incidentes ICIJ/CLIP, con desgloses por año, entidad, modo de detección y precisión y un mapa que permite consultar las filas con coordenadas; servicios georreferenciados de OIM DTM, agrupados por país, tipo de sitio y completitud de campos; desapariciones del EAAF, con un explorador de los agregados por banco o mecanismo, año, entidad de México* y país de hallazgo, manteniendo separados los cortes de 2025 y 2026 cuando no ofrecen el mismo detalle; y atención y perfiles de REDODEM, con matriz de edad y sexo, gráficas de país de nacimiento y destino, combinaciones observadas de motivos mediante UpSet, matriz de coaparición de violencia y perpetrador, rankings de menciones y cobertura del campo de violencia por año. Los agregados se derivan fuera del sitio mediante procesos reproducibles. El navegador carga los archivos de datos publicados; no ejecuta la derivación ni consulta los servicios fuente al abrir la página.",
          fuentes:
            "UPMRIP/SEGOB: cuadros sobre delitos contra personas migrantes en situación irregular. El tablero conserva la serie anual agregada de 2016–2025 y el corte preliminar disponible de enero a septiembre de 2026. Las unidades y definiciones se presentan junto a cada gráfica. ICIJ/CLIP: base de camiones para el periodo 2018–2023: 156 incidentes y 172 vehículos documentados. Hay al menos 111 muertes reportadas en 13 filas; 148 filas tienen coordenadas y 99 están clasificadas con precisión exacta. OIM DTM: descripción del corredor centroamericano, con corte de referencia de abril de 2026, y capa ArcGIS Shelter Service. La respuesta consultada contiene 3,822 elementos distribuidos en ocho países. EAAF, Proyecto Frontera: al 28 de febrero de 2025 publicó 2,351 casos no localizados, 2,240 familias participantes, 6,000 donantes de ADN y 406 identificaciones. Al 14 de agosto de 2026 publicó más de 2,500 casos y más de 490 identificaciones, sin el mismo nivel de desglose. REDODEM: registros de atención u observación de organizaciones participantes para 2023–2024. El extracto utilizado contiene 40,800 filas; no equivale a personas únicas ni constituye una muestra representativa. Fuentes documentadas pendientes de integración: RARAMIR, Grupos Beta, ACNUR México y OIT. No se les asignan cifras en esta versión.",
          metodo:
            "Los agregados se generan mediante procesos reproducibles a partir de los cuadros UPMRIP, la base ICIJ/CLIP, la respuesta agregada del servicio ArcGIS de OIM y los datos de REDODEM disponibles para el análisis. El sitio publica los archivos derivados y no realiza consultas a las fuentes durante la navegación. Cada fuente conserva su unidad, periodo, cobertura y nota metodológica. Las cifras de fuentes distintas no se suman. Las filas de incidentes no se interpretan como personas únicas; los campos vacíos no se convierten en cero; y la precisión de las coordenadas se indica junto al punto correspondiente. El corredor de OIM se representa como una descripción regional generalizada, no como una línea GPS. La capa de servicios es parcial y no se presenta como directorio vigente o verificado. En el mapa, la superposición de capas ofrece contexto territorial; no demuestra uso de una vía, causalidad ni trayectorias individuales. En REDODEM, el UpSet cuenta combinaciones de motivos observadas en las filas. La matriz de violencia × perpetrador cuenta coapariciones en una misma fila y aplica un umbral de privacidad de cinco: no publica cifras exactas para celdas con entre uno y cuatro registros. Las coapariciones no verifican al perpetrador ni establecen causalidad. El tablero se publica como página estática con sus archivos de datos junto al HTML y se integra en la ficha del proyecto mediante un marco del mismo origen.",
          resultados:
            "El tablero conserva trece áreas previas del proyecto e incorpora veinte visualizaciones nuevas. Incluye desgloses de los datos UPMRIP disponibles; 156 incidentes ICIJ/CLIP, con 148 ubicaciones seleccionables; y 3,822 elementos de la capa de servicios de OIM, agrupados por país, tipo de sitio y completitud. El explorador EAAF permite recorrer los agregados hacia el banco o mecanismo y los desgloses disponibles por año, entidad de México* o país de hallazgo. Los cortes publicados en 2025 y 2026 no se enlazan como una tendencia cuando sus definiciones o niveles de detalle no coinciden. En Atención y perfiles, REDODEM se presenta como 40,800 filas de atención u observación. El módulo incluye 14 combinaciones de motivos, una matriz de 14 categorías de violencia por 10 de perpetradores —38 celdas visibles y 38 suprimidas por el umbral—, rankings basados en 737 menciones de violencia y 597 de perpetradores, y la cobertura del campo de violencia por año: 317 de 22,123 filas en 2023 y 182 de 18,677 en 2024. Las gráficas incluyen tablas accesibles y notas sobre sus denominadores.",
          limitaciones:
            "UPMRIP registra eventos administrativos de personas migrantes en situación irregular que declararon victimización y quedaron en los registros consultados. No es un censo de delitos ni de toda la población migrante. La entidad de registro no equivale necesariamente al lugar del hecho. El corte de 2026 es preliminar y no se extrapola al año completo. En ICIJ/CLIP, cada fila es un incidente documentado, no una persona única. Una celda vacía en muertes no equivale a cero. El mapa muestra únicamente incidentes con coordenadas y conserva la precisión declarada por la fuente. La capa de servicios de OIM tiene cobertura geográfica parcial y los metadatos consultados no permiten confirmar una actualización vigente. No debe usarse como directorio operativo ni como orientación práctica. El corredor regional descrito por OIM no es exhaustivo ni representa trayectos individuales. Esta versión no dibuja rutas de “La Bestia” ni rutas de carteles; la geometría ferroviaria y los directorios prácticos no están integrados. Los cortes del EAAF tienen distintos niveles de detalle. La fuente no publica edad, sexo ni nacionalidad para los agregados presentados, por lo que esas variables no se infieren. Las entidades ausentes en el desglose de México* no se interpretan como cero. Los indicadores de 2026 publicados con el operador “>” se mantienen separados de los cortes anteriores. La transcripción del corte de 2025 coincide con los totales impresos; sigue pendiente una segunda revisión humana. En REDODEM, las 40,800 filas no son personas únicas. Las menciones de motivos, violencias y perpetradores pueden coexistir en una misma fila y no suman 100%. La matriz presenta coapariciones, no relaciones causales ni perpetradores verificados; los conteos pequeños se suprimen según el umbral de privacidad. La cobertura anual describe si el campo tiene valor, no si el hecho ocurrió ni con qué frecuencia en la población.",
          tecnologias: ['Python', 'JavaScript', 'HTML/CSS', 'Análisis geoespacial', 'Datos abiertos'],
          tecnologiasGrupos: [
            { funcion: 'Datos y derivación', items: ['Python', 'xlrd', 'Datos abiertos'] },
            { funcion: 'Interfaz', items: ['JavaScript', 'HTML/CSS', 'Análisis geoespacial'] }
          ],
          enlaces: [
            {
              texto: 'UPMRIP · delitos contra personas migrantes (serie y cuadros)',
              url: 'https://portales.segob.gob.mx/es/PoliticaMigratoria/Delitos_Perpetrados'
            },
            {
              texto: 'ICIJ/CLIP · base de incidentes en camiones (2018–2023)',
              url: 'https://www.icij.org/inside-icij/2024/04/from-chiapas-to-tamaulipas-new-database-maps-thousands-of-migrants-dangerous-journeys-through-mexico-in-trailer-trucks/'
            },
            {
              texto: 'OIM DTM · portal de rutas migratorias en las Américas',
              url: 'https://dtm.iom.int/es/global-overview-of-migration-routes-portal/americas'
            },
            {
              texto: 'OIM DTM · servicio geográfico Shelter Service',
              url: 'https://gisportal.iom.int/arcgis/rest/services/DTM_LAC/Shelter_Service/MapServer'
            },
            {
              texto: 'EAAF · Proyecto Frontera, estadísticas al 28 de febrero de 2025',
              url: 'https://eaaf.org/wp-content/uploads/2025/03/Estadisticas_Proyecto-Frontera_Generales_28feb2025-2.pdf'
            },
            {
              texto: 'REDODEM · base de monitoreo de protección (CSV/ZIP)',
              url: 'https://monitoreo-de-proteccion.redodem.org/csv/base_monitoreo-de-proteccion_redodem.zip'
            }
          ]
        },
        {
          id: 'orbita',
          titulo: 'ORBITA — Inteligencia orbital y visualización geoespacial interactiva',
          estado: 'publicado',
          categoria: 'Ingeniería de datos y visualización',
          notaEstado:
            'Demo local con snapshot fijo. La UI 26 se sirve como recurso estático y se carga solo al abrir esta ficha; no usa telemetría, backend, Atlas, LLM ni credenciales. Demo publicada en el portal; el snapshot y sus límites se mantienen explícitos.',
          descripcion:
            'Explorador interactivo para analizar un snapshot público de satélites, comprender la estructura de sus órbitas y comparar su presencia geométrica desde una ubicación. Integra una Tierra 3D, propagación orbital, distribuciones estadísticas, ventanas de paso y trazabilidad del catálogo en una experiencia local reproducible.',
          resumen:
            'Explorador orbital con Tierra 3D, propagación SGP4 en Web Worker, distribuciones de altura e inclinación, ventanas geométricas y comparación normalizada de constelaciones sobre un snapshot público de 12,308 registros.',
          destinatario:
            'Equipos y profesionales de ingeniería y análisis de datos, visualización geoespacial, educación científica y exploración de catálogos satelitales. También permite evaluar la integración entre datos científicos, cálculo en navegador y diseño de interfaces.',
          problema:
            'Los catálogos orbitales contienen miles de registros difíciles de interpretar como tablas aisladas. Una representación atractiva del planeta tampoco basta para explicar dónde se concentran los objetos, qué puede observarse desde una ubicación o cuáles son los límites de los datos. ORBITA conecta exploración espacial y análisis cuantitativo para responder esas preguntas con contexto temporal y procedencia explícita.',
          contribucion:
            'Diseñé e implementé un explorador orbital con cinco vistas: Explorador, Constelaciones, Sobre mi ubicación, Comparar y Datos y método. Integré un catálogo público con propagación SGP4, procesamiento en Web Worker, una escena Three.js construida con React Three Fiber y visualizaciones D3/SVG. Modelé filtros de capas, selección de objetos, distribuciones de altura e inclinación, ventanas geométricas, trayectoria aparente y comparación normalizada entre constelaciones. Incorporé exportaciones CSV y controles para distinguir datos del snapshot, resultados calculados y escalas ilustrativas.',
          fuentes:
            'Snapshot de CelesTrak con 12,308 registros y 12,308 identificadores NORAD únicos, en seis grupos públicos: Starlink (11,185), Amazon Leo (391), OneWeb (651), GPS (32), Galileo (32) y estaciones (17). Descarga registrada: 2026-11-17T00:46:34.832588+00:00; referencia temporal de la simulación: 2026-11-16T12:05:12.614208Z. Cada grupo conserva enlace de origen y SHA-256 declarado en `content/orbita.sources.json`. Los conteos pertenecen al snapshot, no al presente; los 17 registros de estaciones no son 17 estaciones espaciales independientes ni un censo completo. El paquete no asigna una licencia nueva al conjunto: conserva las atribuciones de CelesTrak, Earth3D, NASA GIBS y Solar System Scope incluidas en la demo, y sus condiciones deben verificarse antes de redistribuir. La interfaz cita DataViz Inspiration como referencia de familias visuales, no como fuente de datos.',
          metodo:
            'Los elementos orbitales se propagan con SGP4 mediante satellite.js; las coordenadas se transforman a un marco terrestre para su representación. Los cálculos pesados se ejecutan en un Web Worker. La altura media de las distribuciones se aproxima a partir del movimiento medio y no equivale a altitud instantánea. Los pasos se evalúan durante 24 horas con muestras cada 30 segundos. La comparación de Starlink, Amazon Leo y OneWeb utiliza 25 instantes separados por cinco minutos durante dos horas, con conteos absolutos o normalizados por cada 1,000 objetos. D3/SVG coordina selección de rangos, matrices, series y trayectoria polar. La escena combina texturas terrestres, iluminación, atmósfera estilizada, estaciones simbólicas y una posición lunar calculada con efemérides; su distancia de presentación está comprimida. El menú interno permanece en el flujo normal (position: relative) como ancla de su indicador; no se convierte en sticky/fixed. La demo es un HTML monolítico de UI 26 (17,478,841 bytes) que se carga en iframe solo al abrir la ficha; el bundle inicial del portafolio no incluye la escena 3D.',
          resultados:
            'El prototipo permite explorar seis grupos, seleccionar satélites, comparar distribuciones de altura e inclinación, inspeccionar ventanas desde ciudades predefinidas y contrastar la presencia geométrica de tres constelaciones. La selección de altura dispone de tabla y CSV; la comparación ofrece un cursor temporal compartido y la trayectoria polar puede recorrerse con teclado. En el escenario precomputado de ISS desde Ciudad de México se obtienen dos ventanas sobre 10° dentro de las 24 horas del snapshot. Es un resultado de ese escenario y de ese snapshot, no una predicción vigente ni una garantía de visibilidad.',
          limitaciones:
            'Prototipo analítico con snapshot fijo; no recibe telemetría en vivo ni es una herramienta de control de misión. La precisión depende de los elementos y su distancia temporal. Un paso geométrico no garantiza visibilidad óptica, conectividad ni cobertura comercial. El relieve es una textura desplazada con exageración, no un DEM calibrado; la atmósfera no es un modelo físico validado. La Luna tiene distancia visual comprimida y orientación superficial ilustrativa; las estaciones están ampliadas para identificarlas. Las posiciones se actualizan por muestras y aún no se interpolan. El HTML es monolítico y pesado (17.48 MB); las pruebas de navegador verifican el worker real y la interfaz, pero no sustituyen una auditoría científica ni una medición de rendimiento sostenido. El backend Python separado no está conectado al HTML. No requiere LLM, credenciales ni escritura en sistemas externos. Límites de afirmación: no tiempo real, no cobertura de internet, no 60 FPS medidos, no exactitud científica integral ni DEM, no FastAPI integrado y no una licencia universal para todos los recursos.',
          tecnologias: ['JavaScript', 'satellite.js / SGP4', 'Web Workers', 'CelesTrak GP JSON', 'astronomy-engine', 'React', 'TypeScript', 'Three.js', 'React Three Fiber', 'Drei', 'D3.js', 'SVG', 'HTML/CSS'],
          tecnologiasGrupos: [
            { funcion: 'Cálculo y datos', items: ['JavaScript', 'satellite.js / SGP4', 'Web Workers', 'CelesTrak GP JSON', 'astronomy-engine'] },
            { funcion: 'Visualización e interfaz', items: ['React', 'TypeScript', 'Three.js', 'React Three Fiber', 'Drei', 'D3.js', 'SVG', 'HTML/CSS'] }
          ],
          capturas: ['img/orbita-resumen.jpg'],
          captura: 'img/orbita-resumen.jpg',
          capturaAncho: 1600,
          capturaAlto: 1726,
          capturaRatio: '1600 / 1726',
          capturaAjuste: 'tablero',
          capturaAlt:
            'Portada de «ORBITA»: explorador orbital con Tierra 3D, Luna, estaciones y marcadores de seis grupos; panel de constelaciones visibles, indicadores del snapshot, navegación de cinco vistas y avisos de posiciones calculadas, no telemetría en vivo.',
          demoUrl: 'dashboards/orbita/index.html',
          codigoUrl: 'https://github.com/Dev-HugoAguilar/orbita-orbital-intelligence',
          enlaces: [
            {
              texto: 'CelesTrak · catálogo GP',
              url: 'https://celestrak.org/NORAD/elements/'
            },
            {
              texto: 'Earth3D · referencia de escena y texturas',
              url: 'https://github.com/mitchcamza/Earth3D'
            },
            {
              texto: 'NASA GIBS · imágenes y atribuciones',
              url: 'https://earthdata.nasa.gov/gibs'
            },
            {
              texto: 'Solar System Scope · texturas',
              url: 'https://www.solarsystemscope.com/textures/'
            },
            {
              texto: 'DataViz Inspiration · familias visuales',
              url: 'https://www.dataviz-inspiration.com/'
            }
          ]
        }
      ]
    },

    {
      id: 'ciencia-de-datos',
      numero: '02',
      nombre: 'Ciencia de datos y Machine Learning',
      etiqueta: 'Ciencia de datos',
      descripcion: 'Modelos y análisis con criterios de evaluación explícitos.',
      resumen: 'Del análisis exploratorio a la evaluación de modelos, con criterios explícitos y comparables.',
      alcance: ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'XGBoost', 'Optuna', 'LightGBM', 'Validación cruzada', 'Pipelines de datos', 'Modelos predictivos', 'Comparación de métodos', 'Evaluación'],
      ilustracion: 'modelos',
      escenaAlt: 'Ilustración conceptual: observaciones dispersas, una recta de ajuste, su banda de confianza del 95 % y los residuos.',
      proyectos: [
        {
          id: 'atlas-comercial',
          titulo: 'Walmart M5 — Planeación de demanda y evaluación de pronósticos',
          estado: 'publicado',
          resumen:
            'Analítica de ventas históricas y pronóstico diario a 28 días con datos de la competencia M5 de Kaggle.',
          descripcion:
            'Analítica de ventas históricas y pronóstico diario a 28 días con datos de la competencia M5 de Kaggle. Proyecto independiente con datos públicos de la competencia M5; no está afiliado ni patrocinado por Walmart.',
          destinatario:
            'Equipos de planeación de demanda, analistas comerciales y perfiles de ciencia de datos que necesitan ver de dónde salen las unidades vendidas, cómo se comparan dos intervalos y cuánto se equivoca un pronóstico de referencia antes de invertir en un modelo más complejo.',
          categoria: 'Demanda',
          /* Resumen legible antes del detalle: cifras ya publicadas en `resultados`,
             sin cambios ni redondeos nuevos. */
          resumenMetricas:
            '28 días pronosticados con un LightGBM global sobre 30 490 series artículo × tienda. Evaluación al grano artículo × tienda × día en los dos cortes finales: MAE 1,07 frente a 1,24 del baseline; WAPE 75,64 % frente a 87,53 % (13,58 % menos error). Comparación agregada por día del segmento: MAE 3 050,23 frente a 3 501,00 (12,88 % menos error). Los dos cortes finales se consultaron antes de publicar: no son un holdout intacto. El método completo, con sus cortes, variables y reglas de lectura, está en el bloque desplegable.',
          /* El texto del método es largo: se dibuja en un <details> y el resto de
             apartados —incluidas las limitaciones— queda a la vista. */
          metodoEnDetalle: true,
          meta: 'Walmart M5 (Kaggle) → MongoDB local → FastAPI → React + D3 · Proyecto · Datos y calidad · Exploración (panorama, estacionalidad, precios, detalle de artículo) · Modelado · Evaluación · Resultados a 28 días con LightGBM',
          capturas: [],
          /* Bloque técnico de la demo: la base compacta se generó y se validó en local. */
          demoTecnica: {
            titulo: 'Optimización de la demo',
            intro:
              'La base compacta de demostración redujo el consumo de recursos y mantuvo la paridad funcional:',
            puntos: [
              'Documentos: 557 598 → 435 276 (−21,9 %).',
              'Datos BSON: 958,13 MB → 659,87 MB (−31,1 %).',
              'Almacenamiento físico: 272,76 MB → 164,81 MB (−39,6 %).',
              'Paquete de publicación comprimido: 70,48 MB.',
              'Paridad funcional comprobada: 60 de 60 casos de API equivalentes entre la base original y la compacta.'
            ],
            nota:
              'Estas optimizaciones no modificaron las cifras del pronóstico. El paquete compacto se generó, empaquetó y validó en local: no se ha cargado ni desplegado en MongoDB Atlas.'
          },
          captura: 'img/walmart-m5-resumen.jpg',
          capturaAncho: 1600,
          capturaAlto: 1726,
          capturaRatio: '1600 / 1726',
          capturaAlt:
            'Resumen del tablero «Walmart M5 — Planeación de demanda y evaluación de pronósticos», pantalla «Resultados»: encabezado del caso con la nota de independencia y la navegación de las seis pantallas, el plan de ventas a cuatro semanas con el corte del 22 de mayo de 2016, el resumen del conjunto filtrado (1 335 219,04 unidades previstas, 1 231 764 observadas, +103 455 de diferencia y 30 490 series), la tabla semanal por artículo y tienda con sus cuatro semanas y paginación, y el detalle de la serie seleccionada.',
          demoUrl: null,
          codigoUrl: 'https://github.com/HugoAguilarReyna/demand-forecasting-m5',
          hallazgos: null,
          notaEstado:
            'Datos reales de M5 importados en MongoDB local (base atlas_comercial_local). El tablero lee la versión publicada desde la API; no hay datos sintéticos en las cifras publicadas. El paquete de publicación compacto para la demo está generado, exportado y validado en local (base atlas_comercial_demo: 435 276 documentos, 164,8 MB de almacenamiento, archivo gzip de 70,5 MB, 60 de 60 respuestas equivalentes a la base de trabajo y las seis pantallas verificadas contra ella); la carga en MongoDB Atlas no se ha ejecutado en este incremento. La cobertura son los días con ventas: 1 941 de los 1 969 días de calendario, y los 28 días finales sin ventas se excluyen de la cobertura pública. La exploración por departamentos usa un derivado local tienda × departamento (70 combinaciones) construido desde los bloques y reconciliado contra los agregados antes de publicarse.',
          problema:
            'Planear demanda con un histórico de ventas diarias exige tres cosas que suelen faltar: saber qué se está sumando (unidades por producto y tienda, no ingresos), comparar dos intervalos con los mismos filtros no temporales y tener una referencia de error medida fuera de muestra. Sin eso, cualquier modelo posterior se juzga por impresiones y se confunde el volumen con el desempeño.',
          contribucion:
            'Diseñé e implementé el flujo completo: importación por lotes e idempotente de los archivos de M5 a MongoDB local con manifiesto de hashes, cobertura y validaciones; un modelo de documentos compacto (catálogo, calendario, agregados diarios por dimensión y bloques producto × tienda); la API con contrato tipado y estados explícitos; el tablero en seis pantallas —Proyecto, Datos y calidad, Exploración, Modelado, Evaluación y Resultados, cada una con su propia URL, su título y su propósito— con dos jerarquías que se cruzan en un mismo estado de filtros —territorio (Estados Unidos → estado → tienda) y catálogo (categoría → departamento → producto)—, panorama territorial por estado, composición en barras con denominadores explícitos, exploración de productos de un departamento y una gráfica editorial que compara el año elegido con el promedio y el rango observado de los años anteriores completos; la exploración descriptiva en cuatro subsecciones con carga progresiva dentro de su pantalla —panorama con comparación entre periodos por tienda × categoría (12 filas reales en California, no 3 categorías agregadas) y matriz de composición por tienda, estacionalidad semanal y mensual con días observados y meses parciales, matriz temporal tienda × día con cero distinto de «sin dato», precios con distribución ponderada por días cubiertos y conteo de cambios entre semanas con precio, y detalle de artículo × tienda con ventas diarias, precio semanal escalonado, capas de SNAP y eventos, e intermitencia por serie—; el motor predictivo de demanda diaria a 28 días para las 30 490 series (50 variables de historia, calendario, eventos y SNAP; un único LightGBM global condicionado al horizonte); y su evaluación fuera de muestra en tres cortes de desarrollo y dos cortes finales que no intervinieron en la selección, con MAE, sesgo y WAPE calculados desde errores y denominadores en dos granos (artículo × tienda × día y total del segmento por día), la tabla completa por ventana, horizonte, estado y categoría y la descarga en CSV de exactamente la selección mostrada.',
          fuentes:
            '«M5 Forecasting - Accuracy», competición de Kaggle: sales_train_evaluation.csv (unidades diarias por producto y tienda), calendar.csv (fecha, eventos y SNAP) y sell_prices.csv (precio semanal por tienda y producto, usado en la exploración de precios y en una variante del modelo). Referencia analítica de la exploración: el cuaderno «Back to (predict) the future — Interactive M5 EDA», del que se tomó la organización del análisis y no el código. Datos históricos de Estados Unidos: tres estados (CA, TX, WI), diez tiendas, tres categorías y siete departamentos. Los archivos no se redistribuyen en el repositorio: se descargan aparte y el proyecto guarda su manifiesto de importación. Este proyecto no está vinculado ni patrocinado por Walmart.',
          metodo:
            'La importación corre fuera de la API: valida cabeceras y hashes, calcula una versión estable a partir del contenido, escribe por lotes y solo mueve el puntero de versión publicada si la reconciliación cuadra (suma de series = suma de agregados = total de la concentración). Los documentos son compactos: un vector diario por dimensión, series producto × tienda en bloques de 196 días y resultados de pronóstico versionados. La intersección tienda × departamento no viene en M5: se calcula en un proceso aparte desde los bloques y el catálogo, se reconcilia día a día contra los agregados de tienda y de departamento y solo entonces se publica. El modelo es un LightGBM global para las 30 490 series con el horizonte (día 1 a 28) como una variable más: todas las variables de ventas usan t ≤ origen (rezagos, medias y desviaciones móviles, mismo día de la semana, intermitencia), y del día objetivo solo se usan calendario, eventos y los flags SNAP reales; la variante publicada no usa precios, y en la variante con precios (identificada aparte) el precio del horizonte es el último conocido. Se entrena con 320 rondas, objetivo tweedie (varianza 1,1), muestreo al 6 % de las filas con cero reponderado solo en entrenamiento, semilla fija y 8 hilos. La selección se hace en cuatro cortes de desarrollo (d_1773, d_1801, d_1829 y d_1857) con un criterio único (menor WAPE de desarrollo frente al baseline); los dos cortes finales (d_1885 y d_1913) son posteriores al entrenamiento (d_1857), pero se consultaron para confirmar la publicación, así que no son un holdout intacto y así se declara. Las pantallas que filtran por etapa muestran «0 cortes de desarrollo» para la ejecución publicada porque esos cortes pertenecen a las ejecuciones de desarrollo de la misma variante. La separación temporal se audita por ejecución y corte comprobando la fecha de las etiquetas (origen + horizonte): 14 evaluaciones auditadas, todas con separación verificada (ninguna contaminada, ninguna no verificable), con el detalle en la pantalla «Evaluación» y en la respuesta /auditoria-temporal. Esa separación no convierte los cortes finales en un holdout intacto. El baseline es un ingenuo estacional semanal que repite los últimos siete días observados, medido siempre en las mismas series, fechas y filtros que el candidato. Las métricas se calculan desde errores y denominadores sumados, no promediando porcentajes, y el error de una serie agregada se mide sumando predicción y observado antes de comparar. La exploración descriptiva se recalcula en el servidor con reglas explícitas: un día sin observación nunca es un cero y no entra en los denominadores; las combinaciones tienda × categoría y tienda × departamento se verifican contra las series importadas en lugar de fabricarse con un producto cartesiano; los conteos distintos (artículos únicos, series artículo × tienda, unidades) no se suman entre sí; el promedio diario divide entre días con observación y cada mes declara por separado días del mes, del periodo, con cobertura y observados (enero de 2011 son 3 días observados de 31, con datos desde el 29); la matriz temporal usa el año completo y distingue cero, sin dato y fuera del filtro; la distribución de precios usa una observación por artículo × tienda con el precio medio ponderado por los días cubiertos (no por unidades); los cambios de precio comparan semanas consecutivas con precio en centavos enteros, de modo que un hueco no genera una transición y un cambio de un centavo cuenta (sin tolerancia técnica; cualquier umbral comercial sería explícito); y la intermitencia corta la racha de ceros en un día sin dato e incluye las series de ventas siempre cero.',
          resultados:
            'Versión publicada m5-85e8ac8df562 (revisión rev-ec9b21cd45, política decimal-v1): 29 ene 2011 – 22 may 2016, 1 941 días con ventas; 3 estados de EE. UU., 10 tiendas, 3 categorías, 7 departamentos, 3 049 artículos y 30 490 series artículo × tienda; 66 927 173 unidades conciliadas entre detalle, agregados y concentración. '
            + 'Pronóstico publicado de 28 días con un modelo global LightGBM condicionado al horizonte y 50 variables de calendario, eventos, SNAP e historia de ventas (la variante publicada no usa variables de precio), frente a un baseline estacional semanal que repite los últimos 7 días observados. '
            + 'Total de unidades previstas para el horizonte: 1 335 219,04. '
            + 'Evaluación al grano artículo × tienda × día en los dos cortes finales: MAE 1,07 frente a 1,24 del baseline; WAPE 75,64 % frente a 87,53 %; 13,58 % menos error que el baseline. '
            + 'Comparación agregada consolidada por día del segmento: MAE 3 050,23 frente a 3 501,00; 12,88 % menos error. '
            + 'Los resultados varían por ventana y grano y se publican tal cual: en el primer corte final el error agregado fue 23,71 % mayor que el baseline y en el segundo 44,23 % menor. '
            + 'Los dos cortes finales se consultaron antes de confirmar la publicación, así que no son un holdout intacto ni una evaluación independiente nueva. '
            + 'Las cifras estiman unidades vendidas de un conjunto histórico: no son ventas actuales, ni ingresos, ni órdenes de compra, ni una garantía de abastecimiento. '
            + 'Política de precisión: la serie canónica es decimal, los agregados se calculan desde esa serie y el redondeo se aplica solo al presentar; por eso la tabla semanal se muestra a 2 decimales y puede diferir del total por redondeo visual.',
          limitaciones:
            'El WAPE a grano artículo × tienda es alto (75–92 %) porque la mayoría de las series son intermitentes: no es un error porcentual sobre volumen agregado, y por eso también se publica el MAE en unidades por serie-día y el error de las series agregadas. El modelo predice unidades de un conjunto histórico, no ventas actuales, y no incluye ingresos, campañas ni segmentación de clientes; M5 no trae promociones, así que los cambios de precio no se etiquetan como tales. No hay intervalos de predicción calculados, ni WRMSSE (métrica oficial de M5) porque exigiría implementar su jerarquía, escalamiento y ponderaciones; las cifras no son comparables con el ranking de la competencia. El sesgo se publica con su grano y su unidad: unidades por serie-día (diario), por serie-horizonte de 28 días (horizonte) y por día del segmento (agregado); son medidas distintas y no se suman entre sí. Las diferencias de error se leen con una regla única: «Mismo error dentro de la precisión del cálculo» solo cuando los errores coinciden dentro de la precisión publicada; «Diferencia inferior a 0,05 %» cuando no son iguales pero la mejora no alcanza ese umbral (0,0005 en razón), sin declarar empate ni equivalencia; y «X % menos error» o «X % más error» en el resto. Con el baseline en cero la mejora porcentual no se calcula. En la variante con precios —que no es la publicada— el precio de los 28 días pronosticados es un supuesto (último precio conocido); la variante publicada no usa variables de precio y así se declara en su manifiesto. El pronóstico está anclado al último día observado: no hay ingesta incremental ni monitorización en producción. La comparación histórica es descriptiva, sin estacionalidad ajustada ni contraste de hipótesis, y el nivel de producto se limita a cinco series. La exploración tampoco es inferencial: los perfiles de estacionalidad y la matriz temporal describen patrones observados, no efectos causales; SNAP y los eventos se dibujan como coincidencias temporales; la intermitencia incluye las series de todo cero y no distingue demanda no satisfecha de rotura de stock; precios y unidades se publican separados y no se convierten en ingresos. El cuaderno de análisis exploratorio que sirvió de referencia (sin autor declarado en el archivo) no se presenta como modelo ganador y sus cifras no se reutilizan: todo se recalcula sobre la versión publicada. Las tiendas conservan su código original y no se renombran como ciudades mexicanas. El paquete compacto reduce el almacenamiento 39,6 % (272,8 → 164,8 MB) y los precios 91,7 %, pero los bloques de venta siguen siendo el 79 % del almacenamiento: guardarlos en binario int32 ahorraría otro 35 % de esa colección y no se aplicó porque la concentración calcula en el servidor sobre el arreglo de unidades. Ni la base de trabajo ni el paquete se han subido a Atlas.',
          tecnologias: ['Python', 'LightGBM', 'NumPy', 'FastAPI', 'MongoDB', 'React', 'TypeScript', 'D3.js', 'Pytest', 'Playwright'],
          tecnologiasGrupos: [
            { funcion: 'Ingesta y datos', items: ['Python', 'Pandas-free (csv)', 'MongoDB local'] },
            { funcion: 'Modelo predictivo', items: ['LightGBM', 'NumPy', 'Evaluación temporal'] },
            { funcion: 'API y contrato', items: ['FastAPI', 'Pydantic'] },
            { funcion: 'Interfaz y visualización', items: ['React', 'TypeScript', 'D3.js'] },
            { funcion: 'Verificación', items: ['Pytest', 'Playwright'] }
          ],
          enlaces: [
            {
              texto: 'M5 Forecasting - Accuracy (Kaggle)',
              url: 'https://www.kaggle.com/competitions/m5-forecasting-accuracy/data'
            }
          ]
        },
        {
          id: 'clientes-campanas',
          titulo: 'Clientes y campañas — Segmentación conductual, propensión e incrementalidad',
          estado: 'publicado',
          resumen:
            'Segmentación conductual, propensión de respuesta e incrementalidad publicitaria',
          descripcion:
            'Segmentación conductual, propensión de respuesta e incrementalidad publicitaria. Un recorrido de ciencia de datos sobre hogares compradores (Complete Journey), un benchmark independiente de incrementalidad (Criteo) y el diseño de un experimento de campañas que todavía no se ejecutó.',
          destinatario:
            'Equipos de marketing y CRM que necesitan separar tres preguntas distintas: quién compra de qué manera, quién respondería a una campaña y qué parte de esa respuesta sería realmente incremental.',
          categoria: 'Marketing',
          capturas: [],
          captura: 'img/clientes-campanas-resumen.jpg?v=2',
          capturaAncho: 1600,
          capturaAlto: 1726,
          capturaRatio: '1600 / 1726',
          capturaAjuste: 'tablero',
          capturaAlt:
            'Portada del tablero «Clientes y campañas»: cabecera con el título y la edición Complete Journey · Criteo, la barra de las seis secciones con «Campañas» activa y el bloque de capacidad de contacto, con el selector de corte, el deslizador de porcentaje seleccionado, los cuatro indicadores del ranking y las dos curvas de targeting —respuestas capturadas y tasa entre seleccionados— sobre su eje de audiencia contactada.',
          demoUrl: 'dashboards/clientes-campanas/index.html',
          codigoUrl: 'https://github.com/Dev-HugoAguilar/customer-growth-intelligence',
          hallazgos: null,
          tecnologiaEstado: null,
          problema:
            'Las campañas de fidelización suelen mezclar tres preguntas que exigen datos distintos: cómo se comportan los hogares, quién respondería a un envío y cuánto de esa respuesta se habría producido de todos modos. Sin separarlas, se confunde una tasa de canje con un efecto y se invierte en la audiencia equivocada.',
          contribucion:
            'Construí el flujo completo sobre transacciones de Complete Journey: perfiles conductuales con ventana móvil de 90 días y K-Means con regla explícita de tamaño mínimo, alineación de etiquetas entre cortes para que el segmento signifique lo mismo al cambiar de mes, transiciones y entradas/salidas del universo por hogar, un modelo de propensión a canje con holdout temporal hacia adelante y curvas de targeting y calibración calculadas desde predicciones fuera de muestra. En paralelo, adapté el benchmark aleatorizado de Criteo como módulo independiente para comparar modelos de uplift con su ranking aleatorio, y dejé preparado el diseño del experimento: potencia con efectos mínimos detectables, aleatorizador y analizador por intención de tratar. Todo se sirve desde artefactos exportados de forma reproducible; el tablero no entrena modelos al navegar.',
          fuentes:
            'Complete Journey (84.51°), publicado como paquete R: 1 469 307 líneas de transacción de 2 469 hogares entre 2017 y 2018, con campañas, cupones, productos y demografía parcial; y Criteo Uplift Prediction Dataset v2.1 como benchmark aleatorizado independiente, con una muestra reproducible de 500 000 filas y el benchmark completo ya calculado por el proyecto. Las dos fuentes no comparten identificadores: no se unen hogares ni se atribuyen efectos de Criteo a los segmentos. Los datos no se redistribuyen fuera del proyecto.',
          metodo:
            'Las variables de cada corte se calculan solo con transacciones anteriores a la fecha de corte; el canje se mide en campañas posteriores. La segmentación usa recencia, frecuencia, gasto, diversidad, canasta media, uso de descuentos y mezcla de departamentos, estandarizados, y el número de segmentos se elige con la regla de al menos 5 % de hogares por segmento; las etiquetas se alinean por actividad porque el identificador de K-Means es arbitrario. Las transiciones se calculan desde las asignaciones por hogar, no desde el ARI. La propensión es una regresión logística con variables de 90 días y de exposición previa, sin demografía, entrenada solo con campañas cerradas antes del corte, y se evalúa con campañas posteriores; la calibración se publica como diagnóstico y el puntaje se usa para ordenar. En Criteo se comparan S-learner, T-learner, una propensión de respuesta y el ranking aleatorio con AUUC por usuario, sin declarar superioridad entre candidatos y con los rangos entre semillas etiquetados como rangos. La experimentación es diseño: aproximación normal para dos proporciones con varianza agrupada, tres brazos por segmento y α de 0.025 por comparación primaria con corrección de Holm.',
          resultados:
            'Cortes al 1 de julio, 1 de agosto y 1 de septiembre de 2017 con dos segmentos en cada uno: alrededor de 2 300 hogares, con el grupo de mayor actividad en torno al 68 % del universo y un gasto mediano de 509–519 USD frente a 67–71 USD del grupo de menor actividad. La permanencia entre cortes es de 90,2 % y 91,1 % de los hogares comparables (ARI 0,64 y 0,67), de modo que el segmento es dinámico y debe recalcularse. La propensión ordena con Average Precision de 0,379–0,414 y un lift del decil superior cercano a ×3,6–3,9 frente a la tasa base; el grupo sin exposición previa rinde menos y así se declara. La calibración no alcanza para leer cada puntuación como probabilidad. En Criteo, el benchmark completo (1,1 M de filas de ajuste y 2,8 M de prueba por semilla) deja a los tres modelos por encima del ranking aleatorio, con diferencias pequeñas entre ellos; las curvas de la muestra confirman la dirección en visitas y conversiones. El diseño experimental indica que detectar 30 % de mejora relativa exigiría 22 107 hogares en tres brazos, mientras el cohorte actual solo tiene 2 317: la cohorte no alcanza y el experimento queda pendiente de ejecución.',
          limitaciones:
            'El canje observado no es uplift causal: Complete Journey no tiene asignación aleatoria ni grupo de control, y las campañas y los hogares se repiten. El puntaje ordena, no estima ingresos, margen ni ROI, y la calibración es insuficiente para interpretarlo como probabilidad. Las ventanas de prueba de los tres cortes se traslapan y no son réplicas independientes; el grupo "sin exposición previa" no es un arranque en frío estricto, porque puede tener historial de compras. La demografía está disponible para el 32 % del universo transaccional y no se imputa. Criteo es otro retailer, otro país y otro año: sus efectos no se transfieren a estos segmentos y su comparación entre modelos no prueba superioridad estadística. La experimentación es un diseño con supuestos de asignación balanceada y sin attrition; no hay campaña ejecutada ni resultados de campo. Abandono, recomendación y valor de vida siguen fuera del alcance implementado. Las cifras describen 2017–2018, no el comportamiento actual.',
          tecnologias: ['Python', 'pandas', 'scikit-learn', 'NumPy', 'SciPy', 'JavaScript', 'SVG', 'CSS'],
          tecnologiasGrupos: [
            { funcion: 'Datos y análisis', items: ['Python', 'pandas', 'NumPy', 'SciPy'] },
            { funcion: 'Modelado', items: ['scikit-learn', 'K-Means', 'Regresión logística', 'Uplift S/T'] },
            { funcion: 'Interfaz', items: ['JavaScript', 'SVG generado a mano', 'CSS'] },
            { funcion: 'Verificación', items: ['Playwright', 'pytest', 'Exportador reproducible'] }
          ],
          enlaces: [
            {
              texto: 'Complete Journey (paquete R)',
              url: 'https://cran.r-project.org/package=completejourney'
            },
            {
              texto: 'Criteo Uplift Prediction Dataset',
              url: 'https://ailab.criteo.com/criteo-uplift-prediction-dataset/'
            }
          ]
        },
        {
          id: 'clientes-en-movimiento',
          titulo: 'Clientes en movimiento',
          estado: 'publicado',
          resumen:
            'Segmentación de hogares compradores y evolución de sus hábitos con clustering y datos reales de Complete Journey',
          descripcion:
            'Segmentación de hogares compradores y evolución de sus hábitos con clustering y datos reales de Complete Journey. Un laboratorio interactivo para ver cómo cambia el comportamiento de compra de un mismo hogar entre julio, agosto y septiembre de 2017.',
          destinatario:
            'Equipos de marketing y CRM que necesitan leer la conducta de compra por hogar y seguir sus cambios sin confundir un cambio de hábito con una campaña o con una pérdida de cliente.',
          categoria: 'Marketing',
          capturas: [],
          captura: 'img/clientes-en-movimiento-resumen.jpg?v=2',
          capturaAncho: 1600,
          capturaAlto: 1726,
          capturaRatio: '1600 / 1726',
          capturaAjuste: 'tablero',
          capturaAlt:
            'Portada del tablero «Clientes en movimiento»: encabezado con el nombre del proyecto y la fuente, la cifra de hogares presentes en los tres cortes, la navegación de las cuatro vistas con «Explorar clientes» activa, los filtros de corte, perfil y cohorte, las cuatro cifras de la selección y la gráfica completa de trayectorias conectadas con la nube de hogares sobre sus dos ejes, con la escala logarítmica.',
          demoUrl: 'dashboards/clientes-en-movimiento/index.html',
          codigoUrl: 'https://github.com/Dev-HugoAguilar/customer-growth-intelligence',
          hallazgos: null,
          tecnologiaEstado: null,
          problema:
            'Un perfil de cliente suele leerse como una etiqueta fija, cuando en realidad resume una ventana de compra que se mueve. Con un corte único no se distingue si un hogar cambió de hábito, si solo cambió el reajuste del modelo o si entró o salió del universo observado.',
          contribucion:
            'Construí el tablero de segmentación sobre Complete Journey con cuatro vistas conectadas: exploración de hogares con trayectorias entre cortes, corrientes de frecuencia, huella temporal de los 90 días previos al corte y evidencia del modelo. Los perfiles se recalculan por corte con K-Means sobre variables de conducta, las etiquetas comerciales se alinean por mediana de frecuencia y la selección de un hogar se conserva entre vistas. Añadí filtros de corte, perfil, cohorte y canastas mínimas, búsqueda por identificador, ejes configurables con escala log1p, selección semanal del ritmo de compra, tablas de respaldo y descarga CSV del conjunto seleccionado completo.',
          fuentes:
            'Complete Journey (84.51°), publicado como paquete R: 1 469 307 líneas de transacción de 2 469 hogares compradores entre 2017 y 2018. La unidad analítica es el hogar, no una persona identificada; el universo por corte es de 2 300, 2 317 y 2 311 hogares. Los datos no se redistribuyen fuera de este proyecto y no representan clientes actuales ni un mercado mexicano.',
          metodo:
            'Perfiles por corte con ventanas móviles de 90 días anteriores a la fecha de corte (1 de julio, 1 de agosto y 1 de septiembre de 2017). Variables de actividad de compra, recencia, gasto, uso de cupones y composición de la canasta, transformadas con log1p, con recorte de extremos y estandarización; se compararon k = 2…8 y se exige al menos 5 % de hogares por grupo. Las etiquetas comerciales se alinean por la mediana de frecuencia porque el identificador del agrupamiento es arbitrario. La cohorte común son los 2 207 hogares presentes en los tres cortes; 364 de ellos cambian de etiqueta en alguna transición. Las corrientes solo conectan esos hogares comunes y la huella temporal agrega 13 bloques consecutivos de los 90 días previos (doce de 7 días y uno de 6).',
          resultados:
            'Corte de referencia por omisión: agosto, cohorte común de 2 207 hogares, ambos perfiles y sin mínimo de canastas. El tablero publica, para cada selección, hogares, mediana de canastas y de gasto en los 90 días y mediana de días sin comprar, además de las transiciones exactas entre perfiles y la validación del agrupamiento por corte (tamaño de muestra, k elegido, silhouette y estabilidad por submuestras). La ficha de un hogar muestra sus canastas, gasto observado, productos distintos, días sin comprar y proporción de líneas con cupón en los cortes disponibles, y la vista de ritmo detalla sus 13 semanas con canastas por día, gasto por día y porcentaje de líneas con cupón.',
          limitaciones:
            'Cada fila es un hogar comprador, no una persona identificada, y los datos son históricos internacionales de 2017. Los gastos están en la moneda de la fuente, no en pesos mexicanos. Las ventanas de 90 días se solapan y los cambios observados no prueban causalidad ni abandono. Las posiciones de las trayectorias son variables observadas: no son un embedding ni una prueba visual de la separación del agrupamiento. Los anillos de la huella temporal tienen escalas independientes y no comparten unidad. Los porcentajes de cupón se calculan por líneas de compra, no por hogares. Este módulo no estima respuesta a campañas, ingreso incremental, valor de vida ni abandono, y no integra el benchmark publicitario, que pertenece a otra evaluación con otra población.',
          tecnologias: ['Python', 'scikit-learn', 'JavaScript', 'SVG', 'CSS', 'Playwright'],
          tecnologiasGrupos: [
            { funcion: 'Datos y análisis', items: ['Python', 'scikit-learn', 'K-Means', 'Complete Journey'] },
            { funcion: 'Interfaz', items: ['JavaScript', 'SVG', 'CSS'] },
            { funcion: 'Verificación', items: ['Playwright', 'Verificador de entrega'] }
          ],
          enlaces: [
            {
              texto: 'Complete Journey (paquete R)',
              url: 'https://cran.r-project.org/package=completejourney'
            }
          ]
        },
        {
          id: 'gaza-observatorio',
          titulo: 'Gaza · Vidas y territorio — Observatorio del impacto humano y territorial',
          estado: 'publicado',
          resumen:
            'Impacto humano, evolución del daño territorial y agrupación de trayectorias observadas con datos abiertos y fuentes trazables',
          descripcion:
            'Observatorio del impacto humano, las lesiones duraderas y la transformación del territorio en Gaza, con datos abiertos y fuentes trazables. Reúne el registro diario de fallecidos y heridos, los acumulados publicados de niños y periodistas, las estimaciones de necesidades de rehabilitación de la OMS, catorce evaluaciones satelitales del daño, un experimento no supervisado sobre secuencias de daño y la lista nominal de personas identificadas, dibujada punto por punto en la vista «Cada punto, una vida». No es un producto oficial de Naciones Unidas, la OMS ni Tech for Palestine.',
          destinatario:
            'Equipos de análisis humanitario, comunicación y política pública que necesitan leer el impacto con fuentes trazables y límites explícitos, sin confundir un reporte con un hecho, la ausencia de reporte con cero ni un sitio evaluado con un edificio dañado.',
          categoria: 'Observatorio humanitario',
          capturas: [],
          captura: 'img/gaza-observatorio-resumen.jpg?v=2',
          capturaAncho: 1600,
          capturaAlto: 1726,
          capturaRatio: '1600 / 1726',
          capturaAjuste: 'tablero',
          capturaAlt:
            'Portada del observatorio «Gaza · Vidas y territorio»: el mapa bivariado del daño a todo el ancho de su sección, con el título que explica las dos dimensiones de cada celda, los controles de evaluación de UNOSAT, mínimo de sitios y descarga, la barra de ampliación y la franja de Gaza dividida en celdas de 0,005 grados sobre su contorno geográfico.',
          demoUrl: 'dashboards/gaza-observatorio/index.html',
          codigoUrl: 'https://github.com/HugoAguilarReyna/gaza-humanitarian-observatory',
          hallazgos: null,
          tecnologiaEstado: null,
          problema:
            'Cuatro fuentes describen el mismo conflicto con gránulos distintos: reportes diarios de Tech for Palestine, una lista identificada de fallecidos, estimaciones de necesidades de rehabilitación de la OMS y evaluaciones satelitales de UNOSAT. Leídas juntas sin cuidado producen errores previsibles: tomar un reporte publicado como la muerte ocurrida ese día, leer la falta de reporte como cero, sumar categorías de lesiones que se solapan, tratar las prótesis colocadas como personas o confundir un sitio evaluado con un edificio dañado.',
          contribucion:
            'Construí el observatorio público con vistas agregadas conectadas: impacto humano con calendario de intensidad, círculos proporcionales por reporte y curva acumulada; edades declaradas con trama de cien celdas y pirámide de puntos por sexo, más prensa; la extensión nominal opcional «Cada punto, una vida» se construye por separado y no forma parte de esta demo pública; lesiones con rangos de necesidades de rehabilitación y actividad de prótesis; mapa bivariado del daño con catorce evaluaciones; explorador de sitios con selección vinculada y ficha del registro; trayectorias y un panel de pronóstico con validación temporal —muertes nuevas reportadas con sus rangos y su backtest, daño por zona y cambio de clasificación por sitio—; «Acceso y respuesta» con logística, IPC, financiación y efectivo; y las vistas de evidencia, archivo completo y referencias de diseño. Cada familia de cifras lleva su fuente y su fecha de corte junto a la visualización, los controles de universo, edad, año, métrica, evaluación, mínimo de sitios y búsqueda actúan sobre la vista que la contiene, y las tablas accesibles, la descarga de celdas visibles y el JSON del archivo filtrado permiten volver al registro original.',
          fuentes:
            'Tech for Palestine: 1 131 reportes diarios de Gaza y 1 131 de Cisjordania, 730 registros de infraestructura y 263 de prensa; los reportes llegan al corte del 10 de noviembre de 2026. Lista identificada de fallecidos: 72 835 registros con nombre y edad declarada, corte al 7 de mayo de 2026; el tablero la incluye completa en «Cada punto, una vida», la extensión nominal opcional, y no completa ni estima las personas que la lista no identifica. OMS (EMRO): estimación de necesidades de rehabilitación por politrauma, mayo de 2026, con rangos de escenario que no son intervalos de confianza; 2 277 personas evaluadas y 502 prótesis colocadas son actividades con unidades distintas, no una cohorte uno a uno. UNOSAT, producto 4213: 198 308 sitios y 14 evaluaciones, con el último producto de comparación de octubre de 2025. Los enlaces completos, los metadatos y los créditos de inspiración están dentro del propio observatorio; los datos de terceros conservan su licencia y no se redistribuyen desde este portafolio.',
          metodo:
            'El mapa bivariado agrega el universo completo de sitios en 1 352 celdas de 0,005 grados: un eje es la cobertura con fecha y clase, el otro la proporción clasificada como destruida entre los sitios observados, y un mínimo de sitios por celda controla el ruido antes de dibujar. La vista de exploración usa una muestra visual fija de 10 000 puntos con selección vinculada a la ficha del sitio y no sirve para conteos locales. El experimento —publicado como resultado precalculado, sin el código de cálculo en el paquete— agrupa sitios por su secuencia de evaluaciones —seis categorías en one-hot por siete evaluaciones, 42 variables— sobre 155 112 sitios elegibles, con partición por bloques geográficos (118 889 de entrenamiento y 36 223 de validación) y k = 6 elegido entre 2 y 6 con silueta de 0,7005 en la muestra de validación. Los totales se leen de los acumulados publicados: las diferencias de acumulados no se presentan como datos diarios y la ausencia de reporte no se rellena con cero. En «Cada punto, una vida», la extensión nominal opcional, los 72 835 registros nominales se dibujan sin muestreo sobre un lienzo, con una fila por edad y solo las filas visibles repintadas al desplazar; el color codifica la edad declarada, el tamaño es constante y el orden es por edad y luego por nombre, de modo que la posición no representa lugar ni fecha.',
          resultados:
            'Con el corte propio de cada fuente declarado en la cabecera —reportes al 10 de noviembre de 2026, edades al 7 de mayo de 2026, daño satelital de octubre de 2025 y OMS de mayo de 2026— el observatorio publica 74 645 fallecidos reportados y 175 978 heridos reportados, más los acumulados publicados de 21 976 niños y 263 periodistas con sus propias fechas de corte. La cobertura de reportes utilizables por año es 69 % en 2023, 92 % en 2024, 80 % en 2025 y 66 % en 2026, y los círculos dibujan 884 reportes positivos de 24 horas sobre 1 131 fechas. El mapa bivariado resume las 14 evaluaciones de UNOSAT sobre 198 308 sitios y el experimento retiene seis grupos con silueta de 0,701 en validación, concordancia ARI de 0,757 con clase inicial por clase final y asociación ajustada de 0,008 con la secuencia de sensores y 0,066 con la gobernación. La lista nominal, en la extensión opcional, dibuja 21 637 niños y adolescentes de 0 a 17 años —5 293 de ellos menores de 5— y 51 198 adultos sobre 72 835 registros con corte al 7 de mayo de 2026, frente a los 74 645 fallecidos reportados del acumulado al 10 de noviembre de 2026.',
          limitaciones:
            'Un reporte publicado no equivale necesariamente a un periodo de 24 horas ni a las muertes ocurridas ese día, y la ausencia de reporte no es un cero: se marca como falta de reporte utilizable. Las categorías de lesiones pueden solaparse y no se suman; los rangos de la OMS son escenarios, no intervalos de confianza, y las 502 prótesis colocadas no son personas. La lista nominal es incompleta y su corte —7 de mayo de 2026— no coincide con el acumulado diario del 10 de noviembre de 2026: la diferencia incluye personas no identificadas y no se rellena con nombres, edades ni puntos inventados; la edad es declarada (0 = menos de un año), no hay fecha individual de defunción y la fuente identifica personas en Gaza, no a todas las niñas y niños fallecidos en Palestina. UNOSAT es un universo seleccionado en el producto final, no un censo de edificios previo al conflicto; sus coordenadas son de sitios y la fecha de una evaluación no identifica el instante del daño ni su autor. El límite geográfico es una referencia territorial, no un frente militar. La partición del experimento se usó para elegir la configuración: no es una prueba final independiente, no hay validación de terreno ni buffer espacial, k alcanzó el extremo del rango explorado y la utilidad incremental frente a reglas simples no está demostrada. El observatorio no predice fallecimientos, ataques ni responsables, y no vincula sitios dañados con personas. El agrupamiento de trayectorias y el panel de pronóstico se publican como resultados empaquetados: el paquete incluye los datos de salida y los verificadores que comprueban las cifras mostradas, no el código que las produjo, así que ninguno de los dos cálculos es reproducible desde este repositorio.',
          tecnologias: ['Python', 'scikit-learn', 'JavaScript', 'D3.js', 'SVG', 'CSS', 'Playwright'],
          tecnologiasGrupos: [
            { funcion: 'Datos y análisis', items: ['Python', 'scikit-learn', 'MiniBatchKMeans', 'Fuentes abiertas'] },
            { funcion: 'Interfaz', items: ['JavaScript', 'D3.js 7.9.0', 'SVG', 'CSS'] },
            { funcion: 'Verificación', items: ['Playwright', 'Verificador del paquete'] }
          ],
          enlaces: [
            {
              texto: 'Tech for Palestine · datos abiertos',
              url: 'https://data.techforpalestine.org/'
            },
            {
              texto: 'OMS EMRO · necesidades de rehabilitación (2026)',
              url: 'https://www.emro.who.int/images/stories/palestine/Estimating_Trauma_Rehabilitation_Needs_in_Gaza_2026.pdf'
            },
            {
              texto: 'UNOSAT · producto 4213',
              url: 'https://unosat.org/products/4213'
            }
          ]
        },
        {
          "id": "retailops",
          "titulo": "RetailOps Unified — Machine learning para operación de supermercados",
          "estado": "publicado",
          "categoria": "Machine Learning",
          "etiquetaCategoria": "Machine Learning",
          "notaEstado": "Publicado en el portafolio. Demo autónoma con operación completamente simulada. No usa datos internos de Walmart, backend, credenciales ni servicios externos.",
          "descripcion": "Prototipo de inteligencia operativa que conecta ventas por sucursal, disponibilidad de productos, preparación de pedidos, capacidad de personal, reparto y experiencia del cliente. Compara una red neuronal y una regresión logística para anticipar retrasos, permite inspeccionar sus probabilidades y probar una inferencia con los pesos entrenados dentro del navegador. La demo combina ubicaciones recopiladas de tiendas de CDMX con una operación simulada con semilla fija (42) y reglas deterministas. No es un producto oficial de Walmart ni utiliza sus ventas, inventario o datos internos.",
          "resumen": "Predicción de retrasos con red neuronal y regresión logística, conectada a ventas por sucursal, inventario, picking, personal y última milla en una operación simulada.",
          "resumenFicha": true,
          "destinatario": "Equipos de operaciones de retail, comercio electrónico, preparación y última milla, junto con responsables de analítica y machine learning que buscan explorar cómo conectar indicadores comerciales con decisiones operativas y predicciones inspeccionables antes de un piloto con datos reales.",
          "problema": "Una operación de supermercado puede vender más de lo que logra preparar y entregar dentro de la promesa. Analizar ventas, inventario, personal y satisfacción en pantallas aisladas dificulta distinguir dónde se concentra un problema, qué pedidos están expuestos y qué capacidad existe para atenderlos. Además, una probabilidad de retraso pierde valor si se presenta sin referencia, sin explicar cuándo se calcula o como si una reasignación demostrara una mejora causal.",
          "contribucion": "Diseñé e implementé un prototipo con siete vistas conectadas: negocio, pedidos y picking, inventario, personal, experiencia, machine learning y evidencia. Construí un mapa de calor de ventas simuladas por sucursal, con límites de alcaldías, ranking y selección vinculada; una matriz temporal de demanda; paneles horarios de demanda y capacidad; visualizaciones de productos, calibración y riesgo; y una traza de las transiciones realizadas durante la sesión. Modelé la asignación por sucursal, rol, turno y plazas disponibles, el cierre de picking con validación atómica y descuento único de stock, las sustituciones manuales y el registro de entrega con evaluación opcional. Entrené y comparé una regresión logística y una MLP, exporté sus parámetros y conecté la red neuronal a un laboratorio de inferencia local. Separé las reglas del dominio de la presentación y preparé las comprobaciones y el paquete reproducible para integrar la demo en el portafolio.",
          "fuentes": "El catálogo contiene 51 ubicaciones de Walmart Supercenter y Express recopiladas de un directorio secundario de BizLocationDB, con cotejo oficial limitado; es una lista parcial y no garantiza vigencia ni exhaustividad. El mapa incorpora las geometrías de referencia de las 16 alcaldías seleccionadas del proyecto sociohidrológico SHI CDMX de 2021. Las 51 coordenadas tienen una coincidencia espacial única en esa capa y el directorio contiene tiendas en 13 de las 16 alcaldías; eso no representa cobertura comercial completa de la ciudad. La operación se genera con semilla 42: 12,000 pedidos sobre 120 días sintéticos, 18 productos, 153 personas y 918 registros de inventario por sucursal y SKU. Los últimos 150 pedidos forman la fotografía operativa. Pedidos, precios de ejemplo, turnos, existencias, evaluaciones y resultados son simulados; no son datos de Walmart ni información en tiempo real.",
          "metodo": "Definí como objetivo de clasificación si la duración total del simulador supera la promesa de entrega. Las cinco entradas son número de referencias distintas, carga inicial sintética, distancia, promesa y hora de creación; el número de referencias no se confunde con la suma de unidades. Comparé una referencia constante de prevalencia, regresión logística y una MLP de arquitectura 5 → 24 → 12 → 1. La separación por bloques de días sintéticos reserva 8,400 ejemplos para entrenamiento, 1,800 para validación y 1,800 para prueba. El escalado se ajusta solo con entrenamiento; la MLP de esta versión no utiliza un split aleatorio interno de early stopping. Los umbrales se eligen únicamente en validación con costos hipotéticos de 5 para un retraso no detectado y 1 para una falsa alerta. La evaluación incluye ROC-AUC, precisión promedio —AP—, Brier, matriz de confusión y curva de fiabilidad. Los pesos y el escalado exportados ejecutan la inferencia en JavaScript, sin un servidor de modelos.\n\nEl mapa suaviza el importe de cada sucursal con un núcleo gaussiano de σ aproximada de 2 km y composición por máximo local: las tiendas cercanas no se suman para aparentar una sola sucursal más vendedora. La sucursal líder se obtiene de su importe exacto. Ventas simuladas significa valor de artículos surtidos en pedidos entregados, conservando el precio original; ticket surtido es ese importe dividido por el número de entregas. Los filtros de sucursal, alcaldía, formato y periodo coordinan las vistas; inventario y personal mantienen su naturaleza de fotografía actual. Los resultados futuros de pedidos activos se ocultan y cambiar una asignación no modifica artificialmente la probabilidad original.",
          "resultados": "El artefacto servido es la version synthetic-42-v2 (13 416 449 bytes, SHA-256 CDC6D7C9...), con particion 8 400/1 800/1 800 y prevalencia de 22.33 %. Metricas declaradas en el bloque MODEL: logistica AUC 0.9856, AP 0.9527, Brier 0.0402; MLP 24/12 AUC 0.9849, AP 0.9519, Brier 0.0411. La logistica queda ligeramente por encima. Las metricas no se recalcularon en esta revision y el entrenamiento no se reprodujo.",
          "limitaciones": "Es el artefacto de una demo, no una plataforma de retail en producción: la operación es simulada y el código que la genera no se publica. La calidad predictiva refleja el generador sintético y no demuestra generalización ni superioridad: la diferencia entre la regresión logística y la MLP es menor a una milésima de AUC. Las métricas son las declaradas por el artefacto y el pipeline de generación y entrenamiento no está publicado, así que no pueden reproducirse de forma independiente desde este portafolio; lo que se publica es la demo, la operación simulada que reproduce en el navegador y los pesos exportados que ejecutan la inferencia. No se comprobó paridad numérica entre Python y JavaScript. Los pedidos, precios, turnos, existencias y evaluaciones son sintéticos y no provienen de ninguna cadena; las fuentes externas citadas —directorio de tiendas y geometrías de alcaldías— se enlazan a su origen y conservan su propia licencia.",
          "tecnologias": [
            "Python",
            "NumPy",
            "scikit-learn",
            "StandardScaler",
            "LogisticRegression",
            "MLPClassifier",
            "JavaScript",
            "HTML/CSS",
            "SVG",
            "GeoJSON",
            "Node.js",
            "LinkeDOM",
            "SHA-256"
          ],
          "tecnologiasGrupos": [
            {
              "funcion": "Datos y machine learning",
              "items": [
                "Python",
                "NumPy",
                "scikit-learn",
                "StandardScaler",
                "LogisticRegression",
                "MLPClassifier"
              ]
            },
            {
              "funcion": "Interfaz y cartografía",
              "items": [
                "JavaScript",
                "HTML/CSS",
                "SVG",
                "GeoJSON",
                "mapa de calor ponderado",
                "inferencia MLP en navegador"
              ]
            },
            {
              "funcion": "Verificación",
              "items": [
                "Node.js",
                "LinkeDOM",
                "SHA-256"
              ]
            }
          ],
          "capturas": [
            "img/retailops-resumen.jpg"
          ],
          "captura": "img/retailops-resumen.jpg",
          "capturaAncho": 1600,
          "capturaAlto": 1726,
          "capturaRatio": "1600 / 1726",
          "capturaAjuste": "tablero",
          "capturaAlt": "Portada de «RetailOps Unified»: mapa de calor lavanda sobre las alcaldías de la Ciudad de México, 51 sucursales, tarjeta de la tienda líder Toreo con $241,760 MXN simulados, controles de capa y métrica, zoom 100 %, rankings y navegación de siete vistas.",
          "demoUrl": "dashboards/retailops/index.html",
          "codigoUrl": "https://github.com/Dev-HugoAguilar/retailops-unified",
          "enlaces": [
            {
              "texto": "BizLocationDB · directorio de tiendas de referencia",
              "url": "https://bizlocationdb.com/locations/walmart/mexico/r/mexico-city"
            },
            {
              "texto": "SHI CDMX / npalomin · geometrías de alcaldías (2021)",
              "url": "https://github.com/npalomin/shi_dataset_cdmx/blob/main/alcaldias.geojson"
            },
            {
              "texto": "DataViz Inspiration · referencias visuales",
              "url": "https://www.dataviz-inspiration.com/"
            }
          ]
        }
      ]
    },

    {
      id: 'ia-generativa',
      numero: '03',
      nombre: 'IA generativa y LLMs',
      etiqueta: 'IA generativa',
      descripcion: 'Búsqueda documental, RAG y consultas SQL en lenguaje natural con trazabilidad.',
      resumen: 'Respuestas con fuentes y un copiloto NL-to-SQL que muestra interpretación, SQL seguro y filas verificables.',
      alcance: ['Integración de LLMs (API)', 'Diseño de prompts', 'RAG', 'NL-to-SQL', 'SQL parametrizado', 'Flujos con agentes', 'Validación de entradas y salidas', 'Respuestas con fuentes', 'Evaluación de calidad', 'Coste', 'Latencia'],
      ilustracion: 'rag',
      escenaAlt: 'Ilustración conceptual de búsqueda documental: consulta, documentos, fragmentos de contexto y respuesta con referencias numeradas.',
      proyectos: [
        {
          id: 'asistente-investigacion',
          titulo: 'Briefing con evidencia · Banco de México',
          estado: 'desarrollo',
          categoria: 'RAG / Finanzas',
          notaEstado:
            'Demo publicada en el portafolio. El corpus y la recuperación léxica están verificados; la consulta al LLM es opcional y pasa por la API del servidor cuando está configurada. Sin proveedor, conserva la respuesta extractiva.',
          descripcion:
            'Asistente documental que responde preguntas sobre dos publicaciones oficiales de Banco de México, muestra los fragmentos exactos que respaldan cada respuesta y distingue las cifras observadas de los pronósticos.',
          resumen:
            'RAG léxico con citas verificables sobre dos documentos de Banco de México: respuesta extractiva, trazabilidad por fragmento y una gráfica D3 de inflación observada y pronosticada.',
          destinatario:
            'Equipos de análisis económico, periodismo de datos y perfiles técnicos que necesitan comprobar una afirmación contra el documento original antes de usarla.',
          problema:
            'Una respuesta generada puede sonar convincente sin estar respaldada por el documento. En temas de política monetaria, mezclar una cifra observada con un pronóstico, perder la fecha de corte o citar una fuente sin fragmento convierte la comodidad del asistente en un riesgo de lectura.',
          contribucion:
            'Construí una demo local con corpus versionable de dos publicaciones de Banco de México, recuperación léxica sobre siete fragmentos, respuestas extractivas cuando no hay modelo, citas por identificador y enlace al documento oficial. Añadí una API FastAPI opcional con Atlas dedicado y una gráfica D3 que separa la serie observada (hasta 2026-T3) del pronóstico publicado (desde 2026-T4), con meta de 3%, tooltip accesible y tabla alternativa.',
          fuentes:
            'Banco de México, Anuncio de Política Monetaria del 5 de noviembre de 2026 (BM-2026-11-05) e Informe trimestral abril–junio de 2026 (BM-2026-08-26). El corpus transcribe siete fragmentos con identificador, título, fecha, URL oficial y palabras clave. No se añadieron documentos, cifras ni explicaciones externas.',
          metodo:
            'La recuperación puntúa coincidencias léxicas entre la pregunta y el título, contenido y palabras clave de cada fragmento; devuelve como máximo tres evidencias. Si Atlas contiene la colección dedicada, se lee de allí; si no responde o está vacía, se usa corpus.json. Si las tres variables LLM están configuradas, el backend pide una respuesta al proveedor usando solo los fragmentos recuperados y que cite sus identificadores; el modo LLM selecciona citas literales con chunk_id; el servidor solo acepta citas que pertenecen a los fragmentos enviados y rechaza texto libre o identificadores ajenos. Si el proveedor falla, conserva la respuesta extractiva. El navegador nunca recibe URI ni claves.',
          resultados:
            'La demo incluye cinco preguntas sugeridas sobre tasa, inflación, riesgos, convergencia y actividad económica; recupera fragmentos con fuente y fecha; distingue modo Atlas/corpus y respuesta extractiva/LLM; y publica la serie de inflación general y subyacente con valores observados y pronosticados. La selección del modelo es opcional; el contrato comprueba identidad textual y procedencia, sin certificar relevancia ni suficiencia de la recuperación; sin proveedor, se mantiene la respuesta extractiva.',
          limitaciones:
            'La recuperación es léxica, no vectorial: no usa embeddings ni comprende paráfrasis fuera del vocabulario del corpus. El corpus es una transcripción resumida de dos documentos y no cubre toda la economía mexicana. El backend publica además una evaluación de recuperación léxica, vectores locales de términos y mezcla híbrida; esos vectores locales no son embeddings de un modelo y el benchmark sigue siendo simulado. El pronóstico es el publicado por Banco de México; la demo no estima escenarios propios ni convierte el pronóstico en una serie observada. La consulta al LLM es opcional, requiere que la API del servidor esté configurada y no reemplaza la verificación de las citas contra los fragmentos. Sin proveedor, la demo responde de forma extractiva. No se muestran URI ni secretos ni se modifica la configuración del clúster.',
          tecnologias: ['Python', 'FastAPI', 'MongoDB Atlas', 'D3.js', 'RAG léxico', 'JavaScript'],
          tecnologiasGrupos: [
            { funcion: 'Datos y recuperación', items: ['Python', 'FastAPI', 'RAG léxico', 'MongoDB Atlas'] },
            { funcion: 'Interfaz', items: ['JavaScript', 'D3.js', 'HTML/CSS'] }
          ],
          capturas: ['img/briefing-banxico-resumen.jpg'],
          captura: 'img/briefing-banxico-resumen.jpg',
          capturaAncho: 1600,
          capturaAlto: 1726,
          capturaRatio: '1600 / 1726',
          capturaAjuste: 'tablero',
          capturaAlt:
            'Portada de «Briefing con evidencia · Banco de México»: cabecera de la demo con el estado local y la API activa, título «Una respuesta. Fuentes a la vista.», corte documental del 5 de noviembre de 2026, las cifras de tasa e inflación, el panel de consulta con preguntas sugeridas, la respuesta pendiente y el inicio de la gráfica D3 de inflación observada y pronosticada.',
          demoUrl: 'dashboards/briefing-banxico/index.html',
          codigoUrl: 'https://github.com/HugoAguilarReyna/portfolio-api/tree/main/app/rag_banxico',
          enlaces: [
            {
              texto: 'Banco de México · Anuncio de Política Monetaria, 5 nov 2026',
              url: 'https://www.banxico.org.mx/publicaciones-y-prensa/anuncios-de-las-decisiones-de-politica-monetaria/%7B43236252-D06E-5231-27E8-058810A86A52%7D.pdf'
            },
            {
              texto: 'Banco de México · Informe trimestral abril–junio 2026',
              url: 'https://www.banxico.org.mx/publicaciones-y-prensa/resumenes-visuales/informe-trimestral-html/informe-trimestral-abr-jun-00005.html'
            }
          ]
        },
        {
          id: 'copiloto-nl-sql',
          titulo: 'Copiloto NL-to-SQL · indicadores económicos de México',
          estado: 'desarrollo',
          categoria: 'NL-to-SQL',
          notaEstado:
            'Demo publicada en el portafolio. El parser léxico, las plantillas SQL y SQLite de solo lectura están verificados. La API puede usar un LLM opcional para proponer un plan JSON validado; sin proveedor, se usa el parser local.',
          descripcion:
            'Copiloto que traduce preguntas en español sobre crecimiento del PIB real, inflación al consumidor y desempleo de México a una consulta SQL parametrizada, y muestra la interpretación, las filas, la tabla, la gráfica y el código que produjo el resultado.',
          resumen:
            'NL-to-SQL acotado con parser léxico, SQL parametrizado, SQLite de solo lectura y visualizaciones D3 que separan unidades y escalas entre indicadores.',
          destinatario:
            'Equipos de análisis y personas que necesitan consultar indicadores públicos sin escribir SQL, pero con la trazabilidad suficiente para auditar la interpretación, la consulta y las cifras.',
          problema:
            'Un copiloto que convierte texto libre en SQL puede ejecutar una consulta destructiva, inventar filtros o comparar indicadores con unidades distintas como si fueran una sola serie. La comodidad sin límites termina ocultando qué se consultó, qué se devolvió y qué significa cada cifra.',
          contribucion:
            'Construí una demo local con un parser léxico de catálogo cerrado, plantillas SQL parametrizadas y una conexión SQLite abierta en mode=ro. Añadí un snapshot WDI de México 2019–2025 para tres indicadores, un ETL opcional desde la API del Banco Mundial y una interfaz D3 con series, rankings y paneles separados por unidad. El backoffice de la demo puede usar Atlas para auditar metadatos de ejecución, sin guardar la pregunta libre.',
          fuentes:
            'Banco Mundial, World Development Indicators, México (MEX), años 2019–2025. Indicadores: NY.GDP.MKTP.KD.ZG (crecimiento del PIB real, % anual), FP.CPI.TOTL.ZG (inflación al consumidor, % anual) y SL.UEM.TOTL.ZS (desempleo total, % de la fuerza laboral). El desempleo es una estimación modelada por la OIT y no mide informalidad ni subempleo. Snapshot local con fecha de corte 15 nov 2026; licencia CC BY 4.0. No se imputaron faltantes.',
          metodo:
            'El parser reconoce únicamente PIB, inflación y desempleo, años entre 2019 y 2025 y operaciones de tendencia, comparación, máximo o mínimo. El texto libre nunca se ejecuta como SQL: se construye una plantilla permitida con parámetros enlazados y se consulta una base SQLite de solo lectura. Si hay un proveedor LLM configurado, solo puede devolver un plan JSON validado contra el catálogo; si falla o devuelve algo inválido, se usa el parser local. Atlas es opcional y recibe solo metadatos de ejecución en una colección dedicada.',
          resultados:
            'Las cuatro consultas sugeridas están verificadas: tendencia del PIB, máximo de inflación, comparación de PIB e inflación en 2020 y tendencia del desempleo. El máximo de inflación se contrasta contra la serie completa, el ranking devuelve los siete años consultados y los valores negativos del PIB se dibujan con referencia en cero. Las comparaciones usan paneles separados con escala y unidad propias; la tabla conserva todas las filas y resalta el extremo solicitado. El plan LLM es opcional; el SQL siempre lo construye el servidor después de validar el plan. El backend incluye una evaluación de 51 casos con modos parser, LLM simulado y fallback; conserva los cuatro errores de alcance conocidos como regresiones y los rechaza antes del proveedor. El conjunto ya usado para corregir no es una prueba independiente. Las cifras del doble no miden un modelo real.',
          limitaciones:
            'El parser es léxico, no semántico: reconoce términos y plantillas de un catálogo cerrado, no comprende libremente cualquier pregunta. La demo cubre un país, tres indicadores y siete años; no imputa faltantes ni suma porcentajes de conceptos distintos. El LLM, si está configurado, solo produce un plan JSON que el servidor valida; no ejecuta SQL arbitrario ni es necesario para usar la demo. Atlas es opcional y su auditoría no guarda preguntas.',
          tecnologias: ['Python', 'FastAPI', 'SQL', 'SQLite', 'ETL', 'D3.js', 'JavaScript'],
          tecnologiasGrupos: [
            { funcion: 'Datos y consulta', items: ['Python', 'FastAPI', 'SQL parametrizado', 'SQLite de solo lectura', 'ETL WDI'] },
            { funcion: 'Interfaz', items: ['JavaScript', 'D3.js', 'HTML/CSS'] }
          ],
          capturas: ['img/copiloto-nl-sql-resumen.jpg'],
          captura: 'img/copiloto-nl-sql-resumen.jpg',
          capturaAncho: 1600,
          capturaAlto: 1726,
          capturaRatio: '1600 / 1726',
          capturaAjuste: 'tablero',
          capturaAlt:
            'Portada de «Copiloto NL-to-SQL · indicadores económicos de México»: cabecera de la demo, pregunta en español sobre la inflación, panel de resultado con el ranking completo de 2019 a 2025, barras horizontales con el máximo de 2022 resaltado, tabla con todas las filas y el SQL parametrizado visible.',
          demoUrl: 'dashboards/copiloto-nl-sql/index.html',
          codigoUrl: 'https://github.com/HugoAguilarReyna/portfolio-api/tree/main/app/nl_sql',
          enlaces: [
            {
              texto: 'Banco Mundial · Crecimiento del PIB real (México)',
              url: 'https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG?locations=MX'
            },
            {
              texto: 'Banco Mundial · Inflación al consumidor (México)',
              url: 'https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG?locations=MX'
            },
            {
              texto: 'Banco Mundial · Desempleo total, estimación OIT (México)',
              url: 'https://data.worldbank.org/indicator/SL.UEM.TOTL.ZS?locations=MX'
            }
          ]
        }
      ]
    },

    {
      id: 'agentes',
      numero: '04',
      nombre: 'Agentes y sistemas de decisión',
      etiqueta: 'Agentes',
      descripcion: 'Herramientas coordinadas, respuesta a incidentes y supervisión humana.',
      resumen: 'Prototipos de decisión con motores deterministas, consulta LLM opcional y aprobación humana.',
      alcance: ['Flujos deterministas', 'Consulta LLM a demanda', 'Data reliability', 'Validación', 'Supervisión humana', 'Trazabilidad del run'],
      ilustracion: 'agentes',
      escenaAlt: 'Ilustración conceptual: un coordinador llama a consulta, cálculo y gráfico, y entrega el resultado a una revisión humana que queda pendiente.',
      proyectos: [
        {
          id: 'data-incident-commander',
          titulo: 'Data Incident Commander — triage supervisado con consulta de IA',
          estado: 'desarrollo',
          categoria: 'Data Reliability',
          notaEstado:
            'Demo desplegada con un flujo base determinista y reproducible. Después de iniciar un run, se puede solicitar una consulta opcional a OpenAI desde la API; los runs y recibos son efímeros y la consulta no aprueba ni ejecuta cambios.',
          descripcion:
            'Prototipo supervisado para DataOps. El flujo determinista expone evidencia, linaje, alternativas y controles, y se detiene para aprobación humana antes de cualquier reparación simulada. Una consulta opcional a OpenAI aporta una recomendación consultiva sin cambiar el run ni ejecutar acciones.',
          resumen:
            'Prototipo de respuesta a incidentes para DataOps: investiga el incidente con reglas deterministas, compara remediaciones, permite consultar una recomendación de OpenAI y espera aprobación humana antes de simular la reparación.',
          destinatario:
            'Equipos de Data Engineering, DataOps, Analytics Engineering y gobierno de datos que quieren explorar un flujo de respuesta a incidentes con trazabilidad, consulta LLM opcional y límites de autoridad.',
          problema:
            'Cuando falla un pipeline, una respuesta rápida puede propagar errores o ejecutar una corrección no autorizada. Los equipos necesitan entender qué activos están afectados, qué alternativas existen y qué evidencia respalda cada decisión antes de intervenir.',
          contribucion:
            'Diseñé e implementé un prototipo supervisado para DataOps. Modelé el ciclo de triage, consulta de evidencia, análisis del linaje declarado, comparación de cuatro remediaciones, validación de políticas y pausa de aprobación humana. Construí cuatro visualizaciones SVG —linaje, coordenadas paralelas, matriz de controles y traza por carriles— y el flujo de aprobación/rechazo con recibo temporal. Las decisiones del flujo base son deterministas; una llamada opcional a OpenAI ofrece una recomendación consultiva separada. El backend publica además un endpoint de agente con cinco herramientas de solo lectura, máximo seis pasos, presupuesto de tokens y traza; la interfaz conserva el flujo consultivo existente.',
          fuentes:
            'Snapshot público de World Development Indicators para México, 2019–2025: 21 observaciones con año, código de indicador, valor, unidad y enlace de origen, bajo CC BY 4.0. Las anomalías de periodo ausente, clave duplicada y contrato alterado son fixtures sintéticas inyectadas en copias temporales; no son incidentes reportados por el Banco Mundial ni defectos del snapshot original.',
          metodo:
            'El usuario elige uno de tres escenarios sintéticos. La anomalía se inyecta solo en una copia temporal; el flujo evalúa reglas de contrato, recorre el linaje declarado y compara cuatro alternativas con puntuaciones hipotéticas del escenario. La matriz distingue pasa, revisar y bloquea. La imputación está prohibida. La ejecución se detiene para revisión humana; aprobar simula la reparación únicamente en memoria y devuelve un recibo, mientras que rechazar no cambia datos. Después de iniciar un run, la persona puede pedir una recomendación a OpenAI: es una sola consulta consultiva sobre el contexto del run, no selecciona herramientas ni modifica su estado. La aprobación humana conserva la decisión final.',
          resultados:
            'El demo permite inspeccionar tres escenarios, el radio de impacto, cuatro remediaciones, la matriz de validaciones y la traza del flujo. También permite solicitar una recomendación consultiva de OpenAI si la API está configurada. La persona puede aprobar o rechazar; la reparación aprobada se simula en una copia temporal y el recibo queda visible durante la sesión. Las métricas del agente de backend corresponden a la corrida simulada con «mock-agente-v1», no a un modelo real: de 12 incidentes cierra 10 (83.3 %) y los dos adversariales (i09 e i10) quedan bloqueados por política antes de cerrar plan, con cero escrituras externas. El baseline determinista de referencia, que solo propone «quarantine», acierta 7 de los 10 casos no adversariales.',
          resumenMetricas:
            '10 de 12 incidentes cerrados (83.3 %) y 2 adversariales (i09, i10) bloqueados por política; baseline determinista: 7 de 10 casos no adversariales. Corrida simulada con mock-agente-v1, no un modelo real.',
          limitaciones:
            'La interfaz publicada conserva una consulta consultiva de una sola llamada; la aprobación y reparación simulada pertenecen al flujo determinista. El agente del backend sí selecciona herramientas de solo lectura dentro de un bucle acotado, pero no aprueba, cambia estados ni repara. Su evaluación utiliza un proveedor simulado; no se verificó en un VPS ni con un modelo real. Las puntuaciones comparan opciones hipotéticas del demo, no métricas operativas. Los recibos viven en memoria y desaparecen al reiniciar. No se escriben archivos, bases de datos, Atlas ni sistemas externos.',
          tecnologias: ['Python', 'FastAPI', 'Flujo de agente simulado', 'Validaciones de contrato', 'Aprobación humana', 'Estado efímero', 'JavaScript', 'SVG', 'HTML/CSS'],
          tecnologiasGrupos: [
            { funcion: 'Orquestación y controles', items: ['Python', 'FastAPI', 'flujo de agente simulado', 'validaciones de contrato', 'aprobación humana', 'estado efímero'] },
            { funcion: 'Interfaz y explicabilidad', items: ['JavaScript', 'SVG', 'HTML/CSS'] }
          ],
          capturas: ['img/data-incident-commander-resumen.jpg'],
          captura: 'img/data-incident-commander-resumen.jpg',
          capturaAncho: 1600,
          capturaAlto: 1726,
          capturaRatio: '1600 / 1726',
          capturaAjuste: 'tablero',
          capturaAlt:
            'Portada de «Data Incident Commander»: consola editorial con el escenario de periodo ausente, KPIs del incidente, Sankey de dependencias afectadas, comparación de remediaciones, matriz de validaciones, traza por carriles y el plan de cuarentena con aprobación humana pendiente.',
          demoUrl: 'dashboards/data-incident-commander/index.html',
          codigoUrl: 'https://github.com/HugoAguilarReyna/portfolio-api/tree/main/app/incident_commander',
          enlaces: [
            {
              texto: 'Banco Mundial · World Development Indicators',
              url: 'https://data.worldbank.org/'
            },
            {
              texto: 'Banco Mundial · Crecimiento del PIB real (México)',
              url: 'https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG?locations=MX'
            }
          ]
        },
        {
          id: 'the-ripple-room',
          titulo: 'The Ripple Room — simulador de disrupciones en la cadena de semiconductores',
          estado: 'desarrollo',
          categoria: 'Simulación / Supply Chain',
          notaEstado:
            'Demo desplegada en el portafolio. El simulador y sus roles conservan un motor determinista; bajo demanda puede solicitar una perspectiva consultiva al LLM mediante la API del servidor. Sin proveedor configurado, la simulación sigue funcionando.',
          descripcion:
            'Sala interactiva de simulación de disrupciones en la cadena de suministro de semiconductores. El visitante activa un choque, observa su propagación en un mapa regional centrado en el Pacífico con tarjeta de exposición, compara respuestas en un diagrama de trade-off y decide qué proteger: servicio, inventario o costo. Puede pedir además una perspectiva consultiva opcional a OpenAI.',
          resumen:
            'Simulador de disrupciones de semiconductores con mapa regional, series de inventario y demanda, trade-off servicio-costo y roles deterministas con perspectiva LLM opcional.',
          destinatario:
            'Equipos de operaciones, abastecimiento, riesgo, estrategia y análisis de cadena de suministro que quieren explorar el impacto de una disrupción y comparar respuestas con supuestos explícitos.',
          problema:
            'Una interrupción en el origen puede propagarse por inventarios, capacidad y demanda antes de que el equipo entienda qué está en riesgo. Sin separar el dato de comercio observado de los supuestos operativos, es fácil confundir valor importado con volumen físico, proveedor real o capacidad de sustitución.',
          contribucion:
            'Integré una demo autónoma con un mapa regional D3 centrado en el Pacífico, una tarjeta de exposición comercial, dos bandas temporales alineadas con escalas independientes, un trade-off seleccionable entre servicio y costo y las perspectivas de tres roles simulados. Los controles de escenario, duración e inventario recalculan el episodio completo, y la decisión del operador se aplica solo al gemelo digital local.',
          fuentes:
            'Importaciones de México de HS 8542 (circuitos integrados electrónicos y microestructuras), valores nominales en USD reportados por UN Comtrade y presentados por WITS, cortes 2023 y 2024. Instantánea consultada: 16 de noviembre de 2026. La red de empresa, inventarios, demanda, capacidad, costos, rutas esquemáticas y crisis son supuestos de la simulación; “Other Asia, nes” se conserva como agregado sin punto geográfico.',
          metodo:
            'El prototipo separa dos capas: los valores agregados de comercio exterior por economía de origen y una red operativa simulada dentro de México. Tres escenarios —shock regional, doble interrupción y pico de demanda— modifican la oferta o la demanda; los deslizadores ajustan duración e inventario de seguridad; el motor determinista calcula servicio, faltantes, backlog y costo índice. El mapa regional usa una proyección centrada en el Pacífico y una tarjeta de exposición contextual; la evolución se muestra en dos bandas con escalas independientes y los planes en un trade-off servicio-costo. Las perspectivas base de Operaciones, Abastecimiento y Finanzas siguen reglas deterministas. A petición del usuario, una sola llamada a OpenAI genera perspectivas consultivas para esos roles; no son agentes independientes ni modifican la simulación. Los arcos representan comercio declarado y conexiones esquemáticas, no rutas logísticas observadas.',
          resultados:
            'La demo permite recorrer los tres escenarios, cambiar la duración de la interrupción y el inventario, ejecutar el episodio, comparar tres planes y leer las perspectivas deterministas de los tres roles. También permite pedir una perspectiva consultiva a OpenAI si la API está configurada. El mapa regional resalta los países bajo presión y muestra una tarjeta de exposición; las dos bandas separan cobertura de inventario y demanda pendiente; el trade-off y el resumen se actualizan con cada configuración y se pueden seleccionar con puntero o teclado.',
          limitaciones:
            'Los valores de importación son comercio nominal agregado, no volumen físico, proveedores de una empresa, rutas observadas, capacidad de sustitución ni pronóstico. La red interna, los escenarios, inventarios, capacidades y costos son hipotéticos. El motor y las perspectivas base son deterministas; la consulta opcional al LLM es de una sola llamada, requiere la API y no constituye agentes independientes ni aprendizaje automático. Los resultados viven en el navegador y no se persisten; no se escriben archivos, bases de datos ni sistemas operativos externos.',
          tecnologias: ['JavaScript', 'D3.js', 'SVG', 'HTML/CSS', 'simulación determinista', 'WITS · UN Comtrade'],
          tecnologiasGrupos: [
            { funcion: 'Datos y simulación', items: ['WITS · UN Comtrade', 'simulación determinista', 'motor local'] },
            { funcion: 'Interfaz y visualización', items: ['JavaScript', 'D3.js', 'SVG', 'HTML/CSS'] }
          ],
          capturas: ['img/the-ripple-room-resumen.jpg'],
          captura: 'img/the-ripple-room-resumen.jpg',
          capturaAncho: 1600,
          capturaAlto: 1726,
          capturaRatio: '1600 / 1726',
          capturaAjuste: 'tablero',
          capturaAlt:
            'Portada de «The Ripple Room»: mapa regional centrado en el Pacífico con países bajo presión y tarjeta de exposición comercial, panel de agentes simulados de Operaciones, Abastecimiento y Finanzas, dos bandas alineadas de cobertura de inventario y demanda pendiente, y diagrama de trade-off servicio-costo.',
          demoUrl: 'dashboards/the-ripple-room/index.html',
          codigoUrl: 'https://github.com/Dev-HugoAguilar/ripple-room-supply-chain',
          enlaces: [
            {
              texto: 'WITS · México, importaciones HS 8542, 2023',
              url: 'https://wits.worldbank.org/trade/comtrade/en/country/MEX/year/2023/tradeflow/Imports/partner/ALL/product/8542'
            },
            {
              texto: 'WITS · México, importaciones HS 8542, 2024',
              url: 'https://wits.worldbank.org/trade/comtrade/en/country/MEX/year/2024/tradeflow/Imports/partner/ALL/product/8542'
            },
            {
              texto: 'UN Comtrade · documentación de la API',
              url: 'https://comtradeplus.un.org/en/api-docs'
            }
          ]
        },
        {
          id: 'kilometro-cero',
          titulo: 'Kilómetro Cero — centro de control de una red de envíos carreteros',
          estado: 'desarrollo',
          categoria: 'Logística',
          notaEstado:
            'Demo desplegada en el portafolio. El mapa, los escenarios y los cálculos siguen funcionando de forma determinista; la lectura del copiloto ofrece una consulta opcional a OpenAI mediante la API del servidor.',
          descripcion:
            'Torre de control para explorar qué cientos de envíos y corredores quedan expuestos cuando una parte de una red carretera se interrumpe. El mapa consolida tramos compartidos, distingue hubs y terminales, y combina filtros, escenarios hipotéticos, flota simulada, Sankey, dispersión, tabla y una lectura supervisada del copiloto antes de decidir.',
          resumen:
            'Centro de control logístico con mapa MapLibre de 12 corredores y 642 envíos agregados, tramos consolidados, flota simulada de muestra, vistas sincronizadas y lectura consultiva opcional del copiloto.',
          destinatario:
            'Equipos de logística, operaciones, abastecimiento y planeación de red que necesitan explorar exposición, propagación de una disrupción y compromisos entre puntualidad, demora y riesgo.',
          problema:
            'Cuando una red carretera se interrumpe, no basta con mirar una ruta: hay que entender qué corredores comparten tramos, cuántos envíos agregados pasan por ellos y cómo cambia su estado. Sumar los conteos de cada tramo como si fueran envíos únicos exagera la exposición y oculta los compromisos entre servicio y riesgo.',
          contribucion:
            'Diseñé una demo con un mapa MapLibre de carreteras OSM/OSRM, tramos consolidados por par de hubs, 12 corredores y 642 envíos ficticios agregados. Añadí una capa de flota simulada de 18 marcadores representativos, un diagrama Sankey por corredor y estado, una dispersión volumen–puntualidad, una tabla accesible sincronizada y un copiloto determinista con consulta consultiva opcional a OpenAI. Los filtros y escenarios recalculan todas las vistas con la misma regla.',
          fuentes:
            'Geografía base Natural Earth 1:50m, admin 0, dominio público (descarga del 16 nov 2026). Carreteras: OpenStreetMap, ODbL 1.0, ruteadas con OSRM perfil automóvil el 16 nov 2026; snapshot local en `data/roads.geojson`, sin tráfico en vivo ni validación de restricciones de carga pesada. Los 642 envíos, 12 corredores, estados, distancias, incidentes y camiones son un fixture sintético; no son datos de una empresa, telemetría ni operaciones observadas. INEGI y SICT se citan como fuentes para una integración posterior, no se usaron sus geometrías ni volúmenes.',
          metodo:
            'El mapa usa MapLibre GL JS 5.6.1 local con MapLibre WebGL y una base GeoJSON; no consulta tiles ni OSRM desde el navegador. Los 17 pares de hubs se consolidan una vez y su grosor representa la suma de envíos agregados de los corredores que los comparten; el color indica el estado dominante y los conteos por tramo se solapan entre rutas. La flota son 18 marcadores sintéticos representativos (no GPS), con capas separadas para mostrar/ocultar y pausar/reanudar. D3 dibuja el Sankey de los siete corredores principales, una dispersión volumen–puntualidad sin doble eje y la tabla. Los filtros de estado y los escenarios de cierre o demora recalculan mapa, KPIs, flujo, dispersión y tabla. El copiloto conserva una lectura por reglas; cuando se solicita una segunda opinión, la API envía al LLM solo el escenario visible y devuelve una recomendación consultiva, sin despachar ni alterar datos.',
          resultados:
            'La demo permite seleccionar corredores y tramos, abrir su ficha, revisar tramos compartidos y sus advertencias de solapamiento, filtrar por estado, aplicar escenarios de interrupción, mostrar u ocultar la flota, pausarla, inspeccionar una unidad virtual y comparar los volúmenes y estados en cuatro vistas sincronizadas. El zoom llega a 800%, se ancla al cursor y devuelve la rueda a la página al alcanzar los límites.',
          limitaciones:
            'Los envíos son agregados ficticios por corredor, no camiones únicos, viajes GPS, toneladas ni tráfico observado. Las carreteras provienen de un snapshot OSM/OSRM de perfil automóvil; no validan carga pesada, cierres activos, clima, seguridad ni capacidad de flota. Los camiones y sus posiciones son sintéticos y no representan telemetría. El copiloto determinista sigue disponible; la consulta opcional a OpenAI requiere la API del servidor y no se conecta a INEGI, SICT, un TMS o un ERP, no despacha y no persiste cambios. La demo no usa datos operativos reales.',
          tecnologias: ['MapLibre GL JS 5.6.1', 'D3.js 7.9.0', 'JavaScript', 'HTML/CSS', 'OpenStreetMap', 'OSRM', 'Natural Earth', 'WebGL'],
          tecnologiasGrupos: [
            { funcion: 'Mapa y geometrías', items: ['MapLibre GL JS 5.6.1', 'OpenStreetMap', 'OSRM', 'Natural Earth', 'WebGL'] },
            { funcion: 'Visualización y datos', items: ['D3.js 7.9.0', 'JavaScript', 'HTML/CSS'] }
          ],
          capturas: ['img/kilometro-cero-resumen.jpg'],
          captura: 'img/kilometro-cero-resumen.jpg',
          capturaAncho: 1600,
          capturaAlto: 1726,
          capturaRatio: '1600 / 1726',
          capturaAjuste: 'tablero',
          capturaAlt:
            'Portada de «Kilómetro Cero»: mapa MapLibre de México con carreteras y corredores de envío consolidados, hubs y terminales, flota simulada de muestra, panel de filtros y escenario de red, KPIs, Sankey por corredor y estado, dispersión volumen–puntualidad y tabla de corredores.',
          demoUrl: 'dashboards/kilometro-cero/index.html',
          codigoUrl: 'https://github.com/Dev-HugoAguilar/kilometro-cero-logistics',
          enlaces: [
            {
              texto: 'OpenStreetMap · copyright y licencia ODbL',
              url: 'https://www.openstreetmap.org/copyright'
            },
            {
              texto: 'MapLibre GL JS',
              url: 'https://maplibre.org/'
            },
            {
              texto: 'INEGI · Red Nacional de Caminos',
              url: 'https://www.inegi.org.mx/programas/rnc/'
            },
            {
              texto: 'INEGI · API de Ruteo',
              url: 'https://www.inegi.org.mx/servicios/Ruteo/'
            },
            {
              texto: 'SICT · Datos viales',
              url: 'https://www.datos.gob.mx/dataset/datos_viales'
            }
          ]
        },
        {
          id: 'dockmind',
          titulo: 'DockMind — Pronóstico de demanda y planificación de inventario con machine learning',
          estado: 'desarrollo',
          categoria: 'Operaciones',
          notaEstado:
            'Demo desplegada en el portafolio. El pronóstico, la simulación de inventario y la aprobación local siguen siendo deterministas; se puede solicitar una explicación consultiva opcional a OpenAI mediante la API del servidor.',
          descripcion:
            'Laboratorio que convierte pronósticos semanales en un plan de compras trazable. Compara modelos con validación temporal, simula faltantes y presupuesto, permite inspeccionar cada recepción y solicitar una explicación consultiva opcional a OpenAI.',
          resumen:
            'Laboratorio de pronóstico y planificación de inventario con 48 SKU sintéticos, cuatro modelos evaluados temporalmente y un plan de compras trazable en cinco pantallas. El valor está en evaluar y priorizar con evidencia, no en un ahorro demostrado.',
          destinatario:
            'Equipos de planeación de demanda, abastecimiento, inventario, finanzas y dirección de retail que necesitan evaluar modelos, priorizar faltantes y revisar el costo y el calendario de una propuesta de compra antes de aprobarla.',
          problema:
            'Un pronóstico semanal no sirve por sí solo si no se conecta con existencias, plazos, empaques y presupuesto. Sin una evaluación temporal y una regla de reposición explícita es fácil confundir una predicción con una orden, prometer servicio que el inventario no puede sostener o perder de vista qué productos explican la exposición.',
          contribucion:
            'Construí el pipeline Python reproducible que prepara 104 semanas sintéticas, entrena referencia estacional, Holt, Ridge y Random Forest multihorizonte, selecciona por validación temporal y evalúa después en test. Añadí intervalos empíricos de residuos, un simulador de reposición con presupuesto, empaque y plazos, y la aplicación D3 con cinco pantallas: Resumen, Demanda, Inventario, Compras y Modelos. El resultado hace trazable cada cálculo y cada recepción hasta sus SKU, sin presentar la heurística como un óptimo demostrado.',
          fuentes:
            'Catálogo sintético de 48 SKU, seis categorías, tres canales simulados y 104 semanas; los canales son etiquetas del fixture, no integraciones con Amazon, Mercado Libre ni Walmart. Benchmark público separado: 45 tiendas × 143 semanas de ventas históricas Walmart en USD, 2010-02-05 a 2012-10-26, reproducido desde GitHub; no es un feed actual, no tiene licencia comercial verificada y no alimenta el inventario sintético. Resultados, cortes, SHA-256 y procedencia en `research/model_report.json`.',
          metodo:
            'Python 3.12 y scikit-learn 1.8 entrenan modelos globales multihorizonte (1/4/8/12 semanas) con cortes temporales exclusivos; el ganador se elige por WAPE de validación y se evalúa una sola vez en test. Los cortes de 12 semanas se solapan y no son muestras independientes. Las bandas son cuantiles 10/90 de residuos de validación agrupados, con cobertura test publicada y sin garantía por SKU. El navegador no entrena: consume los resultados y simula inventario. Regla: recepciones al inicio, demanda durante la semana y nuevas órdenes al cierre; emisión al cierre de S1 + dos semanas completas = recepción al inicio de S4. Necesidad = demanda de la semana de recepción + colchón − stock proyectado al recibir, redondeada por empaque y limitada por presupuesto. Las ventas perdidas no se convierten en backlog.',
          resultados:
            'Cinco pantallas exclusivas con 48 SKU y selección persistente. Resumen: KPIs, cinco excepciones y catálogo filtrable. Demanda: histórico, pronóstico, banda, referencia estacional, tabla de 12 semanas, 48 pequeños múltiplos y ABC. Inventario: balance semanal, cobertura de 576 celdas y calendario de recepciones de 72 celdas con detalle. Compras: fórmula, cascada, alternativas capital-servicio, CSV y estrés de 120 simulaciones. Modelos: cuatro modelos, error por horizonte y cobertura test. Random Forest ganó en ambos conjuntos: WAPE test sintético 7.47% frente a 10.56% de la referencia; benchmark público 5.07% frente a 5.24%. Cobertura media 82.8% y 73.5%. Son resultados de backtest, no ahorro ni mejora de servicio demostrados.',
          limitaciones:
            'La operación es sintética: productos, existencias, precios, costos, plazos, empaques y canales no son datos de una empresa. El benchmark público es histórico, está en USD y se mantiene separado del inventario en unidades/MXN; no se usa para abastecer SKU. La reposición es una regla con presupuesto, no una optimización global ni una frontera óptima; la aprobación es local y no despacha compras. No modela caducidad, capacidad física, citas, comisiones, devoluciones, restricciones de proveedor ni inventario multicanal. Los escenarios de promoción, plazo y estrés son supuestos; el estrés no son probabilidades comerciales calibradas. La explicación LLM es opcional y consultiva: no recalcula pronósticos, modifica inventario ni crea órdenes. No hay integración con marketplace ni persistencia. El CSV público raw no se redistribuye.',
          tecnologias: ['Python', 'scikit-learn', 'pandas', 'NumPy', 'joblib', 'JavaScript', 'D3.js', 'HTML/CSS'],
          tecnologiasGrupos: [
            { funcion: 'Entrenamiento y datos', items: ['Python', 'scikit-learn', 'pandas', 'NumPy', 'joblib'] },
            { funcion: 'Interfaz y visualización', items: ['JavaScript', 'D3.js', 'HTML/CSS'] }
          ],
          capturas: ['img/dockmind-resumen.jpg'],
          captura: 'img/dockmind-resumen.jpg',
          capturaAncho: 1600,
          capturaAlto: 1726,
          capturaRatio: '1600 / 1726',
          capturaAjuste: 'tablero',
          capturaAlt:
            'Portada de «DockMind»: resumen de 48 SKU con KPIs de demanda, compras, ventas no cubiertas y servicio; salud del plan, cinco excepciones priorizadas, catálogo filtrable, navegación de cinco pantallas y controles de escenario, producto, política y presupuesto.',
          demoUrl: 'dashboards/dockmind/index.html',
          codigoUrl: 'https://github.com/Dev-HugoAguilar/dockmind-demand-planning',
          enlaces: [
            {
              texto: 'Benchmark público · Walmart.csv (GonzaloBP, GitHub)',
              url: 'https://github.com/GonzaloBP/Almacen-de-datos-Walmart/blob/main/Walmart.csv'
            },
            {
              texto: 'DataViz Inspiration · familias de visualización',
              url: 'https://www.dataviz-inspiration.com/'
            }
          ]
        },
        {
          problema: 'Al delegar un análisis en un asistente es difícil distinguir una respuesta basada en los datos de una basada en suposiciones; sin trazabilidad el analista no puede auditar la decisión.',
          contribucion: 'Alcance previsto, no implementado: definir el contrato de herramientas permitidas, el registro de cada decisión y la aprobación humana previa a cualquier acción. No hay asistente construido.',
          fuentes: 'Fuentes candidatas, ninguna integrada: los conjuntos de los demás proyectos del portafolio, usados como entorno de prueba. No hay datos propios ni fuente integrada.',
          metodo: 'Criterio previsto: cada propuesta cita la consulta y el resultado que la sustenta; las herramientas son de solo lectura y cualquier escritura requiere aprobación explícita. La calidad se evaluará con tareas reproducibles y respuesta conocida.',
          resultados: 'Caso definido; sin implementación ni evaluación publicadas. No se declaran capacidades evaluadas.',
          id: 'analista-asistido',
          resultados: 'No hay resultados: el caso está definido y pendiente de desarrollo. No se declaran capacidades ni evaluaciones ejecutadas.',
          titulo: 'Analista asistido por IA',
          estado: 'previsto',
          resumen: 'Caso previsto: un analista asistido que proponga el siguiente paso de un análisis y muestre la evidencia y los límites de su propuesta antes de ejecutar nada.',
          categoria: 'Agentes',
          descripcion: 'Consultar datos, ejecutar cálculos, generar una visualización y preparar un informe que una persona revisa antes de usarlo.',
          destinatario: 'Pensado para equipos de análisis que quieren automatizar el trabajo repetitivo sin perder el control del resultado.',
          problema: 'Al delegar un análisis en un asistente es difícil distinguir una respuesta basada en los datos de una basada en suposiciones; sin trazabilidad el analista no puede auditar la decisión.',
          contribucion: 'Alcance previsto, no implementado: definir el contrato de herramientas permitidas, el registro de cada decisión y la aprobación humana previa a cualquier acción. No hay asistente construido.',
          fuentes: 'Fuentes candidatas, ninguna integrada: los conjuntos de los demás proyectos del portafolio como entorno de prueba. No hay datos propios ni fuente integrada.',
          metodo: 'Criterio previsto: cada propuesta cita la consulta y el resultado que la sustenta; las herramientas son de solo lectura y cualquier escritura requiere aprobación explícita. La calidad se evaluará con tareas reproducibles y respuesta conocida.',
          resultados: 'Caso definido; sin implementación ni evaluación publicadas. No se declaran capacidades evaluadas.',
          limitaciones: 'Caso previsto: no existe implementación ni evaluación. Un asistente que propone no demuestra que acierte; la evaluación futura deberá medir acierto, abstención y coste, y declarar qué herramientas puede usar.',
          tecnologias: ['Python', 'APIs', 'Herramientas', 'Validación'],
          capturas: [],
          demoUrl: null,
          codigoUrl: null,
          enlaces: []
        }
      ]
    }
  ]
};













