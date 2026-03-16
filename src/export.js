// SPDX-License-Identifier: PMPL-1.0-or-later
/**
 * Export utilities for UbiCity data
 * Supports CSV, JSON, and other formats
 */

import { UrbanKnowledgeMapper } from './mapper.js';
import { promises as fs } from 'fs';

/**
 * Export experiences to CSV format
 * @param {UrbanKnowledgeMapper} mapper - Loaded mapper instance
 * @returns {string} CSV content
 */
export function exportToCSV(mapper) {
  const headers = [
    'id',
    'timestamp',
    'learner_id',
    'location',
    'type',
    'description',
    'domains',
    'success',
    'latitude',
    'longitude',
  ];

  const rows = [headers.join(',')];

  mapper.experiences.forEach(exp => {
    const data = exp.data;
    const row = [
      data.id,
      data.timestamp,
      data.learner.id,
      `"${data.context.location?.name || ''}"`,
      data.experience.type,
      `"${data.experience.description.replace(/"/g, '""')}"`,
      `"${(data.experience.domains || []).join('; ')}"`,
      data.experience.outcome?.success ?? '',
      data.context.location?.coordinates?.latitude ?? '',
      data.context.location?.coordinates?.longitude ?? '',
    ];
    rows.push(row.join(','));
  });

  return rows.join('\n');
}

/**
 * Export location map to GeoJSON
 * @param {UrbanKnowledgeMapper} mapper - Loaded mapper instance
 * @returns {object} GeoJSON FeatureCollection
 */
export function exportToGeoJSON(mapper) {
  const locationMap = mapper.mapByLocation();
  const features = [];

  Object.entries(locationMap).forEach(([name, data]) => {
    if (data.coordinates) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [data.coordinates.longitude, data.coordinates.latitude],
        },
        properties: {
          name,
          experiences: data.count,
          learners: data.learners,
          diversity: data.diversity,
          domains: data.domains,
          types: data.types,
        },
      });
    }
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Export domain network to Graphviz DOT format
 * @param {UrbanKnowledgeMapper} mapper - Loaded mapper instance
 * @returns {string} DOT format graph
 */
export function exportToDOT(mapper) {
  const network = mapper.generateDomainNetwork();

  let dot = 'graph DomainNetwork {\n';
  dot += '  layout=neato;\n';
  dot += '  overlap=false;\n\n';

  // Nodes
  network.nodes.forEach(node => {
    const size = Math.max(0.5, Math.min(3, node.size / 5));
    dot += `  "${node.id}" [width=${size}];\n`;
  });

  dot += '\n';

  // Edges
  network.edges.forEach(edge => {
    const penwidth = Math.max(1, Math.min(5, edge.weight));
    dot += `  "${edge.source}" -- "${edge.target}" [penwidth=${penwidth}];\n`;
  });

  dot += '}\n';

  return dot;
}

/**
 * Export learner journeys to Markdown
 * @param {UrbanKnowledgeMapper} mapper - Loaded mapper instance
 * @returns {string} Markdown content
 */
export function exportJourneysToMarkdown(mapper) {
  let md = '# UbiCity Learner Journeys\n\n';

  mapper.learnerIndex.forEach((_ids, learnerId) => {
    const journey = mapper.getLearnerJourney(learnerId);

    md += `## Learner: ${learnerId}\n\n`;
    md += `**Total Experiences:** ${journey.experienceCount}\n\n`;

    md += '### Timeline\n\n';
    journey.timeline.forEach((exp, i) => {
      const date = new Date(exp.timestamp).toLocaleDateString();
      md += `${i + 1}. **${date}** - ${exp.location} (${exp.type})\n`;
      if (exp.domains && exp.domains.length > 0) {
        md += `   - Domains: ${exp.domains.join(', ')}\n`;
      }
      md += `   - ${exp.description}\n\n`;
    });

    if (journey.domainEvolution.length > 0) {
      md += '### Domain Evolution\n\n';
      journey.domainEvolution.forEach(evo => {
        const date = new Date(evo.timestamp).toLocaleDateString();
        md += `- **${date}**: Discovered ${evo.newDomains.join(', ')}\n`;
      });
      md += '\n';
    }

    if (journey.questionsEmerged.length > 0) {
      md += '### Questions Emerged\n\n';
      journey.questionsEmerged.forEach(q => {
        md += `- ${q}\n`;
      });
      md += '\n';
    }

    md += '---\n\n';
  });

  return md;
}

/**
 * CLI export tool
 */
export async function exportData(format, outputPath) {
  const mapper = new UrbanKnowledgeMapper();
  await mapper.initialize();
  await mapper.loadAll();

  let content;

  switch (format.toLowerCase()) {
    case 'csv':
      content = exportToCSV(mapper);
      break;

    case 'geojson':
      content = JSON.stringify(exportToGeoJSON(mapper), null, 2);
      break;

    case 'dot':
      content = exportToDOT(mapper);
      break;

    case 'markdown':
    case 'md':
      content = exportJourneysToMarkdown(mapper);
      break;

    case 'json':
      const all = Array.from(mapper.experiences.values()).map(e => e.data);
      content = JSON.stringify(all, null, 2);
      break;

    default:
      throw new Error(`Unknown format: ${format}`);
  }

  if (outputPath) {
    await fs.writeFile(outputPath, content, 'utf8');
    console.log(`Exported to: ${outputPath}`);
  } else {
    console.log(content);
  }
}
