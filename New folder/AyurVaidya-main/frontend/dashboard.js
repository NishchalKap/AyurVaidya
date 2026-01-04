/**
 * Doctor Dashboard Logic
 */

const API_BASE = '/api/v1';
let currentTab = 'queue';

// ==========================================
// DUMMY DATA (Frontend Only Mode)
// ==========================================

const MOCK_STATS = {
    totalPending: 4,
    byPriority: { URGENT: 1, ELEVATED: 2, ROUTINE: 1 },
    totalCases: 42,
    totalReviewed: 38
};

const MOCK_QUEUE = [
    {
        id: 'case_101',
        priority: 'URGENT',
        patient: { full_name: 'Rahul Sharma', age: 45, gender: 'M' },
        chief_complaint: 'Severe Chest Pain & Palpitations',
        symptom_duration: '2 days',
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        status: 'PENDING_REVIEW'
    },
    {
        id: 'case_102',
        priority: 'ELEVATED',
        patient: { full_name: 'Priya Patel', age: 28, gender: 'F' },
        chief_complaint: 'Persistent Migraine & Nausea',
        symptom_duration: '1 week',
        created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        status: 'PENDING_REVIEW'
    },
    {
        id: 'case_103',
        priority: 'ROUTINE',
        patient: { full_name: 'Amit Kumar', age: 35, gender: 'M' },
        chief_complaint: 'Seasonal Allergies',
        symptom_duration: '3 days',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        status: 'PENDING_REVIEW'
    },
    {
        id: 'case_104',
        priority: 'ELEVATED',
        patient: { full_name: 'Sarah Jenkins', age: 52, gender: 'F' },
        chief_complaint: 'Joint Pain (Knees)',
        symptom_duration: '2 months',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        status: 'PENDING_REVIEW'
    }
];

const MOCK_HISTORY = [
    {
        id: 'case_099',
        patient: { full_name: 'Vikram Singh' },
        doctor_decision: 'Prescribed Ashwagandha',
        reviewed_by: 'Dr. Bhavya',
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
    },
    {
        id: 'case_098',
        patient: { full_name: 'Anjali Gupta' },
        doctor_decision: 'Recommended Yoga Therapy',
        reviewed_by: 'Dr. Bhavya',
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
    },
    {
        id: 'case_095',
        patient: { full_name: 'John Doe' },
        doctor_decision: 'Referred to Specialist',
        reviewed_by: 'Dr. Bhavya',
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString()
    }
];

const MOCK_DETAILS = {
    'case_101': {
        rawNotes: "Patient complains of sudden onset sharp test pain radiating to left arm. No history of cardiac issues. BP 150/95. Sweating profusely.",
        vitalSigns: { temperature: 98.6, bloodPressure: "150/95", pulseRate: 110 },
        aiSummary: {
            summary: "Patient exhibiting classic signs of Angina or potential Myocardial Infarction. High BP and pulse rate noted. Immediate ECG recommended.",
            riskFlags: ["Cardiac Alert", "High BP", "Tachycardia"],
            suggestedFollowUp: "Refer to ER immediately for ECG and Cardiac Enzyme tests."
        }
    },
    'default': {
        rawNotes: "Patient reports general malaise and fatigue. Mild fever noted in the evenings.",
        vitalSigns: { temperature: 99.2, bloodPressure: "120/80", pulseRate: 78 },
        aiSummary: {
            summary: "Non-specific viral symptoms. Monitor for 24-48 hours.",
            riskFlags: ["Low Priority"],
            suggestedFollowUp: "Hydration and Rest. Paracetamol PRN."
        }
    }
}

// ==========================================
// MAIN LOGIC
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});

async function initDashboard() {
    loadStats();
    loadQueue();
}

function switchTab(tab) {
    currentTab = tab;

    // Hide all view containers
    document.querySelectorAll('.tab-view').forEach(el => el.style.display = 'none');
    document.getElementById(`view-${tab}`).style.display = 'block';

    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Load Data based on tab
    if (tab === 'queue') loadQueue();
    if (tab === 'closed') loadHistory();
    if (tab === 'system') loadSystemHealth();
}

// ==========================================
// DATA FETCHING (MOCKED)
// ==========================================

async function loadStats() {
    // ORIGINAL API CALL:
    /*
    try {
        const res = await fetch(`${API_BASE}/cases/stats`);
        const stats = await res.json();
        // ... (see usage below)
    } catch (e) { console.error('Failed to load stats', e); }
    */

    // USING MOCK DATA:
    const stats = MOCK_STATS;

    // Update Pending Count in Header
    const pendingEl = document.getElementById('pendingCount');
    if (pendingEl) pendingEl.innerText = stats.totalPending;

    // Render Stats Grid
    const grid = document.getElementById('statsGrid');
    grid.innerHTML = `
        <div class="stat-card">
            <h4>Pending Review</h4>
            <div class="number" style="color:#d97706">${stats.totalPending}</div>
        </div>
        <div class="stat-card">
            <h4>Urgent Cases</h4>
            <div class="number" style="color:#dc2626">${stats.byPriority.URGENT || 0}</div>
        </div>
        <div class="stat-card">
            <h4>Cases Today</h4>
            <div class="number">${stats.totalCases}</div>
        </div>
            <div class="stat-card">
            <h4>Reviewed</h4>
            <div class="number" style="color:#16a34a">${stats.totalReviewed}</div>
        </div>
    `;
}

async function loadQueue() {
    // ORIGINAL API CALL:
    /*
    try {
        const res = await fetch(`${API_BASE}/cases?status=PENDING_REVIEW&limit=50`);
        const data = await res.json();
        renderTable('queueTableBody', data.data, true);
    } catch (e) { ... }
    */

    // USING MOCK DATA:
    renderTable('queueTableBody', MOCK_QUEUE, true);
}

async function loadHistory() {
    // ORIGINAL API CALL:
    /*
    try {
        const res = await fetch(`${API_BASE}/cases?status=CLOSED&limit=50`);
        const data = await res.json();
        const items = data.data; 
        // ...
    } catch (e) { ... }
    */

    // USING MOCK DATA:
    const items = MOCK_HISTORY;
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8;">No closed cases found in history.</td></tr>';
        return;
    }

    items.forEach(c => {
        const row = `
            <tr>
                <td><span style="font-family:monospace;">${c.id.split('_')[1]}</span></td>
                <td><b>${c.patient?.full_name || 'Unknown'}</b></td>
                <td>${c.doctor_decision || '-'}</td>
                <td>${c.reviewed_by || 'Unknown'}</td>
                <td>${new Date(c.updated_at).toLocaleDateString()}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

async function loadSystemHealth() {
    const mockHealth = {
        status: "operational",
        services: { database: "connected", ai_inference: "online" },
        uptime_seconds: 12044
    };
    document.getElementById('systemJson').innerText = JSON.stringify(mockHealth, null, 2);
}

// ==========================================
// RENDERING
// ==========================================

function renderTable(tableId, items, isActionable) {
    const tbody = document.getElementById(tableId);
    tbody.innerHTML = '';

    if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px; color:#94a3b8;">Queue is empty. Great job! 🎉</td></tr>';
        return;
    }

    items.forEach(item => {
        const priorityClass = item.priority.toLowerCase();

        // Calculate relative time
        const created = new Date(item.created_at);
        const timeDiff = Math.floor((new Date() - created) / 60000); // minutes
        let timeString = timeDiff < 60 ? `${timeDiff}m ago` : `${Math.floor(timeDiff / 60)}h ago`;

        const row = `
            <tr>
                <td><span style="font-family:monospace; color:#64748b; font-weight:600;">#${item.id.split('_')[1]}</span></td>
                <td><span class="status-badge ${priorityClass}">${item.priority}</span></td>
                <td>
                    <div style="font-weight:600; color:var(--text);">${item.patient?.full_name || 'Anonymous'}</div>
                    <div style="font-size:12px; color:var(--muted); margin-top:2px;">
                        ${item.patient?.age || '?'} yrs • ${item.patient?.gender === 'M' ? 'Male' : 'Female'}
                    </div>
                </td>
                <td style="max-width:300px;">
                    <div style="font-weight:500; margin-bottom:2px;">${item.chief_complaint}</div>
                    <div style="font-size:12px; color:var(--muted);">${item.symptom_duration}</div>
                </td>
                <td style="font-size:13px; color:var(--muted); white-space:nowrap;">${timeString}</td>
                <td><span class="state-chip ${item.status.toLowerCase()}">${item.status.replace('_', ' ')}</span></td>
                <td style="text-align:right;">
                    ${isActionable ? `<button class="action-btn" onclick="openReview('${item.id}')">Review Case</button>` : '-'}
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// ==========================================
// REVIEW MODAL
// ==========================================

async function openReview(caseId) {
    const modal = document.getElementById('reviewModal');

    // USING MOCK DETAIL:
    const mockDetails = MOCK_DETAILS[caseId] || MOCK_DETAILS['default'];
    // Merge with basic info if we really had the full queue object available, 
    // but here we just use what we have in mock Details
    const c = {
        rawNotes: mockDetails.rawNotes,
        vitalSigns: mockDetails.vitalSigns
    };

    document.getElementById('activeCaseId').value = caseId;
    document.getElementById('modalCaseTitle').innerText = `Reviewing Case #${caseId.split('_')[1]}`;

    // Patient Notes
    document.getElementById('modalPatientNotes').innerText = c.rawNotes || "No notes available.";

    // Vitals
    if (c.vitalSigns) {
        const vitals = typeof c.vitalSigns === 'string' ? JSON.parse(c.vitalSigns) : c.vitalSigns;
        document.getElementById('modalVitals').innerText =
            `Temperature: ${vitals.temperature}°F | BP: ${vitals.bloodPressure} | Pulse: ${vitals.pulseRate}`;
    }

    // AI Summary
    document.getElementById('modalAiSummary').innerText = '🤖 AI is analyzing clinical notes...';
    document.getElementById('modalRiskFlags').innerHTML = '';

    // Simulate AI loading
    setTimeout(() => {
        renderAiSummary(mockDetails.aiSummary);
    }, 800);

    modal.classList.add('active');
}

function renderAiSummary(summaryData) {
    document.getElementById('modalAiSummary').innerText = summaryData.summary;

    const flagsContainer = document.getElementById('modalRiskFlags');
    flagsContainer.innerHTML = '';

    if (summaryData.riskFlags && summaryData.riskFlags.length > 0) {
        summaryData.riskFlags.forEach(flag => {
            flagsContainer.innerHTML += `
                <span style="background:#fee2e2; color:#991b1b; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600;">
                    🚩 ${flag}
                </span>
            `;
        });
    }

    if (summaryData.suggestedFollowUp) {
        document.getElementById('doctorDecision').placeholder = `AI Suggestion: ${summaryData.suggestedFollowUp}`;
    }
}

function closeReviewModal() {
    document.getElementById('reviewModal').classList.remove('active');
}

async function submitCloseCase() {
    const caseId = document.getElementById('activeCaseId').value;
    const decision = document.getElementById('doctorDecision').value;

    if (!decision || decision.length < 5) {
        alert('Please enter a valid clinical decision (min 5 chars).');
        return;
    }

    // MOCKED SUCCESS
    alert(`Case ${caseId} Closed Successfully!\n\n(This is a demo - no data was saved to database)`);

    closeReviewModal();
    // loadQueue(); // If we were updating local state we might re-render here
}
