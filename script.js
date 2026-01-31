// Global State
let currentPage = 'home';
let isDarkMode = false;
let demandChart = null;
let updateInterval = null;

// STATION DATA
const metroStations = [
    "Aluva", "Pulinchodu", "Companypady", "Ambattukavu", "Muttom", 
    "Kalamassery", "Cochin University", "Pathadipalam", "Edapally", 
    "Changampuzha Park", "Palarivattom", "JLN Stadium", "Kaloor", 
    "Town Hall", "M.G Road", "Maharaja's College", "Ernakulam South", 
    "Kadavanthra", "Elamkulam", "Vyttila", "Thaikoodam", "Petta", 
    "Vadakkekotta", "SN Junction", "Tripunithura Terminal"
];

// 1. HARDCODED DATA FROM YOUR PYTHON MODEL (OPERATIONAL HOURS ONLY: 06:00 - 23:00)
const modelOutputData = [
    { hour: "6", demand: 250, freq: 10 },   // Operations Start
    { hour: "7", demand: 380, freq: 10 },
    { hour: "8", demand: 475, freq: 5 },    // Morning Peak
    { hour: "9", demand: 460, freq: 5 },    // Morning Peak
    { hour: "10", demand: 410, freq: 5 },   // Morning Peak
    { hour: "11", demand: 320, freq: 10 },
    { hour: "12", demand: 280, freq: 10 },
    { hour: "13", demand: 290, freq: 10 },
    { hour: "14", demand: 310, freq: 10 },
    { hour: "15", demand: 340, freq: 10 },
    { hour: "16", demand: 390, freq: 10 },
    { hour: "17", demand: 445, freq: 5 },   // Evening Peak
    { hour: "18", demand: 480, freq: 5 },   // Evening Peak
    { hour: "19", demand: 450, freq: 5 },   // Evening Peak
    { hour: "20", demand: 360, freq: 10 },
    { hour: "21", demand: 220, freq: 10 },
    { hour: "22", demand: 140, freq: 15 },
    { hour: "23", demand: 80, freq: 15 }    // Last Train
];

// GENERATE CHART DATA (Fills gaps for closed hours)
function generateDemandData() {
    const fullDayData = [];
    for(let i=0; i<24; i++) {
        // Find if this hour exists in our model output
        const found = modelOutputData.find(d => parseInt(d.hour) === i);
        
        if(found) {
            // Operational Hour
            fullDayData.push({
                hour: `${i}:00`,
                predicted: found.demand,
                actual: found.demand + Math.floor(Math.random() * 40 - 20),
                capacity: 1000
            });
        } else {
            // Non-Operational (Metro Closed)
            fullDayData.push({
                hour: `${i}:00`,
                predicted: 0,
                actual: 0,
                capacity: 0
            });
        }
    }
    return fullDayData;
}

// SIMULATION STATE
let liveTrains = [];

function initializeTrains() {
    liveTrains = [];
    liveTrains.push(createTrain('KM-101', 0, 1, 'At Station'));   
    liveTrains.push(createTrain('KM-103', 8, 1, 'Moving'));       
    liveTrains.push(createTrain('KM-105', 16, 1, 'At Station'));  
    liveTrains.push(createTrain('KM-202', 24, -1, 'At Station')); 
    liveTrains.push(createTrain('KM-204', 16, -1, 'Moving'));     
    liveTrains.push(createTrain('KM-206', 7, -1, 'Moving'));      
}

function createTrain(id, idx, dir, status) {
    return {
        id: id,
        currentIndex: idx,
        direction: dir,
        status: status,
        progress: 0,
        occupancy: Math.floor(Math.random() * 60 + 20)
    };
}

function updateSimulation() {
    const speed = 5; 
    liveTrains.forEach(train => {
        if (train.status === 'At Station') {
            if (Math.random() > 0.6) { 
                train.status = 'Moving';
                train.progress = 0;
            }
        } else {
            train.progress += speed;
            if (train.progress >= 100) {
                train.currentIndex += train.direction;
                train.status = 'At Station';
                train.progress = 0;
                if (train.currentIndex >= metroStations.length - 1) {
                    train.direction = -1; 
                    train.currentIndex = metroStations.length - 1;
                } else if (train.currentIndex <= 0) {
                    train.direction = 1; 
                    train.currentIndex = 0;
                }
            }
        }
    });
    updateMapVisuals();
    updateLiveStatusBox();
}

function updateMapVisuals() {
    const container = document.getElementById('trainMarkers');
    if (!container) return;
    const mapTop = 30;
    const mapBottom = 620;
    const totalHeight = mapBottom - mapTop;
    const segmentHeight = totalHeight / (metroStations.length - 1);
    let svgContent = '';
    
    liveTrains.forEach(train => {
        let visualY;
        const currentY = mapTop + (train.currentIndex * segmentHeight);
        if (train.status === 'Moving') {
            const nextIdx = train.currentIndex + train.direction;
            const nextY = mapTop + (nextIdx * segmentHeight);
            const diff = nextY - currentY;
            visualY = currentY + (diff * (train.progress / 100));
        } else {
            visualY = currentY;
        }
        svgContent += `
            <circle cx="200" cy="${visualY}" r="8" fill="#ef4444" stroke="#fff" stroke-width="2">
                <title>${train.id}</title>
            </circle>
            <text x="215" y="${visualY + 4}" fill="#ef4444" font-size="10" font-weight="bold">${train.id}</text>
        `;
    });
    container.innerHTML = svgContent;
}

function updateLiveStatusBox() {
    const statusText = document.getElementById('trainLocationText');
    const etaText = document.getElementById('userEtaText');
    const userFrom = document.getElementById('fromStation').value;
    const userTo = document.getElementById('toStation').value;

    if (!statusText) return;

    if (!userFrom || !userTo || userFrom === userTo) {
        statusText.textContent = "System Active";
        etaText.textContent = `Tracking ${liveTrains.length} active trains on the Blue Line.`;
        return;
    }

    const fromIdx = metroStations.indexOf(userFrom);
    const toIdx = metroStations.indexOf(userTo);
    const userDir = (toIdx > fromIdx) ? 1 : -1; 

    let nearestTrain = null;
    let minDistance = Infinity;

    liveTrains.forEach(train => {
        if (train.direction !== userDir) return;
        let distance = -1;
        if (userDir === 1) {
            if (train.currentIndex <= fromIdx) {
                distance = fromIdx - train.currentIndex;
                if (train.status === 'Moving') distance -= (train.progress/100);
            }
        } else {
            if (train.currentIndex >= fromIdx) {
                distance = train.currentIndex - fromIdx;
                if (train.status === 'Moving') distance -= (train.progress/100);
            }
        }
        if (distance >= 0 && distance < minDistance) {
            minDistance = distance;
            nearestTrain = train;
        }
    });

    if (nearestTrain) {
        const minsAway = Math.ceil(minDistance * 3);
        statusText.textContent = `Next Train: ${nearestTrain.id}`;
        statusText.style.color = "var(--primary-color)"; 
        if (minsAway <= 0) {
            etaText.textContent = "Train is Arriving / At Platform!";
            etaText.style.color = "var(--success-color)";
        } else {
            etaText.textContent = `Arriving in approx ${minsAway} mins (${Math.floor(minDistance)} stops away)`;
            etaText.style.color = "var(--text-primary)";
        }
    } else {
        statusText.textContent = "Waiting for Train...";
        statusText.style.color = "var(--text-secondary)";
        etaText.textContent = "No train currently approaching.";
    }
}

function renderTrainSchedule() {
    const container = document.getElementById('trainSchedule');
    if (!container) return;
    const sortedTrains = [...liveTrains].sort((a,b) => a.id.localeCompare(b.id));
    container.innerHTML = sortedTrains.map(train => {
        let locText = train.status === 'At Station' ? `Stopped at ${metroStations[train.currentIndex]}` : `Moving to ${metroStations[train.currentIndex + train.direction]}`;
        const dirText = train.direction === 1 ? "Tripunithura ⬇" : "Aluva ⬆";
        return `
        <div class="train-item">
            <div class="train-header">
                <div class="train-info">
                    <span class="train-id">${train.id}</span>
                    <span class="train-line-name" style="color:var(--primary-color)">${dirText}</span>
                </div>
                <span class="train-status ${train.status === 'At Station' ? 'status-ontime' : 'status-delayed'}">
                    ${train.status === 'At Station' ? 'Boarding' : 'Moving'}
                </span>
            </div>
            <div class="train-details">
                <div>${locText}</div>
                <div>Load: ${train.occupancy}%</div>
            </div>
        </div>
    `}).join('');
}

function renderDemandChart() {
    const canvas = document.getElementById('demandChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const data = generateDemandData();
    if (demandChart) demandChart.destroy();
    
    const lineColor = isDarkMode ? '#0ea5e9' : '#5E6C5B'; 
    const fillColor = isDarkMode ? 'rgba(14, 165, 233, 0.1)' : 'rgba(94, 108, 91, 0.1)';
    const gridColor = isDarkMode ? '#334155' : '#D6E0E2';

    demandChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.hour),
            datasets: [
                {
                    label: 'Predicted Load',
                    data: data.map(d => d.predicted),
                    borderColor: lineColor,
                    backgroundColor: fillColor,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: gridColor } },
                x: { grid: { color: gridColor } }
            }
        }
    });
}

function populateStationSelects() {
    const fromSelect = document.getElementById('fromStation');
    const toSelect = document.getElementById('toStation');
    if (!fromSelect || fromSelect.options.length > 1) return;
    const optionsHTML = '<option value="">Select Station</option>' + 
        metroStations.map(s => `<option value="${s}">${s}</option>`).join('');
    fromSelect.innerHTML = optionsHTML;
    toSelect.innerHTML = optionsHTML;
    fromSelect.addEventListener('change', updateLiveStatusBox);
    toSelect.addEventListener('change', updateLiveStatusBox);
}

function handleJourneyForm(e) {
    e.preventDefault();
    const from = document.getElementById('fromStation').value;
    const to = document.getElementById('toStation').value;
    const resultDiv = document.getElementById('journeyResult');
    if (!from || !to || from === to) {
        alert("Please select different stations.");
        return;
    }
    const stops = Math.abs(metroStations.indexOf(to) - metroStations.indexOf(from));
    const time = stops * 3; 
    let price = 10;
    if (stops > 17) price = 60;
    else if (stops > 12) price = 50;
    else if (stops > 8) price = 40;
    else if (stops > 5) price = 30;
    else if (stops > 2) price = 20;
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
        <div class="journey-info">
            <p><strong>Route:</strong> ${from} ➝ ${to}</p>
            <p><strong>Stops:</strong> ${stops}</p>
            <p><strong>Time:</strong> ${time} mins</p>
            <p><strong>Fare:</strong> ₹${price}</p>
        </div>
    `;
    updateLiveStatusBox();
}

function initializeApp() {
    document.body.className = 'light-mode';
    isDarkMode = false;
    const journeyForm = document.getElementById('journeyForm');
    if (journeyForm) journeyForm.addEventListener('submit', handleJourneyForm);
    const contactForm = document.getElementById('contactForm');
    if (contactForm) contactForm.addEventListener('submit', (e) => { e.preventDefault(); alert("Message Sent!"); });
    showPage('home');
}

function showPage(pageName) {
    currentPage = pageName;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageName + 'Page').classList.add('active');
    if (pageName === 'demo') initializeDemoPage();
}

function initializeDemoPage() {
    initializeTrains();
    renderDemandChart();
    populateStationSelects();
    if(currentUser) renderAdminPanel();
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(() => {
        updateSimulation();
        renderTrainSchedule();
    }, 500);
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.className = isDarkMode ? 'dark-mode' : 'light-mode';
    if (demandChart) renderDemandChart();
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// LOGIN & ADMIN LOGIC
let currentUser = null;
let currentAiPrediction = 0;

function openLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

const loginForm = document.getElementById('loginForm');
if(loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;
        const role = document.getElementById('userRole').value;
        if (user === 'admin' && pass === 'admin123' && role === 'admin') {
            currentUser = { name: 'Admin User', role: 'admin' };
            loginSuccess();
        } else if (user === 'user' && pass === 'user123') {
            currentUser = { name: 'Station Master', role: 'user' };
            alert("Logged in as Station Master. View-only access.");
            closeLoginModal();
            updateLoginUI();
        } else {
            alert("Invalid Credentials! (Try: admin / admin123)");
        }
    });
}

function loginSuccess() {
    alert("Admin Access Granted.\nAI Control Panel Unlocked.");
    closeLoginModal();
    updateLoginUI();
    renderAdminPanel();
    generateAiPrediction(); 
}

function updateLoginUI() {
    const btn = document.getElementById('loginBtn');
    if (currentUser) {
        btn.textContent = `Logout (${currentUser.role})`;
        btn.onclick = logout;
    } else {
        btn.textContent = 'Login';
        btn.onclick = openLoginModal;
    }
}

function logout() {
    currentUser = null;
    const adminInterface = document.getElementById('adminInterface');
    const adminLocked = document.getElementById('adminLockedMsg');
    if(adminInterface) adminInterface.style.display = 'none';
    if(adminLocked) adminLocked.style.display = 'block';
    updateLoginUI();
    alert("Logged Out.");
}

function renderAdminPanel() {
    if (currentUser && currentUser.role === 'admin') {
        const adminLocked = document.getElementById('adminLockedMsg');
        const adminInterface = document.getElementById('adminInterface');
        if(adminLocked) adminLocked.style.display = 'none';
        if(adminInterface) adminInterface.style.display = 'block';
    }
}

function generateAiPrediction() {
    const statusText = document.getElementById('aiReasoning');
    const valueText = document.getElementById('aiPredictedValue');
    if(!statusText || !valueText) return;

    valueText.innerHTML = '<span style="font-size:1.5rem">Syncing...</span>';
    statusText.textContent = "Fetching latest batch predictions...";
    
    setTimeout(() => {
        // Randomly sample from our model output data for the demo
        const randomHourIdx = Math.floor(Math.random() * modelOutputData.length);
        const dataPoint = modelOutputData[randomHourIdx];

        currentAiPrediction = dataPoint.freq;
        valueText.textContent = `${currentAiPrediction} mins`;
        
        let reason = "";
        if(dataPoint.demand > 400) {
            reason = `High Demand (${dataPoint.demand} pax) at ${dataPoint.hour}:00. Maximizing frequency.`;
        } else if (dataPoint.demand > 200) {
            reason = `Moderate flow (${dataPoint.demand} pax) at ${dataPoint.hour}:00. Standard schedule.`;
        } else {
            reason = `Low traffic (${dataPoint.demand} pax) at ${dataPoint.hour}:00. Energy saving mode.`;
        }
        statusText.textContent = `AI Insight: ${reason}`;
    }, 1000);
}

function approvePrediction() {
    const display = document.getElementById('currentSystemFreq');
    if(display) {
        display.textContent = `Running at ${currentAiPrediction} min intervals (AI Optimized)`;
        display.style.color = "var(--success-color)";
    }
    alert(`System Update:\nHeadway set to ${currentAiPrediction} minutes.`);
}

function rejectPrediction() {
    if (window.confirm("Disagree with AI? Re-evaluate?")) {
        generateAiPrediction();
    }
}