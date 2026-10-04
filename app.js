// REPLACE THIS WITH YOUR DEPLOYED GOOGLE APPS SCRIPT WEB APP URL
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID_HERE/exec";

/**
 * Saves active campaign state to Google Sheets via Apps Script Web App
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
      mode: "no-cors", // Allows cross-origin posting to Google Scripts
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(campaignData)
    });
    console.log("Campaign state saved to Google Sheets successfully.");
  } catch (err) {
    console.error("Failed to save data to Google Cloud:", err);
  }
}

/**
 * Loads saved campaign state from Google Sheets on application startup
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
    console.error("Failed to load data from Google Cloud:", err);
  }
}
