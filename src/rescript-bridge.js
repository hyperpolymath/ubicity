// SPDX-License-Identifier: MPL-2.0
// Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
/**
 * Bridge to ReScript-compiled modules
 * Imports the optimized JavaScript generated from ReScript
 *
 * NOTE: de-TypeScripted from rescript-bridge.ts (issue #122 / ubicity#30
 * — no `.ts` in src/). This is ReScript-interop glue; it is deliberately
 * NOT ported to AffineScript (that would re-implement a ReScript bridge
 * and cross the estate's ReScript-hands-off boundary). Faithful plain
 * ESM type-strip; runtime behaviour unchanged. The TS `export type {...}`
 * re-export is dropped (type-only; consumers were .ts which src/ no
 * longer permits).
 */

// ReScript compiles to ES6 modules with .res.js extension.
import * as UbiCity from '../src-rescript/UbiCity.res.js';

/**
 * Create a validated learning experience using ReScript's type system
 */
export function createLearningExperience(data) {
  // Use ReScript's make functions with strong typing
  const learner = UbiCity.Learner.make(
    data.learner.id,
    data.learner.name,
    data.learner.interests,
  );

  if (learner.TAG === 'Error') {
    throw new Error(learner._0);
  }

  const location = UbiCity.Location.make(
    data.context.location.name,
    data.context.location.coordinates,
  );

  if (location.TAG === 'Error') {
    throw new Error(location._0);
  }

  const context = UbiCity.Context.make(
    location._0,
    data.context.situation,
    data.context.connections,
  );

  const experience = UbiCity.ExperienceData.make(
    data.experience.type,
    data.experience.description,
    data.experience.domains,
  );

  if (experience.TAG === 'Error') {
    throw new Error(experience._0);
  }

  return UbiCity.LearningExperience.make(
    data.id,
    data.timestamp,
    learner._0,
    context,
    experience._0,
    data.privacy,
    data.tags,
  );
}

/**
 * Functional analysis using ReScript
 */
export const Analysis = {
  findInterdisciplinary: UbiCity.Analysis.findInterdisciplinary,
  groupByLocation: UbiCity.Analysis.groupByLocation,
  groupByLearner: UbiCity.Analysis.groupByLearner,
  calculateDiversity: UbiCity.Analysis.calculateDiversity,
};
