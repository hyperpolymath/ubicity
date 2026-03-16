#!/usr/bin/env node
// SPDX-License-Identifier: PMPL-1.0-or-later

/**
 * Enhanced UbiCity Visualization Generator
 * Creates interactive HTML maps with filtering and search
 */

import { UrbanKnowledgeMapper } from './mapper.js';
import { ExperienceStorage } from './storage.js';

/**
 * Generate enhanced interactive HTML visualization
 */
export async function generateVisualization(options = {}) {
  const {
    outputFile = 'ubicity-map.html',
    includeMap = true,
    includeTimeline = true,
    includeNetwork = true,
  } = options;

  const mapper = new UrbanKnowledgeMapper();
  await mapper.initialize();
  await mapper.loadAll();

  const report = await mapper.generateReport();
  const locationMap = mapper.mapByLocation();
  const network = mapper.generateDomainNetwork();

  // Get all locations with coordinates
  const locations = Object.entries(locationMap)
    .filter(([_, data]) => data.coordinates)
    .map(([name, data]) => ({
      name,
      ...data,
    }));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UbiCity Learning Map</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      color: #333;
    }

    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    header h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    header p {
      opacity: 0.9;
      font-size: 1.1rem;
    }

    .container {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1rem;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }

    .stat-value {
      font-size: 2.5rem;
      font-weight: bold;
      color: #667eea;
      margin-bottom: 0.5rem;
    }

    .stat-label {
      color: #666;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .section {
      background: white;
      border-radius: 8px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .section h2 {
      color: #667eea;
      margin-bottom: 1.5rem;
      font-size: 1.8rem;
    }

    .search-bar {
      width: 100%;
      padding: 0.75rem;
      font-size: 1rem;
      border: 2px solid #ddd;
      border-radius: 4px;
      margin-bottom: 1rem;
      transition: border-color 0.3s;
    }

    .search-bar:focus {
      outline: none;
      border-color: #667eea;
    }

    .filters {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    .filter-tag {
      padding: 0.5rem 1rem;
      background: #f0f0f0;
      border: 1px solid #ddd;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.3s;
      font-size: 0.9rem;
    }

    .filter-tag:hover {
      background: #e0e0e0;
    }

    .filter-tag.active {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }

    .location-list {
      display: grid;
      gap: 1rem;
    }

    .location-card {
      padding: 1.5rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      transition: all 0.3s;
    }

    .location-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border-color: #667eea;
    }

    .location-name {
      font-size: 1.3rem;
      font-weight: bold;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .location-meta {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      color: #666;
    }

    .location-meta span {
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }

    .domains {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .domain-tag {
      padding: 0.3rem 0.8rem;
      background: #f0f4ff;
      color: #667eea;
      border-radius: 15px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .network-viz {
      position: relative;
      height: 400px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-top: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fafafa;
    }

    .network-viz p {
      color: #999;
      font-size: 1.1rem;
    }

    footer {
      text-align: center;
      padding: 2rem;
      color: #666;
    }

    @media (max-width: 768px) {
      header h1 {
        font-size: 1.8rem;
      }

      .stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .location-meta {
        flex-direction: column;
        gap: 0.5rem;
      }
    }
  </style>
</head>
<body>
  <header>
    <h1>🏙️ UbiCity Learning Map</h1>
    <p>Mapping informal learning across urban space</p>
    <p style="font-size: 0.9rem; margin-top: 0.5rem;">
      Generated: ${new Date().toLocaleDateString()}
    </p>
  </header>

  <div class="container">
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${report.summary.totalExperiences}</div>
        <div class="stat-label">Experiences</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${report.summary.uniqueLocations}</div>
        <div class="stat-label">Locations</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${report.summary.uniqueDomains}</div>
        <div class="stat-label">Domains</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${report.summary.uniqueLearners}</div>
        <div class="stat-label">Learners</div>
      </div>
    </div>

    <div class="section">
      <h2>🔥 Learning Hotspots</h2>
      <p style="margin-bottom: 1rem; color: #666;">
        Locations with high disciplinary diversity (${report.learningHotspots.length} found)
      </p>

      <input
        type="text"
        class="search-bar"
        id="searchHotspots"
        placeholder="Search locations, domains, or types..."
      />

      <div class="filters" id="domainFilters"></div>

      <div class="location-list" id="hotspotsList">
        ${report.learningHotspots
          .map(
            hotspot => `
          <div class="location-card" data-domains="${hotspot.domains.join(' ')}">
            <div class="location-name">${hotspot.location}</div>
            <div class="location-meta">
              <span>📊 ${hotspot.count} experiences</span>
              <span>👥 ${hotspot.learners} learners</span>
              <span>🎯 ${hotspot.diversity} diversity</span>
            </div>
            <div class="domains">
              ${hotspot.domains.map(d => `<span class="domain-tag">${d}</span>`).join('')}
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>

    ${
      locations.length > 0
        ? `
    <div class="section">
      <h2>🗺️ Geographic Distribution</h2>
      <p style="margin-bottom: 1rem; color: #666;">
        ${locations.length} locations with GPS coordinates
      </p>
      <div style="background: #f0f0f0; padding: 2rem; border-radius: 8px; text-align: center;">
        <p style="color: #666; margin-bottom: 1rem;">
          📍 Coordinates available for mapping
        </p>
        <p style="font-size: 0.9rem; color: #999;">
          Export to GeoJSON to visualize in mapping tools:
          <code style="background: white; padding: 0.2rem 0.5rem; border-radius: 3px; color: #667eea;">
            node src/export.js geojson map.json
          </code>
        </p>
      </div>
    </div>
    `
        : ''
    }

    <div class="section">
      <h2>🕸️ Domain Network</h2>
      <p style="margin-bottom: 1rem; color: #666;">
        ${network.nodes.length} domains, ${network.edges.length} connections
      </p>

      <div style="background: #f9f9f9; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem;">
        <h3 style="margin-bottom: 1rem; color: #555;">Top Domains</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem;">
          ${network.nodes
            .sort((a, b) => b.size - a.size)
            .slice(0, 10)
            .map(
              node => `
            <div style="padding: 0.5rem; background: white; border-radius: 4px; border: 1px solid #e0e0e0;">
              <strong>${node.id}</strong>: ${node.size} experiences
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <div style="background: #f9f9f9; padding: 1.5rem; border-radius: 8px;">
        <h3 style="margin-bottom: 1rem; color: #555;">Strongest Connections</h3>
        <div style="display: grid; gap: 0.5rem;">
          ${network.edges
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 10)
            .map(
              edge => `
            <div style="padding: 0.5rem; background: white; border-radius: 4px; border: 1px solid #e0e0e0; display: flex; justify-content: space-between;">
              <span>${edge.source} ↔ ${edge.target}</span>
              <strong style="color: #667eea;">${edge.weight}x</strong>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <div style="margin-top: 1rem; font-size: 0.9rem; color: #999; text-align: center;">
        💡 Export to DOT format for graph visualization:
        <code style="background: white; padding: 0.2rem 0.5rem; border-radius: 3px; color: #667eea;">
          node src/export.js dot network.dot
        </code>
      </div>
    </div>

    <div class="section">
      <h2>💡 Insights</h2>
      <div style="display: grid; gap: 1rem;">
        <div style="padding: 1rem; background: #f0f4ff; border-left: 4px solid #667eea; border-radius: 4px;">
          <strong>Most diverse location:</strong>
          ${report.learningHotspots[0]?.location || 'N/A'} (${report.learningHotspots[0]?.diversity || 0} domains)
        </div>
        <div style="padding: 1rem; background: #f0f4ff; border-left: 4px solid #667eea; border-radius: 4px;">
          <strong>Interdisciplinary learning:</strong>
          ${report.summary.interdisciplinaryExperiences} experiences span multiple domains
        </div>
        <div style="padding: 1rem; background: #f0f4ff; border-left: 4px solid #667eea; border-radius: 4px;">
          <strong>Average diversity per location:</strong>
          ${(report.summary.uniqueDomains / report.summary.uniqueLocations).toFixed(1)} domains
        </div>
      </div>
    </div>
  </div>

  <footer>
    <p>Generated by UbiCity Learning Capture System</p>
    <p style="font-size: 0.9rem; margin-top: 0.5rem;">
      <a href="https://github.com/Hyperpolymath/ubicity" style="color: #667eea;">
        GitHub Repository
      </a>
    </p>
  </footer>

  <script>
    // Search functionality
    const searchBar = document.getElementById('searchHotspots');
    const cards = document.querySelectorAll('.location-card');

    searchBar.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();

      cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? 'block' : 'none';
      });
    });

    // Domain filters
    const allDomains = ${JSON.stringify(Array.from(new Set(report.learningHotspots.flatMap(h => h.domains))))};
    const filtersContainer = document.getElementById('domainFilters');
    let activeDomains = new Set();

    allDomains.forEach(domain => {
      const tag = document.createElement('div');
      tag.className = 'filter-tag';
      tag.textContent = domain;
      tag.addEventListener('click', () => {
        tag.classList.toggle('active');

        if (tag.classList.contains('active')) {
          activeDomains.add(domain);
        } else {
          activeDomains.delete(domain);
        }

        filterCards();
      });

      filtersContainer.appendChild(tag);
    });

    function filterCards() {
      if (activeDomains.size === 0) {
        cards.forEach(card => card.style.display = 'block');
        return;
      }

      cards.forEach(card => {
        const cardDomains = card.dataset.domains.split(' ');
        const hasActiveDomain = cardDomains.some(d => activeDomains.has(d));
        card.style.display = hasActiveDomain ? 'block' : 'none';
      });
    }
  </script>
</body>
</html>`;

  const storage = new ExperienceStorage();
  await storage.saveVisualization(html, outputFile);

  return outputFile;
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    console.log('\n🎨 Generating interactive visualization...\n');

    const outputFile = await generateVisualization();

    console.log(`✅ Visualization saved: ${outputFile}`);
    console.log(`\n📂 Open in browser to explore!\n`);
  })();
}
