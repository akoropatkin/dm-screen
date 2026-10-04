/* ==========================================================================
   CAMPAIGN COMMAND CENTER - ROBUST JAVASCRIPT ENGINE
   ========================================================================== */

// --- 1. NPC LORE DATABASE ---
const NPC_DATABASE = {
  "Alberto Knox": {
    role: "Displaced Sage / Horizon Walker (LN)",
    goal: "Track planar breaches and resolve timeline anomalies.",
    emotionalState: "Hesitant, burdened by epistemic strain and doubt."
  },
  "Sophia": {
    role: "Celestial Archivist of Deneir (LN)",
    goal: "Guards written realities, dangerous glyphs, and living texts.",
    emotionalState: "Calm, resonant, formal, compassionate."
  },
  "Mr. X / Aurivex Veyne": {
    role: "The Counselor / Master Builder (Archwizard)",
    goal: "Manages the House of Endless Odds while concealing his true identity.",
    emotionalState: "Polished, dry wit, suppressed anguish."
  },
  "Kaelen": {
    role: "Steward of Thalara / Cleric (LN)",
    goal: "Uncover traitor in the Order.",
    emotionalState: "Reserved, emotionally burdened."
  },
  "The Whispering Archivist": {
    role: "Recurring Guide / Memory Preserver (INFJ)",
    goal: "Preserve memories of past selves across timelines.",
    emotionalState: "Bound by oath, serene yet vulnerable."
  },
  "Glasstaff": {
    role: "Secret Leader of Redbrands (NE)",
    goal: "Secure Wave Echo Cave for the Black Spider.",
    emotionalState: "Arrogant, cautious, opportunistic."
  },
  "General World Clue": {
    role: "Campaign Lore / Environment",
    goal: "General world secrets not tied to a single NPC.",
    emotionalState: "N/A"
  }
};

// Seed Campaign Clues
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
    text: "Ledger entries mention 'Master Aurivex' beneath the Vault.",
    npc: "Mr. X / Aurivex Veyne",
    pointsToward: "True Identity as the House Builder",
    status: "Hidden"
  },
  {
    id: 3,
    text: "Carries a sealed letter bearing the Black Spider's wax stamp.",
    npc: "Glasstaff",
    pointsToward: "Treason & Redbrand leadership",
    status: "Hidden"
  }
];

// --- 2. SAFE DOM GETTER ---
function getEl(id) {
  return document.getElementById(id);
}

// DOM References
const startDateInput = getEl('campaign-start');
const currentDateInput = getEl('campaign-current');
const daysElapsedDisplay = getEl('days-elapsed-display');
const moonPhaseDisplay = getEl('moon-phase-display');

const dicePoolCountDisplay = getEl('dice-pool-count');
const threatLevelDisplay = getEl('threat-level-display');
const rollResultsDisplay = getEl('roll-results-display');
const btnAddDie = getEl('btn-add-die');
const btnRollPool = getEl('btn-roll-pool');

const btnAddEvent = getEl('btn-add-event');
const eventTitleInput = getEl('event-title-input');
const eventDateInput = getEl('event-date-input');
const eventTimeInput = getEl('event-time-input');
const eventsList = getEl('events-list');

const btnAddClue = getEl('btn-add-clue');
const newClueInput = getEl('new-clue');
const clueNpcSelect = getEl('clue-npc-select');
const cluePointsTowardInput = getEl('clue-points-toward');
const cluesList = getEl('clues-list');

const npcInspectorSelect = getEl('npc-inspector-select');
const npcProfileDisplay = getEl('npc-profile-display');
const npcAttachedCluesList = getEl('npc-attached-clues');

const logForm = getEl('log-form');
const logHistory = getEl('log-history');

let tensionDicePool = 0;

// --- 3. CALENDAR & MOON PHASE MATH ---
function updateCalendarStats() {
  if (!startDateInput || !currentDateInput) return;
  
  const startDate = new Date(startDateInput.value);
  const currentDate = new Date(currentDateInput.value);

  const diffTime = currentDate - startDate;
  const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (daysElapsedDisplay) {
    daysElapsedDisplay.textContent = isNaN(daysElapsed) ? 0 : daysElapsed;
  }

  if (moonPhaseDisplay && !isNaN(currentDate.getTime())) {
    moonPhaseDisplay.textContent = calculateMoonPhase(currentDate);
  }
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

if (startDateInput) startDateInput.addEventListener('change', updateCalendarStats);
if (currentDateInput) currentDateInput.addEventListener('change', updateCalendarStats);

// --- 4. TENSION POOL MECHANICS ---
if (btnAddDie) {
  btnAddDie.addEventListener('click', () => {
    if (tensionDicePool < 6) {
      tensionDicePool++;
      if (dicePoolCountDisplay) dicePoolCountDisplay.textContent = tensionDicePool;
    } else {
      alert("Tension pool is full! (Maximum 6d6)");
    }
  });
}

if (btnRollPool) {
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

    if (threatLevelDisplay) threatLevelDisplay.textContent = threatText;
    if (rollResultsDisplay) rollResultsDisplay.textContent = `[ ${rolls.join(', ')} ] (Sum: ${totalSum})`;

    tensionDicePool = 0;
    if (dicePoolCountDisplay) dicePoolCountDisplay.textContent = 0;
  });
}

// --- 5. SCHEDULED EVENTS ---
if (btnAddEvent) {
  btnAddEvent.addEventListener('click', () => {
    const title = eventTitleInput ? eventTitleInput.value.trim() : '';
    const date = eventDateInput ? eventDateInput.value : '';
    const time = eventTimeInput ? eventTimeInput.value : '';

    if (!title || !date || !time) {
      alert("Please enter event name, date, and time!");
      return;
    }

    if (eventsList) {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${title} — ${date} at ${time}</span>
        <span class="status-tag unrevealed">Scheduled</span>
      `;
      eventsList.appendChild(li);
    }

    if (eventTitleInput) eventTitleInput.value = '';
  });
}

// --- 6. CLUES & NPC INSPECTOR ---
if (btnAddClue) {
  btnAddClue.addEventListener('click', () => {
    const text = newClueInput ? newClueInput.value.trim() : '';
    const npc = clueNpcSelect ? clueNpcSelect.value : 'General World Clue';
    const pointsToward = (cluePointsTowardInput && cluePointsTowardInput.value.trim()) ? cluePointsTowardInput.value.trim() : 'General Information';

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

    if (newClueInput) newClueInput.value = '';
    if (cluePointsTowardInput) cluePointsTowardInput.value = '';

    renderClues();
    updateNPCProfileInspector();
  });
}

function renderClues() {
  if (!cluesList) return;
  cluesList.innerHTML = '';

  campaignClues.forEach((clue) => {
    const li = document.createElement('li');
    li.style.flexDirection = 'column';
    li.style.alignItems = 'flex-start';
    li.style.gap = '4px';

    const statusClass = clue.status === 'Revealed' ? 'revealed' : 'unrevealed';

    li.innerHTML = `
      <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
        <strong style="color:#f1c40f;">[${clue.npc}]</strong>
        <button class="status-tag ${statusClass}" onclick="toggleClueStatusById(${clue.id})">${clue.status}</button>
      </div>
      <div>${clue.text}</div>
      <div style="font-size:0.75rem; color:#aaa;">Points toward: <em>${clue.pointsToward}</em></div>
    `;

    cluesList.appendChild(li);
  });
}

window.toggleClueStatusById = function(clueId) {
  const clue = campaignClues.find(c => c.id === clueId);
  if (clue) {
    clue.status = clue.status === 'Hidden' ? 'Revealed' : 'Hidden';
    renderClues();
    updateNPCProfileInspector();
  }
};

function updateNPCProfileInspector() {
  if (!npcInspectorSelect || !npcProfileDisplay || !npcAttachedCluesList) return;

  const selectedNPC = npcInspectorSelect.value;
  const npcData = NPC_DATABASE[selectedNPC] || {
    role: "Unknown Role",
    goal: "No goal recorded.",
    emotionalState: "Neutral"
  };

  npcProfileDisplay.innerHTML = `
    <p><strong>Role & Alignment:</strong> ${npcData.role}</p>
    <p><strong>Goal:</strong> ${npcData.goal}</p>
    <p><strong>Emotional State:</strong> ${npcData.emotionalState}</p>
  `;

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

if (npcInspectorSelect) {
  npcInspectorSelect.addEventListener('change', updateNPCProfileInspector);
}

// --- 7. SESSION LOG FORM ---
if (logForm) {
  logForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const sessionNum = getEl('log-session-num') ? getEl('log-session-num').value : 1;
    const location = getEl('log-location') ? getEl('log-location').value : '';
    const summary = getEl('log-summary') ? getEl('log-summary').value : '';

    if (!summary) {
      alert("Please enter a summary!");
      return;
    }

    if (logHistory) {
      const logEntry = document.createElement('div');
      logEntry.className = 'stats-box';
      logEntry.style.marginBottom = '10px';
      logEntry.innerHTML = `
        <p><strong>Session #${sessionNum}</strong> (${currentDateInput ? currentDateInput.value : ''})</p>
        <p><strong>Location:</strong> ${location || 'N/A'}</p>
        <p><strong>Summary:</strong> ${summary}</p>
      `;

      logHistory.prepend(logEntry);
    }

    if (getEl('log-summary')) getEl('log-summary').value = '';
  });
}

// --- INITIALIZE DISPLAY ON LOAD ---
updateCalendarStats();
renderClues();
updateNPCProfileInspector();
