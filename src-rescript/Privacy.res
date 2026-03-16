// SPDX-License-Identifier: PMPL-1.0-or-later
// UbiCity Privacy and Anonymization Utilities
// This module provides tools to scrub PII (Personally Identifiable Information) 
// from captured learning data while preserving analytical utility.

open UbiCity

// Configuration for learner anonymization.
type anonymizeLearnerOptions = {
  preserveIds: bool, // Keep original IDs if needed for internal tracking
  hashIds: bool, // Deterministically hash IDs to track the same learner across sessions
  removeName: bool, // Strip 'name' field
  removeInterests: bool, // Strip 'interests' field
}

// Configuration for location blurring.
type anonymizeLocationOptions = {
  fuzzyCoordinates: bool, // Round coordinates to reduce precision
  fuzzRadius: float, // The rounding factor (e.g., 0.01 degrees)
  removeAddress: bool, // Strip physical address
  generalizeType: bool, // Convert specific place names to general categories
}

type anonymizationLevel = Full | Partial | None_

module Crypto = {
  @module("crypto") @val external randomUUID: unit => string = "randomUUID"
}

// HASHING: Implementation of the DJB2 algorithm for deterministic ID blurring.
let hashString = (str: string): string => {
  let hash = ref(5381)

  for i in 0 to str->String.length - 1 {
    let char = str->String.charCodeAt(i)->Int.fromFloat
    let shifted = hash.contents * 33
    hash := shifted + char
  }

  Math.abs(Int.toFloat(hash.contents))->Float.toString(~radix=16)->String.slice(~start=0, ~end=8)
}

// FFI: Regex-based text replacement.
@send external replaceRegex: (string, Js.Re.t, string) => string = "replace"

// SCRUBBING: Replaces common PII patterns (emails, phones, URLs) with placeholders.
let sanitizeText = (text: string): string => {
  let maxLength = 10000
  let sanitized = text->String.length > maxLength ? text->String.slice(~start=0, ~end=maxLength) : text

  // PATTERN: Email addresses
  let sanitized = sanitized->replaceRegex(%re("/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/g"), "[email]")

  // PATTERN: Phone numbers
  let sanitized = sanitized->replaceRegex(%re("/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g"), "[phone]")

  // PATTERN: URLs (potentially containing tracking parameters)
  let sanitized = sanitized->replaceRegex(%re("/https?:\/\/[^\s]{1,2000}/g"), "[url]")

  // PATTERN: Common name-revealing phrases
  sanitized->replaceRegex(
    %re("/\b(I met|met with|talked to|spoke with)\s+([A-Z][a-z]+)\b/g"),
    "$1 [person]",
  )
}

// PIPELINE: Anonymizes the learner profile.
let anonymizeLearner = (
  experience: LearningExperience.t,
  options: option<anonymizeLearnerOptions>,
): LearningExperience.t => {
  let opts = options->Option.getOr({
    preserveIds: false,
    hashIds: true,
    removeName: true,
    removeInterests: false,
  })

  let newLearnerId = if !opts.preserveIds {
    if opts.hashIds {
      "anon-" ++ hashString(experience.learner.id)
    } else {
      "anon-" ++ Crypto.randomUUID()->String.slice(~start=0, ~end=8)
    }
  } else {
    experience.learner.id
  }

  let newName = if opts.removeName { None } else { experience.learner.name }
  let newInterests = if opts.removeInterests { None } else { experience.learner.interests }

  {
    ...experience,
    learner: {
      id: newLearnerId,
      name: newName,
      interests: newInterests,
    },
  }
}

// PIPELINE: Blurs location data to protect physical privacy.
let anonymizeLocation = (
  experience: LearningExperience.t,
  options: option<anonymizeLocationOptions>,
): LearningExperience.t => {
  let opts = options->Option.getOr({
    fuzzyCoordinates: true,
    fuzzRadius: 0.01, // ~1.1km precision
    removeAddress: true,
    generalizeType: false,
  })

  let newCoordinates = switch experience.context.location.coordinates {
  | Some(coords) if opts.fuzzyCoordinates => {
      // GRID-BASED FUZZING: Snap coordinates to a grid defined by fuzzRadius.
      let latitude = Math.round(coords.latitude /. opts.fuzzRadius) *. opts.fuzzRadius
      let longitude = Math.round(coords.longitude /. opts.fuzzRadius) *. opts.fuzzRadius
      let fuzzed: Coordinates.t = {latitude, longitude}
      Some(fuzzed)
    }
  | coords => coords
  }

  let newAddress = if opts.removeAddress { None } else { experience.context.location.address }

  let newType = switch experience.context.location.type_ {
  | Some(t) if opts.generalizeType => {
      // GENERALIZATION: Map specific place types to high-level categories.
      let generalizations = Dict.fromArray([
        ("coffee shop", "cafe"),
        ("library branch", "library"),
        ("university", "educational institution"),
      ])

      let lower = t->String.toLowerCase
      Some(generalizations->Dict.get(lower)->Option.getOr(t))
    }
  | t => t
  }

  {
    ...experience,
    context: {
      ...experience.context,
      location: {
        ...experience.context.location,
        coordinates: newCoordinates,
        address: newAddress,
        type_: newType,
      },
    },
  }
}

// PIPELINE: Scrub all free-text fields for PII.
let removePII = (experience: LearningExperience.t): LearningExperience.t => {
  let newConnections = switch experience.context.connections {
  | Some(conns) => Some(conns->Array.mapWithIndex((_name, i) => `person-${Int.toString(i + 1)}`))
  | None => None
  }

  let newDescription = sanitizeText(experience.experience.description)

  let newOutcome = switch experience.experience.outcome {
  | Some(outcome) =>
    Some({
      ...outcome,
      connections_made: outcome.connections_made->Option.map(arr => arr->Array.map(sanitizeText)),
      next_questions: outcome.next_questions->Option.map(arr => arr->Array.map(sanitizeText)),
    })
  | None => None
  }

  {
    ...experience,
    context: { ...experience.context, connections: newConnections },
    experience: { ...experience.experience, description: newDescription, outcome: newOutcome },
  }
}

// Orchestrates the entire anonymization process.
let fullyAnonymize = (
  experience: LearningExperience.t,
  options: option<fullAnonymizationOptions>,
): LearningExperience.t => {
  let opts = options->Option.getOr({learner: None, location: None})

  experience
  ->anonymizeLearner(opts.learner)
  ->anonymizeLocation(opts.location)
  ->removePII
  ->(result => {
    ...result,
    privacy: Some({ level: #anonymous, shareableWith: None }),
  })
}
