// SPDX-License-Identifier: AGPL-3.0-or-later
// Unit tests for Visualization.res

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateCSS,
  generateStats,
  generateHotspotCard,
  generateHotspotsSection,
  generateGeographicSection,
  generateNetworkSection,
  generateInsightsSection,
  generateJavaScript,
  generateHTML
} from '../src-rescript/Visualization.res.js';

// Test data helpers
function createReport(totalExperiences = 10, uniqueLocations = 5, uniqueDomains = 8, uniqueLearners = 3, interdisciplinaryExperiences = 4) {
  return {
    summary: {
      totalExperiences,
      uniqueLocations,
      uniqueDomains,
      uniqueLearners,
      interdisciplinaryExperiences
    },
    learningHotspots: []
  };
}

function createHotspot(location, count, learners, diversity, domains) {
  return {
    location,
    count,
    learners,
    diversity,
    domains
  };
}

function createNetwork(nodes, edges) {
  return { nodes, edges };
}

test('Visualization: generateCSS - returns valid CSS', () => {
  const css = generateCSS();

  assert.ok(css.includes('body {'), 'Should have body styles');
  assert.ok(css.includes('header {'), 'Should have header styles');
  assert.ok(css.includes('.stat-card'), 'Should have stat-card styles');
  assert.ok(css.includes('.section'), 'Should have section styles');
  assert.ok(css.includes('@media'), 'Should have media queries');
});

test('Visualization: generateCSS - includes gradient', () => {
  const css = generateCSS();

  assert.ok(css.includes('gradient'), 'Should include gradient styling');
  assert.ok(css.includes('#667eea'), 'Should include primary color');
});

test('Visualization: generateStats - basic stats display', () => {
  const report = createReport(10, 5, 8, 3);
  const html = generateStats(report.summary);

  assert.ok(html.includes('<div class="stats">'), 'Should have stats container');
  assert.ok(html.includes('10'), 'Should show total experiences');
  assert.ok(html.includes('5'), 'Should show unique locations');
  assert.ok(html.includes('8'), 'Should show unique domains');
  assert.ok(html.includes('3'), 'Should show unique learners');
});

test('Visualization: generateStats - stat labels', () => {
  const report = createReport();
  const html = generateStats(report.summary);

  assert.ok(html.includes('Experiences'), 'Should have Experiences label');
  assert.ok(html.includes('Locations'), 'Should have Locations label');
  assert.ok(html.includes('Domains'), 'Should have Domains label');
  assert.ok(html.includes('Learners'), 'Should have Learners label');
});

test('Visualization: generateHotspotCard - basic structure', () => {
  const hotspot = createHotspot('Lab A', 5, 3, 4, ['software', 'hardware']);
  const html = generateHotspotCard(hotspot);

  assert.ok(html.includes('location-card'), 'Should have location-card class');
  assert.ok(html.includes('Lab A'), 'Should show location name');
  assert.ok(html.includes('5 experiences'), 'Should show experience count');
  assert.ok(html.includes('3 learners'), 'Should show learner count');
  assert.ok(html.includes('4 diversity'), 'Should show diversity score');
});

test('Visualization: generateHotspotCard - domain tags', () => {
  const hotspot = createHotspot('Lab A', 5, 3, 4, ['software', 'hardware', 'design']);
  const html = generateHotspotCard(hotspot);

  assert.ok(html.includes('software'), 'Should include software domain');
  assert.ok(html.includes('hardware'), 'Should include hardware domain');
  assert.ok(html.includes('design'), 'Should include design domain');
  assert.ok(html.includes('domain-tag'), 'Should have domain-tag class');
});

test('Visualization: generateHotspotCard - data attributes', () => {
  const hotspot = createHotspot('Lab A', 5, 3, 4, ['software', 'hardware']);
  const html = generateHotspotCard(hotspot);

  assert.ok(html.includes('data-domains="software hardware"'), 'Should have data-domains attribute for filtering');
});

test('Visualization: generateHotspotsSection - section structure', () => {
  const hotspots = [
    createHotspot('Lab A', 5, 3, 4, ['software']),
    createHotspot('Lab B', 3, 2, 2, ['design'])
  ];
  const html = generateHotspotsSection(hotspots);

  assert.ok(html.includes('Learning Hotspots'), 'Should have section title');
  assert.ok(html.includes('searchHotspots'), 'Should have search bar');
  assert.ok(html.includes('domainFilters'), 'Should have filter container');
  assert.ok(html.includes('hotspotsList'), 'Should have hotspots list container');
});

test('Visualization: generateHotspotsSection - multiple hotspots', () => {
  const hotspots = [
    createHotspot('Lab A', 5, 3, 4, ['software']),
    createHotspot('Lab B', 3, 2, 2, ['design']),
    createHotspot('Lab C', 7, 4, 3, ['hardware'])
  ];
  const html = generateHotspotsSection(hotspots);

  assert.ok(html.includes('Lab A'), 'Should include first hotspot');
  assert.ok(html.includes('Lab B'), 'Should include second hotspot');
  assert.ok(html.includes('Lab C'), 'Should include third hotspot');
  assert.ok(html.includes('3 found'), 'Should show hotspot count');
});

test('Visualization: generateGeographicSection - with coordinates', () => {
  const html = generateGeographicSection(5);

  assert.ok(html.includes('Geographic Distribution'), 'Should have section title');
  assert.ok(html.includes('5 locations'), 'Should show location count');
  assert.ok(html.includes('GeoJSON'), 'Should mention GeoJSON export');
  assert.ok(html.includes('Export.res.js'), 'Should reference export script');
});

test('Visualization: generateGeographicSection - without coordinates', () => {
  const html = generateGeographicSection(0);

  assert.equal(html, '', 'Should return empty string when no coordinates');
});

test('Visualization: generateNetworkSection - basic structure', () => {
  const network = createNetwork(
    [
      { id: 'software', size: 10 },
      { id: 'hardware', size: 7 }
    ],
    [
      { source: 'software', target: 'hardware', weight: 5 }
    ]
  );
  const html = generateNetworkSection(network);

  assert.ok(html.includes('Domain Network'), 'Should have section title');
  assert.ok(html.includes('2 domains'), 'Should show domain count');
  assert.ok(html.includes('1 connections'), 'Should show connection count');
  assert.ok(html.includes('Top Domains'), 'Should have top domains subsection');
  assert.ok(html.includes('Strongest Connections'), 'Should have strongest connections subsection');
});

test('Visualization: generateNetworkSection - domain ranking', () => {
  const network = createNetwork(
    [
      { id: 'software', size: 10 },
      { id: 'hardware', size: 7 },
      { id: 'design', size: 3 }
    ],
    []
  );
  const html = generateNetworkSection(network);

  assert.ok(html.includes('software'), 'Should include software domain');
  assert.ok(html.includes('10 experiences'), 'Should show software size');
  assert.ok(html.includes('hardware'), 'Should include hardware domain');
  assert.ok(html.includes('7 experiences'), 'Should show hardware size');
});

test('Visualization: generateNetworkSection - connection weights', () => {
  const network = createNetwork(
    [{ id: 'software', size: 10 }],
    [
      { source: 'software', target: 'hardware', weight: 5 },
      { source: 'software', target: 'design', weight: 3 }
    ]
  );
  const html = generateNetworkSection(network);

  assert.ok(html.includes('software ↔ hardware'), 'Should show first connection');
  assert.ok(html.includes('5x'), 'Should show first weight');
  assert.ok(html.includes('software ↔ design'), 'Should show second connection');
  assert.ok(html.includes('3x'), 'Should show second weight');
});

test('Visualization: generateNetworkSection - DOT export hint', () => {
  const network = createNetwork([], []);
  const html = generateNetworkSection(network);

  assert.ok(html.includes('DOT format'), 'Should mention DOT export');
  assert.ok(html.includes('graph visualization'), 'Should explain purpose');
});

test('Visualization: generateInsightsSection - most diverse location', () => {
  const report = createReport(10, 5, 8, 3, 4);
  const hotspots = [
    createHotspot('Lab A', 5, 3, 4, ['software', 'hardware', 'design', 'art']),
    createHotspot('Lab B', 3, 2, 2, ['software', 'design'])
  ];
  const html = generateInsightsSection(report.summary, hotspots);

  assert.ok(html.includes('Insights'), 'Should have section title');
  assert.ok(html.includes('Most diverse location'), 'Should have diversity insight');
  assert.ok(html.includes('Lab A'), 'Should show most diverse location');
  assert.ok(html.includes('4 domains'), 'Should show diversity count');
});

test('Visualization: generateInsightsSection - interdisciplinary experiences', () => {
  const report = createReport(10, 5, 8, 3, 4);
  const hotspots = [];
  const html = generateInsightsSection(report.summary, hotspots);

  assert.ok(html.includes('Interdisciplinary learning'), 'Should have interdisciplinary insight');
  assert.ok(html.includes('4 experiences'), 'Should show interdisciplinary count');
});

test('Visualization: generateInsightsSection - average diversity', () => {
  const report = createReport(10, 5, 8, 3); // 8 domains / 5 locations = 1.6
  const hotspots = [];
  const html = generateInsightsSection(report.summary, hotspots);

  assert.ok(html.includes('Average diversity'), 'Should have average diversity insight');
  assert.ok(html.includes('1.6'), 'Should show calculated average');
});

test('Visualization: generateInsightsSection - handles no hotspots', () => {
  const report = createReport(10, 5, 8, 3, 4);
  const hotspots = [];
  const html = generateInsightsSection(report.summary, hotspots);

  assert.ok(html.includes('N/A'), 'Should show N/A for missing location');
  assert.ok(html.includes('0 domains'), 'Should show 0 for missing diversity');
});

test('Visualization: generateJavaScript - search functionality', () => {
  const hotspots = [
    createHotspot('Lab A', 5, 3, 4, ['software'])
  ];
  const js = generateJavaScript(hotspots);

  assert.ok(js.includes('searchBar'), 'Should have search bar variable');
  assert.ok(js.includes('addEventListener'), 'Should add event listener');
  assert.ok(js.includes('toLowerCase'), 'Should include case-insensitive search');
  assert.ok(js.includes('card.style.display'), 'Should toggle card visibility');
});

test('Visualization: generateJavaScript - domain filtering', () => {
  const hotspots = [
    createHotspot('Lab A', 5, 3, 4, ['software', 'hardware'])
  ];
  const js = generateJavaScript(hotspots);

  assert.ok(js.includes('domainFilters'), 'Should reference domain filters');
  assert.ok(js.includes('filter-tag'), 'Should create filter tags');
  assert.ok(js.includes('activeDomains'), 'Should track active domains');
  assert.ok(js.includes('filterCards'), 'Should have filter function');
});

test('Visualization: generateJavaScript - domain list', () => {
  const hotspots = [
    createHotspot('Lab A', 5, 3, 4, ['software', 'hardware']),
    createHotspot('Lab B', 3, 2, 2, ['software', 'design'])
  ];
  const js = generateJavaScript(hotspots);

  assert.ok(js.includes('["software","hardware","design"]'), 'Should include unique domain list as JSON');
});

test('Visualization: generateHTML - full document structure', () => {
  const report = createReport(10, 5, 8, 3, 4);
  const hotspots = [createHotspot('Lab A', 5, 3, 4, ['software'])];
  const network = createNetwork([{ id: 'software', size: 10 }], []);
  const html = generateHTML(report.summary, hotspots, network, 2);

  assert.ok(html.includes('<!DOCTYPE html>'), 'Should have doctype');
  assert.ok(html.includes('<html lang="en">'), 'Should have html tag');
  assert.ok(html.includes('<head>'), 'Should have head section');
  assert.ok(html.includes('<body>'), 'Should have body section');
  assert.ok(html.includes('</html>'), 'Should close html tag');
});

test('Visualization: generateHTML - metadata', () => {
  const report = createReport();
  const html = generateHTML(report.summary, [], createNetwork([], []), 0);

  assert.ok(html.includes('<meta charset="UTF-8">'), 'Should have charset meta');
  assert.ok(html.includes('<meta name="viewport"'), 'Should have viewport meta');
  assert.ok(html.includes('UbiCity Learning Map'), 'Should have page title');
});

test('Visualization: generateHTML - includes all sections', () => {
  const report = createReport(10, 5, 8, 3, 4);
  const hotspots = [createHotspot('Lab A', 5, 3, 4, ['software'])];
  const network = createNetwork([{ id: 'software', size: 10 }], []);
  const html = generateHTML(report.summary, hotspots, network, 2);

  assert.ok(html.includes('stats'), 'Should include stats section');
  assert.ok(html.includes('Learning Hotspots'), 'Should include hotspots section');
  assert.ok(html.includes('Geographic Distribution'), 'Should include geographic section');
  assert.ok(html.includes('Domain Network'), 'Should include network section');
  assert.ok(html.includes('Insights'), 'Should include insights section');
});

test('Visualization: generateHTML - includes JavaScript', () => {
  const report = createReport();
  const hotspots = [createHotspot('Lab A', 5, 3, 4, ['software'])];
  const network = createNetwork([], []);
  const html = generateHTML(report.summary, hotspots, network, 0);

  assert.ok(html.includes('<script>'), 'Should have script tag');
  assert.ok(html.includes('</script>'), 'Should close script tag');
  assert.ok(html.includes('searchBar'), 'Should include search functionality');
});

test('Visualization: generateHTML - includes CSS', () => {
  const report = createReport();
  const html = generateHTML(report.summary, [], createNetwork([], []), 0);

  assert.ok(html.includes('<style>'), 'Should have style tag');
  assert.ok(html.includes('</style>'), 'Should close style tag');
  assert.ok(html.includes('.stat-card'), 'Should include CSS classes');
});

test('Visualization: generateHTML - header content', () => {
  const report = createReport();
  const html = generateHTML(report.summary, [], createNetwork([], []), 0);

  assert.ok(html.includes('🏙️ UbiCity Learning Map'), 'Should have header title');
  assert.ok(html.includes('Mapping informal learning'), 'Should have tagline');
  assert.ok(html.includes('Generated:'), 'Should show generation date');
});

test('Visualization: generateHTML - footer content', () => {
  const report = createReport();
  const html = generateHTML(report.summary, [], createNetwork([], []), 0);

  assert.ok(html.includes('<footer>'), 'Should have footer');
  assert.ok(html.includes('Generated by UbiCity'), 'Should have attribution');
  assert.ok(html.includes('github.com/Hyperpolymath/ubicity'), 'Should have GitHub link');
});

test('Visualization: generateHTML - responsive design', () => {
  const report = createReport();
  const html = generateHTML(report.summary, [], createNetwork([], []), 0);

  assert.ok(html.includes('@media (max-width: 768px)'), 'Should have mobile breakpoint');
  assert.ok(html.includes('grid-template-columns: repeat(2, 1fr)'), 'Should adjust grid for mobile');
});
