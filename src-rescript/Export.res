// SPDX-License-Identifier: AGPL-3.0-or-later
// UbiCity Export Utilities
// Supports CSV, GeoJSON, DOT, Markdown, and JSON formats

open UbiCity

type exportFormat = CSV | GeoJSON | DOT | Markdown | JSON

type geoJSONGeometry = {
  @as("type") type_: string,
  coordinates: array<float>,
}

type geoJSONProperties = {
  name: string,
  experiences: int,
  domains: array<string>,
}

type geoJSONFeature = {
  @as("type") type_: string,
  geometry: geoJSONGeometry,
  properties: geoJSONProperties,
}

type geoJSONCollection = {
  @as("type") type_: string,
  features: array<geoJSONFeature>,
}

// CSV Export
let exportToCSV = (experiences: array<LearningExperience.t>): string => {
  let headers = [
    "id",
    "timestamp",
    "learner_id",
    "location",
    "type",
    "description",
    "domains",
    "success",
    "latitude",
    "longitude",
  ]

  let rows = [headers->Array.join(",")]

  experiences->Array.forEach(exp => {
    let locationName = exp.context.location.name
    let description = exp.experience.description->String.replaceAll("\"", "\"\"")
    let domains = exp.experience.domains->Option.getOr([])->Array.join("; ")
    let success = exp.experience.outcome->Option.flatMap(o => o.success)->Option.map(b =>
      b ? "true" : "false"
    )->Option.getOr("")
    let latitude = exp.context.location.coordinates->Option.map(c =>
      Float.toString(c.latitude)
    )->Option.getOr("")
    let longitude = exp.context.location.coordinates->Option.map(c =>
      Float.toString(c.longitude)
    )->Option.getOr("")

    let row = [
      exp.id,
      exp.timestamp,
      exp.learner.id,
      `"${locationName}"`,
      exp.experience.type_,
      `"${description}"`,
      `"${domains}"`,
      success,
      latitude,
      longitude,
    ]

    rows->Array.push(row->Array.join(","))->ignore
  })

  rows->Array.join("\n")
}

// GeoJSON Export
let exportToGeoJSON = (experiences: array<LearningExperience.t>): geoJSONCollection => {
  // Group by location
  let locationExps = experiences->Array.reduce(Dict.make(), (acc, exp) => {
    let location = exp.context.location.name
    let exps = acc->Dict.get(location)->Option.getOr([])
    acc->Dict.set(location, exps->Array.concat([exp]))
    acc
  })

  let features = []

  locationExps->Dict.toArray->Array.forEach(((name, exps)) => {
    // Get first experience with coordinates
    let coordsOpt = exps->Array.find(exp => exp.context.location.coordinates->Option.isSome)

    switch coordsOpt {
    | Some(exp) =>
      switch exp.context.location.coordinates {
      | Some(coords) => {
          let domains = exps
            ->Array.reduce([], (acc, e) => {
              switch e.experience.domains {
              | Some(doms) => Array.concat(acc, doms)
              | None => acc
              }
            })
            ->Array.reduce([], (acc, d) => {
              if acc->Array.includes(d) {acc} else {acc->Array.concat([d])}
            })

          let geometry: geoJSONGeometry = {
            type_: "Point",
            coordinates: [coords.longitude, coords.latitude],
          }

          let properties: geoJSONProperties = {
            name: name,
            experiences: exps->Array.length,
            domains: domains,
          }

          let feature: geoJSONFeature = {
            type_: "Feature",
            geometry: geometry,
            properties: properties,
          }

          features->Array.push(feature)->ignore
        }
      | None => ()
      }
    | None => ()
    }
  })

  {
    type_: "FeatureCollection",
    features: features,
  }
}

// DOT (GraphViz) Export for domain network
let exportToDOT = (experiences: array<LearningExperience.t>): string => {
  // Build domain co-occurrence network
  let domainCounts = Dict.make()
  let coOccurrences = Dict.make()

  experiences->Array.forEach(exp => {
    switch exp.experience.domains {
    | Some(domains) => {
        // Count domain occurrences
        domains->Array.forEach(d => {
          let count = domainCounts->Dict.get(d)->Option.getOr(0)
          domainCounts->Dict.set(d, count + 1)
        })

        // Count co-occurrences
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

  let lines = ["graph DomainNetwork {", "  layout=neato;", "  overlap=false;", ""]

  // Nodes
  domainCounts->Dict.toArray->Array.forEach(((domain, count)) => {
    let size = Math.max(0.5, Math.min(3.0, Int.toFloat(count) /. 5.0))->Float.toString
    lines->Array.push(`  "${domain}" [width=${size}];`)->ignore
  })

  lines->Array.push("")->ignore

  // Edges
  coOccurrences->Dict.toArray->Array.forEach(((key, weight)) => {
    let parts = key->String.split("--")
    let source = parts[0]->Option.getOr("")
    let target = parts[1]->Option.getOr("")
    let penwidth = Math.max(1.0, Math.min(5.0, Int.toFloat(weight)))->Float.toString
    lines->Array.push(`  "${source}" -- "${target}" [penwidth=${penwidth}];`)->ignore
  })

  lines->Array.push("}")->ignore

  lines->Array.join("\n")
}

// Markdown Export for learner journeys
let exportJourneysToMarkdown = (experiences: array<LearningExperience.t>): string => {
  let lines = ["# UbiCity Learner Journeys", ""]

  // Group by learner
  let learnerExps = experiences->Array.reduce(Dict.make(), (acc, exp) => {
    let learnerId = exp.learner.id
    let exps = acc->Dict.get(learnerId)->Option.getOr([])
    acc->Dict.set(learnerId, exps->Array.concat([exp]))
    acc
  })

  learnerExps->Dict.toArray->Array.forEach(((learnerId, exps)) => {
    lines->Array.push(`## Learner: ${learnerId}`)->ignore
    lines->Array.push("")->ignore
    lines->Array.push(`**Total Experiences:** ${Int.toString(exps->Array.length)}`)->ignore
    lines->Array.push("")->ignore

    // Sort by timestamp
    let sorted = exps->Array.toSorted((a, b) => {
      a.timestamp < b.timestamp ? -1.0 : 1.0
    })

    lines->Array.push("### Timeline")->ignore
    lines->Array.push("")->ignore

    sorted->Array.forEachWithIndex((exp, i) => {
      let date = Date.fromString(exp.timestamp)->Date.toLocaleDateString
      let location = exp.context.location.name
      let type_ = exp.experience.type_
      let description = exp.experience.description

      lines->Array.push(`${Int.toString(i + 1)}. **${date}** - ${location} (${type_})`)->ignore

      switch exp.experience.domains {
      | Some(domains) if domains->Array.length > 0 =>
        lines->Array.push(`   - Domains: ${domains->Array.join(", ")}`)->ignore
      | _ => ()
      }

      lines->Array.push(`   - ${description}`)->ignore
      lines->Array.push("")->ignore
    })

    // Questions emerged
    let questions = sorted->Array.reduce([], (acc, exp) => {
      switch exp.experience.outcome {
      | Some(outcome) =>
        switch outcome.next_questions {
        | Some(qs) => Array.concat(acc, qs)
        | None => acc
        }
      | None => acc
      }
    })

    if questions->Array.length > 0 {
      lines->Array.push("### Questions Emerged")->ignore
      lines->Array.push("")->ignore
      questions->Array.forEach(q => {
        lines->Array.push(`- ${q}`)->ignore
      })
      lines->Array.push("")->ignore
    }

    lines->Array.push("---")->ignore
    lines->Array.push("")->ignore
  })

  lines->Array.join("\n")
}

// JSON Export
let exportToJSON = (experiences: array<LearningExperience.t>): string => {
  // Convert to JS objects for serialization
  let jsObjects = experiences->Array.map(exp => {
    {
      "id": exp.id,
      "timestamp": exp.timestamp,
      "version": exp.version,
      "learner": {
        "id": exp.learner.id,
        "name": exp.learner.name,
        "interests": exp.learner.interests,
      },
      "context": {
        "location": {
          "name": exp.context.location.name,
          "coordinates": exp.context.location.coordinates,
          "type": exp.context.location.type_,
          "address": exp.context.location.address,
        },
        "situation": exp.context.situation,
        "connections": exp.context.connections,
        "timeOfDay": exp.context.timeOfDay,
      },
      "experience": {
        "type": exp.experience.type_,
        "description": exp.experience.description,
        "domains": exp.experience.domains,
        "outcome": exp.experience.outcome,
        "duration": exp.experience.duration,
        "intensity": exp.experience.intensity,
      },
      "privacy": exp.privacy,
      "tags": exp.tags,
    }
  })

  switch JSON.stringifyAny(jsObjects) {
  | Some(json) => json
  | None => "[]"
  }
}

// Main export dispatcher
let exportData = (
  experiences: array<LearningExperience.t>,
  format: exportFormat,
): string => {
  switch format {
  | CSV => exportToCSV(experiences)
  | GeoJSON => {
      let geoJSON = exportToGeoJSON(experiences)
      switch JSON.stringifyAny(geoJSON) {
      | Some(json) => json
      | None => "{\"type\":\"FeatureCollection\",\"features\":[]}"
      }
    }
  | DOT => exportToDOT(experiences)
  | Markdown => exportJourneysToMarkdown(experiences)
  | JSON => exportToJSON(experiences)
  }
}
