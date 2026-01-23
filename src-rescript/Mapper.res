// SPDX-License-Identifier: AGPL-3.0-or-later
// UbiCity Urban Knowledge Mapper (ReScript)
// Maps learning experiences across urban space

open UbiCity

module Storage = {
  type t

  @module("./storage.js")
  @new
  external make: string => t = "ExperienceStorage"

  @send
  external ensureDirectories: t => promise<unit> = "ensureDirectories"

  @send
  external saveExperience: (t, 'a) => promise<unit> = "saveExperience"

  @send
  external loadAllExperiences: t => promise<array<'a>> = "loadAllExperiences"

  @send
  external saveVisualization: (t, string, string) => promise<result<unit, string>> = "saveVisualization"
}

type indices = {
  location: Dict.t<array<string>>,
  domain: Dict.t<array<string>>,
  learner: Dict.t<array<string>>,
}

type t = {
  storage: Storage.t,
  experiences: Dict.t<LearningExperience.t>,
  indices: indices,
}

let make = (~storageDir="./ubicity-data", ()): promise<t> => {
  let storage = Storage.make(storageDir)
  let mapper = {
    storage,
    experiences: Dict.make(),
    indices: {
      location: Dict.make(),
      domain: Dict.make(),
      learner: Dict.make(),
    },
  }

  storage
  ->Storage.ensureDirectories
  ->Promise.then(() => Promise.resolve(mapper))
  ->Promise.catch(_ => Promise.resolve(mapper))
}

let addToIndex = (index: Dict.t<array<string>>, key: string, id: string): Dict.t<array<string>> => {
  let existing = index->Dict.get(key)->Option.getOr([])
  if existing->Array.includes(id) {
    index
  } else {
    index->Dict.set(key, existing->Array.concat([id]))
    index
  }
}

let updateIndices = (mapper: t, experience: LearningExperience.t): t => {
  let id = experience.id

  // Location index
  let locationIndex = addToIndex(
    mapper.indices.location,
    experience.context.location.name,
    id
  )

  // Domain index
  let domainIndex = switch experience.experience.domains {
  | Some(domains) =>
    domains->Array.reduce(mapper.indices.domain, (acc, domain) => {
      addToIndex(acc, domain, id)
    })
  | None => mapper.indices.domain
  }

  // Learner index
  let learnerIndex = addToIndex(
    mapper.indices.learner,
    experience.learner.id,
    id
  )

  {
    ...mapper,
    indices: {
      location: locationIndex,
      domain: domainIndex,
      learner: learnerIndex,
    },
  }
}

let captureExperience = (
  mapper: t,
  experience: LearningExperience.t,
): promise<result<string, string>> => {
  mapper.experiences->Dict.set(experience.id, experience)

  let updated = updateIndices(mapper, experience)

  // Convert experience to JS object for storage
  let experienceJs = {
    "id": experience.id,
    "timestamp": experience.timestamp,
    "version": experience.version,
    "learner": {
      "id": experience.learner.id,
      "name": experience.learner.name,
      "interests": experience.learner.interests,
    },
    "context": {
      "location": {
        "name": experience.context.location.name,
        "coordinates": experience.context.location.coordinates,
        "type": experience.context.location.type_,
        "address": experience.context.location.address,
      },
      "situation": experience.context.situation,
      "connections": experience.context.connections,
      "timeOfDay": experience.context.timeOfDay,
    },
    "experience": {
      "type": experience.experience.type_,
      "description": experience.experience.description,
      "domains": experience.experience.domains,
      "outcome": experience.experience.outcome,
      "duration": experience.experience.duration,
      "intensity": experience.experience.intensity,
    },
    "privacy": experience.privacy,
    "tags": experience.tags,
  }

  updated.storage
  ->Storage.saveExperience(experienceJs)
  ->Promise.then(() => Promise.resolve(Ok(experience.id)))
  ->Promise.catch(_ => Promise.resolve(Error("Failed to save experience")))
}

let getExperienceCount = (mapper: t): int => {
  mapper.experiences->Dict.keysToArray->Array.length
}

let loadAll = (mapper: t): promise<result<int, string>> => {
  mapper.storage
  ->Storage.loadAllExperiences
  ->Promise.then(experiencesData => {
    // TODO: Parse experience data from JS objects to ReScript types
    // For now, just return the count
    Promise.resolve(Ok(experiencesData->Array.length))
  })
  ->Promise.catch(_ => Promise.resolve(Error("Failed to load experiences")))
}

// Analysis functions using UbiCity.Analysis
let findInterdisciplinary = (mapper: t): array<LearningExperience.t> => {
  let experiences = mapper.experiences->Dict.valuesToArray
  Analysis.findInterdisciplinary(experiences)
}

let groupByLocation = (mapper: t): Dict.t<array<LearningExperience.t>> => {
  let experiences = mapper.experiences->Dict.valuesToArray
  Analysis.groupByLocation(experiences)
}

let groupByLearner = (mapper: t): Dict.t<array<LearningExperience.t>> => {
  let experiences = mapper.experiences->Dict.valuesToArray
  Analysis.groupByLearner(experiences)
}

let calculateDiversity = (mapper: t): int => {
  let experiences = mapper.experiences->Dict.valuesToArray
  Analysis.calculateDiversity(experiences)
}

// Find experiences by location
let findByLocation = (mapper: t, locationName: string): array<LearningExperience.t> => {
  switch mapper.indices.location->Dict.get(locationName) {
  | Some(ids) =>
    ids
    ->Array.map(id => mapper.experiences->Dict.get(id))
    ->Array.filterMap(x => x)
  | None => []
  }
}

// Find experiences by domain
let findByDomain = (mapper: t, domain: string): array<LearningExperience.t> => {
  switch mapper.indices.domain->Dict.get(domain) {
  | Some(ids) =>
    ids
    ->Array.map(id => mapper.experiences->Dict.get(id))
    ->Array.filterMap(x => x)
  | None => []
  }
}

// Find experiences by learner
let findByLearner = (mapper: t, learnerId: string): array<LearningExperience.t> => {
  switch mapper.indices.learner->Dict.get(learnerId) {
  | Some(ids) =>
    ids
    ->Array.map(id => mapper.experiences->Dict.get(id))
    ->Array.filterMap(x => x)
  | None => []
  }
}

// Get hotspot locations (most experiences)
let getHotspots = (mapper: t, ~limit=10, ()): array<(string, int)> => {
  mapper.indices.location
  ->Dict.toArray
  ->Array.map(((location, ids)) => (location, ids->Array.length))
  ->Array.toSorted((a, b) => {
    let (_, countA) = a
    let (_, countB) = b
    Float.fromInt(countB - countA)
  })
  ->Array.slice(~start=0, ~end=limit)
}

// Get top domains
let getTopDomains = (mapper: t, ~limit=10, ()): array<(string, int)> => {
  mapper.indices.domain
  ->Dict.toArray
  ->Array.map(((domain, ids)) => (domain, ids->Array.length))
  ->Array.toSorted((a, b) => {
    let (_, countA) = a
    let (_, countB) = b
    Float.fromInt(countB - countA)
  })
  ->Array.slice(~start=0, ~end=limit)
}

// Types for report generation
type reportSummary = {
  totalExperiences: int,
  uniqueLocations: int,
  uniqueDomains: int,
  uniqueLearners: int,
  interdisciplinaryExperiences: int,
}

type learningHotspot = {
  location: string,
  count: int,
  diversity: int,
  learners: int,
  domains: array<string>,
}

type domainNode = {
  id: string,
  size: int,
}

type domainEdge = {
  source: string,
  target: string,
  weight: int,
}

type domainNetwork = {
  nodes: array<domainNode>,
  edges: array<domainEdge>,
}

type locationData = {
  coordinates: option<Coordinates.t>,
  count: int,
  domains: array<string>,
}

type report = {
  summary: reportSummary,
  learningHotspots: array<learningHotspot>,
}

// Generate comprehensive report
let generateReport = (mapper: t): promise<result<report, string>> => {
  let experiences = mapper.experiences->Dict.valuesToArray

  let summary: reportSummary = {
    totalExperiences: experiences->Array.length,
    uniqueLocations: mapper.indices.location->Dict.keysToArray->Array.length,
    uniqueDomains: mapper.indices.domain->Dict.keysToArray->Array.length,
    uniqueLearners: mapper.indices.learner->Dict.keysToArray->Array.length,
    interdisciplinaryExperiences: Analysis.findInterdisciplinary(experiences)->Array.length,
  }

  let learningHotspots = mapper.indices.location
    ->Dict.toArray
    ->Array.map(((location, experienceIds)) => {
      let locationExps = experienceIds
        ->Array.map(id => mapper.experiences->Dict.get(id))
        ->Array.filterMap(x => x)

      let domains = locationExps
        ->Array.reduce([], (acc, exp) => {
          switch exp.experience.domains {
          | Some(doms) => Array.concat(acc, doms)
          | None => acc
          }
        })
        ->Array.reduce([], (acc, d) => {
          if acc->Array.includes(d) {acc} else {acc->Array.concat([d])}
        })

      let learners = locationExps
        ->Array.map(exp => exp.learner.id)
        ->Array.reduce([], (acc, id) => {
          if acc->Array.includes(id) {acc} else {acc->Array.concat([id])}
        })

      {
        location,
        count: experienceIds->Array.length,
        diversity: domains->Array.length,
        learners: learners->Array.length,
        domains,
      }
    })
    ->Array.toSorted((a, b) => Float.fromInt(b.diversity - a.diversity))

  Promise.resolve(Ok({summary, learningHotspots}))
}

// Map by location
let mapByLocation = (mapper: t): Dict.t<locationData> => {
  let result = Dict.make()

  mapper.indices.location->Dict.toArray->Array.forEach(((location, experienceIds)) => {
    let locationExps = experienceIds
      ->Array.map(id => mapper.experiences->Dict.get(id))
      ->Array.filterMap(x => x)

    let coordinates = locationExps
      ->Array.find(exp => exp.context.location.coordinates->Option.isSome)
      ->Option.flatMap(exp => exp.context.location.coordinates)

    let domains = locationExps
      ->Array.reduce([], (acc, exp) => {
        switch exp.experience.domains {
        | Some(doms) => Array.concat(acc, doms)
        | None => acc
        }
      })
      ->Array.reduce([], (acc, d) => {
        if acc->Array.includes(d) {acc} else {acc->Array.concat([d])}
      })

    result->Dict.set(location, {
      coordinates,
      count: experienceIds->Array.length,
      domains,
    })
  })

  result
}

// Generate domain network
let generateDomainNetwork = (mapper: t): domainNetwork => {
  let experiences = mapper.experiences->Dict.valuesToArray

  let domainCounts = Dict.make()
  let coOccurrences = Dict.make()

  experiences->Array.forEach(exp => {
    switch exp.experience.domains {
    | Some(domains) => {
        domains->Array.forEach(d => {
          let count = domainCounts->Dict.get(d)->Option.getOr(0)
          domainCounts->Dict.set(d, count + 1)
        })

        domains->Array.forEach(d1 => {
          domains->Array.forEach(d2 => {
            if d1 < d2 {
              let key = `${d1}--${d2}`
              let count = coOccurrences->Dict.get(key)->Option.getOr(0)
              coOccurrences->Dict.set(key, count + 1)
            }
          })
        })
      }
    | None => ()
    }
  })

  let nodes = domainCounts
    ->Dict.toArray
    ->Array.map(((id, size)) => {id, size})

  let edges = coOccurrences
    ->Dict.toArray
    ->Array.map(((key, weight)) => {
      let parts = key->String.split("--")
      {
        source: parts[0]->Option.getOr(""),
        target: parts[1]->Option.getOr(""),
        weight,
      }
    })

  {nodes, edges}
}
