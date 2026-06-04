// SPDX-License-Identifier: MPL-2.0
// Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
/**
 * Bridge to WASM modules for performance-critical operations
 * Loads and initializes the Rust-compiled WASM
 *
 * NOTE: de-TypeScripted from wasm-bridge.ts (issue #122 / ubicity#30 —
 * no `.ts` in src/). This is WebAssembly-runtime glue (instantiate +
 * opaque-export method calls + JSON marshalling) with no importers in
 * src/ or tests/ — pure runtime plumbing, not algorithm. Faithfully
 * type-stripped to plain ESM rather than ported to AffineScript (the
 * #122 AffineScript showcase is storage.js). Behaviour unchanged.
 */

let wasmModule = null;

export async function initWasm() {
  if (wasmModule) return;

  // Load WASM module
  const wasmPath = new URL('../wasm/pkg/ubicity_wasm_bg.wasm', import.meta.url);
  const wasmBytes = await Deno.readFile(wasmPath);
  const wasmResult = await WebAssembly.instantiate(wasmBytes);

  // Initialize exports
  const { instance } = wasmResult;
  wasmModule = instance.exports;
}

/**
 * High-performance validation using WASM
 */
export function validateExperienceWasm(experience) {
  if (!wasmModule) {
    throw new Error('WASM module not initialized. Call initWasm() first.');
  }

  const json = JSON.stringify(experience);
  const result = wasmModule.validate(json);
  return JSON.parse(result);
}

/**
 * High-performance domain network generation using WASM
 */
export function generateDomainNetworkWasm(experiences) {
  if (!wasmModule) {
    throw new Error('WASM module not initialized. Call initWasm() first.');
  }

  const json = JSON.stringify(experiences);
  const result = wasmModule.generate_domain_network(json);
  return JSON.parse(result);
}

/**
 * High-performance Jaccard similarity using WASM
 */
export function jaccardSimilarityWasm(set1, set2) {
  if (!wasmModule) {
    throw new Error('WASM module not initialized. Call initWasm() first.');
  }

  const json1 = JSON.stringify(set1);
  const json2 = JSON.stringify(set2);
  return wasmModule.jaccard_similarity(json1, json2);
}

// Auto-initialize on import (can be disabled if needed)
// await initWasm();
