/** Explicit no-publication fixtures from the four frontend API contracts.
 * Test-only: no recursive mutation of payloads, no fabricated business data. */
const periodo = { desde: null, hasta: null };
const motivo = 'Fixture de prueba: no hay una versión publicada.';
const noData = { datos_disponibles: false, version: null, motivo };
const acceso = { disponible: false, motivo, remedio: [] };
const fuente = { conjunto: 'fixture-vacia', documentacion: '', esquema: '', licencia: '', condicion: 'solo pruebas', periodo_documentado: periodo };
const routes = {
 'cnbv/banca-multiple/catalogo': {
  fuente: { dataset_id:'fixture',nombre:'Fixture vacía',organismo:'Pruebas',portal:'',pagina_estadistica:'',sector:'',sector_nombre:'',url_base_archivos:'',patron_archivo:'',moneda:'MXN',unidad_saldos:'millones_mxn',unidad_indicadores:'porcentaje',atribucion:'',condiciones_uso:[],advertencias_metrica:[],es_sintetico:true,periodos_verificados:[],periodos_por_omision:[] },
  boletines:[],periodos:[],conceptos:[],instituciones:[],indicadores:[],advertencias:[motivo],
  cobertura:{dataset_id:'fixture',periodos_importados:0,periodo_min:null,periodo_max:null,hechos:0,filas_originales:0,indicadores:0,fuente:'fixture',tipos_cartera:[],concepto_por_omision:'',conceptos_destacados:[]}},
 'atlas-vial/catalogo': {
  fuente:{conjunto:'fixture',titulo:'Fixture vacía',portal:'',licencia:'',notas:motivo,catalogo_modificado:null,version:'fixture',ultima_sincronizacion:null,periodo:null,recursos:{}},
  cobertura:{hechos:0,personas_lesionadas:0,personas_fallecidas:0,hechos_con_fallecimientos:0,con_coordenadas:0,sin_coordenadas:0,fuera_de_cdmx:0,con_sexo:0,con_edad:0,con_tipo_usuario:0,con_vehiculo:0,sin_fecha:0,sin_hora:0,coordenadas:null,avisos:[]},
  filtros:{alcaldias:[],tipos_evento:[],vialidades:[],tipos_usuario:[],tipos_vehiculo:[],sexos:[],intersecciones:[],consecuencias:[],semaforizada:[],grupos_edad:[],periodo:{...periodo,consulta_desde:null,consulta_hasta:null}},avisos:[motivo],
  metodologia:{fuente:{conjunto:'fixture',portal:'',autoridad:'',licencia:'',geometria:{}},fechas:{},granularidad:{},metricas:{},tratamiento:{},limitaciones:[]}},
 'atlas-vial/geometria':{type:'FeatureCollection',features:[],extension:null,atribucion:{conjunto:'fixture',portal:'',licencia:'',version:'fixture',catalogo_modificado:'',recurso_modificado:''}},
 'marketing/estado':{...noData,ultima_sincronizacion:null,periodo,cifras:null,capacidades:null,fuente,acceso_bigquery:acceso,ultimo_intento:null},
 'marketing/catalogo':{...noData,fuente,acceso_bigquery:acceso,periodo,filtros:{canales:[],dispositivos:[],paises:[],periodo},capacidades:{},dias_observados:0,definiciones:{},avisos:[]},
 'marketing/resumen':{...noData,indicadores:null,serie:[],comparacion:null,periodo:{...periodo,documentado:periodo},filtros_activos:[],avisos:[]},
 'marketing/conversion':{...noData,pasos:[],por_canal:[],avisos:[]},
 'marketing/cohortes':{...noData,cohortes:[],semanas:[],celdas:[],curvas:[],avisos:[]},
 'marketing/productos':{...noData,articulos:[],categorias:[],afinidad:null,avisos:[]},
 'marketing/adquisicion':{...noData,canales:[],totales:null,detalle:null},
 'marketing/tabla':{...noData,filas:[],total:0,pagina:1,tamano:25,paginas:0},
 'walmex/estado':{...noData,notas:[motivo]},
 'walmex/catalogo':{...noData,version:'fixture',indicadores:[],mercados:[],periodos:[],combinaciones:[],ultimo_periodo:null,cobertura:null,notas:[],alcance:{unidad_importes:'millones_mxn',unidad_variaciones:'porcentaje',detalle:motivo}},
 'walmex/resumen':{...noData,periodo_seleccionado:'',periodos:[],mercados:[],indicadores:[],series:[],consistencia:[],definiciones:{},notas:[],avisos:[]},
 'walmex/motores':{...noData,unidad:'porcentaje',paneles:[],definicion:'',advertencia:motivo,notas:[],avisos:[]},
 'walmex/desempeno':{...noData,indicador:'mismas_tiendas',etiqueta:'',unidad:'porcentaje',base:null,bases:[],periodos:[],filas:[],periodo_ranking:null,ranking:[],divergente:false,notas:[],avisos:[]},
 'walmex/matriz':{...noData,periodos:[],mercados:[],indicadores:[],celdas:[],notas:[],avisos:[]},
 'walmex/fuentes':{...noData,fuentes:[],periodos:[]},
 // Telemetría anónima: contadores en cero, el pie del sitio permanece oculto.
 'visitas':{visitas_totales:0,visitantes_unicos:0,top_proyectos:[]},
 'visitas/registrar':{visitas_totales:0,visitantes_unicos:0,contabilizada:false},
 'visitas/proyecto':{ok:true,proyecto_id:'fixture',vistas_proyecto:0}
};
export function emptyApi(url) { const key=new URL(url).pathname.split('/api/v1/')[1]; return Object.hasOwn(routes,key)?structuredClone(routes[key]):null; }
export const fixturePaths=Object.freeze(Object.keys(routes));
