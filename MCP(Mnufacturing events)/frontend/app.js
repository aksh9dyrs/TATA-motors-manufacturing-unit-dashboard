const API = "http://localhost:8090";

function showTab(tabId) {
  // Hide all tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.style.display = 'none';
    tab.classList.remove('active');
  });
  
  // Show selected tab
  const selectedTab = document.getElementById(tabId);
  if (selectedTab) {
    selectedTab.style.display = 'block';
    selectedTab.classList.add('active');
  }
  
  // Update button states
  document.querySelectorAll('nav button').forEach(button => {
    button.classList.remove('active');
    if (button.textContent.toLowerCase().replace(/\s/g, '') === tabId.replace(/\s/g, '')) {
      button.classList.add('active');
    }
  });
  
  // Show/hide main dashboard info (header, nav, etc.)
  const dashboardMain = document.getElementById('dashboard-main');
  if (tabId === 'events') {
    if (dashboardMain) dashboardMain.style.display = '';
  } else {
    if (dashboardMain) dashboardMain.style.display = 'none';
  }
  
  // Load tab content
  switch(tabId) {
    case 'events':
      loadEvents();
      break;
    case 'similarity':
      loadSimilarity();
      break;
    case 'cosine':
      loadCosine();
      break;
    case 'ask':
      loadAsk();
      break;
    case 'umap':
      loadUMAP();
      break;
    case 'logs':
      loadLogs();
      break;
  }
}

window.onload = () => {
  // Initial load
  showTab('events');
  loadEvents();
  
  // Add click handlers to nav buttons
  document.querySelector('nav').addEventListener('click', e => {
    if (e.target.tagName === 'BUTTON') {
      const tab = e.target.getAttribute('data-tab');
      if (tab) {
        showTab(tab);
      }
    }
  });
};

function showError(message) {
  alert(`Error: ${message}`);
}

function loadEvents() {
  fetch(`${API}/events`)
    .then(r => r.json())
    .then(res => {
      // Prepare data for charts
      const eventTypes = {};
      const cities = {};
      const machines = {};
      const durationPeriods = {};
      const allMachines = [];
      const allCities = [];
      const allEventTypes = [];
      res.data.forEach(ev => {
        eventTypes[ev.event_type] = (eventTypes[ev.event_type] || 0) + 1;
        if (ev.city) cities[ev.city] = (cities[ev.city] || 0) + 1;
        machines[ev.machine_name] = (machines[ev.machine_name] || 0) + 1;
        if (!allMachines.includes(ev.machine_name)) allMachines.push(ev.machine_name);
        if (ev.city && !allCities.includes(ev.city)) allCities.push(ev.city);
        if (!allEventTypes.includes(ev.event_type)) allEventTypes.push(ev.event_type);
        
        // Categorize duration periods
        const duration = ev.duration_minutes || 0;
        if (duration <= 30) {
          durationPeriods['Short (≤30 min)'] = (durationPeriods['Short (≤30 min)'] || 0) + 1;
        } else if (duration <= 120) {
          durationPeriods['Medium (31-120 min)'] = (durationPeriods['Medium (31-120 min)'] || 0) + 1;
        } else if (duration <= 480) {
          durationPeriods['Long (2-8 hours)'] = (durationPeriods['Long (2-8 hours)'] || 0) + 1;
        } else {
          durationPeriods['Extended (>8 hours)'] = (durationPeriods['Extended (>8 hours)'] || 0) + 1;
        }
      });
      // --- DEMO: Generate random news data from events ---
      function getRandom(arr, n) {
        const shuffled = arr.slice().sort(() => 0.5 - Math.random());
        return shuffled.slice(0, n);
      }
      const totalMachines = allMachines.length;
      const workingCount = Math.max(2, Math.min(4, totalMachines, Math.floor(Math.random() * totalMachines) + 1));
      const workingMachinesArr = getRandom(allMachines, workingCount);
      // For each working machine, pick a random city and event type
      const workingDetails = workingMachinesArr.map(name => {
        return {
          name,
          city: getRandom(allCities, 1)[0] || 'Unknown',
          eventType: getRandom(allEventTypes, 1)[0] || 'Running'
        };
      });
      const workingNames = workingDetails.map(d => d.name).join(', ');
      const workingCities = [...new Set(workingDetails.map(d => d.city))].join(', ');
      // Show as a list
      const workingList = workingDetails.map(d => `<li><b>${d.name}</b> (${d.city}) — <span style='color:#43c6ac;'>${d.eventType}</span></li>`).join('');
      const insightsList = [
        'Production is running smoothly with minimal downtime.',
        'A few machines are under maintenance, but most are operational.',
        'High activity in ' + (workingDetails[0]?.city || 'the main plant') + ' today.',
        'Energy consumption is optimal across all working machines.',
        'No critical failures reported in the last 24 hours.',
        'Operator shift change scheduled at 4:00 PM.',
        'All safety checks passed for working machines.'
      ];
      const insights = getRandom(insightsList, 1)[0];
      // --- Vertical bar chart data for automobile industries ---
      const autoLabels = ['Tata', 'Maruti', 'Hyundai', 'Mahindra', 'Kia'];
      const autoData = autoLabels.map(() => Math.floor(Math.random() * 7) + 2); // 2 to 8
      let html = `
        <h4>Manufacturing Events</h4>
        <div id="events-charts" style="display:flex;flex-wrap:wrap;gap:32px;justify-content:center;margin-bottom:32px;">
          <div class="chart-box">
            <h5 style='color:#FFD600;text-align:center;'>Event Type Distribution</h5>
            <canvas id="eventTypePie"></canvas>
          </div>
          <div class="chart-box">
            <h5 style='color:#FFD600;text-align:center;'>Events per City</h5>
            <canvas id="cityBar"></canvas>
          </div>
          <div class="chart-box">
            <h5 style='color:#FFD600;text-align:center;'>Machine Usage</h5>
            <canvas id="machineBar"></canvas>
          </div>
          <div class="chart-box">
            <h5 style='color:#FFD600;text-align:center;'>Duration Periods</h5>
            <canvas id="durationPie"></canvas>
          </div>
          <div class="chart-box">
            <h5 style='color:#FFD600;text-align:center;'>Top 5 Automobile Industries in India</h5>
            <canvas id="autoBar" width="400" height="220"></canvas>
            <div style="color:#ffe066;font-size:1em;text-align:center;margin-top:8px;">All values * 1000 = Production</div>
          </div>
        </div>
        <div class="chart-box" style="margin:0 auto 32px auto;max-width:1200px;">
          <h3 style="color:#ffe066;text-align:center;margin-bottom:10px;">Today's News</h3>
          <div style="font-size:1.15em;color:#fff;margin-bottom:8px;"><b>Total Machines:</b> ${totalMachines}</div>
          <div style="font-size:1.15em;color:#fff;margin-bottom:8px;"><b>Machines Working Today:</b> ${workingCount}</div>
          <div style="font-size:1.08em;color:#ffe066;margin-bottom:6px;"><b>Which & Where:</b></div>
          <ul style="margin:0 0 8px 18px;padding:0 0 0 0.5em;color:#ffe066;font-size:1.08em;">${workingList}</ul>
          <div style="font-size:1.08em;color:#43c6ac;margin-top:10px;"><b>Insights:</b> ${insights}</div>
        </div>
        <div style="text-align:center;margin-bottom:24px;">
          <button id="toggleTableBtn" style="padding:12px 32px;font-size:1.1em;border-radius:10px;background:linear-gradient(90deg,#43c6ac,#ffe066);color:#23243a;font-weight:bold;border:2px solid #ffe066;box-shadow:0 2px 8px #0004;cursor:pointer;transition:background 0.2s;">Show Event Table</button>
        </div>
        <div id="eventTableContainer" style="display:none;">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Machine</th>
                  <th>City</th>
                  <th>Notes</th>
                  <th>Time</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
      `;
      res.data.forEach(ev => {
        const timestamp = new Date(ev.timestamp).toLocaleString();
        html += `
          <tr>
            <td>${ev.id}</td>
            <td>${ev.event_type}</td>
            <td>${ev.machine_name}</td>
            <td>${ev.city || ''}</td>
            <td>${ev.notes || ''}</td>
            <td>${timestamp}</td>
            <td>${ev.duration_minutes} min</td>
          </tr>
        `;
      });
      html += `
              </tbody>
            </table>
          </div>
        </div>
      `;
      document.getElementById('events').innerHTML = html;
      // Draw charts
      setTimeout(() => {
        // Pie chart for event types
        new Chart(document.getElementById('eventTypePie').getContext('2d'), {
          type: 'pie',
          data: {
            labels: Object.keys(eventTypes),
            datasets: [{
              data: Object.values(eventTypes),
              backgroundColor: [
                '#FFD600','#43c6ac','#a1c4fd','#fbc2eb','#ffb347','#ffcc33','#e53935','#4CAF50','#23243a'
              ],
            }]
          },
          options: {
            plugins: { legend: { labels: { color: '#fff' } } }
          }
        });
        // Custom plugin for animated glow on bars
        const glowPlugin = {
          id: 'glowBar',
          afterDraw: (chart) => {
            if (chart.config.type !== 'bar' && chart.config.type !== 'horizontalBar') return;
            const ctx = chart.ctx;
            ctx.save();
            chart.getDatasetMeta(0).data.forEach((bar, i) => {
              const {x, y, base, width, height} = bar;
              ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now()/600 + i);
              ctx.shadowColor = '#43c6ac';
              ctx.shadowBlur = 24;
              ctx.fillStyle = '#43c6ac';
              if (bar.height) {
                ctx.beginPath();
                ctx.roundRect(x, y, width, height, 8);
                ctx.fill();
              }
              ctx.shadowBlur = 0;
            });
            ctx.restore();
          }
        };
        // Bar chart for cities
        new Chart(document.getElementById('cityBar').getContext('2d'), {
          type: 'bar',
          data: {
            labels: Object.keys(cities),
            datasets: [{
              label: 'Events',
              data: Object.values(cities),
              backgroundColor: '#43c6ac',
              borderRadius: 8,
              borderWidth: 6,
              borderSkipped: false
            }]
          },
          options: {
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: '#FFD600' } },
              y: { ticks: { color: '#FFD600' } }
            },
            animation: false
          },
          plugins: [glowPlugin]
        });
        // Bar chart for machines
        new Chart(document.getElementById('machineBar').getContext('2d'), {
          type: 'bar',
          data: {
            labels: Object.keys(machines),
            datasets: [{
              label: 'Events',
              data: Object.values(machines),
              backgroundColor: '#a1c4fd',
              borderRadius: 8,
              borderWidth: 6,
              borderSkipped: false
            }]
          },
          options: {
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: '#FFD600' } },
              y: { ticks: { color: '#FFD600' } }
            },
            animation: false
          },
          plugins: [glowPlugin]
        });
        // Pie chart for duration periods
        new Chart(document.getElementById('durationPie').getContext('2d'), {
          type: 'pie',
          data: {
            labels: Object.keys(durationPeriods),
            datasets: [{
              data: Object.values(durationPeriods),
              backgroundColor: [
                '#4CAF50','#FFD600','#ffb347','#e53935','#43c6ac','#a1c4fd','#fbc2eb','#ffcc33'
              ],
            }]
          },
          options: {
            plugins: { legend: { labels: { color: '#fff' } } }
          }
        });
        // Vertical bar chart for top 5 automobile industries
        new Chart(document.getElementById('autoBar').getContext('2d'), {
          type: 'bar',
          data: {
            labels: autoLabels,
            datasets: [{
              label: 'Production Index',
              data: autoData,
              backgroundColor: [
                '#FFD600','#43c6ac','#a1c4fd','#fbc2eb','#ffb347'
              ],
              borderRadius: 12,
              borderWidth: 6,
              borderSkipped: false
            }]
          },
          options: {
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: '#FFD600' }, grid: { color: '#23243a' } },
              y: { ticks: { color: '#FFD600' }, grid: { color: '#23243a' } }
            },
            animation: false
          },
          plugins: [glowPlugin]
        });
      }, 100);
      // Toggle table logic
      setTimeout(() => {
        const btn = document.getElementById('toggleTableBtn');
        const table = document.getElementById('eventTableContainer');
        btn.onclick = function() {
          if (table.style.display === 'none') {
            table.style.display = '';
            btn.textContent = 'Hide Event Table';
          } else {
            table.style.display = 'none';
            btn.textContent = 'Show Event Table';
          }
        };
      }, 200);
    })
    .catch(err => showError('Failed to load events'));
}

function loadSimilarity() {
  document.getElementById('similarity').innerHTML = `
    <div class="section-title">Similarity Search</div>
    <div class="similarity-section">
      <div class="section-logo">
        <img src="https://cdn-icons-png.flaticon.com/512/1055/1055687.png" alt="Gear Logo" />
      </div>
      <div class="section-info-box">
        <h3 style="font-weight:normal;">
          This feature compares the similarity between two manufacturing events using advanced AI models and vector embeddings. It helps you find events that are most alike, which is useful for root-cause analysis, anomaly detection, and understanding recurring issues.
        </h3>
        <div style="margin: 1.5em 0 1em 0;">
          <h3 style="margin-bottom:0.5em;">Example use cases:</h3>
          <div style="display: flex; flex-direction: column; gap: 8px; margin-left: 18px; text-align:left;">
            <div>• Find past events similar to a current machine failure.</div>
            <div>• Identify recurring patterns in machine breakdowns.</div>
            <div>• Compare events across different cities or machines to spot trends.</div>
            <div>• Analyze if a new event is unique or has happened before.</div>
          </div>
        </div>
      </div>
      <div class="search-container">
        <input type="number" id="simEventId" placeholder="Enter Event ID" min="1" />
        <button onclick="runSimilarity()">Find Similar Events</button>
      </div>
      <div id="simResults" class="result-container"></div>
    </div>
  `;
}

function runSimilarity() {
  const eventId = document.getElementById('simEventId').value;
  if (!eventId) {
    showError('Please enter an Event ID');
    return;
  }
  
  fetch(`${API}/similarity`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({event_id: Number(eventId)})
  })
    .then(r => r.json())
    .then(res => {
      let html = `
        <h3>Similar Events</h3>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Machine</th>
                <th>Notes</th>
                <th>Similarity</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      res.data.forEach(ev => {
        html += `
          <tr>
            <td>${ev.id}</td>
            <td>${ev.event_type}</td>
            <td>${ev.machine_name}</td>
            <td>${ev.notes || ''}</td>
            <td>${(ev.similarity*100).toFixed(2)}%</td>
          </tr>
        `;
      });
      
      html += `
            </tbody>
          </table>
        </div>
      `;
      
      document.getElementById('simResults').innerHTML = html;
    })
    .catch(err => showError('Failed to find similar events'));
}

function loadAsk() {
  document.getElementById('ask').innerHTML = `
    <div class="section-title">Ask AI Assistant</div>
    <div class="chatbot-container enhanced">
      <div class="chatbot-logo">
        <img src="https://cdn-icons-png.flaticon.com/512/4712/4712035.png" alt="AI Logo" />
      </div>
      <div class="chatbot-header">Smart AI Chatbot</div>
      <div style="color:#FFD600;font-weight:500;font-size:1.08em;text-align:center;margin-bottom:12px;letter-spacing:0.5px;">Ask anything about your manufacturing events, analytics, or troubleshooting!</div>
      <div class="chat-messages enhanced" id="chatMessages"></div>
      <div class="chatbot-input-row enhanced">
        <textarea id="askQ" rows="2" placeholder="Ask a question about manufacturing events..." ></textarea>
        <button onclick="runAskChatbot()">Ask</button>
      </div>
    </div>
    <div id="aiFullReport" style="margin: 32px 0 0 0;"></div>
  `;
  document.getElementById('chatMessages').innerHTML = '';
  document.getElementById('aiFullReport').innerHTML = '';
}

window.runAskChatbot = function() {
  const question = document.getElementById('askQ').value;
  if (!question) {
    showError('Please enter a question');
    return;
  }
  const chatMessages = document.getElementById('chatMessages');
  const aiFullReport = document.getElementById('aiFullReport');
  // Show user message and thinking
  chatMessages.innerHTML += `<div class='chat-bubble user enhanced'>${question}</div>` +
    `<div class='chat-bubble ai enhanced'>Thinking...</div>`;
  aiFullReport.innerHTML = '';
  fetch(`${API}/ask-ai`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({question: question})
  })
    .then(r => r.json())
    .then(res => {
      // Replace last AI "Thinking..." bubble with answer
      const bubbles = chatMessages.querySelectorAll('.chat-bubble');
      if (bubbles.length > 0) {
        const lastBubble = bubbles[bubbles.length - 1];
        if (lastBubble.classList.contains('ai')) {
          lastBubble.innerHTML = res.data.answer;
        }
      }
      // Add download button
      chatMessages.innerHTML +=
        `<button id='downloadPdfBtn' style='margin:18px 0 0 0;padding:10px 24px;background:#FFD600;color:#23272b;font-weight:bold;border:none;border-radius:8px;cursor:pointer;display:block;'>Download Report</button>`;
      document.getElementById('downloadPdfBtn').onclick = function() {
        const answerNode = chatMessages.querySelector('.chat-bubble.ai.enhanced:last-child');
        html2canvas(answerNode, {backgroundColor: '#fff'}).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new window.jspdf.jsPDF();
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const imgProps = pdf.getImageProperties(imgData);
          let pdfWidth = pageWidth - 20;
          let pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          if (pdfHeight > pageHeight - 20) {
            pdfHeight = pageHeight - 20;
            pdfWidth = (imgProps.width * pdfHeight) / imgProps.height;
          }
          pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
          pdf.save('ai_answer_report.pdf');
        });
      };
      // Show full summary/table below chatbox
      if (res.data.summary) {
        aiFullReport.innerHTML = res.data.summary;
      }
    })
    .catch(() => {
      const bubbles = chatMessages.querySelectorAll('.chat-bubble');
      if (bubbles.length > 0) {
        const lastBubble = bubbles[bubbles.length - 1];
        if (lastBubble.classList.contains('ai')) {
          lastBubble.innerHTML = 'Sorry, there was an error getting the answer.';
        }
      }
      aiFullReport.innerHTML = '';
    });
}

function loadUMAP() {
  // Show loading screen with rotating logo
  document.getElementById('umap').innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:320px;">
      <div style="margin-bottom:18px;">
        <img src="https://cdn-icons-png.flaticon.com/512/1055/1055687.png" alt="Loading" style="width:64px;height:64px;animation:umapSpin 1.2s linear infinite;" />
      </div>
      <div style="color:#ffe066;font-size:1.25em;font-weight:bold;letter-spacing:1px;">Loading UMAP Visualization...</div>
    </div>
  `;
  fetch(`${API}/umap`)
    .then(r => r.json())
    .then(res => {
      let html = `
        <div id="umapPlotBox" style="display:flex;flex-wrap:wrap;gap:24px;justify-content:center;"></div>
      `;
      document.getElementById('umap').innerHTML = html;
      // Prepare data for Plotly
      const points = res.points;
      const labels = res.labels;
      const labelSet = Array.from(new Set(labels));
      // For each event type, create a box with a mini-plot
      labelSet.forEach(label => {
        const indices = labels.map((l, i) => l === label ? i : -1).filter(i => i !== -1);
        const trace = {
          x: indices.map(i => points[i][0]),
          y: indices.map(i => points[i][1]),
          mode: 'markers',
          type: 'scatter',
          name: label,
          marker: { size: 10 }
        };
        // Create a container for this event type
        const box = document.createElement('div');
        box.style.background = '#f8f8ff';
        box.style.border = '1.5px solid #bdbdbd';
        box.style.borderRadius = '12px';
        box.style.padding = '18px 12px 12px 12px';
        box.style.minWidth = '320px';
        box.style.maxWidth = '400px';
        box.style.flex = '1 1 340px';
        box.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)';
        box.style.marginBottom = '12px';
        box.innerHTML = `<div style='font-weight:bold;font-size:1.1em;margin-bottom:8px;text-align:center;color:#000;'>${label}</div><div id='umapPlot_${label}' style='width:100%;height:260px;'></div>`;
        document.getElementById('umapPlotBox').appendChild(box);
        Plotly.newPlot(`umapPlot_${label}`, [trace], {
          margin: { t: 24, l: 32, r: 16, b: 32 },
          xaxis: { title: 'Embedding Projection X' },
          yaxis: { title: 'Embedding Projection Y' },
          showlegend: false,
          title: ''
        }, {displayModeBar: false});
      });
    })
    .catch(err => {
      document.getElementById('umap').innerHTML = `<div style='color:#e53935;font-weight:bold;font-size:1.2em;text-align:center;margin:48px 0;'>Failed to load UMAP visualization.</div>`;
    });
}

// Add keyframes for rotating logo
const umapSpinStyle = document.createElement('style');
umapSpinStyle.innerHTML = `@keyframes umapSpin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`;
document.head.appendChild(umapSpinStyle);

function loadLogs() {
  document.getElementById('logs').innerHTML = `
    <div class=\"section-title\">System Logs</div>\n    <div class=\"section-flex-row\">\n      <div class=\"section-info-box\">\n        <h3 style=\"font-weight:normal;\">\n          The logs section provides access to backend and system logs, helping you monitor API failures, track system health, and debug issues in your manufacturing analytics pipeline.\n        </h3>\n      </div>\n      <div class=\"section-info-box\">\n        <h3 style=\"margin-bottom:0.5em;\">Example use cases:</h3>\n        <div style=\"display: flex; flex-direction: column; gap: 8px; margin-left: 18px;\">\n          <div>• Review API failure logs to identify integration issues.</div>\n          <div>• Monitor system health and uptime.</div>\n          <div>• Debug errors and investigate anomalies in event processing.</div>\n          <div>• Audit system activity for compliance and troubleshooting.</div>\n        </div>\n      </div>\n      <div class=\"section-info-box\" style=\"margin-bottom:0;\">\n        <div class=\"logs-container\"></div>\n      </div>\n    </div>\n  `;
  fetch(`${API}/logs`)
    .then(r => r.json())
    .then(res => {
      let html = `
        <div class="logs-container">
          <pre>${res.data.join('')}</pre>
        </div>
      `;
      document.getElementById('logs').innerHTML = html;
    })
    .catch(err => showError('Failed to load logs'));
}

function loadCosine() {
  const cosineSection = document.getElementById('cosine');
  if (!cosineSection) {
    alert('Cosine section not found in HTML!');
    return;
  }
  cosineSection.innerHTML = `
    <div class="section-title">Cosine Similarity</div>
    <div class="cosine-section">
      <div class="section-logo">
        <img src="https://cdn-icons-png.flaticon.com/512/2933/2933887.png" alt="Factory Logo" />
      </div>
      <div class="section-info-box">
        <h3 style="font-weight:normal;">
          Cosine similarity measures how similar two events are based on their vector embeddings. It is useful for comparing specific events and understanding their relationship in the data space.
        </h3>
        <div style="margin: 1.5em 0 1em 0;">
          <h3 style="margin-bottom:0.5em;">Example use cases:</h3>
          <div style="display: flex; flex-direction: column; gap: 8px; margin-left: 18px; text-align:left;">
            <div>• Directly compare two events to see how closely related they are.</div>
            <div>• Validate if two incidents are likely to have the same root cause.</div>
            <div>• Investigate if a new event is similar to a known issue.</div>
            <div>• Support troubleshooting by comparing event details.</div>
          </div>
        </div>
      </div>
      <div class="search-container">
        <input type="number" id="cosEventId1" placeholder="Enter Event 1 ID" min="1" />
        <input type="number" id="cosEventId2" placeholder="Enter Event 2 ID" min="1" />
        <button id="runCosineBtn">Compare</button>
      </div>
      <div id="cosineResult" class="result-container"></div>
    </div>
  `;
  document.getElementById('runCosineBtn').onclick = runCosineSimilarity;
}

function runCosineSimilarity() {
  const eventId1 = document.getElementById('cosEventId1').value;
  const eventId2 = document.getElementById('cosEventId2').value;
  if (!eventId1 || !eventId2) {
    showError('Please enter both Event IDs');
    return;
  }
  const resultDiv = document.getElementById('cosineResult');
  resultDiv.innerHTML = '<p>Calculating similarity...</p>';
  fetch(`${API}/cosine-similarity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_id1: Number(eventId1), event_id2: Number(eventId2) })
  })
    .then(r => r.json())
    .then(data => {
      if (!data.data) {
        resultDiv.innerHTML = '<p class="error">Could not calculate similarity</p>';
        return;
      }
      const similarity = (data.data.cosine_similarity * 100).toFixed(2);
      resultDiv.innerHTML = `
        <div class="result-card">
          <h3>Cosine Similarity: ${similarity}%</h3>
          <div class="event-comparison">
            <div class="event-details">
              <h4>Event 1</h4>
              <p>Type: ${data.data.event1.event_type}</p>
              <p>Description: ${data.data.event1.description || data.data.event1.notes || ''}</p>
              <p>Timestamp: ${new Date(data.data.event1.timestamp).toLocaleString()}</p>
            </div>
            <div class="event-details">
              <h4>Event 2</h4>
              <p>Type: ${data.data.event2.event_type}</p>
              <p>Description: ${data.data.event2.description || data.data.event2.notes || ''}</p>
              <p>Timestamp: ${new Date(data.data.event2.timestamp).toLocaleString()}</p>
            </div>
          </div>
        </div>
      `;
    })
    .catch(err => {
      resultDiv.innerHTML = '<p class="error">Error calculating similarity</p>';
    });
}

function createTab(id, label) {
    const tab = document.createElement('button');
    tab.className = 'tab';
    tab.setAttribute('data-tab', id);
    tab.textContent = label;
    return tab;
}

function initializeTabs() {
    const tabContainer = document.createElement('div');
    tabContainer.className = 'tab-container';
    
    const tabs = [
        { id: 'events', label: 'Events' },
        { id: 'similarity', label: 'Similarity' },
        { id: 'cosine', label: 'Cosine Similarity' },
        { id: 'ask-ai', label: 'Ask AI' },
        { id: 'umap', label: 'UMAP' },
        { id: 'logs', label: 'Logs' }
    ];
    
    tabs.forEach(({ id, label }) => {
        const tab = createTab(id, label);
        tabContainer.appendChild(tab);
    });
    
    document.body.appendChild(tabContainer);
    
    const contentContainer = document.createElement('div');
    contentContainer.id = 'content';
    document.body.appendChild(contentContainer);
    
    // Add click handlers
    tabContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab')) {
            const selectedTab = e.target.getAttribute('data-tab');
            switchTab(selectedTab);
        }
    });
}

function createCosineSection() {
    const section = document.createElement('div');
    section.className = 'cosine-section';
    
    const form = document.createElement('form');
    form.className = 'cosine-form';
    form.innerHTML = `
        <div class="form-group">
            <label for="event1">Event 1 ID:</label>
            <input type="number" id="event1" required>
        </div>
        <div class="form-group">
            <label for="event2">Event 2 ID:</label>
            <input type="number" id="event2" required>
        </div>
        <button type="submit" class="btn">Calculate Similarity</button>
    `;
    
    const resultDiv = document.createElement('div');
    resultDiv.className = 'cosine-result';
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const event1 = document.getElementById('event1').value;
        const event2 = document.getElementById('event2').value;
        
        try {
            const response = await fetch(`${API}/cosine-similarity`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event_id1: parseInt(event1), event_id2: parseInt(event2) })
            });
            
            const data = await response.json();
            
            if (data.data === null) {
                resultDiv.innerHTML = '<p class="error">Events not found</p>';
                return;
            }
            
            const similarity = (data.data.cosine_similarity * 100).toFixed(2);
            resultDiv.innerHTML = `
                <div class="result-card">
                    <h3>Cosine Similarity: ${similarity}%</h3>
                    <div class="event-comparison">
                        <div class="event-details">
                            <h4>Event 1</h4>
                            <p>Type: ${data.data.event1.event_type}</p>
                            <p>Description: ${data.data.event1.description}</p>
                            <p>Timestamp: ${new Date(data.data.event1.timestamp).toLocaleString()}</p>
                        </div>
                        <div class="event-details">
                            <h4>Event 2</h4>
                            <p>Type: ${data.data.event2.event_type}</p>
                            <p>Description: ${data.data.event2.description}</p>
                            <p>Timestamp: ${new Date(data.data.event2.timestamp).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            resultDiv.innerHTML = '<p class="error">Error calculating similarity</p>';
            console.error('Error:', error);
        }
    });
    
    section.appendChild(form);
    section.appendChild(resultDiv);
    return section;
}

function switchTab(tabId) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    // Add active class to selected tab
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    
    const content = document.getElementById('content');
    content.innerHTML = '';
    
    switch (tabId) {
        case 'events':
            content.appendChild(createEventsSection());
            loadEvents();
            break;
        case 'similarity':
            content.appendChild(createSimilaritySection());
            break;
        case 'cosine':
            content.appendChild(createCosineSection());
            break;
        case 'ask-ai':
            content.appendChild(createAskAISection());
            break;
        case 'umap':
            content.appendChild(createUMAPSection());
            loadUMAP();
            break;
        case 'logs':
            content.appendChild(createLogsSection());
            loadLogs();
            break;
    }
} 