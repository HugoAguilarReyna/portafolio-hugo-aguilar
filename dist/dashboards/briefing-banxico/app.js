'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const fmt = new Intl.NumberFormat('es-MX');
const params = new URLSearchParams(location.search);
const FORCE_LOCAL = params.get('local') === '1';
const API_BASE = (() => {
  const override = params.get('api');
  if (override !== null) return override.replace(/\/+$/, '');
  // Producción: mismo origen (`/api`, que el nginx del sitio reenvía al backend).
  // Desarrollo: el backend local, salvo que la propia página la sirva el API.
  if (
    (location.hostname === '127.0.0.1' || location.hostname === 'localhost') &&
    location.port !== '8010' &&
    location.port !== '8001'
  ) {
    return 'http://127.0.0.1:8010';
  }
  return '';
})();

const SUGGESTED_ANSWER = 'No encontré evidencia suficiente en los documentos cargados para responder esa pregunta. Prueba con tasa, inflación, riesgos, pronóstico o actividad económica.';
const SOURCE_DESCRIPTIONS = {
  'BM-2026-11-05': 'Decisión de tasa, inflación reciente, balance de riesgos y pronósticos trimestrales.',
  'BM-2026-08-26': 'Lectura de inflación, actividad económica y contexto de política monetaria del trimestre.'
};

let corpus = null;
let api = { available: false, health: null };
let activeSeries = 'general';

function apiUrl(path) {
  return `${API_BASE}/api/v1/briefing-banxico${path}`;
}

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function terms(text) {
  const stop = new Set(['que', 'como', 'cuando', 'desde', 'entre', 'cual', 'cuales', 'sobre', 'para', 'por', 'con', 'del', 'las', 'los', 'una', 'uno', 'fue', 'hay', 'dice', 'dijo', 'segun', 'cambio', 'menciona']);
  return [...new Set(normalize(text).match(/[a-z0-9.%]+/g) || [])]
    .filter((term) => term.length > 2 && !stop.has(term));
}

function scoreChunks(question, chunks) {
  const queryTerms = terms(question);
  if (!queryTerms.length) return [];
  return chunks.map((chunk) => {
    const haystack = normalize(`${chunk.heading || ''} ${chunk.content || ''} ${(chunk.keywords || []).join(' ')}`);
    const keywords = (chunk.keywords || []).map((keyword) => normalize(keyword));
    const score = queryTerms.reduce((sum, term) => {
      if (!haystack.includes(term)) return sum;
      return sum + (keywords.some((keyword) => keyword.includes(term)) ? 2 : 1);
    }, 0);
    return { ...chunk, score };
  }).filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score || a.chunk_id.localeCompare(b.chunk_id))
    .slice(0, 3);
}

function sourceMap() {
  return Object.fromEntries((corpus?.sources || []).map((source) => [source.source_id, source]));
}

function localRetrieve(question) {
  if (!corpus) throw new Error('El corpus local no está cargado.');
  const evidence = scoreChunks(question, corpus.chunks).map((chunk) => ({
    ...chunk,
    source: sourceMap()[chunk.source_id]
  }));
  if (!evidence.length) {
    return { answer: SUGGESTED_ANSWER, mode: 'sin-coincidencias', retrieval_mode: 'corpus-local', vector_search: false, evidence: [] };
  }
  return {
    answer: evidence.map((item) => item.content).join(' '),
    mode: 'extractiva',
    retrieval_mode: 'corpus-local',
    vector_search: false,
    evidence
  };
}

async function fetchJson(url, options = {}, timeoutMs = 6500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/json', ...(options.headers || {}) }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function updateApiBadge(health) {
  const badge = $('#local-badge');
  const status = $('#api-status');
  if (!badge || !status) return;
  const mongo = health.mongo || {};
  const target = mongo.target === 'atlas' ? 'Atlas' : 'MongoDB local';
  const reachable = mongo.reachable ? 'conectado' : 'no disponible';
  const chunks = Number(health.atlas_chunks ?? mongo.chunks ?? 0);
  const model = health.llm?.configured ? 'modelo configurado' : 'sin modelo · respuesta extractiva';
  status.textContent = `API local · ${target} ${reachable} · ${fmt.format(chunks)} fragmentos RAG · ${model}`;
  status.className = 'api-status is-ok';
  badge.innerHTML = `<i aria-hidden="true"></i> LOCAL · API ${mongo.reachable ? 'ACTIVA' : 'DEGRADADA'}`;
  badge.classList.remove('is-local');
}

function updateLocalBadge(message = 'LOCAL · CORPUS OFICIAL') {
  const badge = $('#local-badge');
  const status = $('#api-status');
  if (badge) {
    badge.innerHTML = `<i aria-hidden="true"></i> ${message}`;
    badge.classList.add('is-local');
  }
  if (status) {
    status.textContent = FORCE_LOCAL
      ? 'Modo local activado con ?local=1 · corpus oficial · respuesta extractiva.'
      : 'API no disponible · se usa el corpus local · respuesta extractiva.';
    status.className = 'api-status is-local';
  }
}

async function checkApi() {
  if (FORCE_LOCAL) {
    api = { available: false, health: null };
    updateLocalBadge('LOCAL · CORPUS OFICIAL');
    return;
  }
  try {
    const health = await fetchJson(apiUrl('/health'), {}, 5500);
    api = { available: true, health };
    updateApiBadge(health);
  } catch {
    api = { available: false, health: null };
    updateLocalBadge();
  }
}

function renderSourceCards() {
  const host = $('#source-cards');
  if (!host) return;
  host.replaceChildren();
  if (!corpus) {
    const error = document.createElement('p');
    error.className = 'chart-fallback';
    error.textContent = 'No se pudo cargar el corpus de fuentes. Revisa que corpus.json esté junto a esta página.';
    host.append(error);
    return;
  }
  for (const source of corpus.sources) {
    const card = document.createElement('article');
    card.className = 'source-card';
    const id = document.createElement('span');
    id.className = 'source-id';
    id.textContent = `${source.source_id} · ${source.kind || 'Documento'}`;
    const title = document.createElement('h3');
    title.textContent = source.title;
    const description = document.createElement('p');
    description.textContent = SOURCE_DESCRIPTIONS[source.source_id] || 'Documento oficial incluido en el corpus de la demo.';
    const meta = document.createElement('div');
    meta.className = 'source-meta';
    const date = document.createElement('span');
    date.textContent = source.date;
    const link = document.createElement('a');
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Fuente oficial ↗';
    meta.append(date, link);
    card.append(id, title, description, meta);
    host.append(card);
  }
}

async function loadCorpus(apiReady) {
  try {
    const data = await fetchJson('corpus.json', {}, 5000);
    if (!data.sources?.length || !data.chunks?.length || !data.forecast) throw new Error('corpus incompleto');
    corpus = data;
  } catch {
    await apiReady;
    if (api.available) {
      try {
        const data = await fetchJson(apiUrl('/corpus'), {}, 5000);
        if (data.sources?.length && data.chunks?.length && data.forecast) corpus = data;
      } catch { /* el aviso se muestra abajo */ }
    }
  }
  if (!corpus) {
    const content = $('#answer-content');
    if (content) {
      content.classList.remove('empty-state');
      content.innerHTML = '<h3>No se pudo cargar el corpus local.</h3><p>Sirve esta carpeta por HTTP para leer corpus.json. La demo no completa respuestas sin corpus.</p>';
    }
    updateLocalBadge('LOCAL · CORPUS NO DISPONIBLE');
    return;
  }
  renderSourceCards();
  drawChart(activeSeries);
}

function modeLabel(result, source) {
  const retrieval = result.retrieval_mode === 'atlas'
    ? 'ATLAS'
    : result.retrieval_mode === 'corpus-local-respaldo'
      ? 'CORPUS LOCAL (RESPALDO)'
      : 'CORPUS LOCAL';
  const answer = result.mode === 'llm-grounded'
    ? 'RESPUESTA LLM CON EVIDENCIA'
    : result.mode === 'extractiva-respaldo'
      ? 'RESPUESTA EXTRACTIVA (RESPALDO)'
      : result.mode === 'sin-coincidencias'
        ? 'SIN EVIDENCIA'
        : 'RESPUESTA EXTRACTIVA';
  return source === 'local' ? `CORPUS LOCAL · ${answer}` : `${retrieval} · ${answer}`;
}

function modeNote(result) {
  if (result.mode === 'llm-grounded' && result.grounding_check === 'verbatim-retrieved-chunks') return 'Extractos seleccionados por el modelo y comprobados literalmente contra los fragmentos recuperados. Revisa su relevancia para la pregunta.';
  if (result.mode === 'llm-grounded') return 'Respuesta de un modelo configurado. Contrasta cada afirmación con los fragmentos recuperados.';
  if (result.mode === 'extractiva-respaldo') return 'El modelo no respondió; se conserva la respuesta extractiva de los fragmentos recuperados.';
  if (result.mode === 'sin-coincidencias') return 'No se completó la respuesta con conocimiento externo. La pregunta queda fuera de la cobertura del corpus.';
  return 'Respuesta extractiva: concatenación de los fragmentos recuperados, sin generación libre de un modelo.';
}

function renderAnswer(result, source) {
  const content = $('#answer-content');
  const list = $('#evidence-list');
  const status = $('#answer-status');
  const label = $('#retrieval-mode');
  if (!content || !list || !status || !label) return;

  content.classList.remove('empty-state', 'loading');
  content.replaceChildren();
  list.replaceChildren();
  status.className = 'status-pill';
  const noEvidence = !result.evidence?.length || result.mode === 'sin-coincidencias';

  const heading = document.createElement('h3');
  heading.textContent = noEvidence ? 'No encontré evidencia suficiente.' : 'Lo que dicen las fuentes.';
  const answer = document.createElement('p');
  answer.textContent = result.answer || SUGGESTED_ANSWER;
  const note = document.createElement('p');
  note.className = 'mode-note';
  note.textContent = modeNote(result);
  content.append(heading, answer, note);

  if (noEvidence) {
    status.classList.add('is-empty');
    status.innerHTML = '<i aria-hidden="true"></i> SIN EVIDENCIA';
    label.textContent = modeLabel(result, source);
    const hint = document.createElement('div');
    hint.className = 'no-evidence';
    hint.textContent = 'El corpus cubre tasa, inflación, riesgos, pronóstico y actividad económica de los dos documentos cargados. No se usa conocimiento externo para completar el hueco.';
    list.append(hint);
    return;
  }

  status.classList.add('is-ok');
  status.innerHTML = '<i aria-hidden="true"></i> EVIDENCIA RECUPERADA';
  label.textContent = modeLabel(result, source);

  for (const item of result.evidence) {
    const card = document.createElement('article');
    card.className = 'evidence-card';
    card.dataset.chunkId = item.chunk_id;
    const top = document.createElement('div');
    top.className = 'evidence-top';
    const title = document.createElement('strong');
    title.textContent = item.heading;
    const id = document.createElement('span');
    id.className = 'source-id';
    id.textContent = item.source_id;
    top.append(title, id);
    const sourceData = item.source || sourceMap()[item.source_id] || {};
    const meta = document.createElement('p');
    meta.className = 'evidence-meta';
    meta.textContent = `${sourceData.title || 'Documento oficial'} · ${sourceData.date || ''}`;
    if (item.score) {
      const score = document.createElement('span');
      score.className = 'score';
      score.textContent = `coincidencia léxica ${item.score}`;
      meta.append(score);
    }
    const text = document.createElement('p');
    text.className = 'evidence-text';
    text.textContent = item.content;
    const link = document.createElement('a');
    link.href = sourceData.url || '#fuentes';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Abrir documento oficial ↗';
    card.append(top, meta, text, link);
    list.append(card);
  }
}

async function ask(question) {
  const clean = String(question || '').trim();
  if (clean.length < 3) {
    const status = $('#answer-status');
    if (status) {
      status.className = 'status-pill is-error';
      status.innerHTML = '<i aria-hidden="true"></i> ESCRIBE UNA PREGUNTA';
    }
    $('#question')?.focus();
    return;
  }
  const button = $('#ask');
  const status = $('#answer-status');
  if (button) button.disabled = true;
  if (status) {
    status.className = 'status-pill';
    status.innerHTML = '<i aria-hidden="true"></i> BUSCANDO EVIDENCIA…';
  }

  try {
    let result = null;
    let source = 'local';
    const apiDisponibleAlConsultar = api.available;
    if (apiDisponibleAlConsultar) {
      try {
        result = await fetchJson(apiUrl(`/query?question=${encodeURIComponent(clean)}`), {}, 30000);
        source = 'api';
      } catch {
        result = null;
      }
    }
    if (!result) {
      const apiStatus = $('#api-status');
      if (apiDisponibleAlConsultar && apiStatus) {
        apiStatus.textContent = 'La consulta al backend no respondió; se usó el corpus local.';
        apiStatus.className = 'api-status is-local';
      }
      result = localRetrieve(clean);
    }
    renderAnswer(result, source);
  } catch (error) {
    const content = $('#answer-content');
    if (content) {
      content.classList.remove('empty-state');
      content.innerHTML = '<h3>No se pudo completar la búsqueda.</h3><p>El corpus local no está disponible. Sirve la carpeta por HTTP y vuelve a intentar.</p>';
    }
    if (status) {
      status.className = 'status-pill is-error';
      status.innerHTML = '<i aria-hidden="true"></i> ERROR DE CORPUS';
    }
  } finally {
    if (button) button.disabled = false;
  }
}

function renderForecastTable(data, which) {
  const host = $('#forecast-table-body');
  if (!host) return;
  host.replaceChildren();
  const table = document.createElement('table');
  const caption = document.createElement('caption');
  const series = which === 'core' ? 'INPC subyacente' : 'INPC general';
  caption.textContent = `Trayectoria de ${series}. Fuente: Banco de México, 5 de noviembre de 2026. El pronóstico del cuadro empieza en 2026-T4; la línea discontinua solo conecta los valores publicados.`;
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  for (const label of ['Periodo', 'Inflación', 'Estatus', 'Fuente']) {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = label;
    headRow.append(th);
  }
  thead.append(headRow);
  const tbody = document.createElement('tbody');
  for (const row of data) {
    const tr = document.createElement('tr');
    const period = document.createElement('th');
    period.scope = 'row';
    period.textContent = row.period;
    const value = document.createElement('td');
    value.textContent = `${Number(row.value).toFixed(1)} %`;
    const status = document.createElement('td');
    status.textContent = row.status;
    const source = document.createElement('td');
    source.textContent = 'Banco de México · 05 nov 2026';
    tr.append(period, value, status, source);
    tbody.append(tr);
  }
  table.append(caption, thead, tbody);
  host.append(table);
}

function drawChart(which = 'general') {
  activeSeries = which;
  const host = $('#forecast-chart');
  if (!host || !corpus?.forecast?.[which]) return;
  const data = corpus.forecast[which].map((row) => ({ ...row, value: Number(row.value) }));
  const d3 = window.d3;
  if (!d3) {
    host.innerHTML = '<p class="chart-fallback">La gráfica D3 no está disponible. La tabla accesible conserva la serie y sus fuentes.</p>';
    renderForecastTable(data, which);
    return;
  }

  const width = Math.max(320, Math.floor(host.clientWidth || 860));
  const height = width < 520 ? 300 : 340;
  const margin = { top: 26, right: 24, bottom: 48, left: 48 };
  const periods = data.map((row) => row.period);
  const observed = data.filter((row) => row.status === 'observado');
  const firstForecast = data.findIndex((row) => row.status === 'pronóstico');
  const lastObserved = observed[observed.length - 1];
  const forecastPath = firstForecast > 0 ? [data[firstForecast - 1], ...data.slice(firstForecast)] : data.slice(firstForecast);

  host.replaceChildren();
  const svg = d3.select(host).append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('role', 'group')
    .attr('aria-label', `Inflación ${which === 'general' ? 'general' : 'subyacente'}, serie trimestral observada y pronosticada frente a la meta de 3 por ciento`);
  const x = d3.scalePoint().domain(periods).range([margin.left, width - margin.right]).padding(0.35);
  const y = d3.scaleLinear().domain([2.5, 5]).range([height - margin.bottom, margin.top]);
  const ticks = [3, 3.5, 4, 4.5, 5];

  svg.append('g').selectAll('line').data(ticks).join('line')
    .attr('class', 'grid-line')
    .attr('x1', margin.left).attr('x2', width - margin.right)
    .attr('y1', (d) => y(d)).attr('y2', (d) => y(d));
  svg.append('g').selectAll('text').data(ticks).join('text')
    .attr('class', 'axis-text')
    .attr('x', margin.left - 8).attr('y', (d) => y(d) + 3)
    .attr('text-anchor', 'end').text((d) => `${d.toFixed(1)}%`);

  const showEvery = width < 520 ? 2 : 1;
  svg.append('g').selectAll('text').data(periods).join('text')
    .attr('class', 'axis-text')
    .attr('x', (d) => x(d)).attr('y', height - 18)
    .attr('text-anchor', 'middle')
    .text((d, i) => (i % showEvery === 0 ? d.replace('-T', ' T') : ''));

  svg.append('line')
    .attr('class', 'target-line')
    .attr('x1', margin.left).attr('x2', width - margin.right)
    .attr('y1', y(3)).attr('y2', y(3));
  svg.append('text')
    .attr('class', 'target-label')
    .attr('x', margin.left + 5).attr('y', y(3) - 5)
    .attr('text-anchor', 'start').text('Meta 3%');

  if (firstForecast > 0) {
    const separator = (x(data[firstForecast - 1].period) + x(data[firstForecast].period)) / 2;
    svg.append('line')
      .attr('class', 'split-line')
      .attr('x1', separator).attr('x2', separator)
      .attr('y1', margin.top).attr('y2', height - margin.bottom);
    svg.append('text')
      .attr('class', 'split-label')
      .attr('x', separator + 5).attr('y', margin.top + 10)
      .text(width < 520 ? 'Pronóstico →' : 'Pronóstico desde 2026-T4 →');
  }

  const line = d3.line().x((d) => x(d.period)).y((d) => y(d.value));
  svg.append('path').datum(observed).attr('class', 'forecast-line').attr('d', line);
  if (forecastPath.length > 1) {
    svg.append('path').datum(forecastPath).attr('class', 'forecast-line future').attr('d', line);
  }

  const tip = $('#forecast-tooltip');
  function showTip(event, d) {
    if (!tip) return;
    tip.hidden = false;
    tip.textContent = `${d.period} · ${d.value.toFixed(1)}% · ${d.status}. Banco de México · 05 nov 2026.`;
    const parent = tip.offsetParent || host;
    const parentRect = parent.getBoundingClientRect();
    const hostRect = host.getBoundingClientRect();
    const pointLeft = hostRect.left - parentRect.left + x(d.period) * (hostRect.width / width);
    const pointTop = hostRect.top - parentRect.top + y(d.value) * (hostRect.height / height);
    const clientX = event?.clientX ?? (parentRect.left + pointLeft);
    const clientY = event?.clientY ?? (parentRect.top + pointTop);
    const left = Math.max(8, Math.min(parentRect.width - 210, clientX - parentRect.left + 12));
    const top = Math.max(8, Math.min(parentRect.height - 58, clientY - parentRect.top - 16));
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  }
  function hideTip() {
    if (tip) tip.hidden = true;
  }

  const points = svg.selectAll('circle')
    .data(data)
    .join('circle')
    .attr('class', (d) => d.status === 'observado' ? 'actual-point' : 'forecast-point')
    .attr('cx', (d) => x(d.period))
    .attr('cy', (d) => y(d.value))
    .attr('r', width < 520 ? 4.2 : 5.2)
    .attr('tabindex', 0)
    .attr('role', 'img')
    .attr('data-period', (d) => d.period)
    .attr('data-status', (d) => d.status)
    .attr('aria-label', (d) => `${d.period}: ${d.value.toFixed(1)} por ciento, ${d.status}. Banco de México, 5 de noviembre de 2026.`)
    .on('pointerenter', showTip)
    .on('pointermove', showTip)
    .on('pointerleave', hideTip)
    .on('focus', (event, d) => showTip(null, d))
    .on('blur', hideTip);
  points.append('title').text((d) => `${d.period}: ${d.value.toFixed(1)}% · ${d.status}`);

  const source = $('#chart-source');
  if (source) source.textContent = `Fuente: Banco de México · 05 nov 2026 · ${which === 'general' ? 'INPC general' : 'INPC subyacente'}`;
  renderForecastTable(data, which);
}

function setSeries(which, focus = false) {
  if (!['general', 'core'].includes(which)) return;
  activeSeries = which;
  $$('[data-series]').forEach((button) => {
    const active = button.dataset.series === which;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
    if (active && focus) button.focus();
  });
  drawChart(which);
}

function initControls() {
  $('#query-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    ask($('#question')?.value || '');
  });
  $$('[data-question]').forEach((button) => {
    button.addEventListener('click', () => {
      const question = button.dataset.question;
      const input = $('#question');
      if (input) input.value = question;
      ask(question);
    });
  });
  $('#question')?.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      ask($('#question').value);
    }
  });
  $$('[data-series]').forEach((button) => {
    button.addEventListener('click', () => setSeries(button.dataset.series));
  });
  window.addEventListener('resize', () => {
    if (corpus) drawChart(activeSeries);
  });
}

async function start() {
  initControls();
  const apiReady = checkApi();
  await loadCorpus(apiReady);
}

start();
