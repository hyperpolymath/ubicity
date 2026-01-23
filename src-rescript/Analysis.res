// SPDX-License-Identifier: AGPL-3.0-or-later
// UbiCity Advanced Analysis Features
// Temporal patterns, collaborative networks, recommendations

open UbiCity

// Time of day bucket
type timeOfDay = Morning | Afternoon | Evening | Night

type timeDistribution = {
  morning: (int, array<string>),
  afternoon: (int, array<string>),
  evening: (int, array<string>),
  night: (int, array<string>),
}

type weeklyDistribution = Dict.t<(int, array<string>)>

type learningStreak = {
  start: string,
  end_: string,
  days: int,
  experiences: int,
}

type collaborationEdge = {
  source: string,
  target: string,
  weight: int,
}

type collaborationNode = {
  id: string,
  experiences: int,
}

type collaborationNetwork = {
  nodes: array<collaborationNode>,
  edges: array<collaborationEdge>,
}

type recommendation = {
  learnerId: string,
  similarity: float,
  sharedDomains: array<string>,
}

type locationRecommendation = {
  location: string,
  relevance: float,
  matchingDomains: array<string>,
}

type domainRecommendation = {
  domain: string,
  relevance: int,
}

// Helper: Get time of day from timestamp
let getTimeOfDay = (timestamp: string): timeOfDay => {
  let date = Date.fromString(timestamp)
  let hour = date->Date.getHours->Int.toFloat

  if hour >= 6. && hour < 12. {
    Morning
  } else if hour >= 12. && hour < 18. {
    Afternoon
  } else if hour >= 18. && hour < 22. {
    Evening
  } else {
    Night
  }
}

// Helper: Extract unique domains from experiences
let extractDomains = (experiences: array<LearningExperience.t>): array<string> => {
  experiences
  ->Array.reduce([], (acc, exp) => {
    switch exp.experience.domains {
    | Some(domains) => Array.concat(acc, domains)
    | None => acc
    }
  })
  ->Array.reduce([], (acc, domain) => {
    if acc->Array.includes(domain) {
      acc
    } else {
      acc->Array.concat([domain])
    }
  })
}

// Temporal Analysis
module TemporalAnalyzer = {
  let analyzeByTimeOfDay = (experiences: array<LearningExperience.t>): timeDistribution => {
    let morningExps = []
    let afternoonExps = []
    let eveningExps = []
    let nightExps = []

    experiences->Array.forEach(exp => {
      let tod = getTimeOfDay(exp.timestamp)
      switch tod {
      | Morning => morningExps->Array.push(exp)->ignore
      | Afternoon => afternoonExps->Array.push(exp)->ignore
      | Evening => eveningExps->Array.push(exp)->ignore
      | Night => nightExps->Array.push(exp)->ignore
      }
    })

    {
      morning: (morningExps->Array.length, extractDomains(morningExps)),
      afternoon: (afternoonExps->Array.length, extractDomains(afternoonExps)),
      evening: (eveningExps->Array.length, extractDomains(eveningExps)),
      night: (nightExps->Array.length, extractDomains(nightExps)),
    }
  }

  let analyzeByDayOfWeek = (experiences: array<LearningExperience.t>): weeklyDistribution => {
    let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    let distribution = Dict.make()

    // Initialize all days
    days->Array.forEach(day => {
      distribution->Dict.set(day, (0, []))
    })

    // Bucket experiences by day
    experiences->Array.forEach(exp => {
      let date = Date.fromString(exp.timestamp)
      let dayIndex = date->Date.getDay
      let dayName = days->Array.get(dayIndex)->Option.getOr("Sunday")

      let (count, domains) = distribution->Dict.get(dayName)->Option.getOr((0, []))
      let newDomains = switch exp.experience.domains {
      | Some(doms) => Array.concat(domains, doms)
      | None => domains
      }
      distribution->Dict.set(dayName, (count + 1, newDomains))
    })

    // Deduplicate domains
    distribution->Dict.keysToArray->Array.forEach(day => {
      let (count, domains) = distribution->Dict.get(day)->Option.getOr((0, []))
      let uniqueDomains = domains->Array.reduce([], (acc, d) => {
        if acc->Array.includes(d) {acc} else {acc->Array.concat([d])}
      })
      distribution->Dict.set(day, (count, uniqueDomains))
    })

    distribution
  }

  let detectStreaks = (
    experiences: array<LearningExperience.t>,
    ~minDays=3,
    (),
  ): array<learningStreak> => {
    // Sort by timestamp
    let sorted = experiences->Array.toSorted((a, b) => {
      let aDate = Date.fromString(a.timestamp)
      let bDate = Date.fromString(b.timestamp)
      aDate < bDate ? -1.0 : 1.0
    })

    let streaks = []
    let currentStreak = []

    sorted->Array.forEachWithIndex((exp, i) => {
      if i == 0 {
        currentStreak->Array.push(exp)->ignore
      } else {
        let prevExp = sorted[i - 1]->Option.getExn
        let prevDate = Date.fromString(prevExp.timestamp)
        let currDate = Date.fromString(exp.timestamp)

        let daysDiff =
          Math.floor((currDate->Date.getTime -. prevDate->Date.getTime) /. 86400000.0)->Int.fromFloat

        if daysDiff <= 1 {
          currentStreak->Array.push(exp)->ignore
        } else {
          if currentStreak->Array.length >= minDays {
            let firstExp = currentStreak[0]->Option.getExn
            let lastExp = currentStreak[currentStreak->Array.length - 1]->Option.getExn
            streaks
            ->Array.push({
              start: firstExp.timestamp,
              end_: lastExp.timestamp,
              days: currentStreak->Array.length,
              experiences: currentStreak->Array.length,
            })
            ->ignore
          }
          currentStreak->Array.splice(~start=0, ~remove=currentStreak->Array.length, ~insert=[])->ignore
          currentStreak->Array.push(exp)->ignore
        }
      }
    })

    // Check final streak
    if currentStreak->Array.length >= minDays {
      let firstExp = currentStreak[0]->Option.getExn
      let lastExp = currentStreak[currentStreak->Array.length - 1]->Option.getExn
      streaks
      ->Array.push({
        start: firstExp.timestamp,
        end_: lastExp.timestamp,
        days: currentStreak->Array.length,
        experiences: currentStreak->Array.length,
      })
      ->ignore
    }

    streaks
  }
}

// Collaborative Network Analysis
module CollaborativeNetworkAnalyzer = {
  let buildCollaborationNetwork = (
    experiences: array<LearningExperience.t>,
  ): collaborationNetwork => {
    let edges = Dict.make()
    let allLearners = []

    experiences->Array.forEach(exp => {
      let learnerId = exp.learner.id
      allLearners->Array.push(learnerId)->ignore

      switch exp.context.connections {
      | Some(collaborators) =>
        collaborators->Array.forEach(collaborator => {
          let key = [learnerId, collaborator]->Array.toSorted((a, b) => a < b ? -1.0 : 1.0)->Array.join("-")
          let count = edges->Dict.get(key)->Option.getOr(0)
          edges->Dict.set(key, count + 1)

          allLearners->Array.push(collaborator)->ignore
        })
      | None => ()
      }
    })

    // Deduplicate learners
    let uniqueLearners = allLearners->Array.reduce([], (acc, id) => {
      if acc->Array.includes(id) {acc} else {acc->Array.concat([id])}
    })

    // Count experiences per learner
    let learnerCounts = Dict.make()
    experiences->Array.forEach(exp => {
      let count = learnerCounts->Dict.get(exp.learner.id)->Option.getOr(0)
      learnerCounts->Dict.set(exp.learner.id, count + 1)
    })

    {
      nodes: uniqueLearners->Array.map(id => {
        {id, experiences: learnerCounts->Dict.get(id)->Option.getOr(0)}
      }),
      edges: edges
      ->Dict.toArray
      ->Array.map(((key, weight)) => {
        let parts = key->String.split("-")
        {source: parts[0]->Option.getOr(""), target: parts[1]->Option.getOr(""), weight}
      }),
    }
  }

  let findMostCollaborative = (
    experiences: array<LearningExperience.t>,
    ~topN=10,
    (),
  ): array<(string, int)> => {
    let counts = Dict.make()

    experiences->Array.forEach(exp => {
      switch exp.context.connections {
      | Some(collaborators) if collaborators->Array.length > 0 => {
          let count = counts->Dict.get(exp.learner.id)->Option.getOr(0)
          counts->Dict.set(exp.learner.id, count + collaborators->Array.length)
        }
      | _ => ()
      }
    })

    counts
    ->Dict.toArray
    ->Array.toSorted((a, b) => {
      let (_, countA) = a
      let (_, countB) = b
      Float.fromInt(countB - countA)
    })
    ->Array.slice(~start=0, ~end=topN)
  }
}

// Recommendation Engine
module RecommendationEngine = {
  let getLearnerDomains = (
    experiences: array<LearningExperience.t>,
    learnerId: string,
  ): array<string> => {
    experiences
    ->Array.filter(exp => exp.learner.id == learnerId)
    ->Array.reduce([], (acc, exp) => {
      switch exp.experience.domains {
      | Some(domains) => Array.concat(acc, domains)
      | None => acc
      }
    })
    ->Array.reduce([], (acc, d) => {
      if acc->Array.includes(d) {acc} else {acc->Array.concat([d])}
    })
  }

  let getVisitedLocations = (
    experiences: array<LearningExperience.t>,
    learnerId: string,
  ): array<string> => {
    experiences
    ->Array.filter(exp => exp.learner.id == learnerId)
    ->Array.map(exp => exp.context.location.name)
    ->Array.reduce([], (acc, loc) => {
      if acc->Array.includes(loc) {acc} else {acc->Array.concat([loc])}
    })
  }

  let jaccardSimilarity = (set1: array<string>, set2: array<string>): float => {
    let intersection = set1->Array.filter(x => set2->Array.includes(x))->Array.length
    let union = Array.concat(set1, set2)->Array.reduce([], (acc, x) => {
      if acc->Array.includes(x) {acc} else {acc->Array.concat([x])}
    })->Array.length

    union == 0 ? 0.0 : Int.toFloat(intersection) /. Int.toFloat(union)
  }

  let recommendSimilarLearners = (
    experiences: array<LearningExperience.t>,
    learnerId: string,
    ~topN=5,
    (),
  ): array<recommendation> => {
    let targetDomains = getLearnerDomains(experiences, learnerId)

    if targetDomains->Array.length == 0 {
      []
    } else {
      let allLearners = experiences
        ->Array.map(exp => exp.learner.id)
        ->Array.reduce([], (acc, id) => {
          if acc->Array.includes(id) {acc} else {acc->Array.concat([id])}
        })

      let similarities = allLearners
        ->Array.filter(id => id != learnerId)
        ->Array.map(otherLearnerId => {
          let otherDomains = getLearnerDomains(experiences, otherLearnerId)
          let similarity = jaccardSimilarity(targetDomains, otherDomains)

          {
            learnerId: otherLearnerId,
            similarity,
            sharedDomains: targetDomains->Array.filter(d => otherDomains->Array.includes(d)),
          }
        })
        ->Array.filter(r => r.similarity > 0.0)

      similarities
      ->Array.toSorted((a, b) => Float.compare(b.similarity, a.similarity))
      ->Array.slice(~start=0, ~end=topN)
    }
  }

  let recommendLocations = (
    experiences: array<LearningExperience.t>,
    learnerId: string,
    ~topN=5,
    (),
  ): array<locationRecommendation> => {
    let learnerDomains = getLearnerDomains(experiences, learnerId)
    let visitedLocations = getVisitedLocations(experiences, learnerId)

    // Group experiences by location
    let locationExps = experiences->Array.reduce(Dict.make(), (acc, exp) => {
      let location = exp.context.location.name
      let exps = acc->Dict.get(location)->Option.getOr([])
      acc->Dict.set(location, exps->Array.concat([exp]))
      acc
    })

    let scores = []

    locationExps->Dict.toArray->Array.forEach(((locationName, exps)) => {
      if !(visitedLocations->Array.includes(locationName)) {
        let locationDomains = extractDomains(exps)
        let relevance = jaccardSimilarity(learnerDomains, locationDomains)

        if relevance > 0.0 {
          scores
          ->Array.push({
            location: locationName,
            relevance,
            matchingDomains: learnerDomains->Array.filter(d => locationDomains->Array.includes(d)),
          })
          ->ignore
        }
      }
    })

    scores
    ->Array.toSorted((a, b) => Float.compare(b.relevance, a.relevance))
    ->Array.slice(~start=0, ~end=topN)
  }

  let recommendDomains = (
    experiences: array<LearningExperience.t>,
    learnerId: string,
    ~topN=5,
    (),
  ): array<domainRecommendation> => {
    let learnerDomains = getLearnerDomains(experiences, learnerId)

    // Find domains that co-occur with learner's domains
    let coOccurrences = Dict.make()

    experiences->Array.forEach(exp => {
      switch exp.experience.domains {
      | Some(domains) => {
          let hasLearnerDomain = domains->Array.some(d => learnerDomains->Array.includes(d))

          if hasLearnerDomain {
            domains->Array.forEach(d => {
              if !(learnerDomains->Array.includes(d)) {
                let count = coOccurrences->Dict.get(d)->Option.getOr(0)
                coOccurrences->Dict.set(d, count + 1)
              }
            })
          }
        }
      | None => ()
      }
    })

    coOccurrences
    ->Dict.toArray
    ->Array.toSorted((a, b) => {
      let (_, countA) = a
      let (_, countB) = b
      Float.fromInt(countB - countA)
    })
    ->Array.slice(~start=0, ~end=topN)
    ->Array.map(((domain, count)) => {domain, relevance: count})
  }
}
