// SPDX-License-Identifier: AGPL-3.0-or-later
// UbiCity Privacy and Anonymization Utilities
// Respects learner privacy while maintaining analytical value

open UbiCity

type anonymizeLearnerOptions = {
  preserveIds: bool,
  hashIds: bool,
  removeName: bool,
  removeInterests: bool,
}

type anonymizeLocationOptions = {
  fuzzyCoordinates: bool,
  fuzzRadius: float,
  removeAddress: bool,
  generalizeType: bool,
}

type anonymizationLevel = Full | Partial | None_

module Crypto = {
  @module("crypto") @val external randomUUID: unit => string = "randomUUID"
}

// Hash string to consistent identifier (simple DJB2 hash)
let hashString = (str: string): string => {
  let hash = ref(5381)

  for i in 0 to str->String.length - 1 {
    let char = str->String.charCodeAt(i)->Int.fromFloat
    let shifted = hash.contents * 33
    hash := shifted + char
  }

  Math.abs(Int.toFloat(hash.contents))->Float.toString(~radix=16)->String.slice(~start=0, ~end=8)
}

// FFI bindings for JavaScript String.replace with regex
@send external replaceRegex: (string, Js.Re.t, string) => string = "replace"

// Sanitize text to remove common PII patterns
let sanitizeText = (text: string): string => {
  let maxLength = 10000
  let sanitized = text->String.length > maxLength ? text->String.slice(~start=0, ~end=maxLength) : text

  // Email addresses
  let sanitized = sanitized->replaceRegex(%re("/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/g"), "[email]")

  // Phone numbers
  let sanitized = sanitized->replaceRegex(%re("/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g"), "[phone]")

  // URLs
  let sanitized = sanitized->replaceRegex(%re("/https?:\/\/[^\s]{1,2000}/g"), "[url]")

  // Name patterns
  sanitized->replaceRegex(
    %re("/\b(I met|met with|talked to|spoke with)\s+([A-Z][a-z]+)\b/g"),
    "$1 [person]",
  )
}

// Anonymize learner data
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

  let newName = if opts.removeName {
    None
  } else {
    experience.learner.name
  }

  let newInterests = if opts.removeInterests {
    None
  } else {
    experience.learner.interests
  }

  {
    ...experience,
    learner: {
      id: newLearnerId,
      name: newName,
      interests: newInterests,
    },
  }
}

// Anonymize location data
let anonymizeLocation = (
  experience: LearningExperience.t,
  options: option<anonymizeLocationOptions>,
): LearningExperience.t => {
  let opts = options->Option.getOr({
    fuzzyCoordinates: true,
    fuzzRadius: 0.01, // ~1km
    removeAddress: true,
    generalizeType: false,
  })

  let newCoordinates = switch experience.context.location.coordinates {
  | Some(coords) if opts.fuzzyCoordinates => {
      let latitude = Math.round(coords.latitude /. opts.fuzzRadius) *. opts.fuzzRadius
      let longitude = Math.round(coords.longitude /. opts.fuzzRadius) *. opts.fuzzRadius
      let fuzzed: Coordinates.t = {latitude, longitude}
      Some(fuzzed)
    }
  | coords => coords
  }

  let newAddress = if opts.removeAddress {
    None
  } else {
    experience.context.location.address
  }

  let newType = switch experience.context.location.type_ {
  | Some(t) if opts.generalizeType => {
      let generalizations = Dict.fromArray([
        ("coffee shop", "cafe"),
        ("starbucks", "cafe"),
        ("library branch", "library"),
        ("community college", "educational institution"),
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

// Remove personally identifiable information
let removePII = (experience: LearningExperience.t): LearningExperience.t => {
  // Sanitize connections
  let newConnections = switch experience.context.connections {
  | Some(conns) => Some(conns->Array.mapWithIndex((_name, i) => `person-${Int.toString(i + 1)}`))
  | None => None
  }

  // Sanitize description
  let newDescription = sanitizeText(experience.experience.description)

  // Sanitize outcome
  let newOutcome = switch experience.experience.outcome {
  | Some(outcome) =>
    Some({
      ...outcome,
      connections_made: outcome.connections_made->Option.map(arr =>
        arr->Array.map(sanitizeText)
      ),
      next_questions: outcome.next_questions->Option.map(arr => arr->Array.map(sanitizeText)),
    })
  | None => None
  }

  {
    ...experience,
    context: {
      ...experience.context,
      connections: newConnections,
    },
    experience: {
      ...experience.experience,
      description: newDescription,
      outcome: newOutcome,
    },
  }
}

// Full anonymization options
type fullAnonymizationOptions = {
  learner: option<anonymizeLearnerOptions>,
  location: option<anonymizeLocationOptions>,
}

// Full anonymization pipeline
let fullyAnonymize = (
  experience: LearningExperience.t,
  options: option<fullAnonymizationOptions>,
): LearningExperience.t => {
  let opts = options->Option.getOr({learner: None, location: None})

  let result = experience
  let result = anonymizeLearner(result, opts.learner)
  let result = anonymizeLocation(result, opts.location)
  let result = removePII(result)

  // Set privacy level
  {
    ...result,
    privacy: Some({
      level: #anonymous,
      shareableWith: None,
    }),
  }
}

// Filter experiences by privacy level
let filterByPrivacyLevel = (
  experiences: array<LearningExperience.t>,
  ~includePrivate=false,
  (),
): array<LearningExperience.t> => {
  experiences->Array.filter(exp => {
    switch exp.privacy {
    | Some({level: #\"private"}) if !includePrivate => false
    | _ => true
    }
  })
}

// Generate shareable dataset
let generateShareableDataset = (
  experiences: array<LearningExperience.t>,
  ~includePrivate=false,
  ~anonymizationLevel=Full,
  (),
): array<LearningExperience.t> => {
  experiences
  ->filterByPrivacyLevel(~includePrivate, ())
  ->Array.map(exp => {
    switch anonymizationLevel {
    | Full => fullyAnonymize(exp, None)
    | Partial => anonymizeLearner(exp, None)
    | None_ => exp
    }
  })
}
