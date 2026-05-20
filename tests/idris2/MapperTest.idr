-- SPDX-License-Identifier: PMPL-1.0-or-later
-- Copyright (c) 2026 Jonathan D.A. Jewell (hyperpolymath) <j.d.a.jewell@open.ac.uk>
--
-- Port of tests/mapper.test.ts to Idris2, estate-rollout port 6/11.
-- 5 of 5 tests ported. All tests exercise pure data-manipulation logic
-- (group-by, adjacency, filter, sort, set-uniqueness). The TS suite
-- builds its inline data fresh in each test, so the Idris2 port needs
-- no SUT bindings either.

module MapperTest

import Test.Spec
import Data.String
import Data.List

%default covering

-- == Lightweight experience record ==
-- Single shared shape covering all 5 tests. Unused fields per test are
-- defaulted to "" or [] when building test fixtures.

record MExp where
  constructor MkMExp
  expId : String
  locationName : String
  domains : List String
  timestamp : String
  learnerId : String
  expType : String

-- == Helpers ==

locCount : String -> List MExp -> Nat
locCount loc xs = length (filter (\e => e.locationName == loc) xs)

uniqueDomains : List MExp -> List String
uniqueDomains xs = nub (concatMap (\e => e.domains) xs)

sortPair : Ord a => (a, a) -> (a, a)
sortPair (a, b) = if a <= b then (a, b) else (b, a)

-- All unordered pairs from a list, each sorted (smaller first).
pairsOf : Ord a => List a -> List (a, a)
pairsOf []        = []
pairsOf (x :: xs) = map (\y => sortPair (x, y)) xs ++ pairsOf xs

isInterdisciplinary : MExp -> Bool
isInterdisciplinary e = length e.domains >= 2

-- ASCII-only separator (PATTERNS.adoc ascii-only-string-literals-idris2).
domainPairStr : (String, String) -> String
domainPairStr (a, b) = a ++ "->" ++ b

allInterdisciplinaryPairs : List MExp -> List String
allInterdisciplinaryPairs xs =
  concatMap (\e => map domainPairStr (pairsOf e.domains))
            (filter isInterdisciplinary xs)

-- Learner journey: filter by id, sort by timestamp (ISO strings are
-- lexicographically sortable, so a string compare suffices).
journeyOf : String -> List MExp -> List MExp
journeyOf lid xs =
  sortBy (\a, b => compare a.timestamp b.timestamp)
         (filter (\e => e.learnerId == lid) xs)

-- == Test fixtures ==

hotspotData : List MExp
hotspotData =
  [ MkMExp "1" "Makerspace A" ["electronics"]  "" "" ""
  , MkMExp "2" "Makerspace A" ["woodworking"]  "" "" ""
  , MkMExp "3" "Garden B"     ["gardening"]    "" "" ""
  ]

networkData : List MExp
networkData =
  [ MkMExp "1" "" ["electronics", "art"]      "" "" ""
  , MkMExp "2" "" ["art", "sculpture"]        "" "" ""
  , MkMExp "3" "" ["electronics", "robotics"] "" "" ""
  ]

journeyData : List MExp
journeyData =
  [ MkMExp "1" "" [] "2025-01-01T10:00:00Z" "alice" "workshop"
  , MkMExp "2" "" [] "2025-01-05T14:00:00Z" "alice" "project"
  , MkMExp "3" "" [] "2025-01-03T12:00:00Z" "alice" "mentorship"
  ]

interdisciplinaryData : List MExp
interdisciplinaryData =
  [ MkMExp "1" "" ["electronics", "art"]         "" "alice" ""
  , MkMExp "2" "" ["gardening", "food-justice"]  "" "bob"   ""
  ]

highDiversityData : List MExp
highDiversityData =
  [ MkMExp "" "" ["electronics"] "" "" ""
  , MkMExp "" "" ["woodworking"] "" "" ""
  , MkMExp "" "" ["textiles"]    "" "" ""
  , MkMExp "" "" ["sculpture"]   "" "" ""
  ]

lowDiversityData : List MExp
lowDiversityData =
  [ MkMExp "" "" ["electronics"] "" "" ""
  , MkMExp "" "" ["electronics"] "" "" ""
  , MkMExp "" "" ["electronics"] "" "" ""
  ]

-- == Tests ==

public export
allSuites : List TestCase
allSuites =
  [ test "Mapper - Hotspot detection" $ do
      let mkrA = locCount "Makerspace A" hotspotData
      let gdnB = locCount "Garden B" hotspotData
      let uniqLocs = nub (map (\e => e.locationName) hotspotData)
      let hotspotsList = filter (\l => locCount l hotspotData >= 2) uniqLocs
      let firstHotspot = case hotspotsList of
                           (h :: _) => h
                           []       => ""
      allPass
        [ assertTrue "Makerspace A has 2" (mkrA == 2)
        , assertTrue "Garden B has 1" (gdnB == 1)
        , assertTrue "2 unique locations" (length uniqLocs == 2)
        , assertTrue "exactly 1 hotspot at threshold 2" (length hotspotsList == 1)
        , assertEq firstHotspot "Makerspace A"
        ]

  , test "Mapper - Domain network generation" $ do
      let allPairs = concatMap (\e => pairsOf e.domains) networkData
      let artPartners = nub (mapMaybe (\(a, b) => if a == "art" then Just b else Nothing) allPairs)
      allPass
        [ assertTrue "art-electronics edge present" (elem ("art", "electronics") allPairs)
        , assertTrue "art-sculpture edge present" (elem ("art", "sculpture") allPairs)
        , assertTrue "electronics-robotics edge present" (elem ("electronics", "robotics") allPairs)
        , assertTrue "art has exactly 2 distinct partners" (length artPartners == 2)
        ]

  , test "Mapper - Learner journey tracking" $ do
      let journey = journeyOf "alice" journeyData
      let t0 = case journey of
                 (h :: _) => h.expType
                 []       => ""
      let t1 = case (drop 1 journey) of
                 (h :: _) => h.expType
                 []       => ""
      let t2 = case (drop 2 journey) of
                 (h :: _) => h.expType
                 []       => ""
      allPass
        [ assertTrue "journey length 3" (length journey == 3)
        , assertEq t0 "workshop"
        , assertEq t1 "mentorship"
        , assertEq t2 "project"
        ]

  , test "Mapper - Interdisciplinary connections" $ do
      let interdisc = filter isInterdisciplinary interdisciplinaryData
      let pairs = allInterdisciplinaryPairs interdisciplinaryData
      allPass
        [ assertTrue "2 interdisciplinary entries" (length interdisc == 2)
        , assertTrue "2 unique pair strings" (length pairs == 2)
        , assertTrue "art->electronics present" (elem "art->electronics" pairs)
        , assertTrue "food-justice->gardening present" (elem "food-justice->gardening" pairs)
        ]

  , test "Mapper - Diversity score calculation" $ do
      let uniqHigh = uniqueDomains highDiversityData
      let uniqLow = uniqueDomains lowDiversityData
      let hiNum = length uniqHigh
      let loNum = length uniqLow
      let highTotal = length highDiversityData
      let lowTotal = length lowDiversityData
      -- Compare ratios via cross-multiplication to stay in Nat:
      -- (hiNum / highTotal) > (loNum / lowTotal)
      -- iff hiNum * lowTotal > loNum * highTotal
      let lhs = hiNum * lowTotal
      let rhs = loNum * highTotal
      allPass
        [ assertTrue "high has 4 unique domains" (hiNum == 4)
        , assertTrue "low has 1 unique domain" (loNum == 1)
        , assertTrue "high diversity ratio > low diversity ratio" (lhs > rhs)
        ]
  ]
