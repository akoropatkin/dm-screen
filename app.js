/* ==========================================================================
   CAMPAIGN COMMAND CENTER - JAVASCRIPT LOGIC ENGINE
   Handles date calculations, moon phase math, tension pool dice rolls,
   scheduled calendar event tracking, clues management, and session logs.
   ========================================================================== */

// --- 1. CALENDAR, DAYS ELAPSED & MOON PHASE ENGINE ---
const startDateInput = document.getElementById('campaign-start');
const currentDateInput = document.getElementById('campaign-current');
const daysElapsedDisplay = document.getElementById('days-elapsed-display');
const moonPhaseDisplay = document.getElementById('moon-phase-display');

/**
 * Calculates days elapsed between start date and current campaign date,
 * and updates the estimated moon phase.
 */
function updateCalendarStats() {
  const startDate = new Date(startDateInput.value);
  const currentDate = new Date(currentDateInput.value);

  // Math: Calculate difference in milliseconds, then convert to full days
  const diffTime = currentDate - startDate;
  const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  daysElapsedDisplay.textContent = isNaN(daysElapsed) ? 0 : daysElapsed;

  // Calculate Lunar Phase based on Current Campaign Date
  if (!isNaN(currentDate.getTime())) {
    const phaseName = calculateMoonPhase(currentDate);
    moonPhaseDisplay.textContent = phaseName;
  }
}

/**
 * Calculates the approximate lunar phase using a standard 29.53-day synodic lunar cycle.
 */
function calculateMoonPhase(date) {
  // Known reference epoch date (Known New Moon)
  const refDate = new Date('2026-01-01');
  const daysDiff = (date - refDate) / (1000 * 60 * 60 * 24);
  const synodicCycle = 29.53058867; // Average synodic month length
  
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

// Attach event listeners to date inputs
startDateInput.addEventListener('change', updateCalendarStats);
currentDateInput.addEventListener('change', updateCalendarStats);

// --- 2. TENSION POOL & HAZARD ROLLER ---
let tensionDicePool = 0;

const dicePoolCountDisplay = document.getElementById('dice-pool-count');
const threatLevelDisplay = document.getElementById('threat-level-display');
const rollResultsDisplay = document.getElementById('roll-results-display');
const btnAddDie = document.getElementById('btn-add-die');
const btnRollPool = document.getElementById('btn-roll-pool');

// Add a die to the pool (Max 6d6)
btnAddDie.addEventListener('click', () => {
  if (tensionDicePool < 6) {
    tensionDicePool++;
    dicePoolCountDisplay.textContent = tensionDicePool;
  } else {
    alert("Tension pool is full! (Maximum 6d6)");
  }
});

// Roll all accumulated dice in the pool
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

  // Determine threat severity based on total sum and ones rolled
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

  // Reset dice pool after roll
  tensionDicePool = 0;
  dicePoolCountDisplay.textContent = 0;
});

// --- 3. SCHEDULED CALENDAR EVENTS ---
const btnAddEvent = document.getElementById('btn-add-event');
const eventTitleInput = document.getElementById('event-title-input');
const eventDateInput = document.getElementById('event-date-input');
const eventTimeInput = document.getElementById('event-time-input');
const eventsList = document.getElementById('events-list');

btnAddEvent.addEventListener('click', () => {
  const title = eventTitleInput.value.trim();
  const date = eventDateInput.value;
  const time = eventTimeInput.value;

  if (!title || !date || !time) {
    alert("Please enter event name, date, and time!");
    return;
  }

  const li = document.createElement('li');
  li.innerHTML = `
    <span>${title} — ${date} at ${time}</span>
    <span class="status-tag unrevealed">Scheduled</span>
  `;
  eventsList.appendChild(li);

  // Clear title input field
  eventTitleInput.value = '';
});

// --- 4. SECRETS & CLUES TRACKER ---
const btnAddClue = document.getElementById('btn-add-clue');
const newClueInput = document.getElementById('new-clue');
const cluesList = document.getElementById('clues-list');

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
});

/**
 * Toggles a clue status between Hidden and Revealed
 */
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
}

// --- 5. SESSION LOG FORM ---
const logForm = document.getElementById('log-form');
const logHistory = document.getElementById('log-history');

logForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const sessionNum = document.getElementById('log-session-num').value;
  const location = document.getElementById('log-location').value;
  const summary = document.getElementById('log-summary').value;

  if (!summary) {
    alert("Please enter a summary of main events!");
    return;
  }

  const logEntry = document.createElement('div');
  logEntry.className = 'stats-box';
  logEntry.style.marginBottom = '10px';
  logEntry.innerHTML = `
    <p><strong>Session #${sessionNum}</strong> (${currentDateInput.value})</p>
    <p><strong>Location:</strong> ${location || 'N/A'}</p>
    <p><strong>Summary:</strong> ${summary}</p>
  `;

  logHistory.prepend(logEntry);

  // Reset text summary input
  document.getElementById('log-summary').value = '';
});

// --- INITIALIZE DISPLAY ON LOAD ---
updateCalendarStats();
