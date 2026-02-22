// ReScript types for UbiCity domain model
// These modules define the core data structures used throughout the application.
// The ReScript compiler generates highly optimized and type-safe JavaScript from these definitions.

module Coordinates = {
  // Representation of a physical location on Earth using latitude and longitude.
  type t = {
    latitude: float,
    longitude: float,
  }

  // Safe constructor for coordinates. Ensures values are within valid geographic bounds.
  let make = (~latitude: float, ~longitude: float): option<t> => {
    if latitude >= -90.0 && latitude <= 90.0 && longitude >= -180.0 && longitude <= 180.0 {
      Some({latitude, longitude})
    } else {
      None
    }
  }

  // Runtime validation for coordinates.
  let isValid = (coords: t): bool => {
    coords.latitude >= -90.0 &&
    coords.latitude <= 90.0 &&
    coords.longitude >= -180.0 &&
    coords.longitude <= 180.0
  }
}

module Location = {
  // A named place where learning occurs.
  type t = {
    name: string,
    coordinates: option<Coordinates.t>,
    @as("type") type_: option<string>, // e.g., "makerspace", "library"
    address: option<string>,
  }

  // Factory function for Location with basic validation on the 'name' field.
  let make = (~name: string, ~coordinates=?, ~type_=?, ~address=?, ()): result<t, string> => {
    if name->String.length == 0 {
      Error("Location name is required")
    } else {
      Ok({
        name,
        coordinates,
        type_,
        address,
      })
    }
  }
}

module Learner = {
  // The person engaged in the learning experience.
  type t = {
    id: string, // Unique identifier or pseudonym
    name: option<string>,
    interests: option<array<string>>,
  }

  // Factory function for Learner.
  let make = (~id: string, ~name=?, ~interests=?, ()): result<t, string> => {
    if id->String.length == 0 {
      Error("Learner ID is required")
    } else {
      Ok({id, name, interests})
    }
  }
}

module Context = {
  // The situational context of the learning event.
  type t = {
    location: Location.t,
    situation: option<string>, // Description of what was happening
    connections: option<array<string>>, // People involved (pseudonyms or IDs)
    timeOfDay: option<[#morning | #afternoon | #evening | #night]>,
  }

  // Constructor for learning context.
  let make = (
    ~location: Location.t,
    ~situation=?,
    ~connections=?,
    ~timeOfDay=?,
    (),
  ): t => {
    {location, situation, connections, timeOfDay}
  }
}

module Outcome = {
  // The result or impact of the learning experience.
  type t = {
    success: option<bool>,
    connections_made: option<array<string>>, // New insights or links identified
    next_questions: option<array<string>>, // Questions that emerged from the experience
    artifacts: option<array<string>>, // Created items (URLs, file paths, etc.)
  }

  // Default empty outcome.
  let empty: t = {
    success: None,
    connections_made: None,
    next_questions: None,
    artifacts: None,
  }
}

module ExperienceData = {
  // Quantitative/Qualitative data describing the learning activity.
  type intensity = [#low | #medium | #high]

  type t = {
    @as("type") type_: string, // e.g., "experiment", "reading"
    description: string,
    domains: option<array<string>>, // Subject areas involved
    outcome: option<Outcome.t>,
    duration: option<int>, // Duration in minutes
    intensity: option<intensity>,
  }

  // Factory function for experience data.
  let make = (
    ~type_: string,
    ~description: string,
    ~domains=?,
    ~outcome=?,
    ~duration=?,
    ~intensity=?,
    (),
  ): result<t, string> => {
    if type_->String.length == 0 {
      Error("Experience type is required")
    } else if description->String.length == 0 {
      Error("Description is required")
    } else {
      Ok({type_, description, domains, outcome, duration, intensity})
    }
  }
}

module Privacy = {
  // Privacy preferences for the learning data.
  type level = [#\"private" | #anonymous | #public]

  type t = {
    level: level,
    shareableWith: option<array<string>>, // Specific groups or individuals
  }

  // Helper for anonymous-by-default logic.
  let makeAnonymous: t = {level: #anonymous, shareableWith: None}
}

module LearningExperience = {
  // The top-level container for a complete UbiCity learning capture.
  type t = {
    id: string,
    timestamp: string,
    learner: Learner.t,
    context: Context.t,
    experience: ExperienceData.t,
    privacy: option<Privacy.t>,
    tags: option<array<string>>,
    version: string,
  }

  // FFI: Bindings to Node.js crypto API for ID generation.
  module Crypto = {
    @module("crypto") @val external randomUUID: unit => string = "randomUUID"
  }

  // ID GENERATION: Creates a unique identifier with the 'ubi-' prefix.
  let generateId = (): string => {
    let uuid = Crypto.randomUUID()
    "ubi-" ++ uuid
  }

  // PRIMARY CONSTRUCTOR: Aggregates all components into a LearningExperience object.
  let make = (
    ~id=?,
    ~timestamp=?,
    ~learner: Learner.t,
    ~context: Context.t,
    ~experience: ExperienceData.t,
    ~privacy=?,
    ~tags=?,
    ~version="0.3.0",
    (),
  ): t => {
    let id = id->Option.getOr(generateId())
    let timestamp = timestamp->Option.getOr(Date.now()->Float.toString)

    {id, timestamp, learner, context, experience, privacy, tags, version}
  }
}

// ANALYSIS ENGINE: Functional utilities for processing learning datasets.
module Analysis = {
  // Returns experiences that involve more than one domain.
  let findInterdisciplinary = (experiences: array<LearningExperience.t>): array<
    LearningExperience.t,
  > => {
    experiences->Array.filter(exp => {
      switch exp.experience.domains {
      | Some(domains) => domains->Array.length > 1
      | None => false
      }
    })
  }

  // Group experiences by the location name.
  let groupByLocation = (
    experiences: array<LearningExperience.t>,
  ): Dict.t<array<LearningExperience.t>> => {
    experiences->Array.reduce(Dict.make(), (acc, exp) => {
      let locationName = exp.context.location.name
      let existing = acc->Dict.get(locationName)->Option.getOr([])
      acc->Dict.set(locationName, existing->Array.concat([exp]))
      acc
    })
  }

  // Group experiences by the learner identifier.
  let groupByLearner = (
    experiences: array<LearningExperience.t>,
  ): Dict.t<array<LearningExperience.t>> => {
    experiences->Array.reduce(Dict.make(), (acc, exp) => {
      let learnerId = exp.learner.id
      let existing = acc->Dict.get(learnerId)->Option.getOr([])
      acc->Dict.set(learnerId, existing->Array.concat([exp]))
      acc
    })
  }

  // Calculates the number of unique domains represented in a dataset.
  let calculateDiversity = (experiences: array<LearningExperience.t>): int => {
    let domains = experiences->Array.reduce([], (acc, exp) => {
      switch exp.experience.domains {
      | Some(doms) => Array.concat(acc, doms)
      | None => acc
      }
    })
    // Get unique domains
    let uniqueDomains = domains->Array.reduce([], (acc, domain) => {
      if acc->Array.includes(domain) {
        acc
      } else {
        acc->Array.concat([domain])
      }
    })
    uniqueDomains->Array.length
  }
}
