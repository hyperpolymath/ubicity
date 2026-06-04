// SPDX-License-Identifier: MPL-2.0
// Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
#!/usr/bin/env node

/**
 * Populate example learning experiences to demonstrate UbiCity
 *
 * These are fictional but realistic examples showing different types
 * of urban learning experiences.
 */

const { UrbanKnowledgeMapper } = require('../mapper');

const examples = [
  {
    learner: {
      id: 'alex-maker',
      background: ['design', 'electronics'],
      interests: ['urban sensing', 'environmental data']
    },
    context: {
      location: {
        name: 'Central Library Makerspace',
        type: 'library',
        coordinates: { lat: 51.5074, lon: -0.1278 }
      },
      situation: 'Weekly Arduino workshop',
      connections: [{ type: 'mentor', id: 'maker-jane' }]
    },
    experience: {
      type: 'failure',
      description:
        'Tried connecting Arduino to city air quality sensor. Failed to get I2C communication working, but learned about protocol timing and pullup resistors.',
      domains: ['electronics', 'environmental science', 'programming'],
      artifacts: [
        {
          type: 'photo',
          description: 'Circuit diagram with timing notes'
        }
      ],
      outcome: {
        success: false,
        next_questions: [
          'How do professional environmental monitoring networks work?',
          'Could citizen sensors create city-wide air quality map?'
        ],
        connections_made: [
          'Air quality data connects to urban planning decisions',
          'Similar to how field biologists collect distributed data'
        ]
      }
    },
    metadata: {
      tags: ['arduino', 'sensors', 'failure', 'environment'],
      privacy_level: 'public'
    }
  },

  {
    learner: {
      id: 'sam-urbanist',
      background: ['urban planning', 'sociology'],
      interests: ['walkability', 'public space']
    },
    context: {
      location: {
        name: 'Shoreditch High Street',
        type: 'street',
        coordinates: { lat: 51.5236, lon: -0.0775 }
      },
      situation: 'Observing pedestrian flow during lunch hour'
    },
    experience: {
      type: 'observation',
      description:
        'Noticed people naturally gather around food truck, creating impromptu social space. Seating spillover from cafe becomes de facto public square.',
      domains: ['urban planning', 'sociology', 'architecture'],
      outcome: {
        success: true,
        connections_made: [
          'Food infrastructure creates social infrastructure',
          'Temporary installations can seed permanent gathering spaces',
          'Similar to how parks need activation not just design'
        ],
        next_questions: [
          'What makes some food trucks become community hubs?',
          'How to formalize informal gathering patterns?'
        ]
      }
    },
    metadata: {
      tags: ['public space', 'food', 'community'],
      privacy_level: 'public'
    }
  },

  {
    learner: {
      id: 'alex-maker',
      background: ['design', 'electronics'],
      interests: ['urban sensing', 'environmental data']
    },
    context: {
      location: {
        name: 'Borough Market',
        type: 'public_space',
        coordinates: { lat: 51.5055, lon: -0.0909 }
      },
      situation: 'Lunch break, overheard vendor explaining seasonal produce'
    },
    experience: {
      type: 'insight',
      description:
        'Vendor explained how weather patterns affect crop timing. Realized my air quality sensor project could help farmers predict microclimates.',
      domains: ['agriculture', 'environmental science', 'electronics'],
      outcome: {
        success: true,
        connections_made: [
          'Urban sensors could inform urban farming',
          'Market vendors have deep environmental knowledge',
          'Technology meets traditional ecological knowledge'
        ],
        next_questions: [
          'Do urban farmers already track microclimate data?',
          'Could sensor network be food-production focused?'
        ]
      }
    },
    metadata: {
      tags: ['urban farming', 'sensors', 'traditional knowledge'],
      privacy_level: 'public',
      related_experiences: ['ubi-*'] // Would link to the previous Arduino experience
    }
  },

  {
    learner: {
      id: 'priya-coder',
      background: ['computer science', 'data visualization'],
      interests: ['civic tech', 'open data']
    },
    context: {
      location: {
        name: 'Cafe on Brick Lane',
        type: 'cafe',
        coordinates: { lat: 51.5208, lon: -0.0714 }
      },
      situation: 'Working on personal project',
      connections: [{ type: 'stranger', id: 'overheard-conversation' }]
    },
    experience: {
      type: 'discovery',
      description:
        'Overheard two people discussing local history. Led me to discover Layers of London project - historical maps overlaid on modern city. Perfect pattern for my civic data viz.',
      domains: ['data visualization', 'history', 'cartography', 'programming'],
      artifacts: [
        {
          type: 'note',
          description: 'Sketch of temporal layer interface'
        }
      ],
      outcome: {
        success: true,
        connections_made: [
          'Historical thinking applies to civic data',
          'Maps are time machines',
          'Local knowledge lives in conversations not databases'
        ],
        next_questions: [
          'How to capture local knowledge digitally?',
          'What other domains use temporal layering?'
        ]
      }
    },
    metadata: {
      tags: ['data viz', 'history', 'maps', 'serendipity'],
      privacy_level: 'public'
    }
  },

  {
    learner: {
      id: 'sam-urbanist',
      background: ['urban planning', 'sociology'],
      interests: ['walkability', 'public space']
    },
    context: {
      location: {
        name: 'Granary Square, Kings Cross',
        type: 'public_space',
        coordinates: { lat: 51.5359, lon: -0.1252 }
      },
      situation: 'Attending outdoor exhibition about urban data'
    },
    experience: {
      type: 'collaboration',
      description:
        'Met data artist showing real-time pedestrian flow visualizations. Discussed how my observations could become datasets for art installations.',
      domains: ['urban planning', 'data visualization', 'art', 'sociology'],
      connections: [{ type: 'practitioner', id: 'priya-coder' }],
      outcome: {
        success: true,
        connections_made: [
          'Urban planning data is artistic material',
          'Art makes invisible patterns visible',
          'Collaboration across practice boundaries'
        ],
        next_questions: [
          'What if planners and artists worked together from the start?',
          'Can art installations be data collection tools?'
        ]
      }
    },
    metadata: {
      tags: ['collaboration', 'art', 'data', 'interdisciplinary'],
      privacy_level: 'community'
    }
  },

  {
    learner: {
      id: 'jordan-student',
      background: ['literature', 'creative writing'],
      interests: ['storytelling', 'place']
    },
    context: {
      location: {
        name: 'Shakespeare\'s Globe Theatre',
        type: 'institution',
        coordinates: { lat: 51.5081, lon: -0.0972 }
      },
      situation: 'Taking walking tour, guide explaining theater history'
    },
    experience: {
      type: 'reflection',
      description:
        'Guide explained how Globe was designed for audience interaction - no fourth wall. Made me realize my writing treats readers as audience not participants.',
      domains: ['literature', 'theater', 'architecture', 'design'],
      outcome: {
        success: true,
        connections_made: [
          'Architecture shapes narrative form',
          'Interactive theater is like interactive fiction',
          'Physical space affects storytelling possibility'
        ],
        next_questions: [
          'How would Shakespeare have used hypertext?',
          'Can narrative structure reflect urban structure?',
          'What is the "architecture" of a story?'
        ]
      }
    },
    metadata: {
      tags: ['literature', 'architecture', 'narrative', 'interaction'],
      privacy_level: 'public'
    }
  },

  {
    learner: {
      id: 'morgan-researcher',
      background: ['anthropology', 'ethnography'],
      interests: ['urban culture', 'methodology']
    },
    context: {
      location: {
        name: 'Brixton Village Market',
        type: 'public_space',
        coordinates: { lat: 51.4613, lon: -0.1142 }
      },
      situation: 'Fieldwork on market social dynamics'
    },
    experience: {
      type: 'question',
      description:
        'Realized my ethnographic methods assume I\'m an observer. But market vendors keep pulling me into conversations. What if participation is the method?',
      domains: ['anthropology', 'methodology', 'sociology'],
      outcome: {
        success: true,
        connections_made: [
          'Observation vs participation is false binary',
          'Urban fieldwork is always participatory',
          'Method emerges from place not textbook'
        ],
        next_questions: [
          'How to document experiences I\'m part of?',
          'Is there an urban-specific ethnography?',
          'What would vendor-led research look like?'
        ]
      }
    },
    metadata: {
      tags: ['methodology', 'ethnography', 'participation', 'markets'],
      privacy_level: 'public'
    }
  },

  {
    learner: {
      id: 'alex-maker',
      background: ['design', 'electronics'],
      interests: ['urban sensing', 'environmental data']
    },
    context: {
      location: {
        name: 'Central Library Makerspace',
        type: 'library',
        coordinates: { lat: 51.5074, lon: -0.1278 }
      },
      situation: 'Return to makerspace with new approach',
      connections: [
        { type: 'mentor', id: 'maker-jane' },
        { type: 'peer', id: 'priya-coder' }
      ]
    },
    experience: {
      type: 'experiment',
      description:
        'Built working prototype of air quality sensor. Used I2C lessons from previous failure. Priya offered to help visualize data.',
      domains: ['electronics', 'environmental science', 'programming', 'data visualization'],
      artifacts: [
        {
          type: 'code',
          description: 'Arduino sketch with working I2C communication'
        },
        {
          type: 'photo',
          description: 'Functioning sensor showing real-time readings'
        }
      ],
      outcome: {
        success: true,
        connections_made: [
          'Previous failure was necessary learning',
          'Collaboration makes projects possible',
          'Makerspace becoming community not just facility'
        ],
        next_questions: [
          'Where should sensors be placed for urban farming data?',
          'Who owns data from public sensors?',
          'How to make visualizations accessible to farmers?'
        ]
      }
    },
    metadata: {
      tags: ['arduino', 'sensors', 'success', 'collaboration'],
      privacy_level: 'public',
      related_experiences: ['ubi-*'] // Links back to first Arduino failure
    }
  }
];

function populateExamples() {
  console.log('🏙️  Populating UbiCity with example learning experiences...\n');

  const mapper = new UrbanKnowledgeMapper();

  examples.forEach((example, index) => {
    try {
      const id = mapper.captureExperience(example);
      console.log(`✅ [${index + 1}/${examples.length}] Captured: ${id}`);
      console.log(
        `   ${example.learner.id} @ ${example.context.location.name}`
      );
    } catch (error) {
      console.error(`❌ Failed to capture example ${index + 1}:`, error.message);
    }
  });

  console.log('\n📊 Generating initial analysis...\n');

  const report = mapper.generateReport();

  console.log('Summary:');
  console.log(`  Total experiences: ${report.summary.totalExperiences}`);
  console.log(`  Unique learners: ${report.summary.uniqueLearners}`);
  console.log(`  Unique locations: ${report.summary.uniqueLocations}`);
  console.log(`  Unique domains: ${report.summary.uniqueDomains}`);
  console.log(
    `  Interdisciplinary: ${report.summary.interdisciplinaryExperiences}`
  );

  console.log('\n🔥 Learning Hotspots:');
  report.learningHotspots.slice(0, 3).forEach(hotspot => {
    console.log(`  • ${hotspot.location} (${hotspot.diversity} domains)`);
  });

  console.log('\n🔗 Sample Interdisciplinary Connections:');
  report.interdisciplinaryConnections.slice(0, 3).forEach(conn => {
    console.log(`  • ${conn.location}: ${conn.domains.join(' + ')}`);
  });

  console.log('\n✨ Example data populated successfully!');
  console.log('\nTry these commands:');
  console.log('  node mapper.js report       - Full analysis');
  console.log('  node mapper.js hotspots     - Learning hotspot details');
  console.log('  node mapper.js learner alex-maker  - See Alex\'s learning journey');
  console.log('  node mapper.js network      - Domain connection network');
}

if (require.main === module) {
  populateExamples();
}

module.exports = { examples, populateExamples };
