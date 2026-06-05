#!/usr/bin/env node

const DEFAULT_BASE_URL = "http://localhost:3000";
const DEFAULT_ITERATIONS = 10;
const DEFAULT_CONCURRENCY = 2;

const scenarios = {
  home: "/api/public/popular?offset=0&limit=12&tag=RPG&store=steam",
  search: "/api/search?q=hades&country=KR&tag=Action&store=steam",
  deals: "/api/deals?country=KR&store=steam&minDiscount=20&sort=reviews&limit=12"
};

function printHelp() {
  console.log(`Public route load smoke

Usage:
  node scripts/load-public-routes.mjs [options]

Options:
  --base-url <url>       Target app URL. Default: ${DEFAULT_BASE_URL}
  --scenario <name>      all, home, search, or deals. Default: all
  --iterations <count>   Requests per scenario. Default: ${DEFAULT_ITERATIONS}
  --concurrency <count>  Parallel requests per scenario. Default: ${DEFAULT_CONCURRENCY}
  --warmup <count>       Warmup requests before measuring. Default: 1
  --help                 Show this help

Recommended local setup:
  ITAD_ENABLE_LOCAL_DEV=false npm run dev
`);
}

function parseArgs(argv) {
  const options = {
    baseUrl: DEFAULT_BASE_URL,
    scenario: "all",
    iterations: DEFAULT_ITERATIONS,
    concurrency: DEFAULT_CONCURRENCY,
    warmup: 1
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--help") {
      return { ...options, help: true };
    }

    if (arg === "--base-url" && next) {
      options.baseUrl = next;
      index += 1;
      continue;
    }

    if (arg === "--scenario" && next) {
      options.scenario = next;
      index += 1;
      continue;
    }

    if (arg === "--iterations" && next) {
      options.iterations = Math.max(1, Number.parseInt(next, 10) || DEFAULT_ITERATIONS);
      index += 1;
      continue;
    }

    if (arg === "--concurrency" && next) {
      options.concurrency = Math.max(1, Number.parseInt(next, 10) || DEFAULT_CONCURRENCY);
      index += 1;
      continue;
    }

    if (arg === "--warmup" && next) {
      options.warmup = Math.max(0, Number.parseInt(next, 10) || 0);
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  if (options.scenario !== "all" && !scenarios[options.scenario]) {
    throw new Error(`Unknown scenario: ${options.scenario}`);
  }

  return options;
}

function percentile(values, ratio) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1);

  return sorted[index];
}

function increment(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

async function requestScenario(baseUrl, scenarioName, path) {
  const startedAt = performance.now();
  const response = await fetch(new URL(path, baseUrl), {
    headers: {
      Accept: "application/json",
      Cookie: "gdw_anonymous_id=load-smoke"
    }
  });
  const durationMs = Math.round(performance.now() - startedAt);
  const cacheStatus =
    response.headers.get("X-Cache") ??
    response.headers.get("X-Search-Cache") ??
    response.headers.get("X-Deals-Cache") ??
    response.headers.get("X-API-Cache") ??
    "none";

  await response.arrayBuffer();

  return {
    scenarioName,
    status: response.status,
    cacheStatus,
    durationMs
  };
}

async function runPool(tasks, concurrency) {
  const results = [];
  let cursor = 0;

  async function worker() {
    while (cursor < tasks.length) {
      const current = tasks[cursor];
      cursor += 1;
      results.push(await current());
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker));

  return results;
}

async function runScenario(baseUrl, scenarioName, path, options) {
  for (let index = 0; index < options.warmup; index += 1) {
    await requestScenario(baseUrl, scenarioName, path);
  }

  const tasks = Array.from({ length: options.iterations }, () => () =>
    requestScenario(baseUrl, scenarioName, path)
  );
  const results = await runPool(tasks, options.concurrency);
  const durations = results.map((result) => result.durationMs);
  const statuses = new Map();
  const cache = new Map();

  for (const result of results) {
    increment(statuses, String(result.status));
    increment(cache, result.cacheStatus);
  }

  return {
    scenario: scenarioName,
    requests: results.length,
    status: Object.fromEntries(statuses),
    cache: Object.fromEntries(cache),
    minMs: Math.min(...durations),
    p50Ms: percentile(durations, 0.5),
    p95Ms: percentile(durations, 0.95),
    maxMs: Math.max(...durations)
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const selectedScenarios = options.scenario === "all"
    ? Object.entries(scenarios)
    : [[options.scenario, scenarios[options.scenario]]];
  const results = [];

  for (const [scenarioName, path] of selectedScenarios) {
    results.push(await runScenario(options.baseUrl, scenarioName, path, options));
  }

  console.log(JSON.stringify({
    baseUrl: options.baseUrl,
    iterations: options.iterations,
    concurrency: options.concurrency,
    warmup: options.warmup,
    results
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
