// =================================================================
// MASTER CAMPAIGN & SESSION LOG ENGINE
// =================================================================

let masterCampaignLogs = [
  {
    timestamp: "2026-10-04",
    text: "Campaign Command Center initialized.",
    isAlert: false
  }
];

const masterSessionLogDisplay = getEl('master-session-log');
const customLogInput = getEl('custom-log-input');
const btnAddCustomLog = getEl('btn-add-custom-log');
const btnCopyLog = getEl('btn-copy-log');
const btnClearLog = getEl('btn-clear-log');

// Centralized Automatic Logger Function
function addCampaignLog(text, isAlert = false) {
  const currentDate = getEl('campaign-current') ? getEl('campaign-current').value : '2026-10-04';
  
  const newEntry = {
    timestamp: currentDate,
    text: text,
    isAlert: isAlert
  };

  masterCampaignLogs.push(newEntry);
  renderMasterCampaignLog();
}

function renderMasterCampaignLog() {
  if (!masterSessionLogDisplay) return;

  masterSessionLogDisplay.innerHTML = '';

  if (masterCampaignLogs.length === 0) {
    masterSessionLogDisplay.innerHTML = '<div style="color:#888;">No campaign log entries yet.</div>';
    return;
  }

  masterCampaignLogs.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.style.borderBottom = '1px dotted #222';
    div.style.paddingBottom = '4px';
    div.style.lineHeight = '1.3';

    if (entry.isAlert) {
      div.style.color = '#e57373';
      div.style.fontWeight = 'bold';
    }

    div.innerHTML = `<span style="color:#f1c40f; font-weight:bold;">[${entry.timestamp}]</span> ${entry.text}`;
    masterSessionLogDisplay.appendChild(div);
  });

  // Auto-scroll to the newest entry at the bottom
  masterSessionLogDisplay.scrollTop = masterSessionLogDisplay.scrollHeight;
}

// Manual Note Entry Handler
if (btnAddCustomLog) {
  btnAddCustomLog.addEventListener('click', () => {
    const text = customLogInput ? customLogInput.value.trim() : '';
    if (!text) return;

    addCampaignLog(`✍️ ${text}`);
    if (customLogInput) customLogInput.value = '';
  });
}

// Copy Log to Clipboard
if (btnCopyLog) {
  btnCopyLog.addEventListener('click', () => {
    if (!masterSessionLogDisplay) return;
    const logText = masterCampaignLogs.map(e => `[${e.timestamp}] ${e.text}`).join('\n');
    navigator.clipboard.writeText(logText);
    alert("Campaign log copied to clipboard!");
  });
}

// Clear Log History
if (btnClearLog) {
  btnClearLog.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear the session log history?")) {
      masterCampaignLogs = [];
      renderMasterCampaignLog();
    }
  });
}

// =================================================================
// CAMPAIGN COMMAND CENTER — MASTER APPLICATION ENGINE (app.js)
// =================================================================

// Safe DOM Selector Utility (Prevents runtime crashes if any element is absent)
function getEl(id) {
  return document.getElementById(id);
}

// -----------------------------------------------------------------
// 1. TIME, CALENDAR & MOON ENGINE
// -----------------------------------------------------------------
const campaignStart = getEl('campaign-start');
const campaignCurrent = getEl('campaign-current');
const daysElapsedDisplay = getEl('days-elapsed-display');

function updateCalendarStats() {
  if (!campaignStart || !campaignCurrent || !daysElapsedDisplay) return;
  const start = new Date(campaignStart.value);
  const current = new Date(campaignCurrent.value);
  const diffTime = current - start;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  daysElapsedDisplay.textContent = diffDays >= 0 ? diffDays : 0;
}

if (campaignStart) campaignStart.addEventListener('change', updateCalendarStats);
if (campaignCurrent) campaignCurrent.addEventListener('change', updateCalendarStats);


// -----------------------------------------------------------------
// 2. TENSION POOL & HAZARD COUNTER
// -----------------------------------------------------------------
let tensionPool = 0;
const dicePoolCount = getEl('dice-pool-count');
const threatLevelDisplay = getEl('threat-level-display');
const rollResultsDisplay = getEl('roll-results-display');
const btnAddDie = getEl('btn-add-die');
const btnRollPool = getEl('btn-roll-pool');

function updateTensionDisplay() {
  if (dicePoolCount) dicePoolCount.textContent = tensionPool;
  if (threatLevelDisplay) {
    if (tensionPool === 0) threatLevelDisplay.textContent = "Calm";
    else if (tensionPool < 3) threatLevelDisplay.textContent = "Uneasy";
    else if (tensionPool < 5) threatLevelDisplay.textContent = "High Risk";
    else threatLevelDisplay.textContent = "CRITICAL THREAT";
  }
}

if (btnAddDie) {
  btnAddDie.addEventListener('click', () => {
    tensionPool++;
    updateTensionDisplay();
    addCampaignLog(`🎲 Added Action Die (+1d6). Current Tension Pool: ${tensionPool}d6`);
  });
}

if (btnRollPool) {
  btnRollPool.addEventListener('click', () => {
    if (tensionPool === 0) {
      alert("Tension pool is empty! Add a die first.");
      return;
    }
    let rolls = [];
    let hazardCount = 0;
    for (let i = 0; i < tensionPool; i++) {
      let roll = Math.floor(Math.random() * 6) + 1;
      rolls.push(roll);
      if (roll === 1) hazardCount++;
    }
    
    const resultMsg = `Rolls: [${rolls.join(', ')}] -> ${hazardCount > 0 ? `🚨 ${hazardCount} HAZARD(S) TRIGGERED!` : 'Clear!'}`;
    if (rollResultsDisplay) {
      rollResultsDisplay.textContent = resultMsg;
    }

    addCampaignLog(`🚨 Rolled Tension Pool (${rolls.length}d6) -> Result: ${hazardCount > 0 ? `${hazardCount} Hazard(s) Triggered!` : 'Clear!'} [${rolls.join(', ')}]`, hazardCount > 0);

    tensionPool = 0;
    updateTensionDisplay();
  });
}


// -----------------------------------------------------------------
// 3. SCHEDULED CALENDAR EVENTS
// -----------------------------------------------------------------
let scheduledEvents = [];
const btnAddEvent = getEl('btn-add-event');
const eventTitleInput = getEl('event-title-input');
const eventDateInput = getEl('event-date-input');
const eventTimeInput = getEl('event-time-input');
const eventsList = getEl('events-list');

if (btnAddEvent) {
  btnAddEvent.addEventListener('click', () => {
    const title = eventTitleInput ? eventTitleInput.value.trim() : '';
    const date = eventDateInput ? eventDateInput.value : '';
    const time = eventTimeInput ? eventTimeInput.value : '';

    if (!title) {
      alert("Please enter an event name!");
      return;
    }

    const newEvt = { id: Date.now(), title, date, time };
    scheduledEvents.push(newEvt);

    if (eventTitleInput) eventTitleInput.value = '';

    addCampaignLog(`⏰ Scheduled Calendar Event: "${title}" for ${date} at ${time}`);
    renderScheduledEvents();
  });
}

function renderScheduledEvents() {
  if (!eventsList) return;
  eventsList.innerHTML = '';
  if (scheduledEvents.length === 0) {
    eventsList.innerHTML = '<li style="color:#888;">No upcoming scheduled events.</li>';
    return;
  }
  scheduledEvents.forEach(evt => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${evt.title}</strong> — ${evt.date} at ${evt.time}`;
    eventsList.appendChild(li);
  });
}


// -----------------------------------------------------------------
// 4. NPC DATABASE, ATTACHED CLUES & REVEALED LOG
// -----------------------------------------------------------------
const NPC_DATABASE = {
  "Alberto Knox": {
    role: "Horizon Walker Ranger",
    goal: "Seal planar rifts destabilizing the region.",
    emotionalState: "Guarded, Observant"
  },
  "Sophia": {
    role: "Archivist of Deneir",
    goal: "Recover forgotten lore from the Old Vaults.",
    emotionalState: "Scholarly, Anxious"
  },
  "Mr. X / Aurivex Veyne": {
    role: "Secret House Builder / Patron",
    goal: "Complete the cosmic blueprint before the eclipse.",
    emotionalState: "Enigmatic, Calculating"
  },
  "Kaelen": {
    role: "Steward of Thalara",
    goal: "Maintain political neutrality amidst rising tension.",
    emotionalState: "Weary, Formal"
  },
  "The Whispering Archivist": {
    role: "Entity of the Deep Record",
    goal: "Collect untold secrets and unwritten debts.",
    emotionalState: "Unsettling, Calm"
  },
  "Glasstaff": {
    role: "Former Alliance Wizard / Redbrand Leader",
    goal: "Consolidate power in Phandalin for the Black Spider.",
    emotionalState: "Arrogant, Paranoid"
  }
};

let campaignClues = [
  {
    id: 1,
    text: "Mirror reflections are faintly distorted when he speaks.",
    npc: "Alberto Knox",
    pointsToward: "Epistemic Strain & Metaphysical Unraveling",
    status: "Hidden",
    sessionDelivered: 1
  },
  {
    id: 2,
    text: "Ledger entries mention 'Master Aurivex' beneath the Vault.",
    npc: "Mr. X / Aurivex Veyne",
    pointsToward: "True Identity as the House Builder",
    status: "Hidden",
    sessionDelivered: 1
  },
  {
    id: 3,
    text: "Carries a sealed letter bearing the Black Spider's wax stamp.",
    npc: "Glasstaff",
    pointsToward: "Traitor & Redbrand leadership",
    status: "Hidden",
    sessionDelivered: 2
  }
];

const btnAddClue = getEl('btn-add-clue');
const newClueInput = getEl('new-clue');
const clueNpcSelect = getEl('clue-npc-select');
const cluePointsTowardInput = getEl('clue-points-toward');
const clueSessionNumInput = getEl('clue-session-num');

const npcInspectorSelect = getEl('npc-inspector-select');
const npcProfileDisplay = getEl('npc-profile-display');
const npcAttachedCluesList = getEl('npc-attached-clues');
const revealedCluesLog = getEl('revealed-clues-log');

if (btnAddClue) {
  btnAddClue.addEventListener('click', () => {
    const text = newClueInput ? newClueInput.value.trim() : '';
    const npc = clueNpcSelect ? clueNpcSelect.value : 'General World Clue';
    const pointsToward = (cluePointsTowardInput && cluePointsTowardInput.value.trim()) 
      ? cluePointsTowardInput.value.trim() 
      : 'General Information';
    const sessionDelivered = clueSessionNumInput ? parseInt(clueSessionNumInput.value) || 1 : 1;

    if (!text) {
      alert("Please enter secret/clue text!");
      return;
    }

    const newClue = {
      id: Date.now(),
      text: text,
      npc: npc,
      pointsToward: pointsToward,
      status: "Hidden",
      sessionDelivered: sessionDelivered
    };

    campaignClues.push(newClue);

    if (newClueInput) newClueInput.value = '';
    if (cluePointsTowardInput) cluePointsTowardInput.value = '';

    addCampaignLog(`🔍 New Secret Attached to [${npc}]: "${text}" (Delivered: Session ${sessionDelivered}, Points toward: ${pointsToward})`);

    updateNPCProfileInspector();
    renderRevealedCluesLog();
  });
}

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
    li.style.flexDirection = 'column';
    li.style.alignItems = 'flex-start';
    li.style.gap = '4px';

    const statusClass = clue.status === 'Revealed' ? 'revealed' : 'unrevealed';

    li.innerHTML = `
      <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
        <span style="font-size:0.75rem; color:#aaa;">Delivered: Session ${clue.sessionDelivered}</span>
        <button class="status-tag ${statusClass}" onclick="toggleClueStatusById(${clue.id})">${clue.status}</button>
      </div>
      <div style="font-weight:600; color:#fff;">${clue.text}</div>
      <div style="font-size:0.75rem; color:#f1c40f;">Points toward: <em>${clue.pointsToward}</em></div>
    `;
    npcAttachedCluesList.appendChild(li);
  });
}

window.toggleClueStatusById = function(clueId) {
  const clue = campaignClues.find(c => c.id === clueId);
  if (clue) {
    clue.status = clue.status === 'Hidden' ? 'Revealed' : 'Hidden';
    
    if (clue.status === 'Revealed') {
      addCampaignLog(`📜 SECRET REVEALED [${clue.npc}]: "${clue.text}" (Session ${clue.sessionDelivered}, Points toward: ${clue.pointsToward})`, true);
    } else {
      addCampaignLog(`🙈 Secret toggled back to Hidden [${clue.npc}]: "${clue.text}"`);
    }

    updateNPCProfileInspector();
    renderRevealedCluesLog();
  }
};

function renderRevealedCluesLog() {
  if (!revealedCluesLog) return;
  revealedCluesLog.innerHTML = '';

  const revealedList = campaignClues.filter(c => c.status === 'Revealed');

  if (revealedList.length === 0) {
    revealedCluesLog.innerHTML = '<li style="color:#888;">No clues revealed yet. Mark clues as "Revealed" in the NPC Inspector to add them here.</li>';
    return;
  }

  revealedList.forEach(clue => {
    const li = document.createElement('li');
    li.style.flexDirection = 'column';
    li.style.alignItems = 'flex-start';
    li.style.gap = '4px';
    li.style.borderLeft = '3px solid #27ae60';

    li.innerHTML = `
      <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
        <strong style="color:#f1c40f;">[${clue.npc}]</strong>
        <span class="status-tag revealed">Session ${clue.sessionDelivered}</span>
      </div>
      <div>${clue.text}</div>
      <div style="font-size:0.75rem; color:#aaa;">Points toward: <em>${clue.pointsToward}</em></div>
    `;
    revealedCluesLog.appendChild(li);
  });
}

if (npcInspectorSelect) {
  npcInspectorSelect.addEventListener('change', updateNPCProfileInspector);
}


// -----------------------------------------------------------------
// 5. MASTER CAMPAIGN & SESSION LOG ENGINE
// -----------------------------------------------------------------
let masterCampaignLogs = [
  {
    timestamp: "2026-10-04",
    text: "Campaign Command Center initialized.",
    isAlert: false
  }
];

const masterSessionLogDisplay = getEl('master-session-log');
const customLogInput = getEl('custom-log-input');
const btnAddCustomLog = getEl('btn-add-custom-log');
const btnCopyLog = getEl('btn-copy-log');
const btnClearLog = getEl('btn-clear-log');

function addCampaignLog(text, isAlert = false) {
  const currentDate = campaignCurrent ? campaignCurrent.value : '2026-10-04';
  
  const newEntry = {
    timestamp: currentDate,
    text: text,
    isAlert: isAlert
  };

  masterCampaignLogs.push(newEntry);
  renderMasterCampaignLog();
}

function renderMasterCampaignLog() {
  if (!masterSessionLogDisplay) return;

  masterSessionLogDisplay.innerHTML = '';

  if (masterCampaignLogs.length === 0) {
    masterSessionLogDisplay.innerHTML = '<div style="color:#888;">No campaign log entries yet.</div>';
    return;
  }

  masterCampaignLogs.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.style.borderBottom = '1px dotted #222';
    div.style.paddingBottom = '4px';
    div.style.lineHeight = '1.3';

    if (entry.isAlert) {
      div.style.color = '#e57373';
      div.style.fontWeight = 'bold';
    }

    div.innerHTML = `<span style="color:#f1c40f; font-weight:bold;">[${entry.timestamp}]</span> ${entry.text}`;
    masterSessionLogDisplay.appendChild(div);
  });

  masterSessionLogDisplay.scrollTop = masterSessionLogDisplay.scrollHeight;
}

if (btnAddCustomLog) {
  btnAddCustomLog.addEventListener('click', () => {
    const text = customLogInput ? customLogInput.value.trim() : '';
    if (!text) return;

    addCampaignLog(`✍️ ${text}`);
    if (customLogInput) customLogInput.value = '';
  });
}

if (btnCopyLog) {
  btnCopyLog.addEventListener('click', () => {
    if (!masterSessionLogDisplay) return;
    const logText = masterCampaignLogs.map(e => `[${e.timestamp}] ${e.text}`).join('\n');
    navigator.clipboard.writeText(logText);
    alert("Campaign log copied to clipboard!");
  });
}

if (btnClearLog) {
  btnClearLog.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear the session log history?")) {
      masterCampaignLogs = [];
      renderMasterCampaignLog();
    }
  });
}

// 1. Log when Tension Pool Action Die is added or rolled
if (btnAddDie) {
  btnAddDie.addEventListener('click', () => {
    tensionPool++;
    updateTensionDisplay();
    addCampaignLog(`🎲 Added Action Die (+1d6). Current Tension Pool: ${tensionPool}d6`);
  });
}

if (btnRollPool) {
  btnRollPool.addEventListener('click', () => {
    // ... roll calculation ...
    addCampaignLog(`🚨 Rolled Tension Pool (${rolls.length}d6) -> Result: ${hazardCount > 0 ? `${hazardCount} Hazard(s) Triggered!` : 'Clear!'} [${rolls.join(', ')}]`, hazardCount > 0);
  });
}

// 2. Log when a Calendar Event is scheduled
if (btnAddEvent) {
  btnAddEvent.addEventListener('click', () => {
    // ... event creation ...
    addCampaignLog(`⏰ Scheduled Calendar Event: "${title}" for ${date} at ${time}`);
  });
}

// 3. Log when a Secret is attached or toggled to Revealed
if (btnAddClue) {
  btnAddClue.addEventListener('click', () => {
    // ... clue creation ...
    addCampaignLog(`🔍 New Secret Attached to [${npc}]: "${text}" (Session ${sessionDelivered}, Points toward: ${pointsToward})`);
  });
}

window.toggleClueStatusById = function(clueId) {
  const clue = campaignClues.find(c => c.id === clueId);
  if (clue) {
    clue.status = clue.status === 'Hidden' ? 'Revealed' : 'Hidden';
    
    if (clue.status === 'Revealed') {
      addCampaignLog(`📜 SECRET REVEALED [${clue.npc}]: "${clue.text}" (Delivered Session ${clue.sessionDelivered})`, true);
    } else {
      addCampaignLog(`🙈 Secret hidden again [${clue.npc}]: "${clue.text}"`);
    }

    updateNPCProfileInspector();
    renderRevealedCluesLog();
  }
};

// -----------------------------------------------------------------
// INITIALIZATION ON PAGE LOAD
// -----------------------------------------------------------------
updateCalendarStats();
updateTensionDisplay();
renderScheduledEvents();
updateNPCProfileInspector();
renderRevealedCluesLog();
renderMasterCampaignLog();
