// SPDX-License-Identifier: AGPL-3.0-or-later
// UbiCity Learning Experience Capture Tool (ReScript)
// Quick, frictionless capture of learning moments

open UbiCity

type captureMode = Quick | Full | Template

module CaptureSession = {
  type t = {
    mode: captureMode,
    mapper: option<Mapper.t>,
  }

  let make = (~mode=Quick, ()): t => {
    {mode, mapper: None}
  }

  let initialize = (session: t): promise<result<t, string>> => {
    // Initialize mapper
    Mapper.make()
    ->Promise.then(mapper => {
      Promise.resolve(Ok({...session, mapper: Some(mapper)}))
    })
    ->Promise.catch(_ => {
      Promise.resolve(Error("Failed to initialize mapper"))
    })
  }

  // Prompt utilities using Node readline
  module Process = {
    @val external stdin: 'a = "process.stdin"
    @val external stdout: 'a = "process.stdout"
  }

  module Readline = {
    type t

    @send
    external question: (t, string) => promise<string> = "question"

    @send
    external close: t => unit = "close"

    @module("readline/promises")
    external createInterface: {..} => t = "createInterface"

    let make = (): t => {
      createInterface({
        "input": Process.stdin,
        "output": Process.stdout,
      })
    }
  }

  let captureLearner = async (
    readline: Readline.t,
    mode: captureMode,
  ): result<Learner.t, string> => {
    Console.log("WHO learned?\n")

    let id = await readline->Readline.question("Learner ID (pseudonym): ")

    if id->String.trim->String.length == 0 {
      Error("Learner ID is required")
    } else {
      let learnerId = id->String.trim

      switch mode {
      | Full => {
          let name = await readline->Readline.question("Full name (optional): ")
          let nameOpt = if name->String.trim->String.length > 0 {
            Some(name->String.trim)
          } else {
            None
          }

          let interests = await readline->Readline.question(
            "Interests (comma-separated, optional): ",
          )
          let interestsOpt = if interests->String.trim->String.length > 0 {
            Some(
              interests
              ->String.split(",")
              ->Array.map(String.trim)
              ->Array.filter(s => s->String.length > 0),
            )
          } else {
            None
          }

          Learner.make(~id=learnerId, ~name=?nameOpt, ~interests=?interestsOpt, ())
        }
      | Quick | Template => Learner.make(~id=learnerId, ())
      }
    }
  }

  let captureLocation = async (
    readline: Readline.t,
    mode: captureMode,
  ): result<Location.t, string> => {
    let locationName = await readline->Readline.question("Location name: ")

    if locationName->String.trim->String.length == 0 {
      Error("Location name is required")
    } else {
      let name = locationName->String.trim

      switch mode {
      | Full => {
          let hasCoords = await readline->Readline.question("Add GPS coordinates? (y/n): ")

          let coords = if hasCoords->String.toLowerCase == "y" {
            let lat = await readline->Readline.question("Latitude: ")
            let lon = await readline->Readline.question("Longitude: ")

            switch (lat->Float.fromString, lon->Float.fromString) {
            | (Some(latitude), Some(longitude)) =>
              Coordinates.make(~latitude, ~longitude)
            | _ => None
            }
          } else {
            None
          }

          let locationType = await readline->Readline.question(
            "Location type (makerspace/library/park/etc, optional): ",
          )
          let typeOpt = if locationType->String.trim->String.length > 0 {
            Some(locationType->String.trim)
          } else {
            None
          }

          Location.make(~name, ~coordinates=?coords, ~type_=?typeOpt, ())
        }
      | Quick | Template => Location.make(~name, ())
      }
    }
  }

  let captureContext = async (
    readline: Readline.t,
    mode: captureMode,
  ): result<Context.t, string> => {
    Console.log("\nWHERE did learning happen?\n")

    let locationResult = await captureLocation(readline, mode)

    switch locationResult {
    | Error(err) => Error(err)
    | Ok(location) =>
      switch mode {
      | Full => {
          let situation = await readline->Readline.question("Situation/context (optional): ")
          let situationOpt = if situation->String.trim->String.length > 0 {
            Some(situation->String.trim)
          } else {
            None
          }

          let connections = await readline->Readline.question(
            "Others involved (comma-separated, optional): ",
          )
          let connectionsOpt = if connections->String.trim->String.length > 0 {
            Some(
              connections
              ->String.split(",")
              ->Array.map(String.trim)
              ->Array.filter(s => s->String.length > 0),
            )
          } else {
            None
          }

          Ok(Context.make(~location, ~situation=?situationOpt, ~connections=?connectionsOpt, ()))
        }
      | Quick | Template => Ok(Context.make(~location, ()))
      }
    }
  }

  let captureOutcome = async (readline: Readline.t): Outcome.t => {
    Console.log("\nOutcome (optional):\n")

    let success = await readline->Readline.question("Was it successful? (y/n/skip): ")

    let outcome = switch success->String.toLowerCase {
    | "y" => {...Outcome.empty, success: Some(true)}
    | "n" => {...Outcome.empty, success: Some(false)}
    | _ => Outcome.empty
    }

    switch outcome.success {
    | Some(_) => {
        let connections = await readline->Readline.question(
          "Unexpected connections made (optional): ",
        )
        let connectionsMade = if connections->String.trim->String.length > 0 {
          Some([connections->String.trim])
        } else {
          None
        }

        let questions = await readline->Readline.question("New questions emerged (optional): ")
        let nextQuestions = if questions->String.trim->String.length > 0 {
          Some([questions->String.trim])
        } else {
          None
        }

        {
          ...outcome,
          connections_made: connectionsMade,
          next_questions: nextQuestions,
        }
      }
    | None => outcome
    }
  }

  let captureExperience = async (
    readline: Readline.t,
    mode: captureMode,
  ): result<ExperienceData.t, string> => {
    Console.log("\nWHAT was learned?\n")

    let type_ = await readline->Readline.question(
      "Type (experiment/workshop/observation/conversation/reading/making): ",
    )

    if type_->String.trim->String.length == 0 {
      Error("Experience type is required")
    } else {
      let description = await readline->Readline.question("Description: ")

      if description->String.trim->String.length == 0 {
        Error("Description is required")
      } else {
        let domains = await readline->Readline.question(
          "Domains/disciplines (comma-separated, optional but useful): ",
        )
        let domainsOpt = if domains->String.trim->String.length > 0 {
          Some(
            domains
            ->String.split(",")
            ->Array.map(String.trim)
            ->Array.filter(s => s->String.length > 0),
          )
        } else {
          None
        }

        switch mode {
        | Full => {
            let outcome = await captureOutcome(readline)

            let intensity = await readline->Readline.question(
              "Intensity (low/medium/high, optional): ",
            )
            let intensityOpt = switch intensity->String.trim->String.toLowerCase {
            | "low" => Some(#low)
            | "medium" => Some(#medium)
            | "high" => Some(#high)
            | _ => None
            }

            ExperienceData.make(
              ~type_=type_->String.trim,
              ~description=description->String.trim,
              ~domains=?domainsOpt,
              ~outcome=outcome,
              ~intensity=?intensityOpt,
              (),
            )
          }
        | Quick | Template =>
          ExperienceData.make(
            ~type_=type_->String.trim,
            ~description=description->String.trim,
            ~domains=?domainsOpt,
            (),
          )
        }
      }
    }
  }

  let captureOptionalFields = async (
    readline: Readline.t,
  ): (option<Privacy.t>, option<array<string>>) => {
    Console.log("\nOptional metadata:\n")

    let privacy = await readline->Readline.question(
      "Privacy level (private/anonymous/public) [default: anonymous]: ",
    )
    let privacyOpt: option<Privacy.t> = switch privacy->String.trim->String.toLowerCase {
    | "private" => Some({level: #\"private", shareableWith: None})
    | "public" => Some({level: #public, shareableWith: None})
    | "anonymous" | _ => Some(Privacy.makeAnonymous)
    }

    let tags = await readline->Readline.question("Tags (comma-separated, optional): ")
    let tagsOpt = if tags->String.trim->String.length > 0 {
      Some(
        tags
        ->String.split(",")
        ->Array.map(String.trim)
        ->Array.filter(s => s->String.length > 0),
      )
    } else {
      None
    }

    (privacyOpt, tagsOpt)
  }

  let generateTemplate = (readline: Readline.t): promise<unit> => {
    let template = {
      "learner": {
        "id": "your-pseudonym",
        "name": "Your Name (optional)",
        "interests": ["interest1", "interest2"],
      },
      "context": {
        "location": {
          "name": "Location Name",
          "coordinates": {
            "latitude": 0.0,
            "longitude": 0.0,
          },
          "type": "makerspace",
        },
        "situation": "What was happening",
        "connections": ["person1", "person2"],
      },
      "experience": {
        "type": "experiment",
        "description": "What you learned",
        "domains": ["domain1", "domain2"],
        "outcome": {
          "success": true,
          "connections_made": ["Unexpected insight"],
          "next_questions": ["What question emerged?"],
        },
        "duration": 60,
        "intensity": "medium",
      },
      "privacy": {
        "level": "anonymous",
      },
      "tags": ["tag1", "tag2"],
    }

    switch JSON.stringifyAny(template) {
    | Some(json) => Console.log(json)
    | None => Console.log("Error: Could not generate template")
    }
    readline->Readline.close
    Promise.resolve()
  }

  let capture = async (session: t): result<string, string> => {
    let readline = Readline.make()

    Console.log("\n🏙️  UbiCity Learning Capture\n")

    switch session.mode {
    | Template => {
        let _ = await generateTemplate(readline)
        Ok("template-generated")
      }
    | mode => {
        // Initialize mapper
        let sessionResult = await session->initialize

        switch sessionResult {
        | Error(err) => {
            readline->Readline.close
            Error(err)
          }
        | Ok(initializedSession) =>
          switch initializedSession.mapper {
          | None => {
              readline->Readline.close
              Error("Mapper not initialized")
            }
          | Some(mapper) => {
              // Capture learner
              let learnerResult = await captureLearner(readline, mode)

              switch learnerResult {
              | Error(err) => {
                  readline->Readline.close
                  Error(err)
                }
              | Ok(learner) => {
                  // Capture context
                  let contextResult = await captureContext(readline, mode)

                  switch contextResult {
                  | Error(err) => {
                      readline->Readline.close
                      Error(err)
                    }
                  | Ok(context) => {
                      // Capture experience
                      let experienceResult = await captureExperience(readline, mode)

                      switch experienceResult {
                      | Error(err) => {
                          readline->Readline.close
                          Error(err)
                        }
                      | Ok(experience) => {
                          // Optional fields (only in Full mode)
                          let (privacy, tags) = switch mode {
                          | Full => await captureOptionalFields(readline)
                          | Quick | Template => (None, None)
                          }

                          // Create learning experience
                          let learningExperience = LearningExperience.make(
                            ~learner,
                            ~context,
                            ~experience,
                            ~privacy=?privacy,
                            ~tags=?tags,
                            (),
                          )

                          // Save to mapper
                          let saveResult = await Mapper.captureExperience(
                            mapper,
                            learningExperience,
                          )

                          readline->Readline.close

                          switch saveResult {
                          | Ok(id) => {
                              Console.log(`\n✅ Experience captured: ${id}`)
                              let count = Mapper.getExperienceCount(mapper)
                              Console.log(`📊 Total experiences: ${count->Int.toString}\n`)
                              Ok(id)
                            }
                          | Error(err) => Error(err)
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

// Import Mapper module
// (Mapper.res must be compiled first)
