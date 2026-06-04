// SPDX-License-Identifier: MPL-2.0
// Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
/**
 * Observability Framework for UbiCity
 * Privacy-first metrics and logging (local only, no telemetry)
 *
 * Platinum RSR Requirement: Observability for performance monitoring
 *
 * NOTE: de-TypeScripted from observability.ts (issue #122 / ubicity#30 —
 * no `.ts` in src/). Pure JS runtime glue (Array HOFs, Date, performance,
 * Deno.env): faithfully type-stripped to plain ESM rather than ported to
 * AffineScript, which would require re-implementing the JS runtime. The
 * AffineScript showcase for this migration is storage.js / wasm-bridge.js.
 * Behaviour is byte-for-byte identical to the former .ts.
 */

/**
 * Local metrics collector (no remote telemetry)
 */
export class MetricsCollector {
  #metrics = [];
  #maxMetrics = 1000; // Circular buffer

  record(name, value, labels) {
    this.#metrics.push({
      name,
      value,
      timestamp: new Date().toISOString(),
      labels,
    });

    // Circular buffer: keep only last N metrics
    if (this.#metrics.length > this.#maxMetrics) {
      this.#metrics.shift();
    }
  }

  get(name) {
    return this.#metrics.filter((m) => m.name === name);
  }

  summary(name) {
    const values = this.get(name).map((m) => m.value).sort((a, b) => a - b);
    if (values.length === 0) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    const p = (pct) => values[Math.floor(values.length * pct / 100)] || 0;

    return {
      count: values.length,
      min: values[0],
      max: values[values.length - 1],
      avg: sum / values.length,
      p50: p(50),
      p95: p(95),
      p99: p(99),
    };
  }

  clear() {
    this.#metrics = [];
  }

  export() {
    return [...this.#metrics];
  }
}

/**
 * Structured logger (local only, no remote logging)
 */
export class Logger {
  #logs = [];
  #maxLogs = 500;
  #minLevel = 'info';

  constructor(minLevel = 'info') {
    this.#minLevel = minLevel;
  }

  #log(level, message, context) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    if (levels[level] < levels[this.#minLevel]) return;

    const entry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    this.#logs.push(entry);

    // Circular buffer
    if (this.#logs.length > this.#maxLogs) {
      this.#logs.shift();
    }

    // Console output
    const emoji = { debug: '🔍', info: 'ℹ️ ', warn: '⚠️ ', error: '❌' };
    console.log(
      `${emoji[level]} [${entry.timestamp}] ${message}`,
      context || '',
    );
  }

  debug(message, context) {
    this.#log('debug', message, context);
  }

  info(message, context) {
    this.#log('info', message, context);
  }

  warn(message, context) {
    this.#log('warn', message, context);
  }

  error(message, context) {
    this.#log('error', message, context);
  }

  export() {
    return [...this.#logs];
  }

  clear() {
    this.#logs = [];
  }
}

/**
 * Performance timer
 */
export class Timer {
  #start;

  constructor() {
    this.#start = performance.now();
  }

  elapsed() {
    return performance.now() - this.#start;
  }

  stop() {
    return this.elapsed();
  }
}

/**
 * Global observability instance (singleton)
 */
export const metrics = new MetricsCollector();
export const logger = new Logger(
  Deno.env.get('UBICITY_LOG_LEVEL') || 'info',
);

/**
 * Measure function execution time
 */
export async function measure(name, fn) {
  const timer = new Timer();
  try {
    const result = await fn();
    const elapsed = timer.stop();
    metrics.record(name, elapsed, { status: 'success' });
    logger.debug(`${name} completed`, { duration_ms: elapsed });
    return result;
  } catch (error) {
    const elapsed = timer.stop();
    metrics.record(name, elapsed, { status: 'error' });
    logger.error(`${name} failed`, { duration_ms: elapsed, error });
    throw error;
  }
}
