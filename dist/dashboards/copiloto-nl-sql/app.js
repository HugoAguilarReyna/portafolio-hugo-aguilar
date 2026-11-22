'use strict';

/* ==========================================================================
   Copiloto NL-to-SQL · indicadores económicos de México
   --------------------------------------------------------------------------
   La interpretación es léxica y el SQL sale de una plantilla permitida. El
   navegador puede ejecutar la API local o simular la misma plantilla sobre
   data.json; en ningún caso evalúa el texto libre como SQL.
   ========================================================================== */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
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

const METRIC_META = {
  'NY.GDP.MKTP.KD.ZG': {
    label: 'Crecimiento del PIB real',
    terms: ['pib', 'producto interno', 'crecimiento', 'economia'],
    unit: '% anual'
  },
  'FP.CPI.TOTL.ZG': {
    label: 'Inflación al consumidor',
    terms: ['inflacion', 'precios', 'ipc', 'cpi'],
    unit: '% anual'
  },
  'SL.UEM.TOTL.ZS': {
    label: 'Desempleo total · estimación OIT',
    terms: ['desempleo', 'desocupacion', 'empleo', 'sin trabajo', 'oit'],
    unit: '% fuerza laboral'
  }
};
const UNSUPPORTED_COUNTRIES = [
  'guatemala', 'honduras', 'el salvador', 'costa rica', 'nicaragua', 'panama',
  'estados unidos', 'eeuu', 'canada', 'brasil', 'argentina', 'colombia'
];
const YEARS_ALLOWED = [2019, 2025];
const COLORS = {
  'NY.GDP.MKTP.KD.ZG': '#4b55ff',
  'FP.CPI.TOTL.ZG': '#9586bd',
  'SL.UEM.TOTL.ZS': '#c97b43'
};

let DATA = null;
let api = { available: false, health: null };
let drawVersion = 0;

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const fmt = new Intl.NumberFormat('es-MX', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const fmtAxis = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });

function apiUrl(path) {
  return `${API_BASE}/api/v1/copiloto-nl-sql${path}`;
}

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatSnapshot(value) {
  if (!value) return 'snapshot local';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function sourceFor(code) {
  return (DATA?.sources || []).find((source) => source.indicator_code === code) || {};
}

function parseQuestion(question) {
  const q = normalize(question);
  if (UNSUPPORTED_COUNTRIES.some((country) => q.includes(country))) {
    throw new Error('El snapshot de esta demo solo cubre México.');
  }

  const indicators = Object.entries(METRIC_META)
    .filter(([, meta]) => meta.terms.some((term) => q.includes(term)))
    .map(([code]) => code);
  if (!indicators.length) {
    throw new Error('No reconocí el indicador. Prueba con PIB, inflación o desempleo.');
  }

  const years = (q.match(/\b(?:19|20)\d{2}\b/g) || []).map(Number);
  if (years.some((year) => year < YEARS_ALLOWED[0] || year > YEARS_ALLOWED[1])) {
    throw new Error(`El periodo disponible es ${YEARS_ALLOWED[0]}–${YEARS_ALLOWED[1]}.`);
  }
  let start = years.length ? Math.min(...years) : YEARS_ALLOWED[0];
  let end = years.length ? Math.max(...years) : YEARS_ALLOWED[1];

  let order = null;
  if (['mayor', 'maximo', 'maxima', 'mas alto', 'mas elevada', 'pico'].some((word) => q.includes(word))) {
    order = 'DESC';
  } else if (['menor', 'minimo', 'minima', 'mas bajo', 'mas baja'].some((word) => q.includes(word))) {
    order = 'ASC';
  }
  if (order && indicators.length > 1) {
    throw new Error('Para ordenar por máximo o mínimo, especifica un solo indicador.');
  }

  return {
    country_code: 'MEX',
    country: 'México',
    indicator_codes: indicators,
    indicator_labels: indicators.map((code) => METRIC_META[code].label),
    start_year: start,
    end_year: end,
    kind: order ? 'ranking' : (indicators.length > 1 ? 'comparison' : 'trend'),
    rank_order: order
  };
}

function makeSql(spec) {
  const marks = spec.indicator_codes.map(() => '?').join(', ');
  const tail = spec.kind === 'ranking'
    ? `ORDER BY value ${spec.rank_order}, year ${spec.rank_order === 'DESC' ? 'ASC' : 'DESC'}`
    : 'ORDER BY indicator_code, year';
  return {
    sql: `SELECT year, country, indicator_code, indicator, value, unit
FROM observations
WHERE country_code = ?
  AND indicator_code IN (${marks})
  AND year BETWEEN ? AND ?
${tail};`,
    params: [spec.country_code, ...spec.indicator_codes, spec.start_year, spec.end_year]
  };
}

function simulate(spec, data) {
  const rows = data.observations
    .filter((row) => spec.indicator_codes.includes(row.indicator_code)
      && row.year >= spec.start_year
      && row.year <= spec.end_year)
    .sort((a, b) => a.indicator_code.localeCompare(b.indicator_code) || a.year - b.year);
  if (spec.kind === 'ranking') {
    rows.sort((a, b) => spec.rank_order === 'DESC' ? b.value - a.value : a.value - b.value);
  }
  return rows;
}

function summarize(spec, rows) {
  if (!rows.length) return 'No hay observaciones para esos filtros en el corte local.';
  if (spec.kind === 'ranking') {
    const row = rows[0];
    return `El valor ${spec.rank_order === 'DESC' ? 'más alto' : 'más bajo'} del periodo fue ${fmt.format(row.value)} ${row.unit} para ${row.indicator} en ${row.year}.`;
  }
  if (spec.start_year === spec.end_year) {
    return spec.indicator_codes.map((code) => {
      const row = rows.find((item) => item.indicator_code === code);
      return row ? `En ${row.year}, ${row.indicator}: ${fmt.format(row.value)} ${row.unit}.` : '';
    }).filter(Boolean).join(' ');
  }
  return spec.indicator_codes.map((code) => {
    const subset = rows.filter((row) => row.indicator_code === code);
    if (!subset.length) return '';
    const first = subset[0];
    const last = subset[subset.length - 1];
    const delta = last.value - first.value;
    const verb = delta > 0 ? 'aumentó' : (delta < 0 ? 'disminuyó' : 'se mantuvo');
    return `${last.indicator}: ${fmt.format(first.value)} ${first.unit} en ${first.year} y ${fmt.format(last.value)} ${last.unit} en ${last.year}; ${verb} ${fmt.format(Math.abs(delta))} puntos porcentuales en el periodo.`;
  }).filter(Boolean).join(' ');
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
    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try {
        const body = await response.json();
        if (body && body.detail) detail = body.detail;
      } catch { /* respuesta sin JSON */ }
      throw new ApiError(detail, response.status);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function updateApiBadge(health) {
  const badge = $('#local-badge');
  const status = $('#api-status');
  if (!badge || !status) return;
  const atlas = health.atlas || {};
  const atlasLabel = !atlas.enabled
    ? 'Atlas desactivado'
    : atlas.reachable
      ? 'Atlas conectado'
      : 'Atlas no disponible';
  const model = health.llm?.configured ? 'modelo configurado' : 'sin modelo';
  status.textContent = `API local · SQLite de lectura · ${atlasLabel} · ${model} · ${health.observations ?? 0} observaciones`;
  status.className = 'api-status is-ok';
  badge.innerHTML = `<i aria-hidden="true"></i> LOCAL · API ACTIVA`;
  badge.classList.remove('is-local');
}

function updateLocalBadge(message = 'LOCAL · SNAPSHOT WDI') {
  const badge = $('#local-badge');
  const status = $('#api-status');
  if (badge) {
    badge.innerHTML = `<i aria-hidden="true"></i> ${message}`;
    badge.classList.add('is-local');
  }
  if (status) {
    status.textContent = FORCE_LOCAL
      ? 'Modo local activado con ?local=1 · snapshot WDI · parser léxico.'
      : 'API no disponible · se usa el snapshot local · parser léxico.';
    status.className = 'api-status is-local';
  }
}

async function checkApi() {
  if (FORCE_LOCAL) {
    api = { available: false, health: null };
    updateLocalBadge();
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

function updateSnapshot() {
  if (!DATA) return;
  const host = $('#snapshot-date');
  if (host) host.textContent = `Snapshot local · ${formatSnapshot(DATA.snapshot_date)}`;
}

async function loadData(apiReady) {
  try {
    const local = await fetchJson('data.json', {}, 5000);
    if (!local.observations?.length || !local.sources?.length) throw new Error('snapshot incompleto');
    DATA = local;
  } catch {
    await apiReady;
    if (api.available) {
      try {
        const remote = await fetchJson(apiUrl('/data'), {}, 5000);
        if (remote.observations?.length && remote.sources?.length) DATA = remote;
      } catch { /* aviso abajo */ }
    }
  }
  if (!DATA) {
    showError('No se pudo cargar el snapshot local. Sirve esta carpeta por HTTP para leer data.json.');
    return;
  }
  updateSnapshot();
}

function renderInterpretation(spec) {
  const box = $('#interpretation');
  if (!box) return;
  box.replaceChildren();
  const operation = spec.kind === 'ranking'
    ? `Ordenar ${spec.rank_order === 'DESC' ? 'descendente' : 'ascendente'}`
    : spec.kind === 'comparison' ? 'Comparar series' : (spec.start_year === spec.end_year ? 'Valor puntual' : 'Serie temporal');
  const tokens = [
    ['País', spec.country],
    ['Indicador', spec.indicator_labels.join(' + ')],
    ['Periodo', `${spec.start_year}–${spec.end_year}`],
    ['Operación', operation],
    ['Fuente', 'WDI · MEX']
  ];
  for (const [label, value] of tokens) {
    const token = make('span', 'token');
    token.append(make('span', '', `${label}:`), make('b', '', value));
    box.append(token);
  }
  box.hidden = false;
}

function renderTable(rows, spec) {
  const wrap = $('#table-wrap');
  if (!wrap) return;
  wrap.replaceChildren();
  if (!rows.length) {
    wrap.hidden = false;
    wrap.append(make('p', 'execution-note', 'No hay filas para mostrar con estos filtros.'));
    return;
  }
  const table = make('table');
  const caption = make('caption');
  const displayRows = spec.kind === 'comparison'
    ? [...rows].sort((a, b) => spec.indicator_codes.indexOf(a.indicator_code) - spec.indicator_codes.indexOf(b.indicator_code) || a.year - b.year)
    : rows;
  const sourceNames = [...new Set(displayRows.map((row) => row.indicator))].join('; ');
  caption.textContent = `${sourceNames}. Fuente: Banco Mundial · World Development Indicators (WDI); corte ${formatSnapshot(DATA?.snapshot_date)}. ${spec.kind === 'ranking' ? 'La tabla conserva todos los años consultados y resalta el extremo solicitado.' : 'Todas las filas recuperadas por la consulta.'}`;
  const thead = make('thead');
  const headRow = make('tr');
  for (const label of ['Año', 'Indicador', 'Código WDI', 'Valor', 'Unidad', 'Estatus']) {
    const th = make('th');
    th.scope = 'col';
    th.textContent = label;
    headRow.append(th);
  }
  thead.append(headRow);
  const tbody = make('tbody');
  displayRows.forEach((row, index) => {
    const tr = make('tr', spec.kind === 'ranking' && index === 0 ? 'row-highlight' : '');
    const year = make('th');
    year.scope = 'row';
    year.textContent = row.year;
    const dataCell = (label, text, className = '') => {
      const cell = make('td', className, text);
      cell.dataset.label = label;
      return cell;
    };
    const indicator = dataCell('Indicador', row.indicator);
    const code = dataCell('Código WDI', row.indicator_code);
    const value = dataCell('Valor', fmt.format(row.value));
    const unit = dataCell('Unidad', row.unit);
    const status = dataCell(
      'Estatus',
      spec.kind === 'ranking' && index === 0
        ? (spec.rank_order === 'DESC' ? 'Máximo' : 'Mínimo')
        : '—',
      'status-cell'
    );
    tr.append(year, indicator, code, value, unit, status);
    tbody.append(tr);
  });
  table.append(caption, thead, tbody);
  wrap.append(table);
  wrap.hidden = false;
}

function bindChartEvents(selection, tip, host) {
  selection
    .attr('tabindex', 0)
    .attr('role', 'img')
    .on('pointerenter', (event, row) => showChartTip(event, row, tip, host))
    .on('pointermove', (event, row) => showChartTip(event, row, tip, host))
    .on('pointerleave', () => { tip.hidden = true; })
    .on('focus', (event, row) => showChartTip(event, row, tip, host))
    .on('blur', () => { tip.hidden = true; });
}

function showChartTip(event, row, tip, host) {
  tip.hidden = false;
  tip.textContent = `${row.indicator} · ${row.year}: ${fmt.format(row.value)} ${row.unit}. Fuente: WDI.`;
  const hostRect = host.getBoundingClientRect();
  const target = event && event.currentTarget;
  const targetRect = target && target.getBoundingClientRect ? target.getBoundingClientRect() : null;
  const left = targetRect
    ? targetRect.left - hostRect.left + targetRect.width / 2
    : 20;
  const top = targetRect
    ? targetRect.top - hostRect.top
    : 20;
  tip.style.left = `${Math.max(6, Math.min(hostRect.width - 232, left + 9))}px`;
  tip.style.top = `${Math.max(5, top - 42)}px`;
}

function drawTrend(d3, svg, rows, spec, width, host, tip) {
  const values = [...rows].sort((a, b) => a.year - b.year);
  const hasNegative = values.some((row) => row.value < 0);
  const minValue = hasNegative ? Math.min(0, ...values.map((row) => row.value)) : Math.min(...values.map((row) => row.value));
  const maxValue = hasNegative ? Math.max(0, ...values.map((row) => row.value)) : Math.max(...values.map((row) => row.value));
  const padding = Math.max((maxValue - minValue) * 0.16, 0.35);
  const height = 330;
  const margin = { top: 45, right: 24, bottom: 48, left: 58 };
  const x = d3.scalePoint()
    .domain(values.map((row) => row.year))
    .range([margin.left, width - margin.right])
    .padding(values.length === 1 ? 1 : 0.22);
  const y = d3.scaleLinear()
    .domain([minValue - padding, maxValue + padding])
    .nice(5)
    .range([height - margin.bottom, margin.top]);
  const color = COLORS[values[0].indicator_code] || '#4b55ff';
  const extreme = values.reduce((best, row) => (row.value > best.value ? row : best), values[0]);

  svg.attr('viewBox', `0 0 ${width} ${height}`)
    .attr('role', 'group')
    .attr('aria-label', `${values[0].indicator}. Serie anual ${values[0].year}–${values[values.length - 1].year}, unidad ${values[0].unit}. Tabla alternativa disponible.`);
  svg.append('text').attr('class', 'chart-kicker').attr('x', margin.left).attr('y', 17)
    .text(`${values[0].indicator} · ${values[0].unit}`);
  svg.append('text').attr('class', 'facet-code').attr('x', width - margin.right).attr('y', 17)
    .attr('text-anchor', 'end').text(values[0].indicator_code);

  const ticks = y.ticks(5);
  svg.append('g').selectAll('line').data(ticks).join('line')
    .attr('class', 'grid')
    .attr('x1', margin.left).attr('x2', width - margin.right)
    .attr('y1', (value) => y(value)).attr('y2', (value) => y(value));
  svg.append('g').selectAll('text').data(ticks).join('text')
    .attr('class', 'axis')
    .attr('x', margin.left - 9).attr('y', (value) => y(value) + 3)
    .attr('text-anchor', 'end').text((value) => fmtAxis.format(value));
  if (hasNegative) {
    svg.append('line').attr('class', 'baseline')
      .attr('x1', margin.left).attr('x2', width - margin.right)
      .attr('y1', y(0)).attr('y2', y(0));
  }
  svg.append('g').selectAll('text').data(values).join('text')
    .attr('class', 'axis')
    .attr('x', (row) => x(row.year)).attr('y', height - 17)
    .attr('text-anchor', 'middle').text((row) => row.year);

  const line = d3.line()
    .x((row) => x(row.year))
    .y((row) => y(row.value))
    .curve(d3.curveMonotoneX);
  svg.append('path').datum(values).attr('class', 'trend-line').attr('stroke', color).attr('d', line);

  const points = svg.append('g').selectAll('circle').data(values).join('circle')
    .attr('class', (row) => row === extreme ? 'point point-extreme' : 'point')
    .attr('cx', (row) => x(row.year))
    .attr('cy', (row) => y(row.value))
    .attr('r', (row) => row === extreme ? 5.8 : 4.2)
    .attr('stroke', color)
    .attr('aria-label', (row) => `${row.indicator}, ${row.year}: ${fmt.format(row.value)} ${row.unit}. Fuente WDI; corte ${formatSnapshot(DATA?.snapshot_date)}.`);
  bindChartEvents(points, tip, host);

  const labelX = x(extreme.year);
  const anchor = labelX > width - 120 ? 'end' : 'start';
  svg.append('text').attr('class', 'value-label')
    .attr('x', labelX + (anchor === 'end' ? -7 : 7))
    .attr('y', Math.max(31, y(extreme.value) - 12))
    .attr('text-anchor', anchor)
    .text(`${fmt.format(extreme.value)} · ${extreme.year}`);
}

function drawRanking(d3, svg, rows, spec, width, host, tip) {
  const sorted = [...rows].sort((a, b) => spec.rank_order === 'DESC' ? b.value - a.value : a.value - b.value);
  const height = Math.max(255, sorted.length * 36 + 65);
  const margin = { top: 49, right: 24, bottom: 36, left: 57 };
  const minValue = Math.min(0, ...sorted.map((row) => row.value));
  const maxValue = Math.max(0, ...sorted.map((row) => row.value));
  const padding = Math.max((maxValue - minValue) * 0.12, 0.2);
  const x = d3.scaleLinear()
    .domain([minValue - padding, maxValue + padding])
    .range([margin.left, width - margin.right]);
  const y = d3.scaleBand()
    .domain(sorted.map((row, index) => `${row.year}-${index}`))
    .range([margin.top, height - margin.bottom])
    .padding(0.28);
  const zero = x(0);
  const best = sorted[0];
  const ticks = x.ticks(4);

  svg.attr('viewBox', `0 0 ${width} ${height}`)
    .attr('role', 'group')
    .attr('aria-label', `${best.indicator}. Ranking ${spec.rank_order === 'DESC' ? 'descendente' : 'ascendente'} de ${sorted.length} años; unidad ${best.unit}. Tabla alternativa disponible.`);
  svg.append('text').attr('class', 'chart-kicker').attr('x', margin.left).attr('y', 18)
    .text(`${best.indicator} · ${best.unit} · ${spec.rank_order === 'DESC' ? 'de mayor a menor' : 'de menor a mayor'}`);
  svg.append('text').attr('class', 'facet-code').attr('x', width - margin.right).attr('y', 18)
    .attr('text-anchor', 'end').text(best.indicator_code);

  svg.append('g').selectAll('line').data(ticks).join('line')
    .attr('class', (value) => Math.abs(value) < 1e-9 ? 'baseline' : 'grid')
    .attr('x1', (value) => x(value)).attr('x2', (value) => x(value))
    .attr('y1', margin.top - 12).attr('y2', height - margin.bottom + 5);
  svg.append('g').selectAll('text').data(ticks).join('text')
    .attr('class', 'axis')
    .attr('x', (value) => x(value)).attr('y', height - 9)
    .attr('text-anchor', 'middle').text((value) => fmtAxis.format(value));

  const groups = svg.append('g').selectAll('g').data(sorted).join('g')
    .attr('transform', (row, index) => `translate(0,${y(`${row.year}-${index}`)})`);
  groups.append('text').attr('class', 'rank-year')
    .attr('x', margin.left - 10).attr('y', y.bandwidth() / 2 + 3)
    .attr('text-anchor', 'end').text((row) => row.year);

  const bars = groups.append('rect')
    .attr('class', (row, index) => index === 0 ? 'rank-bar rank-bar-best' : 'rank-bar')
    .attr('x', (row) => Math.min(zero, x(row.value)))
    .attr('y', 0)
    .attr('width', (row) => Math.max(2, Math.abs(x(row.value) - zero)))
    .attr('height', y.bandwidth())
    .attr('rx', 4)
    .attr('aria-label', (row, index) => `${row.indicator}, ${row.year}: ${fmt.format(row.value)} ${row.unit}${index === 0 ? ', valor destacado' : ''}.`);
  bindChartEvents(bars, tip, host);

  groups.append('text').attr('class', 'rank-value')
    .attr('x', (row) => Math.min(width - margin.right - 4, Math.max(margin.left + 4, x(row.value) + (row.value >= 0 ? 7 : -7))))
    .attr('y', y.bandwidth() / 2 + 3)
    .attr('text-anchor', (row) => row.value < 0 ? 'end' : 'start')
    .text((row) => fmt.format(row.value));
}

function drawComparison(d3, svg, rows, spec, width, host, tip) {
  const groups = spec.indicator_codes
    .map((code) => [code, rows.filter((row) => row.indicator_code === code).sort((a, b) => a.year - b.year)])
    .filter(([, values]) => values.length);
  const panel = 198;
  const height = groups.length * panel + 23;
  const margin = { left: 58, right: 24 };
  const years = [...new Set(rows.map((row) => row.year))].sort((a, b) => a - b);
  const x = d3.scalePoint().domain(years).range([margin.left, width - margin.right]).padding(years.length === 1 ? 1 : 0.22);

  svg.attr('viewBox', `0 0 ${width} ${height}`)
    .attr('role', 'group')
    .attr('aria-label', `Comparación de ${groups.length} indicadores. Cada panel tiene escala y unidad propias; no se comparten ejes. Tabla alternativa disponible.`);
  groups.forEach(([code, values], index) => {
    const top = index * panel;
    const meta = METRIC_META[code] || { label: values[0].indicator, unit: values[0].unit };
    const hasNegative = values.some((row) => row.value < 0);
    const minValue = hasNegative ? Math.min(0, ...values.map((row) => row.value)) : Math.min(...values.map((row) => row.value));
    const maxValue = hasNegative ? Math.max(0, ...values.map((row) => row.value)) : Math.max(...values.map((row) => row.value));
    const padding = Math.max((maxValue - minValue) * 0.2, 0.3);
    const y = d3.scaleLinear()
      .domain([minValue - padding, maxValue + padding])
      .nice(4)
      .range([top + panel - 39, top + 43]);
    const color = COLORS[code] || '#4b55ff';
    if (index) {
      svg.append('line').attr('class', 'facet-separator')
        .attr('x1', 10).attr('x2', width - 10).attr('y1', top + 4).attr('y2', top + 4);
    }
    svg.append('text').attr('class', 'facet-title').attr('x', margin.left).attr('y', top + 18)
      .text(meta.label);
    svg.append('text').attr('class', 'facet-unit').attr('x', width - margin.right).attr('y', top + 18)
      .attr('text-anchor', 'end').text(`${meta.unit} · ${code}`);
    const ticks = y.ticks(4);
    svg.append('g').selectAll('line').data(ticks).join('line')
      .attr('class', (value) => Math.abs(value) < 1e-9 ? 'baseline' : 'grid')
      .attr('x1', margin.left).attr('x2', width - margin.right)
      .attr('y1', (value) => y(value)).attr('y2', (value) => y(value));
    svg.append('g').selectAll('text').data(ticks).join('text')
      .attr('class', 'axis')
      .attr('x', margin.left - 8).attr('y', (value) => y(value) + 3)
      .attr('text-anchor', 'end').text((value) => fmtAxis.format(value));
    svg.append('g').selectAll('text').data(years).join('text')
      .attr('class', 'axis')
      .attr('x', (year) => x(year)).attr('y', top + panel - 12)
      .attr('text-anchor', 'middle').text((year) => String(year));
    const line = d3.line().x((row) => x(row.year)).y((row) => y(row.value)).curve(d3.curveMonotoneX);
    svg.append('path').datum(values).attr('class', 'trend-line').attr('stroke', color).attr('d', line);
    const points = svg.append('g').selectAll('circle').data(values).join('circle')
      .attr('class', 'point')
      .attr('cx', (row) => x(row.year))
      .attr('cy', (row) => y(row.value))
      .attr('r', 4.2)
      .attr('stroke', color)
      .attr('aria-label', (row) => `${row.indicator}, ${row.year}: ${fmt.format(row.value)} ${row.unit}. Fuente WDI; corte ${formatSnapshot(DATA?.snapshot_date)}.`);
    bindChartEvents(points, tip, host);
    const extreme = values.reduce((best, row) => (row.value > best.value ? row : best), values[0]);
    const labelX = x(extreme.year);
    svg.append('text').attr('class', 'value-label')
      .attr('x', labelX + (labelX > width - 110 ? -7 : 7))
      .attr('y', Math.max(top + 31, y(extreme.value) - 9))
      .attr('text-anchor', labelX > width - 110 ? 'end' : 'start')
      .text(`${fmt.format(extreme.value)} · ${extreme.year}`);
  });
}

function renderChart(rows, spec) {
  const host = $('#chart');
  const empty = $('#chart-empty');
  if (!host || !empty) return;
  const version = ++drawVersion;
  host.replaceChildren();
  host.hidden = false;
  empty.hidden = true;
  if (!rows.length) {
    host.hidden = true;
    empty.hidden = false;
    return;
  }
  if (!window.d3) {
    host.append(make('p', 'execution-note', 'D3 no está disponible; consulta los mismos valores en la tabla accesible.'));
    return;
  }
  const d3 = window.d3;
  const width = Math.max(320, Math.floor(host.clientWidth || 760));
  const tip = make('div', 'chart-tooltip');
  tip.hidden = true;
  tip.setAttribute('role', 'status');
  host.append(tip);
  const svg = d3.select(host).append('svg');
  if (spec.kind === 'ranking') {
    drawRanking(d3, svg, rows, spec, width, host, tip);
  } else if (spec.kind === 'comparison' || spec.indicator_codes.length > 1) {
    drawComparison(d3, svg, rows, spec, width, host, tip);
  } else {
    drawTrend(d3, svg, rows, spec, width, host, tip);
  }
  // Si la ventana cambió de ancho durante el dibujo, no dejes una versión vieja.
  if (version !== drawVersion) return;
}

function showError(message) {
  const mode = $('#mode');
  const summary = $('#summary');
  if (mode) {
    mode.textContent = 'NO SE PUDO INTERPRETAR';
    mode.className = 'mode-pill';
  }
  if (summary) {
    summary.textContent = message;
    summary.classList.add('error');
  }
  for (const selector of ['#source-line', '#interpretation', '#table-wrap', '#sql-details']) {
    const node = $(selector);
    if (node) node.hidden = true;
  }
  const chart = $('#chart');
  const empty = $('#chart-empty');
  if (chart) {
    chart.replaceChildren();
    chart.hidden = true;
  }
  if (empty) empty.hidden = false;
}

function showResult(result, source) {
  window.__copilotoLastResult = result;
  const spec = result.spec;
  const rows = result.rows || [];
  const local = source === 'local';
  const mode = $('#mode');
  const summary = $('#summary');
  if (mode) {
    mode.textContent = local
      ? 'MODO LOCAL · JSON'
      : result.intent_mode === 'llm-json-validado'
        ? 'LLM · PLAN VALIDADO · SQL SEGURO'
        : 'REGLAS LOCALES · SQL SEGURO';
    mode.className = 'mode-pill live';
  }
  if (summary) {
    summary.classList.remove('error');
    summary.textContent = result.summary;
  }
  const title = $('#result-title');
  if (title) {
    title.textContent = spec.kind === 'ranking'
      ? 'Hallazgo principal'
      : spec.kind === 'comparison' ? 'Comparación de indicadores' : 'Serie consultada';
  }
  const sourceLine = $('#source-line');
  if (sourceLine) {
    sourceLine.hidden = false;
    sourceLine.replaceChildren();
    const codes = spec.indicator_codes.join(' · ');
    sourceLine.append(
      document.createTextNode('Fuente: Banco Mundial · World Development Indicators · '),
      make('code', '', codes),
      document.createTextNode(` · corte ${formatSnapshot(result.snapshot_date || DATA?.snapshot_date)}.`)
    );
  }
  renderInterpretation(spec);
  renderTable(rows, spec);
  renderChart(rows, spec);

  const details = $('#sql-details');
  if (details) details.hidden = false;
  const sqlCode = $('#sql-code');
  if (sqlCode) sqlCode.textContent = result.sql || '';
  const sqlParams = $('#sql-params');
  if (sqlParams) sqlParams.textContent = JSON.stringify(result.parameters || []);
  const stack = $('#execution-stack');
  if (stack) stack.textContent = local ? 'Vista local · JSON' : 'Python · FastAPI · SQLite';
  const note = $('#sql-note');
  if (note) {
    note.textContent = local
      ? 'Consulta de demostración: el HTML local simula la plantilla sobre data.json y no ejecuta SQL. El backend Python ejecuta SQL real con conexión de solo lectura.'
      : `${result.safety || 'SQL parametrizado en SQLite de solo lectura'} · Corte de datos ${formatSnapshot(result.snapshot_date)}.`;
  }
  selectCodeTab('sql');
}

async function runLocal(question, note) {
  const data = DATA || await loadData(Promise.resolve());
  const spec = parseQuestion(question);
  const rows = simulate(spec, data);
  const query = makeSql(spec);
  return {
    spec,
    rows,
    sql: query.sql,
    parameters: query.params,
    summary: summarize(spec, rows),
    summary_mode: 'simulación local sobre JSON',
    intent_mode: 'reglas-locales',
    sources: spec.indicator_codes.map((code) => sourceFor(code)).filter(Boolean),
    snapshot_date: data.snapshot_date,
    safety: 'plantilla local sobre JSON; no ejecuta SQL',
    engine: note,
    audit: 'local'
  };
}

async function run(question) {
  const clean = String(question || '').trim();
  if (clean.length < 5) {
    showError('Escribe una pregunta de al menos 5 caracteres.');
    $('#question')?.focus();
    return;
  }
  const button = $('#run');
  const mode = $('#mode');
  const summary = $('#summary');
  if (button) button.disabled = true;
  if (mode) {
    mode.textContent = 'INTERPRETANDO…';
    mode.className = 'mode-pill';
  }
  if (summary) {
    summary.classList.remove('error');
    summary.textContent = 'Identificando indicador, periodo y operación…';
  }

  try {
    if (FORCE_LOCAL) {
      showResult(await runLocal(clean, 'modo local forzado con ?local=1'), 'local');
      return;
    }
    if (api.available) {
      try {
        const result = await fetchJson(
          apiUrl(`/query?question=${encodeURIComponent(clean)}`),
          {},
          30000
        );
        showResult(result, 'api');
        return;
      } catch (error) {
        if (error instanceof ApiError && error.status === 422) {
          showError(error.message);
          return;
        }
        const status = $('#api-status');
        if (status) {
          status.textContent = 'La API no respondió; se usó el snapshot local.';
          status.className = 'api-status is-local';
        }
      }
    }
    showResult(await runLocal(clean, 'snapshot local; API no disponible'), 'local');
  } catch (error) {
    showError(error.message || 'No se pudo interpretar la pregunta.');
  } finally {
    if (button) button.disabled = false;
  }
}

function selectCodeTab(name, focus = false) {
  $$('[data-code-tab]').forEach((button) => {
    const active = button.dataset.codeTab === name;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
    if (active && focus) button.focus();
  });
  const sqlPane = $('#sql-pane');
  const pythonPane = $('#python-pane');
  if (sqlPane) sqlPane.hidden = name !== 'sql';
  if (pythonPane) pythonPane.hidden = name !== 'python';
}

function initControls() {
  $('#query-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    run($('#question')?.value || '');
  });
  $$('[data-q]').forEach((button) => {
    button.addEventListener('click', () => {
      const question = button.dataset.q;
      const input = $('#question');
      if (input) input.value = question;
      run(question);
    });
  });
  $('#question')?.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      run($('#question').value);
    }
  });
  $$('[data-code-tab]').forEach((button) => {
    button.addEventListener('click', () => selectCodeTab(button.dataset.codeTab, true));
    button.addEventListener('keydown', (event) => {
      const order = ['sql', 'python'];
      const index = order.indexOf(button.dataset.codeTab);
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % order.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + order.length) % order.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = order.length - 1;
      selectCodeTab(order[next], true);
    });
  });
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    if (resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (DATA && $('#chart') && !$('#chart')?.hidden) {
        const result = window.__copilotoLastResult;
        if (result) renderChart(result.rows, result.spec);
      }
    }, 120);
  });
}

async function start() {
  initControls();
  const apiReady = checkApi();
  await loadData(apiReady);
  if (params.get('q')) {
    const initial = params.get('q');
    const input = $('#question');
    if (input) input.value = initial;
    await run(initial);
  }
}

start();
