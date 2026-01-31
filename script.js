// Global State
let currentPage = 'home';
let isDarkMode = true;
let mobileMenuOpen = false;
let demandChart = null;
let updateInterval = null;

// Metro Data
const metroLines = [
    { id: 1, name: 'Red Line', color: '#EF4444', stations: ['Central Station', 'Tech Park', 'University', 'Mall Junction', 'Airport'] },
    { id: 2, name: 'Blue Line', color: '#3B82F6', stations: ['Harbor Point', 'Business District', 'Central Station', 'Sports Complex', 'West End'] },
    { id: 3, name: 'Green Line', color: '#10B981', stations: ['North Terminal', 'Museum', 'Central Station', 'Garden Plaza', 'South Bay'] },
    { id: 4, name: 'Yellow Line', color: '#F59E0B', stations: ['East Gate', 'Market Square', 'Central Station', 'Convention Center', 'Lakeside'] }
];

const alerts = [
    { id: 1, type: 'high', message: 'High passenger demand predicted at Central Station (18:00-19:00)' },
    { id: 2, type: 'medium', message: 'Weather alert: Light rain expected, minor delays possible' },
    { id: 3, type: 'low', message: 'AI optimization increased frequency on Blue Line by 25%' }
];

const performanceMetrics = {
    onTimePerformance: 94.2,
    averageWaitTime: 3.8,
    passengerSatisfaction: 4.6,
    systemEfficiency: 91.5
};

// Data Generation Functions
function generateDemandData() {
    const data = [];
    for (let hour = 0; hour < 24; hour++) {
        const isPeak = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
        const baseValue = isPeak ? 800 : 100;
        data.push({
            hour: `${hour}:00`,
            predicted: Math.floor(Math.random() * 500 + baseValue),
            actual: Math.floor(Math.random() * 500 + baseValue),
            capacity: 1200
        });
    }
    return data;
}

function generateTrainSchedule() {
    const trains = ['T-101', 'T-102', 'T-103', 'T-104', 'T-105'];
    return trains.map((train, idx) => ({
        id: train,
        line: ['Red', 'Blue', 'Green', 'Yellow'][idx % 4],
        lineColor: [metroLines[0].color, metroLines[1].color, metroLines[2].color, metroLines[3].color][idx % 4],
        nextStation: ['Central Station', 'Tech Park', 'Museum', 'Mall Junction'][idx % 4],
        eta: `${2 + idx} min`,
        status: idx === 2 ? 'Delayed' : 'On Time',
        occupancy: Math.floor(Math.random() * 40 + 60)
    }));
}

function getAllStations() {
    const stations = new Set();
    metroLines.forEach(line => {
        line.stations.forEach(station => stations.add(station));
    });
    return Array.from(stations).sort();
}

// Page Navigation
function showPage(pageName) {
    currentPage = pageName;
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const pageElement = document.getElementById(pageName + 'Page');
    if (pageElement) {
        pageElement.classList.add('active');
    }
    
    // Update navigation active state
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageName) {
            link.classList.add('active');
        }
    });
    
    document.querySelectorAll('.nav-link-mobile').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageName) {
            link.classList.add('active');
        }
    });
    
    // Initialize page-specific features
    if (pageName === 'demo') {
        initializeDemoPage();
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Theme Toggle
function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.className = isDarkMode ? 'dark-mode' : 'light-mode';
    
    // Update chart if it exists
    if (demandChart) {
        updateChartColors();
    }
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
    const mobileMenu = document.getElementById('mobileMenu');
    const menuIcon = document.querySelector('.menu-icon');
    const closeIcon = document.querySelector('.close-icon');
    
    if (mobileMenuOpen) {
        mobileMenu.style.display = 'block';
        menuIcon.style.display = 'none';
        closeIcon.style.display = 'block';
    } else {
        mobileMenu.style.display = 'none';
        menuIcon.style.display = 'block';
        closeIcon.style.display = 'none';
    }
}

// Initialize Demo Page
function initializeDemoPage() {
    renderAlerts();
    renderMetroLines();
    renderTrainSchedule();
    renderDemandChart();
    populateStationSelects();
    renderMetrics();
    initializeSliders();
    
    // Start auto-update
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    updateInterval = setInterval(() => {
        renderTrainSchedule();
        updateDemandChart();
    }, 10000); // Update every 10 seconds
}

// Render Alerts
function renderAlerts() {
    const container = document.getElementById('alertsContainer');
    if (!container) return;
    
    container.innerHTML = alerts.map(alert => `
        <div class="alert alert-${alert.type}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>${alert.message}</div>
        </div>
    `).join('');
}

// Render Metro Lines
function renderMetroLines() {
    const container = document.getElementById('metroLines');
    if (!container) return;
    
    container.innerHTML = metroLines.map(line => `
        <button class="metro-line" style="background-color: ${line.color}; opacity: 0.7;">
            ${line.name}
        </button>
    `).join('');
}

// Render Train Schedule
function renderTrainSchedule() {
    const container = document.getElementById('trainSchedule');
    if (!container) return;
    
    const trains = generateTrainSchedule();
    
    container.innerHTML = trains.map(train => `
        <div class="train-item">
            <div class="train-header">
                <div class="train-info">
                    <div class="train-line-indicator" style="background-color: ${train.lineColor}"></div>
                    <span class="train-id">${train.id}</span>
                    <span class="train-line-name">${train.line} Line</span>
                </div>
                <span class="train-status ${train.status === 'On Time' ? 'status-ontime' : 'status-delayed'}">
                    ${train.status}
                </span>
            </div>
            <div class="train-details">
                <div class="train-destination">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                    </svg>
                    <span>${train.nextStation}</span>
                </div>
                <div class="train-meta">
                    <span>ETA: <strong class="train-eta">${train.eta}</strong></span>
                    <div class="train-occupancy">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <div class="occupancy-bar">
                            <div class="occupancy-fill" style="width: ${train.occupancy}%; background-color: ${
                                train.occupancy > 80 ? '#ef4444' : 
                                train.occupancy > 60 ? '#f59e0b' : '#22c55e'
                            }"></div>
                        </div>
                        <span class="occupancy-text">${train.occupancy}%</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Render Demand Chart
function renderDemandChart() {
    const canvas = document.getElementById('demandChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const data = generateDemandData();
    
    if (demandChart) {
        demandChart.destroy();
    }
    
    demandChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.hour),
            datasets: [
                {
                    label: 'AI Predicted',
                    data: data.map(d => d.predicted),
                    borderColor: '#0ea5e9',
                    backgroundColor: isDarkMode ? 'rgba(14, 165, 233, 0.1)' : 'rgba(14, 165, 233, 0.05)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Actual Flow',
                    data: data.map(d => d.actual),
                    borderColor: '#22c55e',
                    backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Capacity',
                    data: data.map(d => d.capacity),
                    borderColor: '#ef4444',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        font: {
                            size: 12
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: isDarkMode ? '#334155' : '#e2e8f0'
                    },
                    ticks: {
                        color: isDarkMode ? '#64748b' : '#64748b'
                    }
                },
                x: {
                    grid: {
                        color: isDarkMode ? '#334155' : '#e2e8f0'
                    },
                    ticks: {
                        color: isDarkMode ? '#64748b' : '#64748b'
                    }
                }
            }
        }
    });
}

// Update Chart Colors
function updateChartColors() {
    if (!demandChart) return;
    
    demandChart.options.plugins.legend.labels.color = isDarkMode ? '#94a3b8' : '#64748b';
    demandChart.options.scales.y.grid.color = isDarkMode ? '#334155' : '#e2e8f0';
    demandChart.options.scales.y.ticks.color = isDarkMode ? '#64748b' : '#64748b';
    demandChart.options.scales.x.grid.color = isDarkMode ? '#334155' : '#e2e8f0';
    demandChart.options.scales.x.ticks.color = isDarkMode ? '#64748b' : '#64748b';
    
    demandChart.data.datasets[0].backgroundColor = isDarkMode ? 'rgba(14, 165, 233, 0.1)' : 'rgba(14, 165, 233, 0.05)';
    demandChart.data.datasets[1].backgroundColor = isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)';
    
    demandChart.update();
}

// Update Demand Chart
function updateDemandChart() {
    if (!demandChart) return;
    
    const data = generateDemandData();
    demandChart.data.datasets[0].data = data.map(d => d.predicted);
    demandChart.data.datasets[1].data = data.map(d => d.actual);
    demandChart.update();
}

// Populate Station Selects
function populateStationSelects() {
    const stations = getAllStations();
    const fromSelect = document.getElementById('fromStation');
    const toSelect = document.getElementById('toStation');
    
    if (!fromSelect || !toSelect) return;
    
    const optionsHTML = '<option value="">Select station</option>' + 
        stations.map(station => `<option value="${station}">${station}</option>`).join('');
    
    fromSelect.innerHTML = optionsHTML;
    toSelect.innerHTML = optionsHTML;
}

// Handle Journey Form
function handleJourneyForm(e) {
    e.preventDefault();
    
    const fromStation = document.getElementById('fromStation').value;
    const toStation = document.getElementById('toStation').value;
    const resultDiv = document.getElementById('journeyResult');
    
    if (!fromStation || !toStation) return;
    
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
        <div class="journey-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Estimated Journey</span>
        </div>
        <div class="journey-info">
            <p><strong>Duration:</strong> 18 minutes</p>
            <p><strong>Wait Time:</strong> 3 minutes</p>
            <p><strong>Transfers:</strong> 1</p>
            <p><strong>Route:</strong> ${fromStation} → Central Station → ${toStation}</p>
        </div>
    `;
}

// Render Metrics
function renderMetrics() {
    const container = document.getElementById('metricsGrid');
    if (!container) return;
    
    const metrics = [
        { label: 'On-Time %', value: performanceMetrics.onTimePerformance, color: '#22c55e', suffix: '%' },
        { label: 'Avg Wait', value: performanceMetrics.averageWaitTime, color: '#0ea5e9', suffix: ' min' },
        { label: 'Satisfaction', value: performanceMetrics.passengerSatisfaction, color: '#f59e0b', suffix: '/5', max: 5 },
        { label: 'Efficiency', value: performanceMetrics.systemEfficiency, color: '#8b5cf6', suffix: '%' }
    ];
    
    container.innerHTML = metrics.map(metric => {
        const percentage = metric.max ? (metric.value / metric.max) * 100 : metric.value;
        return `
            <div class="metric-item">
                <div class="metric-label">${metric.label}</div>
                <div class="metric-value" style="color: ${metric.color}">
                    ${metric.value}${metric.suffix}
                </div>
                <div class="metric-bar">
                    <div class="metric-fill" style="width: ${percentage}%; background-color: ${metric.color}"></div>
                </div>
            </div>
        `;
    }).join('');
}

// Initialize Sliders
function initializeSliders() {
    const peakSlider = document.getElementById('peakSlider');
    const offPeakSlider = document.getElementById('offPeakSlider');
    const peakValue = document.getElementById('peakValue');
    const offPeakValue = document.getElementById('offPeakValue');
    const recommendation = document.getElementById('aiRecommendation');
    
    if (!peakSlider || !offPeakSlider) return;
    
    peakSlider.addEventListener('input', (e) => {
        peakValue.textContent = `${e.target.value} minutes`;
    });
    
    offPeakSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        offPeakValue.textContent = `${value} minutes`;
        
        const recommendedValue = Math.max(value + 2, 10);
        recommendation.textContent = `Based on predicted demand, reduce off-peak frequency to ${recommendedValue} minutes to optimize energy consumption while maintaining service quality.`;
    });
}

// Handle Contact Form
function handleContactForm(e) {
    e.preventDefault();
    alert('Thank you for your message! We will get back to you soon.');
    e.target.reset();
}

// Initialize Application
function initializeApp() {
    // Set initial theme
    document.body.className = 'dark-mode';
    
    // Add event listeners
    const journeyForm = document.getElementById('journeyForm');
    if (journeyForm) {
        journeyForm.addEventListener('submit', handleJourneyForm);
    }
    
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
    
    // Show home page
    showPage('home');
}

// Run on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    if (demandChart) {
        demandChart.destroy();
    }
});
