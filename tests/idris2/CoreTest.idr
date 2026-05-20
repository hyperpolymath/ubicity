-- SPDX-License-Identifier: PMPL-1.0-or-later
-- Copyright (c) 2026 Jonathan D.A. Jewell (hyperpolymath) <j.d.a.jewell@open.ac.uk>
--
-- Port of tests/core.test.ts to Idris2, estate-rollout port 6/11.
-- PARTIAL: 1 of 4 TS test files in ubicity. The other 3 (privacy,
-- mapper, export) await strategy review per ESTATE-ROLLOUT.adoc
-- "unit-logic strategy" section.
--
-- 3 of 5 original tests ported here. The other 2 deferred:
--
--   • "Core - Data persistence" — needs JSON parse + temp-file write.
--     Idris2 base stdlib lacks JSON. Would need either a JSON
--     dependency or a custom parser. Deferred.
--
--   • "Core - ID generation uniqueness" — needs crypto.randomUUID().
--     Idris2 base lacks crypto. Would need either a crypto dep or
--     a deterministic-RNG mock (which defeats the uniqueness check).
--     Deferred.

module CoreTest

import Test.Spec
import Data.String
import Data.List

%default covering

-- == LearningExperience record type ==
-- Mirrors the TS interface implicitly assumed by core.test.ts. Fields
-- match the literal object the TS test constructs.

record Location where
  constructor MkLocation
  name : String
  ltype : String

record Learner where
  constructor MkLearner
  id : String
  name : String

record Experience where
  constructor MkExperience
  etype : String
  domain : List String
  description : String

record LearningExperience where
  constructor MkLearningExperience
  id : String
  timestamp : String
  learner : Learner
  context_location : Location
  experience : Experience

-- Sample valid experience matching the TS literal object.
sampleExperience : LearningExperience
sampleExperience = MkLearningExperience
  { id = "test-001"
  , timestamp = "2026-05-20T00:00:00Z"
  , learner = MkLearner
      { id = "learner-123"
      , name = "Test Learner"
      }
  , context_location = MkLocation
      { name = "Test Makerspace"
      , ltype = "makerspace"
      }
  , experience = MkExperience
      { etype = "workshop"
      , domain = ["electronics", "art"]
      , description = "Built a light-up sculpture"
      }
  }

-- == ISO 8601 timestamp shape helpers ==

isoLooksValid : String -> Bool
isoLooksValid s = isInfixOf "T" s && isInfixOf "Z" s

-- == List dedup helper ==

dedupList : Eq a => List a -> List a
dedupList = nub

-- == Tests ==

public export
allSuites : List TestCase
allSuites =
  [ test "Core - LearningExperience validation (field presence)" $ do
      let e = sampleExperience
      allPass
        [ assertTrue "id non-empty" (length e.id > 0)
        , assertTrue "learner id non-empty" (length e.learner.id > 0)
        , assertTrue "location name non-empty" (length e.context_location.name > 0)
        , assertTrue "domain has exactly 2 entries" (length e.experience.domain == 2)
        ]

  , test "Core - Timestamp ISO 8601 shape (T + Z)" $ do
      let s = "2026-05-20T10:30:00Z"
      let parseable = length s >= 20
      allPass
        [ assertTrue "contains T" (isInfixOf "T" s)
        , assertTrue "contains Z" (isInfixOf "Z" s)
        , assertTrue "length >= 20" parseable
        ]

  , test "Core - Domain array dedup/normalize/filter" $ do
      let domains = ["electronics", "art", "sculpture"]
      let unique = dedupList domains
      let normalized = map toLower domains
      let filtered = filter (isPrefixOf "e") domains
      let first_normalized = case normalized of
                               (x :: _) => x
                               []       => ""
      allPass
        [ assertTrue "dedup keeps all 3" (length unique == 3)
        , assertTrue "normalize keeps electronics" (length normalized == 3 && first_normalized == "electronics")
        , assertTrue "filter on e-prefix returns 1" (length filtered == 1)
        ]
  ]
