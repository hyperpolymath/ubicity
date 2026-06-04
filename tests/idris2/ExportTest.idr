-- SPDX-License-Identifier: MPL-2.0
-- Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
--
-- Port of tests/export.test.ts to Idris2, estate-rollout port 6/11.
-- 5 of 5 tests ported. All exports are pure string-formatting (CSV,
-- GeoJSON struct, DOT, Markdown, CSV escaping). The TS suite builds
-- its inline data fresh per test, so no SUT bindings are required.
--
-- Note: the TS Markdown test uses `new Date().toLocaleDateString()`
-- but only asserts on Type/Domains/description (not the date), so we
-- substitute a deterministic ISO date string with no test-coverage loss.

module ExportTest

import Test.Spec
import Data.String
import Data.List

%default covering

-- == Lightweight experience record ==
-- Single shape covering all 5 export shapes. Fields unused per test
-- default to "" / 0.0 / [].

record EExp where
  constructor MkEExp
  eId : String
  eTimestamp : String
  eLearnerId : String
  eLocName : String
  eLat : Double
  eLon : Double
  eType : String
  eDomains : List String
  eDescription : String

-- == CSV ==

csvHeaders : String
csvHeaders = "id,timestamp,learner_id,location,type,domains,description"

csvRow : EExp -> String
csvRow e =
  e.eId ++ "," ++
  e.eTimestamp ++ "," ++
  e.eLearnerId ++ "," ++
  e.eLocName ++ "," ++
  e.eType ++ "," ++
  joinWith ";" e.eDomains ++ "," ++
  e.eDescription

  where
    joinWith : String -> List String -> String
    joinWith _   []        = ""
    joinWith _   [x]       = x
    joinWith sep (x :: xs) = x ++ sep ++ joinWith sep xs

csvOf : List EExp -> String
csvOf xs = csvHeaders ++ "\n" ++ rowsJoined
  where
    rowsJoined : String
    rowsJoined = case map csvRow xs of
      []        => ""
      (r :: rs) => foldl (\acc, r2 => acc ++ "\n" ++ r2) r rs

-- == GeoJSON (struct-only, no JSON serialization) ==
-- The TS test builds an object literal and asserts on its shape, NOT
-- on serialized text. Mirror that with an Idris2 record + assertions.

record GeoPoint where
  constructor MkGeoPoint
  pId : String
  pName : String
  pType : String
  pLat : Double
  pLon : Double

geojsonFeatures : List EExp -> List GeoPoint
geojsonFeatures =
  map (\e => MkGeoPoint e.eId e.eLocName e.eType e.eLat e.eLon)

-- == DOT graph ==

dotOf : List (String, List String) -> String
dotOf connections =
  let header = "graph LearningNetwork {\n"
      edges = concatMap edgesFrom connections
      footer = "}"
  in header ++ edges ++ footer
  where
    edgesFrom : (String, List String) -> String
    edgesFrom (from, tos) =
      foldl (\acc, to => acc ++ "  \"" ++ from ++ "\" -- \"" ++ to ++ "\";\n") "" tos

-- == Markdown ==
-- TS uses toLocaleDateString() but never asserts on it. We pass through
-- the ISO timestamp directly — covers the same invariants.

mdEntry : EExp -> String
mdEntry e =
  "## " ++ e.eTimestamp ++ "\n\n" ++
  "**Type**: " ++ e.eType ++ "\n\n" ++
  "**Domains**: " ++ joinComma e.eDomains ++ "\n\n" ++
  e.eDescription ++ "\n\n" ++
  "---\n\n"
  where
    joinComma : List String -> String
    joinComma []        = ""
    joinComma [x]       = x
    joinComma (x :: xs) = x ++ ", " ++ joinComma xs

mdOf : List EExp -> String
mdOf xs = "# Learner Journey\n\n" ++ concatMap mdEntry xs

-- == CSV escaping ==

-- Replace every `"` with `""`, then wrap whole string in `"`.
csvEscape : String -> String
csvEscape s =
  let doubled = pack (escapeChars (unpack s))
  in "\"" ++ doubled ++ "\""
  where
    escapeChars : List Char -> List Char
    escapeChars []        = []
    escapeChars (c :: cs) =
      if c == '"'
        then '"' :: '"' :: escapeChars cs
        else c :: escapeChars cs

-- == Test fixtures ==

csvSample : EExp
csvSample = MkEExp
  "exp-001"
  "2025-01-01T10:00:00Z"
  "alice"
  "Makerspace A"
  0.0
  0.0
  "workshop"
  ["electronics"]
  "Built LED circuit"

geoSample : EExp
geoSample = MkEExp
  "exp-001"
  ""
  ""
  "Makerspace A"
  37.77
  (-122.42)
  "workshop"
  []
  ""

dotSample : List (String, List String)
dotSample =
  [ ("electronics", ["art", "robotics"])
  , ("art", ["sculpture"])
  ]

mdJourney : List EExp
mdJourney =
  [ MkEExp "1" "2025-01-01T10:00:00Z" "" "" 0.0 0.0
      "workshop" ["electronics"] "First workshop"
  , MkEExp "2" "2025-01-05T14:00:00Z" "" "" 0.0 0.0
      "project" ["electronics", "art"] "Built sculpture"
  ]

-- == Tests ==

public export
allSuites : List TestCase
allSuites =
  [ test "Export - CSV format generation" $ do
      let csv = csvOf [csvSample]
      allPass
        [ assertTrue "csv contains header" (isInfixOf "id,timestamp,learner_id" csv)
        , assertTrue "csv contains row data" (isInfixOf "exp-001,2025-01-01T10:00:00Z" csv)
        , assertTrue "csv contains domain" (isInfixOf "electronics" csv)
        ]

  , test "Export - GeoJSON struct generation" $ do
      let features = geojsonFeatures [geoSample]
      let first = case features of
                    (h :: _) => h
                    []       => MkGeoPoint "" "" "" 0.0 0.0
      allPass
        [ assertTrue "1 feature" (length features == 1)
        , assertTrue "feature id matches" (first.pId == "exp-001")
        , assertTrue "feature name matches" (first.pName == "Makerspace A")
        , assertTrue "feature lat preserved" (first.pLat == 37.77)
        , assertTrue "feature lon preserved" (first.pLon == -122.42)
        ]

  , test "Export - DOT graph format generation" $ do
      let dot = dotOf dotSample
      allPass
        [ assertTrue "header present" (isInfixOf "graph LearningNetwork" dot)
        , assertTrue "electronics--art edge" (isInfixOf "\"electronics\" -- \"art\"" dot)
        , assertTrue "electronics--robotics edge" (isInfixOf "\"electronics\" -- \"robotics\"" dot)
        , assertTrue "art--sculpture edge" (isInfixOf "\"art\" -- \"sculpture\"" dot)
        ]

  , test "Export - Markdown format generation" $ do
      let md = mdOf mdJourney
      allPass
        [ assertTrue "title present" (isInfixOf "# Learner Journey" md)
        , assertTrue "Type: workshop" (isInfixOf "**Type**: workshop" md)
        , assertTrue "Domains: electronics, art" (isInfixOf "**Domains**: electronics, art" md)
        , assertTrue "description present" (isInfixOf "Built sculpture" md)
        ]

  , test "Export - CSV escaping special characters" $ do
      let text = "Description with \"quotes\" and, commas"
      let escaped = csvEscape text
      let expected = "\"Description with \"\"quotes\"\" and, commas\""
      allPass
        [ assertEq escaped expected
        , assertTrue "starts with quote" (isPrefixOf "\"" escaped)
        , assertTrue "ends with quote" (isSuffixOf "\"" escaped)
        ]
  ]
