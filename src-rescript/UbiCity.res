// ReScript types for UbiCity domain model
// Compiles to highly optimized JavaScript

module Coordinates = {
  type t = {
    latitude: float,
    longitude: float,
  }

  let make = (~latitude: float, ~longitude: float): option<t> => {
    if latitude >= -90.0 && latitude <= 90.0 && longitude >= -180.0 && longitude <= 180.0 {
      Some({latitude, longitude})
    } else {
      None
    }
  }

  let isValid = (coords: t): bool => {
    coords.latitude >= -90.0 &&
    coords.latitude <= 90.0 &&
    coords.longitude >= -180.0 &&
    coords.longitude <= 180.0
  }
}

module Location = {
  type t = {
    name: string,
    coordinates: option<Coordinates.t>,
    @as("type") type_: option<string>,
    address: option<string>,
  }

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
  type t = {
    id: string,
    name: option<string>,
    interests: option<array<string>>,
  }

  let make = (~id: string, ~name=?, ~interests=?, ()): result<t, string> => {
    if id->String.length == 0 {
      Error("Learner ID is required")
    } else {
      Ok({id, name, interests})
    }
  }
}

module Context = {
  type t = {
    location: Location.t,
    situation: option<string>,
    connections: option<array<string>>,
    timeOfDay: option<[#morning | #afternoon | #evening | #night]>,
  }

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
  type t = {
    success: option<bool>,
    connections_made: option<array<string>>,
    next_questions: option<array<string>>,
    artifacts: option<array<string>>,
  }

  let empty: t = {
    success: None,
    connections_made: None,
    next_questions: None,
    artifacts: None,
  }
}

module ExperienceData = {
  type intensity = [#low | #medium | #high]

  type t = {
    @as("type") type_: string,
    description: string,
    domains: option<array<string>>,
    outcome: option<Outcome.t>,
    duration: option<int>,
    intensity: option<intensity>,
  }

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
  type level = [#private | #anonymous | #public]

  type t = {
    level: level,
    shareableWith: option<array<string>>,
  }

  let makeAnonymous: t = {level: #anonymous, shareableWith: None}
}

module LearningExperience = {
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

  let generateId = (): string => {
    // Generate UUID v4 using crypto API
    let uuid = Crypto.randomUUID()
    "ubi-" ++ uuid
  }

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

// Functional utilities for analysis
module Analysis = {
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

  let groupByLocation = (
    experiences: array<LearningExperience.t>,
  ): Map.t<string, array<LearningExperience.t>> => {
    experiences->Array.reduce(Map.String.empty, (acc, exp) => {
      let locationName = exp.context.location.name
      let existing = acc->Map.String.get(locationName)->Option.getOr([])
      acc->Map.String.set(locationName, existing->Array.concat([exp]))
    })
  }

  let groupByLearner = (
    experiences: array<LearningExperience.t>,
  ): Map.t<string, array<LearningExperience.t>> => {
    experiences->Array.reduce(Map.String.empty, (acc, exp) => {
      let learnerId = exp.learner.id
      let existing = acc->Map.String.get(learnerId)->Option.getOr([])
      acc->Map.String.set(learnerId, existing->Array.concat([exp]))
    })
  }

  let calculateDiversity = (experiences: array<LearningExperience.t>): int => {
    let domains = experiences->Array.reduce(Set.String.empty, (acc, exp) => {
      switch exp.experience.domains {
      | Some(doms) => doms->Array.reduce(acc, (acc2, domain) => acc2->Set.String.add(domain))
      | None => acc
      }
    })
    domains->Set.String.size
  }
}
