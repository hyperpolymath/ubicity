// SPDX-License-Identifier: AGPL-3.0-or-later
// UbiCity JSON Decoders
// Type-safe decoding of JSON data from storage into ReScript types

open UbiCity

// FFI bindings for generating IDs
@module("crypto") @val
external randomUUID: unit => string = "randomUUID"

// Helper to get string field from JSON object
let getString = (json: JSON.t, field: string): result<string, string> => {
  switch json->JSON.Decode.object {
  | Some(obj) =>
    switch obj->Dict.get(field) {
    | Some(value) =>
      switch value->JSON.Decode.string {
      | Some(str) => Ok(str)
      | None => Error(`Field "${field}" is not a string`)
      }
    | None => Error(`Missing field "${field}"`)
    }
  | None => Error("Expected JSON object")
  }
}

// Helper to get optional string field
let getOptionalString = (json: JSON.t, field: string): option<string> => {
  json
  ->JSON.Decode.object
  ->Option.flatMap(obj => obj->Dict.get(field))
  ->Option.flatMap(JSON.Decode.string)
}

// Helper to get array field
let getArray = (json: JSON.t, field: string): result<array<JSON.t>, string> => {
  switch json->JSON.Decode.object {
  | Some(obj) =>
    switch obj->Dict.get(field) {
    | Some(value) =>
      switch value->JSON.Decode.array {
      | Some(arr) => Ok(arr)
      | None => Error(`Field "${field}" is not an array`)
      }
    | None => Ok([]) // Missing array field = empty array
    }
  | None => Error("Expected JSON object")
  }
}

// Helper to get optional array field
let getOptionalArray = (json: JSON.t, field: string): option<array<JSON.t>> => {
  json
  ->JSON.Decode.object
  ->Option.flatMap(obj => obj->Dict.get(field))
  ->Option.flatMap(JSON.Decode.array)
}

// Helper to get object field
let getObject = (json: JSON.t, field: string): result<JSON.t, string> => {
  switch json->JSON.Decode.object {
  | Some(obj) =>
    switch obj->Dict.get(field) {
    | Some(value) => Ok(value)
    | None => Error(`Missing field "${field}"`)
    }
  | None => Error("Expected JSON object")
  }
}

// Helper to get optional object field
let getOptionalObject = (json: JSON.t, field: string): option<JSON.t> => {
  json->JSON.Decode.object->Option.flatMap(obj => obj->Dict.get(field))
}

// Helper to get number field
let getNumber = (json: JSON.t, field: string): result<float, string> => {
  switch json->JSON.Decode.object {
  | Some(obj) =>
    switch obj->Dict.get(field) {
    | Some(value) =>
      switch value->JSON.Decode.float {
      | Some(num) => Ok(num)
      | None => Error(`Field "${field}" is not a number`)
      }
    | None => Error(`Missing field "${field}"`)
    }
  | None => Error("Expected JSON object")
  }
}

// Helper to get optional number field
let getOptionalNumber = (json: JSON.t, field: string): option<float> => {
  json
  ->JSON.Decode.object
  ->Option.flatMap(obj => obj->Dict.get(field))
  ->Option.flatMap(JSON.Decode.float)
}

// Decode Coordinates (handles both lat/lon and latitude/longitude)
let decodeCoordinates = (json: JSON.t): result<Coordinates.t, string> => {
  // Try latitude/longitude first, then fall back to lat/lon
  let latResult = switch getNumber(json, "latitude") {
  | Ok(lat) => Ok(lat)
  | Error(_) => getNumber(json, "lat")
  }

  let lonResult = switch getNumber(json, "longitude") {
  | Ok(lon) => Ok(lon)
  | Error(_) => getNumber(json, "lon")
  }

  switch (latResult, lonResult) {
  | (Ok(latitude), Ok(longitude)) => Ok({latitude, longitude})
  | (Error(err), _) | (_, Error(err)) => Error(`Coordinates decode error: ${err}`)
  }
}

// Decode Location
let decodeLocation = (json: JSON.t): result<Location.t, string> => {
  switch getString(json, "name") {
  | Error(err) => Error(`Location decode error: ${err}`)
  | Ok(name) => {
      let coordinates = getOptionalObject(json, "coordinates")->Option.flatMap(coordJson => {
        switch decodeCoordinates(coordJson) {
        | Ok(coords) => Some(coords)
        | Error(_) => None
        }
      })

      let type_ = getOptionalString(json, "type")
      let address = getOptionalString(json, "address")

      Ok({name, coordinates, type_, address})
    }
  }
}

// Decode Learner
let decodeLearner = (json: JSON.t): result<Learner.t, string> => {
  switch getString(json, "id") {
  | Error(err) => Error(`Learner decode error: ${err}`)
  | Ok(id) => {
      let name = getOptionalString(json, "name")
      let interests = getOptionalArray(json, "interests")->Option.map(arr =>
        arr->Array.map(JSON.Decode.string)->Array.filterMap(x => x)
      )

      Ok({id, name, interests})
    }
  }
}

// Decode Context
let decodeContext = (json: JSON.t): result<Context.t, string> => {
  switch getObject(json, "location") {
  | Error(err) => Error(`Context decode error: ${err}`)
  | Ok(locationJson) =>
    switch decodeLocation(locationJson) {
    | Error(err) => Error(`Context.location decode error: ${err}`)
    | Ok(location) => {
        let situation = getOptionalString(json, "situation")
        let connections = getOptionalArray(json, "connections")->Option.map(arr =>
          arr->Array.map(JSON.Decode.string)->Array.filterMap(x => x)
        )
        let timeOfDay = getOptionalString(json, "timeOfDay")->Option.map(str => {
          switch str {
          | "morning" => #morning
          | "afternoon" => #afternoon
          | "evening" => #evening
          | "night" | _ => #night
          }
        })

        Ok({location, situation, connections, timeOfDay})
      }
    }
  }
}

// Decode Outcome
let decodeOutcome = (json: JSON.t): result<Outcome.t, string> => {
  let success = json
    ->JSON.Decode.object
    ->Option.flatMap(obj => obj->Dict.get("success"))
    ->Option.flatMap(JSON.Decode.bool)

  let connections_made = getOptionalArray(json, "connections_made")->Option.map(arr =>
    arr->Array.map(JSON.Decode.string)->Array.filterMap(x => x)
  )

  let next_questions = getOptionalArray(json, "next_questions")->Option.map(arr =>
    arr->Array.map(JSON.Decode.string)->Array.filterMap(x => x)
  )

  let artifacts = getOptionalArray(json, "artifacts")->Option.map(arr =>
    arr->Array.map(JSON.Decode.string)->Array.filterMap(x => x)
  )

  Ok({
    success,
    connections_made,
    next_questions,
    artifacts,
  })
}

// Decode ExperienceData
let decodeExperienceData = (json: JSON.t): result<ExperienceData.t, string> => {
  switch getString(json, "type") {
  | Error(err) => Error(`ExperienceData decode error: ${err}`)
  | Ok(type_) =>
    switch getString(json, "description") {
    | Error(err) => Error(`ExperienceData.description decode error: ${err}`)
    | Ok(description) => {
        let domains = getOptionalArray(json, "domains")->Option.map(arr =>
          arr->Array.map(JSON.Decode.string)->Array.filterMap(x => x)
        )

        let outcome = getOptionalObject(json, "outcome")->Option.flatMap(outcomeJson => {
          switch decodeOutcome(outcomeJson) {
          | Ok(out) => Some(out)
          | Error(_) => None
          }
        })

        let duration = getOptionalNumber(json, "duration")->Option.map(Float.toInt)
        let intensity = getOptionalString(json, "intensity")->Option.map(str => {
          switch str {
          | "low" => #low
          | "medium" => #medium
          | "high" | _ => #high
          }
        })

        Ok({
          type_,
          description,
          domains,
          outcome,
          duration,
          intensity,
        })
      }
    }
  }
}

// Decode Privacy
let decodePrivacy = (json: JSON.t): result<Privacy.t, string> => {
  switch getString(json, "level") {
  | Error(err) => Error(`Privacy decode error: ${err}`)
  | Ok(levelStr) => {
      let level = switch levelStr {
      | "private" => #"private"
      | "anonymous" => #anonymous
      | "public" | _ => #public
      }

      let shareableWith = getOptionalArray(json, "shareableWith")->Option.map(arr =>
        arr->Array.map(JSON.Decode.string)->Array.filterMap(x => x)
      )

      Ok({level, shareableWith})
    }
  }
}

// Decode LearningExperience (with fallbacks for legacy data)
let decodeLearningExperience = (json: JSON.t): result<LearningExperience.t, string> => {
  // Get core required fields
  let learnerResult = getObject(json, "learner")->Result.flatMap(decodeLearner)
  let contextResult = getObject(json, "context")->Result.flatMap(decodeContext)
  let experienceResult = getObject(json, "experience")->Result.flatMap(decodeExperienceData)

  // Get optional fields with defaults for legacy data
  let id = getOptionalString(json, "id")->Option.getOr(`ubi-${randomUUID()}`)
  let timestamp = getOptionalString(json, "timestamp")->Option.getOr(Date.now()->Float.toString)
  let version = getOptionalString(json, "version")->Option.getOr("1.0")

  // Combine all results
  switch (learnerResult, contextResult, experienceResult) {
  | (Ok(learner), Ok(context), Ok(experience)) => {
      // Get optional fields
      let privacy = getOptionalObject(json, "privacy")->Option.flatMap(privJson => {
        switch decodePrivacy(privJson) {
        | Ok(priv) => Some(priv)
        | Error(_) => None
        }
      })

      let tags = getOptionalArray(json, "tags")->Option.map(arr =>
        arr->Array.map(JSON.Decode.string)->Array.filterMap(x => x)
      )

      Ok({
        id,
        timestamp,
        version,
        learner,
        context,
        experience,
        privacy,
        tags,
      })
    }
  | (Error(err), _, _)
  | (_, Error(err), _)
  | (_, _, Error(err)) =>
    Error(`LearningExperience decode error: ${err}`)
  }
}

// Decode array of experiences
let decodeExperiences = (jsonArray: array<JSON.t>): result<array<LearningExperience.t>, string> => {
  let experiences = []
  let errors = []

  jsonArray->Array.forEachWithIndex((json, i) => {
    switch decodeLearningExperience(json) {
    | Ok(exp) => experiences->Array.push(exp)->ignore
    | Error(err) => errors->Array.push(`Experience ${Int.toString(i)}: ${err}`)->ignore
    }
  })

  if errors->Array.length > 0 {
    Error(`Failed to decode ${Int.toString(errors->Array.length)} experiences:\n${errors->Array.join("\n")}`)
  } else {
    Ok(experiences)
  }
}
