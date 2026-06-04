// SPDX-License-Identifier: MPL-2.0
// Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
#!/usr/bin/env node

/**
 * UbiCity Visualization Generator
 *
 * Creates simple HTML visualizations of learning experiences
 * No external dependencies - pure HTML/CSS/JS
 */

const fs = require('fs');
const path = require('path');
const { UrbanKnowledgeMapper } = require('./mapper');

function generateHTML(mapper) {
  const report = mapper.generateReport();
  const locationMap = report.locationMap;
  const network = report.domainNetwork;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UbiCity Learning Map</title>
  <style>
    * {
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }

    h1, h2 {
      color: #2c3e50;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      border-radius: 10px;
      margin-bottom: 30px;
    }

    .header h1 {
      margin: 0 0 10px 0;
      color: white;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .stat-card h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      text-transform: uppercase;
      color: #666;
    }

    .stat-card .value {
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
    }

    .section {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    .location-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .location-card {
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      transition: all 0.3s;
    }

    .location-card:hover {
      border-color: #667eea;
      box-shadow: 0 4px 8px rgba(102, 126, 234, 0.2);
    }

    .location-card h3 {
      margin: 0 0 15px 0;
      color: #2c3e50;
    }

    .location-card .metric {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
      font-size: 14px;
    }

    .location-card .metric .label {
      color: #666;
    }

    .location-card .metric .value {
      font-weight: bold;
      color: #667eea;
    }

    .domains-list {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #e0e0e0;
    }

    .domain-tag {
      display: inline-block;
      background: #f0f0f0;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      margin: 4px;
      color: #555;
    }

    .hotspot {
      border-color: #f39c12;
    }

    .hotspot-badge {
      display: inline-block;
      background: #f39c12;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
      margin-left: 10px;
    }

    .network-viz {
      margin-top: 20px;
    }

    .network-edge {
      display: flex;
      align-items: center;
      margin: 10px 0;
      padding: 10px;
      background: #f9f9f9;
      border-radius: 4px;
    }

    .network-edge .domains {
      flex: 1;
      font-weight: 500;
    }

    .network-edge .weight {
      background: #667eea;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }

    .interdisciplinary-list {
      margin-top: 20px;
    }

    .interdisciplinary-item {
      padding: 15px;
      margin: 10px 0;
      background: #f9f9f9;
      border-left: 4px solid #667eea;
      border-radius: 4px;
    }

    .interdisciplinary-item .location {
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 8px;
    }

    .interdisciplinary-item .description {
      color: #555;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .interdisciplinary-item .connections {
      font-size: 13px;
      color: #666;
      font-style: italic;
    }

    @media (max-width: 768px) {
      .stats {
        grid-template-columns: 1fr;
      }

      .location-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏙️ UbiCity Learning Map</h1>
    <p>Visualization of learning experiences across urban space</p>
    <small>Generated: ${new Date().toLocaleString()}</small>
  </div>

  <div class="stats">
    <div class="stat-card">
      <h3>Total Experiences</h3>
      <div class="value">${report.summary.totalExperiences}</div>
    </div>
    <div class="stat-card">
      <h3>Unique Learners</h3>
      <div class="value">${report.summary.uniqueLearners}</div>
    </div>
    <div class="stat-card">
      <h3>Unique Locations</h3>
      <div class="value">${report.summary.uniqueLocations}</div>
    </div>
    <div class="stat-card">
      <h3>Unique Domains</h3>
      <div class="value">${report.summary.uniqueDomains}</div>
    </div>
    <div class="stat-card">
      <h3>Interdisciplinary</h3>
      <div class="value">${report.summary.interdisciplinaryExperiences}</div>
    </div>
  </div>

  <div class="section">
    <h2>🔥 Learning Hotspots</h2>
    <p>Locations with high disciplinary diversity (3+ domains)</p>
    <div class="location-grid">
      ${report.learningHotspots
        .map(
          hotspot => `
        <div class="location-card hotspot">
          <h3>
            ${hotspot.location}
            <span class="hotspot-badge">HOTSPOT</span>
          </h3>
          <div class="metric">
            <span class="label">Experiences:</span>
            <span class="value">${hotspot.count}</span>
          </div>
          <div class="metric">
            <span class="label">Unique Learners:</span>
            <span class="value">${hotspot.learners}</span>
          </div>
          <div class="metric">
            <span class="label">Domain Diversity:</span>
            <span class="value">${hotspot.diversity}</span>
          </div>
          <div class="domains-list">
            ${hotspot.domains.map(d => `<span class="domain-tag">${d}</span>`).join('')}
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  </div>

  <div class="section">
    <h2>📍 All Locations</h2>
    <div class="location-grid">
      ${Object.entries(locationMap)
        .sort((a, b) => b[1].count - a[1].count)
        .map(
          ([name, data]) => `
        <div class="location-card">
          <h3>${name}</h3>
          <div class="metric">
            <span class="label">Experiences:</span>
            <span class="value">${data.count}</span>
          </div>
          <div class="metric">
            <span class="label">Unique Learners:</span>
            <span class="value">${data.learners}</span>
          </div>
          <div class="metric">
            <span class="label">Domain Diversity:</span>
            <span class="value">${data.diversity}</span>
          </div>
          <div class="domains-list">
            ${data.domains.map(d => `<span class="domain-tag">${d}</span>`).join('')}
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  </div>

  <div class="section">
    <h2>🔗 Interdisciplinary Connections</h2>
    <p>Learning experiences that span multiple domains</p>
    <div class="interdisciplinary-list">
      ${report.interdisciplinaryConnections
        .map(
          conn => `
        <div class="interdisciplinary-item">
          <div class="location">${conn.location || 'Unknown location'}</div>
          <div class="description">${conn.description}</div>
          <div class="domains-list">
            ${conn.domains.map(d => `<span class="domain-tag">${d}</span>`).join('')}
          </div>
          ${
            conn.unexpected && conn.unexpected.length > 0
              ? `<div class="connections">💡 ${conn.unexpected.join('; ')}</div>`
              : ''
          }
        </div>
      `
        )
        .join('')}
    </div>
  </div>

  <div class="section">
    <h2>🕸️ Domain Network</h2>
    <p>Which domains frequently co-occur in learning experiences</p>
    <div class="network-viz">
      ${network.edges
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 15)
        .map(
          edge => `
        <div class="network-edge">
          <div class="domains">${edge.source} ⟷ ${edge.target}</div>
          <div class="weight">${edge.weight}x</div>
        </div>
      `
        )
        .join('')}
    </div>
  </div>

  <div class="section">
    <h2>💡 Insights</h2>
    <ul>
      <li>
        <strong>Most active location:</strong>
        ${Object.entries(locationMap).sort((a, b) => b[1].count - a[1].count)[0]?.[0] || 'N/A'}
      </li>
      <li>
        <strong>Most diverse location:</strong>
        ${Object.entries(locationMap).sort((a, b) => b[1].diversity - a[1].diversity)[0]?.[0] || 'N/A'}
      </li>
      <li>
        <strong>Most connected domains:</strong>
        ${network.edges.length > 0 ? `${network.edges[0].source} ⟷ ${network.edges[0].target}` : 'N/A'}
      </li>
      <li>
        <strong>Interdisciplinary rate:</strong>
        ${
          report.summary.totalExperiences > 0
            ? Math.round(
                (report.summary.interdisciplinaryExperiences /
                  report.summary.totalExperiences) *
                  100
              )
            : 0
        }%
      </li>
    </ul>
  </div>

  <footer style="text-align: center; margin-top: 40px; color: #666; font-size: 14px;">
    <p>UbiCity Learning Capture System • Generated from ${report.summary.totalExperiences} experiences</p>
    <p style="font-size: 12px;">Learning should be free as in freedom • GPL3 Licensed</p>
  </footer>
</body>
</html>`;

  return html;
}

function main() {
  console.log('🎨 Generating UbiCity visualization...\n');

  const mapper = new UrbanKnowledgeMapper();
  mapper.loadAll();

  if (mapper.experiences.size === 0) {
    console.error('❌ No experiences found!');
    console.log('\nTry running: node examples/populate-examples.js');
    process.exit(1);
  }

  const html = generateHTML(mapper);

  const outputPath = path.join(mapper.storageDir, 'ubicity-map.html');
  fs.writeFileSync(outputPath, html);

  console.log(`✅ Visualization generated: ${outputPath}`);
  console.log('\nOpen this file in a browser to view your learning map!');
}

if (require.main === module) {
  main();
}

module.exports = { generateHTML };
