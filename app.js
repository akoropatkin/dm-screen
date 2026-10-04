/* ==========================================================================
   CAMPAIGN COMMAND CENTER - CLOUD SYNCED JAVASCRIPT ENGINE
   ========================================================================== */

// Insert your copied Google Apps Script Web App URL below
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID_HERE/exec";

// --- DOM ELEMENTS ---
const startDateInput = document.getElementById('campaign-start');
const currentDateInput = document.getElementById('campaign-current');
const daysElapsedDisplay = document.getElementById('days-elapsed-display');
const moonPhaseDisplay = document.getElementById('moon-phase-display');

const dicePoolCountDisplay = document.getElementById('dice-pool-count');
const threatLevelDisplay = document.getElementById('threat-level-display');
const rollResultsDisplay = document.getElementById('roll-results-display');
const btnAddDie = document.getElementById('btn-add-die');
const btnRollPool = document.getElementById('btn-roll-pool');

const btnAddEvent = document.getElementById('btn-add-event');
const eventTitleInput = document.getElementById('event-title-input');
const eventDateInput = document.getElementById('event-date-input');
const eventTimeInput = document.getElementById('event-time-input');
const eventsList = document.getElementById('events-list');

const btnAddClue = document.getElementById('btn-add-clue');
const newClueInput = document.getElementById('new-clue');
const cluesList = document.getElementById('clues-list');

const logForm = document.getElementById('log-form');
const logHistory = document.getElementById('log-history');

let tensionDicePool = 0;

// --- 1. CLOUD SAVE & LOAD FUNCTIONS ---

/**
 * Sends active campaign state to Google Sheets via POST
 */
async function saveData() {
  const campaignData = {
    startDate: startDateInput.value,
    currentDate: currentDateInput.value,
    tensionDicePool: tensionDicePool,
    checklist: Array.from(document.querySelectorAll('#scene-checklist input[type="checkbox"]')).map(cb => cb.checked),
    clues: Array.from(cluesList.children).map(li => ({
      text: li.querySelector('span').textContent,
      status: li.querySelector('button').textContent,
      className: li.querySelector('button').className
    })),
    events: Array.from(eventsList.children).map(li => ({
      text: li.querySelector('span').textContent,
      status: li.querySelector('.status-tag').textContent
    })),
    logs: Array.from(logHistory.children).map(div => div.innerHTML)
  };

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(campaignData)
    });
    console.log("Campaign data saved to Google Sheets.");
  } catch (err) {
    console.error("Failed to save data:", err);
  }
}

/**
 * Fetches saved campaign state from Google Sheets via GET
 */
async function loadData() {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL);
    const data = await response.json();

    if (!data || Object.keys(data).length === 0) return;

    if (data.startDate) startDateInput.value = data.startDate;
    if (data.currentDate) currentDateInput.value = data.currentDate;
    if (data.tensionDicePool !== undefined) {
      tensionDicePool = data.tensionDicePool;
      dicePoolCountDisplay.textContent = tensionDicePool;
    }

    // Restore Checkboxes
    if (data.checklist) {
      const checkboxes = document.querySelectorAll('#scene-checklist input[type="checkbox"]');
      data.checklist.forEach((checked, i) => {
        if (checkboxes[i]) checkboxes[i].checked = checked;
      });
    }

    // Restore Clues
    if (data.clues && data.clues.length > 0) {
      cluesList.innerHTML = '';
      data.clues.forEach(clue => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span>${clue.text}</span>
          <button class="${clue.className}" onclick="toggleClueStatus(this)">${clue.status}</button>
        `;
        cluesList.appendChild(li);
      });
    }

    // Restore Events
    if (data.events && data.events.length > 0) {
      eventsList.innerHTML = '';
      data.events.forEach(evt => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span>${evt.text}</span>
          <span class="status-tag unrevealed">${evt.status}</span>
        `;
        eventsList.appendChild(li);
      });
    }

    // Restore Logs
    if (data.logs && data.logs.length > 0) {
      logHistory.innerHTML = '';
      data.logs.forEach(htmlContent => {
        const div = document.createElement('div');
        div.className = 'stats-box';
        div.style.marginBottom = '10px';
        div.innerHTML = htmlContent;
        logHistory.appendChild(div);
      });
    }

    updateCalendarStats();
  } catch (err) {
    console.error("Failed to load data:", err);
  }
}

// --- 2. CALENDAR & MOON PHASE MATH ---

function updateCalendarStats() {
  const startDate = new Date(startDateInput.value);
  const currentDate = new Date(currentDateInput.value);

  const diffTime = currentDate - startDate;
  const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  daysElapsedDisplay.textContent = isNaN(daysElapsed) ? 0 : daysElapsed;

  if (!isNaN(currentDate.getTime())) {
    moonPhaseDisplay.textContent = calculateMoonPhase(currentDate);
  }

  saveData();
}

function calculateMoonPhase(date) {
  const refDate = new Date('2026-01-01');
  const daysDiff = (date - refDate) / (1000 * 60 * 60 * 24);
  const synodicCycle = 29.53058867;
  
  const phasePosition = ((daysDiff % synodicCycle) + synodicCycle) % synodicCycle;
  const normalizedPosition = phasePosition / synodicCycle;

  if (normalizedPosition < 0.03 || normalizedPosition > 0.97) return "New Moon 🌑";
  if (normalizedPosition < 0.22) return "Waxing Crescent 🌒";
  if (normalizedPosition < 0.28) return "First Quarter 🌓";
  if (normalizedPosition < 0.47) return "Waxing Gibbous 🌔";
  if (normalizedPosition < 0.53) return "Full Moon 🌕";
  if (normalizedPosition < 0.72) return "Waning Gibbous 🌖";
  if (normalizedPosition < 0.78) return "Last Quarter 🌗";
  return "Waning Crescent 🌘";
}

// --- 3. TENSION POOL MECHANICS ---

btnAddDie.addEventListener('click', () => {
  if (tensionDicePool < 6) {
    tensionDicePool++;
    dicePoolCountDisplay.textContent = tensionDicePool;
    saveData();
  } else {
    alert("Tension pool is full! (Maximum 6d6)");
  }
});

btnRollPool.addEventListener('click', () => {
  if (tensionDicePool === 0) {
    alert("Add at least 1 action die before rolling!");
    return;
  }

  let rolls = [];
  let totalSum = 0;
  let onesRolled = 0;

  for (let i = 0; i < tensionDicePool; i++) {
    const roll = Math.floor(Math.random() * 6) + 1;
    rolls.push(roll);
    totalSum += roll;
    if (roll === 1) onesRolled++;
  }

  let threatText = "Calm";
  if (onesRolled > 0) {
    threatText = `🚨 Hazard Triggered! (${onesRolled} ones rolled)`;
  } else if (totalSum >= 20) {
    threatText = "Serious Escalation";
  } else if (totalSum >= 15) {
    threatText = "Active Complication";
  } else if (totalSum >= 10) {
    threatText = "Minor Complication";
  } else if (totalSum >= 5) {
    threatText = "Omen / Warning";
  }

  threatLevelDisplay.textContent = threatText;
  rollResultsDisplay.textContent = `[ ${rolls.join(', ')} ] (Sum: ${totalSum})`;

  tensionDicePool = 0;
  dicePoolCountDisplay.textContent = 0;
  saveData();
});

// --- 4. SCHEDULED EVENTS & CLUES ---

btnAddEvent.addEventListener('click', () => {
  const title = eventTitleInput.value.trim();
  const date = eventDateInput.value;
  const time = eventTimeInput.value;

  if (!title || !date || !time) return;

  const li = document.createElement('li');
  li.innerHTML = `
    <span>${title} — ${date} at ${time}</span>
    <span class="status-tag unrevealed">Scheduled</span>
  `;
  eventsList.appendChild(li);

  eventTitleInput.value = '';
  saveData();
});

btnAddClue.addEventListener('click', () => {
  const clueText = newClueInput.value.trim();
  if (!clueText) return;

  const li = document.createElement('li');
  li.innerHTML = `
    <span>${clueText}</span>
    <button class="status-tag unrevealed" onclick="toggleClueStatus(this)">Hidden</button>
  `;
  cluesList.appendChild(li);

  newClueInput.value = '';
  saveData();
});

function toggleClueStatus(btnElement) {
  if (btnElement.classList.contains('unrevealed')) {
    btnElement.classList.remove('unrevealed');
    btnElement.classList.add('revealed');
    btnElement.textContent = 'Revealed';
  } else {
    btnElement.classList.remove('revealed');
    btnElement.classList.add('unrevealed');
    btnElement.textContent = 'Hidden';
  }
  saveData();
}

// --- 5. LOGGING & EVENT LISTENERS ---

logForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const sessionNum = document.getElementById('log-session-num').value;
  const location = document.getElementById('log-location').value;
  const summary = document.getElementById('log-summary').value;

  if (!summary) return;

  const logEntry = document.createElement('div');
  logEntry.className = 'stats-box';
  logEntry.style.marginBottom = '10px';
  logEntry.innerHTML = `
    <p><strong>Session #${sessionNum}</strong> (${currentDateInput.value})</p>
    <p><strong>Location:</strong> ${location || 'N/A'}</p>
    <p><strong>Summary:</strong> ${summary}</p>
  `;

  logHistory.prepend(logEntry);
  document.getElementById('log-summary').value = '';
  saveData();
});

document.querySelectorAll('#scene-checklist input[type="checkbox"]').forEach(cb => {
  cb.addEventListener('change', saveData);
});

startDateInput.addEventListener('change', updateCalendarStats);
currentDateInput.addEventListener('change', updateCalendarStats);

/* ==========================================================================
   NPC PROFILES & ATTACHED SECRETS ENGINE
   ========================================================================== */

// NPC Preset Database
const NPC_DATABASE = {
  "Alberto Knox": {
    role: "Displaced Sage / Horizon Walker (LN)",
    goal: "Track planar breaches and stabilize timeline anomalies.",
    emotionalState: "Hesitant, burdened by epistemic strain and doubt."
  },
  "Sophia": {
    role: "Celestial Archivist of Deneir (LN)",
    goal: "Preserve cosmic order and guide mortals through forbidden texts.",
    emotionalState: "Calm, resonant, formal, compassionate."
  },
  "Mr. X / Aurivex Veyne": {
    role: "The Counselor / Master Builder (Bound Entity)",
    goal: "Manage the House of Endless Odds while concealing his true identity.",
    emotionalState: "Polished, misdirecting, secretive."
  },
  "Kaelen": {
    role: "Steward of Thalara / Cleric (LN)",
    goal: "Uncover traitors in the Order.",
    emotionalState: "Reserved, emotionally burdened."
  },
  "Glasstaff": {
    role: "Secret Leader of Redbrands (NE)",
    goal: "Secure Wave Echo Cave for the Black Spider.",
    emotionalState: "Arrogant, cautious, opportunistic."
  },
  "Sildar Hallwinter": {
    role: "Lords' Alliance Agent / Fighter (LG)",
    goal: "Restore order in Phandalin and find Iarno Albrek.",
    emotionalState: "Frustrated with town leadership, loyal."
  },
  "Gundren Rockseeker": {
    role: "Dwarf Quest Initiator / Prospector",
    goal: "Reopen Wave Echo Cave forge.",
    emotionalState: "Captured / In peril."
  },
  "General World Clue": {
    role: "Campaign Lore / Environment",
    goal: "General world secrets not tied to a single NPC.",
    emotionalState: "N/A"
  }
};

// Data Store for Clues
let campaignClues = [
  {
    id: 1,
    text: "Mirror reflections are faintly distorted when he speaks.",
    npc: "Alberto Knox",
    pointsToward: "Epistemic Strain & Metaphysical Unraveling",
    status: "Hidden"
  },
  {
    id: 2,
    text: "Carries a sealed letter bearing the Black Spider's wax stamp.",
    npc: "Glasstaff",
    pointsToward: "Treason & Redbrand leadership",
    status: "Hidden"
  }
];

// DOM References
const btnAddClue = document.getElementById('btn-add-clue');
const newClueInput = document.getElementById('new-clue');
const clueNpcSelect = document.getElementById('clue-npc-select');
const cluePointsTowardInput = document.getElementById('clue-points-toward');
const cluesList = document.getElementById('clues-list');

const npcInspectorSelect = document.getElementById('npc-inspector-select');
const npcProfileDisplay = document.getElementById('npc-profile-display');
const npcAttachedCluesList = document.getElementById('npc-attached-clues');

/**
 * Adds a new clue attached to a specific NPC
 */
btnAddClue.addEventListener('click', () => {
  const text = newClueInput.value.trim();
  const npc = clueNpcSelect.value;
  const pointsToward = cluePointsTowardInput.value.trim() || 'General Information';

  if (!text) {
    alert("Please enter secret/clue text!");
    return;
  }

  const newClue = {
    id: Date.now(),
    text: text,
    npc: npc,
    pointsToward: pointsToward,
    status: "Hidden"
  };

  campaignClues.push(newClue);

  // Clear inputs
  newClueInput.value = '';
  cluePointsTowardInput.value = '';

  renderClues();
  updateNPCProfileInspector();
  saveData();
});

/**
 * Renders the master list of all campaign clues
 */
function renderClues() {
  cluesList.innerHTML = '';

  campaignClues.forEach((clue, index) => {
    const li = document.createElement('li');
    li.style.flexDirection = 'column';
    li.style.alignItems = 'flex-start';
    li.style.gap = '4px';

    const statusClass = clue.status === 'Revealed' ? 'revealed' : 'unrevealed';

    li.innerHTML = `
      <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
        <strong>[${clue.npc}]</strong>
        <button class="status-tag ${statusClass}" onclick="toggleClueStatusById(${clue.id})">${clue.status}</button>
      </div>
      <div>${clue.text}</div>
      <div style="font-size:0.75rem; color:#aaa;">Points toward: <em>${clue.pointsToward}</em></div>
    `;

    cluesList.appendChild(li);
  });
}

/**
 * Toggles a clue status between Hidden and Revealed by ID
 */
function toggleClueStatusById(clueId) {
  const clue = campaignClues.find(c => c.id === clueId);
  if (clue) {
    clue.status = clue.status === 'Hidden' ? 'Revealed' : 'Hidden';
    renderClues();
    updateNPCProfileInspector();
    saveData();
  }
}

/**
 * Updates the NPC Inspector view with selected NPC data and their attached clues
 */
function updateNPCProfileInspector() {
  const selectedNPC = npcInspectorSelect.value;
  const npcData = NPC_DATABASE[selectedNPC] || {
    role: "Unknown Role",
    goal: "No goal recorded.",
    emotionalState: "Neutral"
  };

  // Render NPC Profile Card
  npcProfileDisplay.innerHTML = `
    <p><strong>Role & Alignment:</strong> ${npcData.role}</p>
    <p><strong>Goal:</strong> ${npcData.goal}</p>
    <p><strong>Emotional State:</strong> ${npcData.emotionalState}</p>
  `;

  // Render Attached Clues for this NPC
  npcAttachedCluesList.innerHTML = '';
  const attached = campaignClues.filter(c => c.npc === selectedNPC);

  if (attached.length === 0) {
    npcAttachedCluesList.innerHTML = '<li style="color:#888;">No clues attached to this NPC yet.</li>';
    return;
  }

  attached.forEach(clue => {
    const li = document.createElement('li');
    const statusClass = clue.status === 'Revealed' ? 'revealed' : 'unrevealed';
    li.innerHTML = `
      <div>
        <div>${clue.text}</div>
        <div style="font-size:0.75rem; color:#aaa;">Points toward: ${clue.pointsToward}</div>
      </div>
      <span class="status-tag ${statusClass}">${clue.status}</span>
    `;
    npcAttachedCluesList.appendChild(li);
  });
}

// Attach listener to NPC selector dropdown
npcInspectorSelect.addEventListener('change', updateNPCProfileInspector);

// Initial Render
renderClues();
updateNPCProfileInspector();

// --- INITIALIZATION ---
loadData();
