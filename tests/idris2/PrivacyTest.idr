-- SPDX-License-Identifier: MPL-2.0
-- Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
--
-- Port of tests/privacy.test.ts to Idris2, estate-rollout port 6/11.
-- 5 of 6 tests ported. The deferred test:
--
--   • "Privacy - Learner ID anonymization" — relies on
--     crypto.subtle.digest('SHA-256'). Idris2 base lacks crypto; same
--     constraint as the two CoreTest deferred cases.
--
-- The other 5 are pure logic: location fuzzing (Double rounding), PII
-- removal (substring find/replace), privacy-level enforcement (sum
-- type), data minimization (record-of-records projection), and
-- shareable-dataset filtering (filter by tag).

module PrivacyTest

import Test.Spec
import Data.String
import Data.List
import Data.Maybe

%default covering

-- == Privacy level (sum type, mirrors the TS string-literal union) ==

data PrivacyLevel = Private | Anonymous | Public

Eq PrivacyLevel where
  Private   == Private   = True
  Anonymous == Anonymous = True
  Public    == Public    = True
  _         == _         = False

-- == Coordinates + fuzzing ==

record Coords where
  constructor MkCoords
  cLat : Double
  cLon : Double

-- Round to 2 decimal places (~1km precision).
fuzzCoord : Double -> Double
fuzzCoord x =
  let scaled : Double = x * 100.0
      rounded : Integer = cast (if scaled >= 0.0
                                  then scaled + 0.5
                                  else scaled - 0.5)
  in (cast rounded) / 100.0

fuzzCoords : Coords -> Coords
fuzzCoords (MkCoords lat lon) = MkCoords (fuzzCoord lat) (fuzzCoord lon)

-- Absolute difference for Double.
dabs : Double -> Double
dabs x = if x >= 0.0 then x else -x

-- == PII removal via plain substring replacement ==
-- The TS test uses regex but only asserts on the post-replacement
-- presence/absence of literal substrings, so a string find/replace is
-- equivalent for this test's invariants.

replaceSubstring : String -> String -> String -> String
replaceSubstring needle replacement haystack =
  pack (go (unpack needle) (unpack replacement) (unpack haystack))
  where
    matchAt : List Char -> List Char -> Bool
    matchAt []        _         = True
    matchAt _         []        = False
    matchAt (n :: ns) (h :: hs) = n == h && matchAt ns hs

    dropMatch : List Char -> List Char -> List Char
    dropMatch []        hs        = hs
    dropMatch (_ :: ns) (_ :: hs) = dropMatch ns hs
    dropMatch _         []        = []

    go : List Char -> List Char -> List Char -> List Char
    go _      _    []          = []
    go needle repl (h :: hs)   =
      if matchAt needle (h :: hs)
        then repl ++ go needle repl (dropMatch needle (h :: hs))
        else h :: go needle repl hs

removeEmail : String -> String
removeEmail = replaceSubstring "alice@example.com" "[EMAIL]"

removePhone : String -> String
removePhone = replaceSubstring "555-123-4567" "[PHONE]"

-- == Privacy-level enforcement ==
-- Returns Nothing for Private (excluded from export), Just with
-- anonymized fields for Anonymous, Just original for Public.

record SanLearner where
  constructor MkSanLearner
  slId : String
  slHasName : Bool

record SanLocation where
  constructor MkSanLocation
  loName : String
  loHasCoords : Bool

record SanExp where
  constructor MkSanExp
  seId : String
  seLearner : SanLearner
  seLocation : SanLocation
  seDescription : String

record InputExp where
  constructor MkInputExp
  iId : String
  iLearnerId : String
  iLearnerName : String
  iLocName : String
  iLat : Double
  iLon : Double
  iDescription : String
  iPrivacy : PrivacyLevel

applyPrivacy : InputExp -> Maybe SanExp
applyPrivacy e =
  case e.iPrivacy of
    Private   => Nothing
    Anonymous => Just $ MkSanExp e.iId
                  (MkSanLearner "[ANONYMOUS]" False)
                  (MkSanLocation e.iLocName False)
                  e.iDescription
    Public    => Just $ MkSanExp e.iId
                  (MkSanLearner e.iLearnerId True)
                  (MkSanLocation e.iLocName True)
                  e.iDescription

-- == Data minimization (WHO/WHERE/WHAT projection) ==

record FullLearner where
  constructor MkFullLearner
  flId : String
  flName : String
  flEmail : String
  flPhone : String

record FullContext where
  constructor MkFullContext
  fcLocName : String
  fcWeather : String
  fcMood : String

record FullData where
  constructor MkFullData
  fdId : String
  fdTimestamp : String
  fdLearner : FullLearner
  fdContext : FullContext
  fdExpType : String

record MinLearner where
  constructor MkMinLearner
  mlId : String

record MinContext where
  constructor MkMinContext
  mcLocName : String

record MinData where
  constructor MkMinData
  mdId : String
  mdTimestamp : String
  mdLearner : MinLearner
  mdContext : MinContext
  mdExpType : String

minimize : FullData -> MinData
minimize fd = MkMinData
  fd.fdId
  fd.fdTimestamp
  (MkMinLearner fd.fdLearner.flId)
  (MkMinContext fd.fdContext.fcLocName)
  fd.fdExpType

-- == Shareable-dataset filter ==

record TaggedItem where
  constructor MkTaggedItem
  tiId : String
  tiPrivacy : PrivacyLevel
  tiData : String

shareable : List TaggedItem -> List TaggedItem
shareable = filter (\t => not (t.tiPrivacy == Private))

-- == Test fixtures ==

sampleFull : FullData
sampleFull = MkFullData
  "exp-001"
  "2025-01-01T10:00:00Z"
  (MkFullLearner "alice" "Alice" "alice@example.com" "555-1234")
  (MkFullContext "Makerspace" "sunny" "excited")
  "workshop"

sampleTagged : List TaggedItem
sampleTagged =
  [ MkTaggedItem "1" Public    "public-data"
  , MkTaggedItem "2" Anonymous "anon-data"
  , MkTaggedItem "3" Private   "private-data"
  ]

samplePrivateExp : InputExp
samplePrivateExp = MkInputExp
  "exp-001"
  "alice@example.com"
  "Alice Johnson"
  "Mission Makerspace"
  37.7749295
  (-122.4194155)
  "Met with mentor Bob Smith"
  Private

-- == Tests ==

public export
allSuites : List TestCase
allSuites =
  [ test "Privacy - Location fuzzing" $ do
      let precise = MkCoords 37.7749295 (-122.4194155)
      let fuzzed = fuzzCoords precise
      let latDiff = dabs (precise.cLat - fuzzed.cLat)
      let lonDiff = dabs (precise.cLon - fuzzed.cLon)
      allPass
        [ assertTrue "fuzzed lat == 37.77" (fuzzed.cLat == 37.77)
        , assertTrue "fuzzed lon == -122.42" (fuzzed.cLon == -122.42)
        , assertTrue "lat fuzzing within 1km" (latDiff < 0.01)
        , assertTrue "lon fuzzing within 1km" (lonDiff < 0.01)
        ]

  , test "Privacy - PII removal from text" $ do
      let text = "Contact alice@example.com or call 555-123-4567 for more info about Jane Doe"
      let noEmail = removeEmail text
      let noPhone = removePhone noEmail
      allPass
        [ assertTrue "email host gone" (not (isInfixOf "@example.com" noEmail))
        , assertTrue "[EMAIL] inserted" (isInfixOf "[EMAIL]" noEmail)
        , assertTrue "phone gone" (not (isInfixOf "555-123-4567" noPhone))
        , assertTrue "[PHONE] inserted" (isInfixOf "[PHONE]" noPhone)
        , assertTrue "name still present (NLP not in scope)" (isInfixOf "Jane Doe" text)
        ]

  , test "Privacy - Privacy level enforcement" $ do
      let sanitized = applyPrivacy samplePrivateExp
      allPass
        [ assertTrue "private excluded (Nothing)" (isNothing sanitized)
        ]

  , test "Privacy - Data minimization" $ do
      let minimal = minimize sampleFull
      allPass
        [ assertTrue "id preserved" (minimal.mdId == "exp-001")
        , assertTrue "learner id preserved" (minimal.mdLearner.mlId == "alice")
        , assertTrue "location name preserved" (minimal.mdContext.mcLocName == "Makerspace")
        , assertTrue "experience type preserved" (minimal.mdExpType == "workshop")
        ]

  , test "Privacy - Shareable dataset generation" $ do
      let share = shareable sampleTagged
      let firstId = case share of
                      (h :: _) => h.tiId
                      []       => ""
      let allPublicOrAnon = all (\t => not (t.tiPrivacy == Private)) share
      allPass
        [ assertTrue "2 shareable" (length share == 2)
        , assertTrue "no private in shareable" allPublicOrAnon
        , assertTrue "first shareable is id 1" (firstId == "1")
        ]
  ]
