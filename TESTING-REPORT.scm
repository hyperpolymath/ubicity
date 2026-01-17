;; SPDX-License-Identifier: AGPL-3.0-or-later
;; UbiCity Testing Report
;; Generated: 2025-12-29
;; Author: Claude Code

(testing-report
  (metadata
    (project "ubicity")
    (version "0.3.0")
    (date "2025-12-29")
    (platform "Linux 6.17.12-300.fc43.x86_64")
    (runtime "Deno 1.45.0")
    (location "/var/home/hyper/repos/ubicity"))

  (summary
    (total-tests 44)
    (passed 44)
    (failed 0)
    (skipped 0)
    (status 'all-pass))

  (issues-fixed
    (issue
      (id "DENO-001")
      (severity 'critical)
      (category 'configuration)
      (title "deno.json referenced non-existent .ts files")
      (description "Exports and tasks pointed to .ts files but source is .js")
      (files-affected ("deno.json"))
      (resolution "Updated all references from .ts to .js"))

    (issue
      (id "DENO-002")
      (severity 'critical)
      (category 'compatibility)
      (title "Node.js bare imports not Deno-compatible")
      (description "Imports like 'crypto' need 'node:' prefix in Deno")
      (files-affected
        ("src/mapper.js"
         "src/storage.js"
         "src/capture.js"
         "src/export.js"
         "src/performance.js"
         "src/privacy.js"
         "src/import.js"))
      (resolution "Added 'node:' prefix to all Node.js module imports"))

    (issue
      (id "DENO-003")
      (severity 'critical)
      (category 'compatibility)
      (title "Node.js globals not available in Deno")
      (description "process.argv, process.exit used without import")
      (files-affected
        ("src/cli.js"
         "src/capture.js"))
      (resolution "Replaced with Deno.args, Deno.exit, import.meta.main")))

  (test-suites
    (suite
      (name "core.test.ts")
      (tests 5)
      (status 'pass)
      (test-cases
        ("LearningExperience validation"
         "Data persistence"
         "ID generation uniqueness"
         "Timestamp validation"
         "Domain array handling")))

    (suite
      (name "export.test.js")
      (tests 4)
      (status 'pass)
      (test-cases
        ("exportToCSV generates valid CSV"
         "exportToGeoJSON generates valid GeoJSON"
         "exportToDOT generates valid Graphviz format"
         "exportToCSV handles special characters")))

    (suite
      (name "export.test.ts")
      (tests 5)
      (status 'pass)
      (test-cases
        ("Export - CSV format generation"
         "Export - GeoJSON format generation"
         "Export - DOT graph format generation"
         "Export - Markdown format generation"
         "Export - CSV escaping special characters")))

    (suite
      (name "mapper.test.js")
      (tests 9)
      (status 'pass)
      (test-cases
        ("LearningExperience generates ID if not provided"
         "LearningExperience generates timestamp if not provided"
         "UrbanKnowledgeMapper initializes indices"
         "captureExperience updates indices"
         "findInterdisciplinaryConnections identifies multi-domain experiences"
         "mapByLocation aggregates experiences"
         "getLearnerJourney tracks timeline"
         "generateDomainNetwork creates edges"
         "findLearningHotspots filters by diversity")))

    (suite
      (name "mapper.test.ts")
      (tests 5)
      (status 'pass)
      (test-cases
        ("Mapper - Hotspot detection"
         "Mapper - Domain network generation"
         "Mapper - Learner journey tracking"
         "Mapper - Interdisciplinary connections"
         "Mapper - Diversity score calculation")))

    (suite
      (name "privacy.test.js")
      (tests 5)
      (status 'pass)
      (test-cases
        ("anonymizeLearner hashes learner IDs consistently"
         "anonymizeLocation fuzzes coordinates"
         "removePII sanitizes email addresses"
         "removePII sanitizes phone numbers"
         "fullyAnonymize applies all anonymization")))

    (suite
      (name "privacy.test.ts")
      (tests 6)
      (status 'pass)
      (test-cases
        ("Privacy - Learner ID anonymization"
         "Privacy - Location fuzzing"
         "Privacy - PII removal from text"
         "Privacy - Privacy level enforcement"
         "Privacy - Data minimization"
         "Privacy - Shareable dataset generation")))

    (suite
      (name "schemas.test.js")
      (tests 5)
      (status 'pass)
      (test-cases
        ("minimal valid experience passes validation"
         "experience with full metadata passes validation"
         "missing required fields fails validation"
         "invalid coordinates fail validation"
         "validateExperience throws on invalid data"))))

  (cli-verification
    (commands-tested
      ("deno task start help" . pass)
      ("deno task stats" . pass)
      ("deno task report" . pass))
    (data-present
      (experiences 8)
      (size-kb 12.05)
      (learners 5)
      (locations 7)
      (domains 16)))

  (code-quality
    (formatting
      (tool "deno fmt")
      (files-formatted 85)
      (status 'complete))
    (linting
      (tool "deno lint")
      (issues 35)
      (critical 0)
      (status 'acceptable-warnings)))

  (recommendations
    (rec-001
      (priority 'medium)
      (title "TypeScript Migration")
      (description "Convert JavaScript to TypeScript for better type safety"))
    (rec-002
      (priority 'low)
      (title "Address Lint Warnings")
      (description "Remove unused imports and fix async function declarations"))
    (rec-003
      (priority 'medium)
      (title "CI/CD Setup")
      (description "Add GitHub Actions workflow for automated Deno testing"))
    (rec-004
      (priority 'low)
      (title "Pin Dependencies")
      (description "Consider exact version pinning in deno.json")))

  (conclusion
    (status 'success)
    (message "UbiCity is fully functional with Deno 1.45.0. All 44 tests pass, CLI works correctly, and code is formatted.")))
