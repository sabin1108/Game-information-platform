import { mkdir, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
const label = process.argv[2] ?? 'current';
const samples = [];
for (const q of ['hades', 'portal', 'stardew']) {
  const start = performance.now();
  const response = await fetch('http://localhost:3000/search?q=' + q, { signal: AbortSignal.timeout(30000) });
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let html = '', controlsMs, resultsMs;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    html += decoder.decode(value, { stream: true });
    if (controlsMs === undefined && /class="(?:deal-filters search-filters|search-controls)/.test(html)) controlsMs = performance.now() - start;
    if (resultsMs === undefined && /(?:data-search-results="true"|class="game-grid" aria-label="검색 결과")/.test(html)) resultsMs = performance.now() - start;
  }
  samples.push({ q, status: response.status, controlsMs: Math.round(controlsMs ?? -1), resultsMs: Math.round(resultsMs ?? -1), completeMs: Math.round(performance.now()-start), bytes: Buffer.byteLength(html) });
}
const result = { label, measuredAt: new Date().toISOString(), scope: 'Local production HTTP streaming, sequential three-query sample; not field Web Vitals or statistically controlled latency comparison.', samples };
await mkdir('.omx/artifacts/frontend', { recursive: true });
await writeFile('.omx/artifacts/frontend/search-' + label + '.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));