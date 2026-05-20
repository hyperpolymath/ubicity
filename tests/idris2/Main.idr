-- SPDX-License-Identifier: PMPL-1.0-or-later
-- Copyright (c) 2026 Jonathan D.A. Jewell (hyperpolymath) <j.d.a.jewell@open.ac.uk>

module Main

import Test.Spec
import CoreTest
import MapperTest
import ExportTest
import PrivacyTest
import System

%default covering

main : IO ()
main = do
  (p1, f1) <- runTestSuite "CoreTest" CoreTest.allSuites
  (p2, f2) <- runTestSuite "MapperTest" MapperTest.allSuites
  (p3, f3) <- runTestSuite "ExportTest" ExportTest.allSuites
  (p4, f4) <- runTestSuite "PrivacyTest" PrivacyTest.allSuites
  let totalPassed = p1 + p2 + p3 + p4
  let totalFailed = f1 + f2 + f3 + f4
  putStrLn ""
  putStrLn $ "=== Total: " ++ show totalPassed ++ " passed, " ++ show totalFailed ++ " failed ==="
  if totalFailed > 0
    then exitWith (ExitFailure 1)
    else pure ()
