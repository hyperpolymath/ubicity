// SPDX-License-Identifier: AGPL-3.0-or-later
// UbiCity Capture CLI Entry Point

@val external argv: array<string> = "process.argv"
@val external exit: int => unit = "process.exit"

let parseMode = (modeStr: option<string>): Capture.captureMode => {
  switch modeStr {
  | Some("full") => Full
  | Some("template") => Template
  | Some("quick") | Some(_) | None => Quick
  }
}

let main = async () => {
  let mode = argv->Array.get(2)->parseMode

  let session = Capture.CaptureSession.make(~mode, ())

  let result = await session->Capture.CaptureSession.capture

  switch result {
  | Ok(id) => {
      Console.log(`\n✅ Success! Experience ID: ${id}`)
      exit(0)
    }
  | Error(err) => {
      Console.error(`\n❌ Error: ${err}`)
      exit(1)
    }
  }
}

// Run
let _ = main()
