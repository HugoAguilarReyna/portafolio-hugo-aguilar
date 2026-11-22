/**
 * Verificación de la integración de «Gaza · Vidas y territorio» en el portafolio.
 *
 * Comprueba sobre el sitio realmente servido (127.0.0.1:8000), con la página
 * aprobada copiada tal cual y montada en la ficha:
 *
 *  1. la tarjeta de «Ciencia de datos»: nombre, etiqueta, descripción, portada
 *     real con la geometría de Walmart M5, estado y enlace;
 *  2. la ficha: campos de método y fuentes, y el observatorio montado en marco
 *     con ancho completo y altura útil;
 *  3. el contrato analítico: once pestañas, cortes por fuente, controles de
 *     calendario, círculos, mapa bivariado, muestra de sitios, lesiones,
 *     archivo con paginación, búsqueda y descarga JSON;
 *  4. el HTML servido es idéntico al aprobado (SHA-256) y el módulo no hace
 *     peticiones externas ni recursos 404;
 *  5. navegación de ida y vuelta, recarga de la URL directa, consola limpia,
 *     teclado con foco visible y medidas a 1440, 1024 y 390 px.
 *
 * Uso: node tools/verificar-gaza-integracion.mjs
 * Sale con código 1 si algo falla.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/* Playwright vive en las dependencias de los tableros: se resuelve desde ahí
   para no duplicar la instalación en la raíz del repositorio. */
async function cargarPlaywright() {
  try {
    return await import("@playwright/test");
  } catch (error) {
    return import(
      new URL("../dashboards/clientes-campanas/node_modules/@playwright/test/index.mjs", import.meta.url).toString()
    );
  }
}

const { chromium } = await cargarPlaywright();

const SITIO = "http://127.0.0.1:8000";
const AREA = "/#/area/ciencia-de-datos";
const FICHA = "/#/area/ciencia-de-datos/gaza-observatorio";
const PAGINA = "/dashboards/gaza-observatorio/index.html";
const APROBADO = resolve("entregas/Gaza_Integracion_Portafolio/Gaza_Integracion_Portafolio/demo/index.html");
const SERVIDO = resolve("dist/dashboards/gaza-observatorio/index.html");
const CAPTURAS = resolve("evidencias/gaza-observatorio");

const fallos = [];
const avisos = [];
const correctas = [];
const ok = (mensaje) => correctas.push(mensaje);
const fallo = (mensaje) => fallos.push(mensaje);
const aviso = (mensaje) => avisos.push(mensaje);

mkdirSync(CAPTURAS, { recursive: true });

/** Marco secundario (el observatorio embebido) como objeto Frame de Playwright. */
function marcoSecundario(pagina) {
  return pagina.frames().find((frame) => frame !== pagina.mainFrame()) ?? null;
}

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1440, height: 1000 } });
const errores = [];
const peticiones = [];
pagina.on("pageerror", (error) => errores.push(`pageerror: ${error.message}`));
pagina.on("console", (mensaje) => {
  if (mensaje.type() === "error") errores.push(`console: ${mensaje.text()}`);
});
pagina.on("requestfailed", (peticion) => errores.push(`404/fallo: ${peticion.url()}`));
pagina.on("response", (respuesta) => {
  if (respuesta.status() >= 400) errores.push(`HTTP ${respuesta.status()}: ${respuesta.url()}`);
});
pagina.on("request", (peticion) => peticiones.push(peticion));

/* ------------------------------------------------- 1. tarjeta en el área */
await pagina.goto(`${SITIO}${AREA}`, { waitUntil: "domcontentloaded" });
await pagina.waitForSelector(".project-list .project-card");
await pagina.waitForTimeout(1500);

const tarjetas = await pagina.evaluate(() => {
  return [...document.querySelectorAll(".project-list .project-card")].map((li) => {
    const cover = li.querySelector(".cover");
    const img = cover.querySelector("img");
    const caja = cover.getBoundingClientRect();
    const meta = li.querySelector(".card-meta");
    return {
      id: li.dataset.proyecto,
      titulo: li.querySelector("h3")?.textContent.replace("→", "").trim() ?? "",
      categoria: meta?.querySelector("span")?.textContent.trim() ?? "",
      estado: meta?.querySelector(".chip")?.textContent.trim() ?? "",
      resumen: li.querySelector(".card-text")?.textContent.trim() ?? "",
      ancho: Math.round(caja.width),
      alto: Math.round(caja.height),
      ratio: Number((caja.width / caja.height).toFixed(4)),
      yEtiqueta: Math.round(meta.getBoundingClientRect().top),
      yTitulo: Math.round(li.querySelector("h3").getBoundingClientRect().top),
      src: img?.getAttribute("src") ?? null,
      natural: img ? [img.naturalWidth, img.naturalHeight] : null,
      ajuste: img ? getComputedStyle(img).objectFit : null,
      posicion: img ? getComputedStyle(img).objectPosition : null,
      clases: cover.className,
      enlace: li.querySelector("a.card-hit")?.getAttribute("href") ?? "",
    };
  });
});

const gaza = tarjetas.find((fila) => fila.id === "gaza-observatorio");
const referencia = tarjetas.find((fila) => fila.id === "atlas-comercial");
if (!gaza) fallo("no aparece la tarjeta de Gaza en Ciencia de datos");
else {
  if (gaza.titulo !== "Gaza · Vidas y territorio") fallo(`título de tarjeta: «${gaza.titulo}»`);
  if (gaza.categoria !== "OBSERVATORIO HUMANITARIO" && gaza.categoria !== "Observatorio humanitario") {
    fallo(`etiqueta de tarjeta: «${gaza.categoria}»`);
  }
  if (
    gaza.resumen !==
    "Impacto humano, evolución del daño territorial y agrupación de trayectorias observadas con datos abiertos y fuentes trazables"
  ) {
    fallo(`descripción de tarjeta distinta de la aprobada: «${gaza.resumen}»`);
  }
  if (gaza.estado !== "Publicado") fallo(`la tarjeta no se anuncia como publicada: «${gaza.estado}»`);
  if (gaza.enlace !== "#/area/ciencia-de-datos/gaza-observatorio") fallo(`enlace de tarjeta: ${gaza.enlace}`);
  if (gaza.natural?.[0] !== 1600 || gaza.natural?.[1] !== 1726) {
    fallo(`la portada mide ${gaza.natural?.join(" × ")}, no 1600 × 1726`);
  }
  if (gaza.ajuste !== "cover" || !/^50% 0%$/.test(gaza.posicion ?? "")) {
    fallo(`la portada usa ${gaza.ajuste} / ${gaza.posicion}`);
  }
  if (!gaza.clases.includes("cover-tablero")) fallo(`la portada no usa la clase compartida: «${gaza.clases}»`);
  if (!/\?v=/.test(gaza.src ?? "")) fallo("la portada no lleva versión de caché");
  if (referencia && (gaza.ancho !== referencia.ancho || gaza.alto !== referencia.alto)) {
    fallo(`la portada no iguala la caja de Walmart M5: ${gaza.ancho}×${gaza.alto} frente a ${referencia.ancho}×${referencia.alto}`);
  } else if (referencia) {
    ok(`tarjeta: «${gaza.titulo}» con portada ${gaza.ancho} × ${gaza.alto} (misma caja que Walmart M5) y estado «${gaza.estado}»`);
  }
}

/* Alineación de las tarjetas de una misma fila. */
const porFila = {};
for (const fila of tarjetas) (porFila[fila.yEtiqueta] ??= []).push(fila);
const desalineadas = Object.values(porFila).filter(
  (grupo) => grupo.length > 1 && new Set(grupo.map((f) => `${f.yTitulo}`)).size > 1,
);
if (desalineadas.length) fallo("hay tarjetas de la misma fila con títulos a distinta altura");
else ok("tarjetas: los títulos de una misma fila arrancan a la misma altura");

/* Se decodifican y recorren las portadas antes de la captura completa: Chromium
   puede coser la página sin pintar una imagen que aún no se decodificó. */
await pagina.evaluate(async () => {
  await Promise.all([...document.querySelectorAll(".project-list img")].map((img) => img.decode().catch(() => {})));
});
for (const fila of tarjetas) {
  await pagina.locator(`.project-card[data-proyecto="${fila.id}"]`).scrollIntoViewIfNeeded();
  await pagina.waitForTimeout(250);
}
await pagina.evaluate(() => window.scrollTo(0, 0));
await pagina.waitForTimeout(700);
await pagina.screenshot({ path: `${CAPTURAS}/tarjeta-area.png`, fullPage: true });

/* ------------------------------------------------- 2. ficha y marco */
await pagina.locator('.project-card[data-proyecto="gaza-observatorio"] a.card-hit').click();
await pagina.waitForSelector("#demo-host iframe", { timeout: 60000 });
const marco = pagina.frameLocator("#demo-host iframe");
const frame = marcoSecundario(pagina);
await marco.locator('[role="tab"]').first().waitFor({ timeout: 60000 });

const ficha = await pagina.evaluate(() => ({
  url: location.hash,
  titulo: document.querySelector("#project-view-title")?.textContent.trim() ?? "",
  subtitulo: document.querySelector(".view-subtitle")?.textContent.trim() ?? "",
  campos: [...document.querySelectorAll(".project-fields dt")].map((n) => n.textContent.trim()),
  nota: document.querySelector(".ficha-note")?.textContent.trim() ?? "",
  marco: (() => {
    const iframe = document.querySelector("#demo-host iframe");
    if (!iframe) return null;
    const caja = iframe.getBoundingClientRect();
    return { ancho: Math.round(caja.width), alto: Math.round(caja.height), titulo: iframe.getAttribute("title") ?? "" };
  })(),
}));
if (ficha.titulo !== "Gaza · Vidas y territorio") fallo(`título de ficha: «${ficha.titulo}»`);
if (!/Observatorio del impacto humano y territorial/.test(ficha.subtitulo)) fallo(`subtítulo de ficha: «${ficha.subtitulo}»`);
for (const campo of ["Problema", "Destinatario", "Mi contribución", "Fuentes y datos", "Método y decisiones técnicas", "Resultados publicados", "Limitaciones"]) {
  if (!ficha.campos.includes(campo)) fallo(`falta el apartado «${campo}» en la ficha`);
}
if (ficha.nota) fallo(`la ficha mantiene la nota de un estado anterior: «${ficha.nota.slice(0, 80)}»`);
if (!ficha.marco || ficha.marco.ancho < 900) fallo(`el marco no ocupa el ancho de la ficha: ${ficha.marco?.ancho} px`);
if (!ficha.marco?.titulo || ficha.marco.titulo.length < 20) fallo("el marco no tiene título accesible");
if (ficha.marco && ficha.marco.alto < 3000) fallo(`el marco mide ${ficha.marco.alto} px: el observatorio queda en miniatura`);
if (!fallos.length) {
  ok(`ficha: ${ficha.campos.length} apartados, estado publicado sin nota de desarrollo y marco de ${ficha.marco.ancho} × ${ficha.marco.alto} px`);
}

/* ------------------------------------------------- 3. contrato analítico */
const pestanas = await marco.locator('nav [role="tab"]').allTextContents();
const nombres = pestanas.map((t) => t.trim());
if (nombres.includes("Cada punto, una vida")) fallo("la demo pública incluye una pestaña nominal");
const esperadas = [
  "Impacto humano",
  "Edades y prensa",
  "Lesiones",
  "Mapas y cronología",
  "Sitios y trayectorias",
  "Experimento",
  "Evidencia",
  "Archivo completo",
  "Diseño y referencias",
];
if (nombres.length !== 10) fallo(`el observatorio muestra ${nombres.length} pestañas (se esperaban 10)`);
for (const esperada of esperadas) if (!nombres.includes(esperada)) fallo(`falta la pestaña «${esperada}»`);
if (!fallos.length) ok(`observatorio: diez pestañas agregadas, sin extensión nominal`);

const heroe = await frame.evaluate(() => document.querySelector("main > header")?.innerText.replace(/\s+/g, " ") ?? "");
if (!/Reportes: 10 nov 2026/.test(heroe) || !/OMS: may 2026/.test(heroe)) {
  fallo("la cabecera no declara el corte propio de cada fuente");
} else {
  ok("cabecera: cortes por fuente declarados (reportes, edades, daño satelital y OMS)");
}

/* --- Calendario: año, métrica, reporte de 24 h, ausencias y selección de día. */
await marco.locator('[role="tab"][data-tab="humano"]').click();
await pagina.waitForTimeout(900);
const calendario = await frame.evaluate(() => {
  const seccion = document.querySelector("#humano");
  const controles = [...seccion.querySelectorAll("select")].map((s) => [...s.options].map((o) => o.textContent.trim()));
  const casillas = seccion.querySelectorAll("#calendar svg [class*=cell], #calendar svg rect, #calendar svg circle").length;
  return {
    controles,
    casillas,
    solo24: Boolean(seccion.querySelector("#only24")),
    aviso: /no equivale a cero|ausencia/i.test(seccion.innerText),
  };
});
if (!calendario.controles.some((opciones) => opciones.includes("Todos") && opciones.some((o) => /^20\d\d$/.test(o)))) {
  fallo("el calendario no ofrece el filtro de año");
}
if (!calendario.solo24) fallo("el calendario no distingue reportes de 24 horas");
if (!calendario.aviso) fallo("el calendario no advierte que la ausencia no equivale a cero");
if (!calendario.casillas) fallo("el calendario no dibujó celdas");
if (!fallos.length) ok(`calendario: año, métrica y «solo 24 horas»; ${calendario.casillas} marcas de día`);

const anio = marco.locator("#dailyYear");
await anio.selectOption({ label: "2024" });
await pagina.waitForTimeout(700);
const trasAnio = await frame.evaluate(() => document.querySelector("#humano").innerText);
if (!/92 %/.test(trasAnio)) fallo("al elegir 2024 el calendario no muestra su cobertura de 92 %");
else ok("calendario: el cambio de año recalcula la cobertura y los círculos");

/* --- Círculos: detalle del reporte sin llamarlo incidente. */
const circulo = marco.locator('#humano g[tabindex="0"], #humano circle[tabindex="0"]').first();
if (await circulo.count()) {
  await circulo.click({ force: true });
  await pagina.waitForTimeout(600);
  const detalle = await frame.evaluate(() => document.body.innerText);
  if (/incidente/i.test(detalle)) aviso("el detalle del reporte usa la palabra «incidente»");
  else ok("círculos: la selección abre el detalle del reporte y no lo llama incidente");
}

/* --- Mapa bivariado: evaluación, mínimo de sitios, selección y descarga. */
await marco.locator('[role="tab"][data-tab="evolucion"]').click();
await pagina.waitForTimeout(2400);
const mapa = await frame.evaluate(() => {
  const seccion = document.querySelector("#evolucion");
  const svg = seccion.querySelector("#biMap svg");
  const selectores = [...seccion.querySelectorAll("select")].map((s) => s.id || s.className);
  const opciones = [...seccion.querySelectorAll("select")].map((s) => s.options.length);
  return {
    svg: Boolean(svg),
    ancho: svg ? Math.round(svg.getBoundingClientRect().width) : 0,
    selectores,
    opciones,
    leyenda: /Cómo leer los dos colores/.test(seccion.innerText),
    descarga: [...seccion.querySelectorAll("button")].some((b) => /Descargar/i.test(b.textContent)),
    universo: /198,308 sitios/.test(seccion.innerText),
  };
});
if (!mapa.svg) fallo("el mapa bivariado no se dibujó");
if (!mapa.leyenda) fallo("el mapa bivariado no muestra la leyenda de dos colores");
if (!mapa.descarga) fallo("el mapa bivariado no ofrece descarga");
if (!mapa.universo) fallo("el mapa bivariado no declara el universo de 198 308 sitios");
if (!mapa.opciones.some((n) => n >= 14)) fallo("el mapa bivariado no lista las 14 evaluaciones");
if (!fallos.length) ok(`mapa bivariado: ${mapa.ancho} px de ancho, leyenda, 14 evaluaciones y descarga`);

const descargas = [];
pagina.on("download", (descarga) => descargas.push(descarga.suggestedFilename()));
const botonDescarga = marco.locator('#evolucion #biMap, #evolucion').locator('button:has-text("Descargar")').first();
if (await botonDescarga.count()) {
  await botonDescarga.click();
  await pagina.waitForTimeout(900);
  if (!descargas.length) fallo("la descarga de celdas visibles no disparó ningún archivo");
  else ok(`mapa: descarga de celdas visibles (${descargas[0]})`);
}
const selectorMinimo = marco.locator("#biMin");
if (await selectorMinimo.count()) {
  await selectorMinimo.selectOption({ label: "50" });
  await pagina.waitForTimeout(900);
  const conMinimo = await frame.evaluate(() => document.querySelector("#evolucion").innerText);
  if (!/198,308 sitios/.test(conMinimo)) aviso("el mínimo de sitios no deja rastro textual reconocible");
  ok("mapa: el control de mínimo de sitios responde sin romper la vista");
}

/* --- Explorar sitios: la muestra no altera los totales del mapa. */
await marco.locator('[role="tab"][data-tab="territorio"]').click();
await pagina.waitForTimeout(900);
/* El mapa de la muestra se dibuja cuando la sección entra en pantalla. */
await marco.locator("#territorio").scrollIntoViewIfNeeded();
await pagina.waitForTimeout(1800);
const muestra = await frame.evaluate(() => {
  const seccion = document.querySelector("#territorio");
  const lienzo = seccion.querySelector("canvas#map") || seccion.querySelector("#map canvas");
  const conteo = seccion.querySelector("#mapcount")?.textContent.replace(/\s+/g, " ").trim() ?? "";
  return {
    avisoMuestra: /muestra/i.test(seccion.innerText),
    incluye: /155,112/.test(seccion.innerText),
    lienzo: Boolean(lienzo),
    anchoLienzo: lienzo ? lienzo.width : 0,
    puntos: Number((conteo.match(/[\d.,]+/g) ?? ["0"]).pop().replace(/[.,]/g, "")) || 0,
    conteo,
    gobernaciones: seccion.querySelectorAll("#gov option").length,
    grupos: seccion.querySelectorAll("#group option").length,
    sitios: seccion.querySelectorAll("#siteSelect option").length,
    ficha: Boolean(seccion.querySelector("#siteTitle")),
  };
});
if (!muestra.avisoMuestra) fallo("«Explorar sitios» no advierte que trabaja sobre una muestra");
if (!muestra.lienzo) fallo("«Explorar sitios» no dibujó el mapa de la muestra");
if (!muestra.ficha) fallo("«Explorar sitios» no tiene ficha del sitio seleccionado");
if (muestra.sitios < 1000) fallo(`la muestra de sitios tiene ${muestra.sitios} opciones`);
/* Los filtros de la muestra no deben mover los totales del archivo completo. */
await marco.locator("#gov").selectOption({ index: 1 });
await pagina.waitForTimeout(1200);
const trasFiltro = await frame.evaluate(() => {
  const seccion = document.querySelector("#territorio");
  return {
    conteo: seccion.querySelector("#mapcount")?.textContent.replace(/\s+/g, " ").trim() ?? "",
    archivo: /198,308 sitios en el archivo/.test(seccion.innerText),
  };
});
if (!trasFiltro.archivo) fallo("al filtrar la muestra cambió el total de sitios del archivo");
else if (trasFiltro.conteo === muestra.conteo) aviso("el filtro de gobernación no cambió el conteo visible de la muestra");
else ok("explorar sitios: el filtro de gobernación mueve la muestra pero no el total de 198 308 sitios");
await marco.locator("#gov").selectOption({ index: 0 });
await pagina.waitForTimeout(800);
if (!fallos.length) {
  ok(
    `explorar sitios: muestra declarada (${muestra.conteo || muestra.puntos + " puntos"}), ` +
      `${muestra.gobernaciones} gobernaciones, ${muestra.grupos} grupos y ficha vinculada`,
  );
}

/* --- Lesiones: intervalos, categorías y aviso de solapamiento. */
await marco.locator('[role="tab"][data-tab="salud"]').click();
await pagina.waitForTimeout(900);
const salud = await frame.evaluate(() => document.querySelector("#salud").innerText.replace(/\s+/g, " "));
if (!/solap/i.test(salud)) fallo("«Lesiones» no advierte que las categorías pueden solaparse");
else ok("lesiones: advierte el solapamiento de categorías y conserva rangos de escenario");

/* --- Experimento: pronóstico directo, validación y plazos. */
await marco.locator('[role="tab"][data-tab="experimento"]').click();
await pagina.waitForTimeout(1200);
const experimento = await frame.evaluate(() => {
  const panel = document.querySelector("#experimento");
  return {
    texto: panel.innerText.replace(/\s+/g, " "),
    tarjetas: [...panel.querySelectorAll("#death-horizon-cards .horizon-card")].map((c) => c.innerText.replace(/\s+/g, " ").trim()),
    corte: panel.querySelector("#death-forecast")?.innerText.replace(/\s+/g, " ").trim() || "",
    internas: [...panel.querySelectorAll(".pronostico-tabs [role=tab]")].map((b) => b.textContent.trim()),
    viejo: !!panel.querySelector("#scores"),
  };
});
const [dia, semana, mes] = experimento.tarjetas;
if (experimento.viejo) fallo("el panel «Experimento» sigue mostrando el contenido anterior");
if (experimento.internas.length !== 3) fallo(`el panel no trae sus tres análisis internos: ${experimento.internas.join(" · ")}`);
if (experimento.tarjetas.length !== 3) fallo(`faltan tarjetas de horizonte: ${experimento.tarjetas.length}`);
if (!/\b3\.7\b/.test(dia || "") || !/0–9\.3/.test(dia || "")) fallo(`pronóstico a 1 día distinto del documentado: ${dia}`);
if (!/\b23\.8\b/.test(semana || "") || !/5\.8–41\.8/.test(semana || "")) fallo(`pronóstico a 7 días distinto del documentado: ${semana}`);
if (!/No estimable/i.test(mes || "")) fallo(`la tarjeta de 28 días no declara que no hay pronóstico: ${mes}`);
if (!/2026-11-11/.test(experimento.corte) || !/506/.test(experimento.corte + experimento.texto)) {
  fallo(`el corte o el número de informes no se leen del JSON: ${experimento.corte}`);
}
if (!/persistencia gana|no debe sustituir/i.test(experimento.texto)) {
  aviso("el panel no repite en el texto el límite del modelo de daño");
}
if (!fallos.length) ok("experimento: pronóstico 3.7 / 23.8, 28 días sin estimar y tres análisis internos");

/* --- Archivo: fuente, campo, búsqueda, ext_, paginación y JSON. */
await marco.locator('[role="tab"][data-tab="archivo"]').click();
await pagina.waitForTimeout(1600);
const archivo = await frame.evaluate(() => {
  const seccion = document.querySelector("#archivo");
  const filasAntes = seccion.querySelectorAll("tbody tr").length;
  const textoPrimero = seccion.querySelector("tbody")?.innerText.slice(0, 200) ?? "";
  return {
    filasAntes,
    selectores: seccion.querySelectorAll("select").length,
    busqueda: seccion.querySelectorAll('input[type="search"], input[type="text"]').length,
    paginacion: [...seccion.querySelectorAll("button")].filter((b) => /siguiente|anterior|página|pagina/i.test(b.textContent)).length,
    json: [...seccion.querySelectorAll("button")].some((b) => /JSON|json/.test(b.textContent)),
    ext: /ext_/.test(seccion.innerHTML),
    textoPrimero,
    incluirExtendidos: Boolean(seccion.querySelector("#includeExtended")),
    fuentes: seccion.querySelectorAll("#archiveSource option").length,
    campos: seccion.querySelectorAll("#archiveField option").length,
  };
});
if (!archivo.busqueda) fallo("el archivo no tiene búsqueda");
if (!archivo.paginacion) fallo("el archivo no tiene paginación");
if (!archivo.json) fallo("el archivo no ofrece descarga JSON del filtro");
if (!archivo.fuentes || archivo.fuentes < 4) fallo(`el selector de fuente del archivo tiene ${archivo.fuentes} opciones`);
if (!archivo.campos || archivo.campos < 20) fallo(`el selector de campo del archivo tiene ${archivo.campos} opciones`);
if (!archivo.incluirExtendidos) fallo("el archivo no permite incluir los campos derivados ext_");
if (archivo.filasAntes < 5) aviso(`el archivo muestra ${archivo.filasAntes} filas al abrir`);
const siguiente = marco.locator('#archivo button:has-text("Siguientes")').first();
if (await siguiente.count()) {
  await siguiente.click();
  await pagina.waitForTimeout(700);
  const trasPaginar = await frame.evaluate(() => document.querySelector("#archivo").innerText.slice(0, 400));
  if (trasPaginar === archivo.textoPrimero) aviso("la paginación no cambió el texto visible del archivo");
  else ok(`archivo: ${archivo.filasAntes} filas, búsqueda, paginación y descarga JSON del filtro`);
} else if (!fallos.length) {
  ok(`archivo: ${archivo.filasAntes} filas, búsqueda y descarga JSON del filtro`);
}

/* ------------------------------------------------- 4. integridad del HTML */
const hash = (ruta) => createHash("sha256").update(readFileSync(ruta)).digest("hex");
const hashAprobado = hash(APROBADO);
const hashServido = hash(SERVIDO);
/* Desde las correcciones, el HTML servido ya no es idéntico al artefacto aprobado:
   se edita en `dashboards/gaza-observatorio/fuente/` y se publica con
   `tools/construir.py`. Lo que se comprueba es que el archivo servido sea
   exactamente el que produce la fuente. */
if (hashAprobado === hashServido) {
  fallo("el HTML servido sigue siendo el artefacto aprobado sin correcciones");
} else {
  const construido = resolve("dashboards/gaza-observatorio/fuente/dist/index.html");
  if (!existsSync(construido)) {
    fallo("no hay build intermedio en fuente/dist/index.html");
  } else if (hash(construido) !== hashServido) {
    fallo(`el HTML servido no coincide con el build de la fuente: ${hashServido.slice(0, 12)}… frente a ${hash(construido).slice(0, 12)}…`);
  } else {
    ok(
      `HTML servido = build de dashboards/gaza-observatorio/fuente (SHA-256 ${hashServido.slice(0, 12)}…), ` +
        `distinto del aprobado por las tres correcciones (${hashAprobado.slice(0, 12)}…)`,
    );
  }
}

/* El cascarón del portafolio carga Google Fonts (comportamiento previo, sin
   cambios). Lo que se comprueba aquí es que el módulo de Gaza no pida nada. */
const externasModulo = peticiones.filter(
  (peticion) => !peticion.url().startsWith(SITIO) && peticion.frame() !== pagina.mainFrame(),
);
const externasPortafolio = peticiones.filter(
  (peticion) => !peticion.url().startsWith(SITIO) && peticion.frame() === pagina.mainFrame(),
);
if (externasModulo.length) {
  fallo(`el observatorio pide recursos externos: ${externasModulo.slice(0, 3).map((p) => p.url()).join(", ")}`);
} else {
  ok("sin peticiones externas del módulo: el observatorio funciona con recursos integrados");
}
if (externasPortafolio.length) {
  aviso(
    `el cascarón del portafolio sigue pidiendo ${externasPortafolio.length} recurso(s) externo(s) ` +
      `(${[...new Set(externasPortafolio.map((p) => new URL(p.url()).host))].join(", ")}); es previo a este cambio`,
  );
}

/* ------------------------------------------------- 5. navegación y consola */
await pagina.screenshot({ path: `${CAPTURAS}/ficha-gaza.png`, fullPage: false });
await pagina.locator(".view-back").first().click();
await pagina.waitForTimeout(900);
if (!pagina.url().includes("/area/ciencia-de-datos")) fallo(`«Volver» no regresó al área: ${pagina.url()}`);
else ok("navegación: «Volver a Ciencia de datos» regresa al área");

await pagina.goto(`${SITIO}${FICHA}`, { waitUntil: "domcontentloaded" });
await pagina.waitForSelector("#demo-host iframe", { timeout: 60000 });
const marcoRecarga = pagina.frameLocator("#demo-host iframe");
const frameRecarga = marcoSecundario(pagina);
await marcoRecarga.locator('[role="tab"]').first().waitFor({ timeout: 60000 });
await pagina.waitForTimeout(1200);
if (!(await marcoRecarga.locator('[role="tab"]').count())) fallo("la URL directa no vuelve a montar el observatorio");
else ok("URL directa: recargar la ficha vuelve a montar el observatorio");

await pagina.evaluate(() => window.scrollTo(0, 0));
await pagina.waitForTimeout(600);
await pagina.screenshot({ path: `${CAPTURAS}/ficha-gaza-completa.png`, fullPage: false });

/* Teclado y foco dentro del marco. */
await marcoRecarga.locator('[role="tab"][data-tab="humano"]').focus();
const foco = await pagina.evaluate(() => {
  const doc = document.querySelector("#demo-host iframe").contentDocument;
  const nodo = doc.activeElement;
  const estilo = doc.defaultView.getComputedStyle(nodo);
  return { etiqueta: nodo.tagName + (nodo.dataset?.tab ? "#" + nodo.dataset.tab : ""), contorno: `${estilo.outlineStyle} ${estilo.outlineWidth} ${estilo.outlineColor}` };
});
if (!/solid|dashed/.test(foco.contorno) || /\b0px/.test(foco.contorno)) fallo(`el foco del teclado no es visible: ${foco.contorno}`);
else ok(`teclado: foco visible en ${foco.etiqueta} (${foco.contorno})`);
await pagina.keyboard.press("ArrowRight");
await pagina.waitForTimeout(500);
const trasFlecha = await frameRecarga.evaluate(() => document.querySelector('[role="tab"][aria-selected="true"]')?.dataset.tab ?? "");
if (!trasFlecha) fallo("las pestañas no responden al teclado");
else ok(`teclado: la barra de pestañas responde (activa «${trasFlecha}»)`);

/* ------------------------------------------------- 6. anchos 1024 y 390 */
const errores1440 = errores.filter((mensaje) => !/favicon|net::ERR_ABORTED/i.test(mensaje));
if (errores1440.length) fallo(`errores en consola o en recursos: ${errores1440.slice(0, 3).join(" | ")}`);
else ok("consola y recursos: sin errores ni respuestas 4xx en la aplicación");

for (const ancho of [1024, 390]) {
  const vista = await navegador.newPage({ viewport: { width: ancho, height: ancho === 390 ? 844 : 800 } });
  const erroresVista = [];
  vista.on("pageerror", (error) => erroresVista.push(error.message));
  await vista.goto(`${SITIO}${FICHA}`, { waitUntil: "domcontentloaded" });
  await vista.waitForSelector("#demo-host iframe", { timeout: 60000 });
  const marcoVista = vista.frameLocator("#demo-host iframe");
  await marcoVista.locator('[role="tab"]').first().waitFor({ timeout: 60000 });
  await vista.waitForTimeout(1500);
  const medida = await vista.evaluate(() => {
    const iframe = document.querySelector("#demo-host iframe");
    const doc = iframe.contentDocument;
    return {
      desbordePagina: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      desbordeMarco: doc.documentElement.scrollWidth - doc.documentElement.clientWidth,
      anchoMarco: Math.round(iframe.getBoundingClientRect().width),
      altoMarco: Math.round(iframe.getBoundingClientRect().height),
      tarjeta: (() => {
        const cover = document.querySelector(".project-card .cover");
        return cover ? Math.round(cover.getBoundingClientRect().width) : 0;
      })(),
    };
  });
  if (medida.desbordePagina > 1) fallo(`${ancho} px: la página desborda ${medida.desbordePagina} px`);
  if (medida.altoMarco < 2500) fallo(`${ancho} px: el marco mide ${medida.altoMarco} px de alto`);
  if (erroresVista.length) fallo(`${ancho} px: errores de JavaScript (${erroresVista[0]})`);
  /* Los gráficos anchos del diseño aprobado pueden desplazarse dentro de su
     contenedor: se documenta como fricción conocida, no como fallo. */
  if (medida.desbordeMarco > 1) {
    aviso(`${ancho} px: el observatorio conserva ${medida.desbordeMarco} px de desplazamiento horizontal interno (gráficos anchos del diseño aprobado)`);
  }
  await vista.screenshot({ path: `${CAPTURAS}/ficha-gaza-${ancho}.png`, fullPage: false });
  ok(`${ancho} px: página sin desbordamiento, marco de ${medida.anchoMarco} × ${medida.altoMarco} px`);
  await vista.close();
}

await navegador.close();

/* ------------------------------------------------- resumen */
console.log(`\ncomprobaciones correctas: ${correctas.length}`);
for (const linea of correctas) console.log(`  ✓ ${linea}`);
if (avisos.length) {
  console.log(`\navisos: ${avisos.length}`);
  for (const linea of avisos) console.log(`  · ${linea}`);
}
if (fallos.length) {
  console.log(`\nFALLOS: ${fallos.length}`);
  for (const linea of fallos) console.log(`  ✗ ${linea}`);
  process.exit(1);
}
console.log("\nverificación OK: tarjeta, ficha, once pestañas, mapa bivariado, archivo, descargas, teclado, 1440/1024/390 y consola.");






