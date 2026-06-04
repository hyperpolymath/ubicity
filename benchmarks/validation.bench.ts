// SPDX-License-Identifier: MPL-2.0
// Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
/**
 * Validation performance benchmarks
 * SLO: < 1ms per experience validation (WASM target)
 */

Deno.bench('Validation - Single experience (baseline)', () => {
  const experience = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    learner: { id: 'learner-123', name: 'Test' },
    context: {
      location: { name: 'Makerspace', type: 'makerspace' },
    },
    experience: {
      type: 'workshop',
      domain: ['electronics'],
      description: 'Built circuit',
    },
  };

  // Basic validation (type checking)
  if (!experience.id || !experience.learner || !experience.context) {
    throw new Error('Invalid');
  }
});

Deno.bench('Validation - Batch 100 experiences', () => {
  const experiences = Array.from({ length: 100 }, (_, i) => ({
    id: `exp-${i}`,
    timestamp: new Date().toISOString(),
    learner: { id: `learner-${i}` },
    context: { location: { name: 'Test Location' } },
    experience: { type: 'workshop', domain: ['test'], description: 'Test' },
  }));

  experiences.forEach((exp) => {
    if (!exp.id || !exp.learner || !exp.context) {
      throw new Error('Invalid');
    }
  });
});

Deno.bench('Validation - Complex nested structure', () => {
  const complex = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    learner: {
      id: 'learner-123',
      name: 'Alice Johnson',
      demographics: {
        age: 25,
        location: 'SF',
      },
    },
    context: {
      location: {
        name: 'Mission Makerspace',
        type: 'makerspace',
        coordinates: { lat: 37.77, lon: -122.42 },
        capacity: 50,
      },
      timestamp: new Date().toISOString(),
      collaborators: ['bob', 'charlie'],
    },
    experience: {
      type: 'project',
      domain: ['electronics', 'art', 'sculpture'],
      description: 'Multi-domain project',
      duration: 120,
      tags: ['beginner', 'collaborative'],
    },
  };

  if (!complex.id || !complex.learner || !complex.context) {
    throw new Error('Invalid');
  }
});

/**
 * Performance SLOs (Service Level Objectives)
 *
 * Target: WASM validation
 * - Single validation: < 0.002ms (2μs)
 * - Batch 100: < 0.5ms total
 * - Complex nested: < 0.005ms
 *
 * Current: TypeScript baseline
 * - Measure and compare against SLOs
 */
