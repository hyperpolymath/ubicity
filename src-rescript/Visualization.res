// SPDX-License-Identifier: AGPL-3.0-or-later
// UbiCity Visualization Generator
// Creates interactive HTML reports with filtering and search

type visualizationOptions = {
  outputFile: string,
  includeMap: bool,
  includeTimeline: bool,
  includeNetwork: bool,
}

let defaultOptions: visualizationOptions = {
  outputFile: "ubicity-map.html",
  includeMap: true,
  includeTimeline: true,
  includeNetwork: true,
}

// Generate CSS styles
let generateCSS = (): string => {
  `
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
  `
}

// Generate stats section
let generateStats = (report: Mapper.reportSummary): string => {
  `
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${Int.toString(report.totalExperiences)}</div>
        <div class="stat-label">Experiences</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${Int.toString(report.uniqueLocations)}</div>
        <div class="stat-label">Locations</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${Int.toString(report.uniqueDomains)}</div>
        <div class="stat-label">Domains</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${Int.toString(report.uniqueLearners)}</div>
        <div class="stat-label">Learners</div>
      </div>
    </div>
  `
}

// Generate hotspot card
let generateHotspotCard = (hotspot: Mapper.learningHotspot): string => {
  let domainTags = hotspot.domains->Array.map(d => `<span class="domain-tag">${d}</span>`)->Array.join("")
  let domainsAttr = hotspot.domains->Array.join(" ")

  `
    <div class="location-card" data-domains="${domainsAttr}">
      <div class="location-name">${hotspot.location}</div>
      <div class="location-meta">
        <span>📊 ${Int.toString(hotspot.count)} experiences</span>
        <span>👥 ${Int.toString(hotspot.learners)} learners</span>
        <span>🎯 ${Int.toString(hotspot.diversity)} diversity</span>
      </div>
      <div class="domains">
        ${domainTags}
      </div>
    </div>
  `
}

// Generate hotspots section
let generateHotspotsSection = (hotspots: array<Mapper.learningHotspot>): string => {
  let cards = hotspots->Array.map(generateHotspotCard)->Array.join("\n")

  `
    <div class="section">
      <h2>🔥 Learning Hotspots</h2>
      <p style="margin-bottom: 1rem; color: #666;">
        Locations with high disciplinary diversity (${Int.toString(hotspots->Array.length)} found)
      </p>

      <input
        type="text"
        class="search-bar"
        id="searchHotspots"
        placeholder="Search locations, domains, or types..."
      />

      <div class="filters" id="domainFilters"></div>

      <div class="location-list" id="hotspotsList">
        ${cards}
      </div>
    </div>
  `
}

// Generate geographic section
let generateGeographicSection = (locationsWithCoords: int): string => {
  if locationsWithCoords > 0 {
    `
      <div class="section">
        <h2>🗺️ Geographic Distribution</h2>
        <p style="margin-bottom: 1rem; color: #666;">
          ${Int.toString(locationsWithCoords)} locations with GPS coordinates
        </p>
        <div style="background: #f0f0f0; padding: 2rem; border-radius: 8px; text-align: center;">
          <p style="color: #666; margin-bottom: 1rem;">
            📍 Coordinates available for mapping
          </p>
          <p style="font-size: 0.9rem; color: #999;">
            Export to GeoJSON to visualize in mapping tools:
            <code style="background: white; padding: 0.2rem 0.5rem; border-radius: 3px; color: #667eea;">
              deno run --allow-read --allow-write src-rescript/Export.res.js geojson map.json
            </code>
          </p>
        </div>
      </div>
    `
  } else {
    ""
  }
}

// Generate domain network section
let generateNetworkSection = (network: Mapper.domainNetwork): string => {
  let topDomains = network.nodes
    ->Array.toSorted((a, b) => Float.fromInt(b.size - a.size))
    ->Array.slice(~start=0, ~end=10)
    ->Array.map(node => {
      `
        <div style="padding: 0.5rem; background: white; border-radius: 4px; border: 1px solid #e0e0e0;">
          <strong>${node.id}</strong>: ${Int.toString(node.size)} experiences
        </div>
      `
    })
    ->Array.join("")

  let strongestConnections = network.edges
    ->Array.toSorted((a, b) => Float.fromInt(b.weight - a.weight))
    ->Array.slice(~start=0, ~end=10)
    ->Array.map(edge => {
      `
        <div style="padding: 0.5rem; background: white; border-radius: 4px; border: 1px solid #e0e0e0; display: flex; justify-content: space-between;">
          <span>${edge.source} ↔ ${edge.target}</span>
          <strong style="color: #667eea;">${Int.toString(edge.weight)}x</strong>
        </div>
      `
    })
    ->Array.join("")

  `
    <div class="section">
      <h2>🕸️ Domain Network</h2>
      <p style="margin-bottom: 1rem; color: #666;">
        ${Int.toString(network.nodes->Array.length)} domains, ${Int.toString(network.edges->Array.length)} connections
      </p>

      <div style="background: #f9f9f9; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem;">
        <h3 style="margin-bottom: 1rem; color: #555;">Top Domains</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem;">
          ${topDomains}
        </div>
      </div>

      <div style="background: #f9f9f9; padding: 1.5rem; border-radius: 8px;">
        <h3 style="margin-bottom: 1rem; color: #555;">Strongest Connections</h3>
        <div style="display: grid; gap: 0.5rem;">
          ${strongestConnections}
        </div>
      </div>

      <div style="margin-top: 1rem; font-size: 0.9rem; color: #999; text-align: center;">
        💡 Export to DOT format for graph visualization:
        <code style="background: white; padding: 0.2rem 0.5rem; border-radius: 3px; color: #667eea;">
          deno run --allow-read --allow-write src-rescript/Export.res.js dot network.dot
        </code>
      </div>
    </div>
  `
}

// Generate insights section
let generateInsightsSection = (report: Mapper.reportSummary, hotspots: array<Mapper.learningHotspot>): string => {
  let mostDiverseLocation = hotspots->Array.get(0)
  let locationName = mostDiverseLocation->Option.map(h => h.location)->Option.getOr("N/A")
  let diversity = mostDiverseLocation->Option.map(h => Int.toString(h.diversity))->Option.getOr("0")

  let avgDiversity = if report.uniqueLocations > 0 {
    Float.toString(Int.toFloat(report.uniqueDomains) /. Int.toFloat(report.uniqueLocations))
  } else {
    "0"
  }

  `
    <div class="section">
      <h2>💡 Insights</h2>
      <div style="display: grid; gap: 1rem;">
        <div style="padding: 1rem; background: #f0f4ff; border-left: 4px solid #667eea; border-radius: 4px;">
          <strong>Most diverse location:</strong>
          ${locationName} (${diversity} domains)
        </div>
        <div style="padding: 1rem; background: #f0f4ff; border-left: 4px solid #667eea; border-radius: 4px;">
          <strong>Interdisciplinary learning:</strong>
          ${Int.toString(report.interdisciplinaryExperiences)} experiences span multiple domains
        </div>
        <div style="padding: 1rem; background: #f0f4ff; border-left: 4px solid #667eea; border-radius: 4px;">
          <strong>Average diversity per location:</strong>
          ${avgDiversity} domains
        </div>
      </div>
    </div>
  `
}

// Generate JavaScript for interactive features
let generateJavaScript = (hotspots: array<Mapper.learningHotspot>): string => {
  // Extract all unique domains
  let allDomains = hotspots
    ->Array.reduce([], (acc, h) => Array.concat(acc, h.domains))
    ->Array.reduce([], (acc, d) => {
      if acc->Array.includes(d) {acc} else {acc->Array.concat([d])}
    })

  let domainsJSON = switch JSON.stringifyAny(allDomains) {
  | Some(json) => json
  | None => "[]"
  }

  `
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
    const allDomains = ${domainsJSON};
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
  `
}

// Generate complete HTML document
let generateHTML = (
  report: Mapper.reportSummary,
  hotspots: array<Mapper.learningHotspot>,
  network: Mapper.domainNetwork,
  locationsWithCoords: int,
): string => {
  let currentDate = Date.make()->Date.toLocaleDateString

  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UbiCity Learning Map</title>
  <style>${generateCSS()}</style>
</head>
<body>
  <header>
    <h1>🏙️ UbiCity Learning Map</h1>
    <p>Mapping informal learning across urban space</p>
    <p style="font-size: 0.9rem; margin-top: 0.5rem;">
      Generated: ${currentDate}
    </p>
  </header>

  <div class="container">
    ${generateStats(report)}
    ${generateHotspotsSection(hotspots)}
    ${generateGeographicSection(locationsWithCoords)}
    ${generateNetworkSection(network)}
    ${generateInsightsSection(report, hotspots)}
  </div>

  <footer>
    <p>Generated by UbiCity Learning Capture System</p>
    <p style="font-size: 0.9rem; margin-top: 0.5rem;">
      <a href="https://github.com/Hyperpolymath/ubicity" style="color: #667eea;">
        GitHub Repository
      </a>
    </p>
  </footer>

  <script>${generateJavaScript(hotspots)}</script>
</body>
</html>`
}

// Main visualization generation function
let generateVisualization = async (
  mapper: Mapper.t,
  options: option<visualizationOptions>,
): promise<result<string, string>> => {
  let opts = options->Option.getOr(defaultOptions)

  // Load all experiences
  let loadResult = await Mapper.loadAll(mapper)
  switch loadResult {
  | Error(err) => Promise.resolve(Error("Failed to load experiences: " ++ err))
  | Ok(_count) => {
      // Generate report
      let reportResult = await Mapper.generateReport(mapper)
      switch reportResult {
      | Error(err) => Promise.resolve(Error("Failed to generate report: " ++ err))
      | Ok(report) => {
          // Get location map
          let locationMap = Mapper.mapByLocation(mapper)

          // Count locations with coordinates
          let locationsWithCoords = locationMap
            ->Dict.toArray
            ->Array.filter(((_, data)) => data.coordinates->Option.isSome)
            ->Array.length

          // Generate domain network
          let network = Mapper.generateDomainNetwork(mapper)

          // Generate HTML
          let html = generateHTML(
            report.summary,
            report.learningHotspots,
            network,
            locationsWithCoords,
          )

          // Save visualization
          let saveResult = await Mapper.Storage.saveVisualization(mapper.storage, html, opts.outputFile)
          switch saveResult {
          | Ok(_) => Promise.resolve(Ok(opts.outputFile))
          | Error(err) => Promise.resolve(Error("Failed to save visualization: " ++ err))
          }
        }
      }
    }
  }
}
