let saveTimeout = null;

function createRuleElement(rule) {
  const ruleDiv = document.createElement('div');
  ruleDiv.className = 'rule';
  ruleDiv.innerHTML = `
    <input type="text" class="sourceUrl" placeholder="Source URL" value="${rule.sourceUrl || ''}">
    <input type="number" class="maxVisits" placeholder="Max Visits" value="${rule.maxVisits || ''}">
    <input type="number" class="timeFrame" placeholder="Time Frame (hours)" value="${rule.timeFrame || ''}">
    <input type="text" class="redirectUrl" placeholder="Redirect URL" value="${rule.redirectUrl || ''}">
    <button class="deleteRule">Delete</button>
  `;
  return ruleDiv;
}

function saveRules() {
  const rules = Array.from(document.querySelectorAll('.rule'))
    .map((ruleElement, index) => ({
      id: index,
      sourceUrl: ruleElement.querySelector('.sourceUrl').value,
      maxVisits: ruleElement.querySelector('.maxVisits').value,
      timeFrame: ruleElement.querySelector('.timeFrame').value,
      redirectUrl: ruleElement.querySelector('.redirectUrl').value
    }));

  chrome.storage.sync.set({ rules }, () => {
    console.log('Rules saved:', rules);
  });
}

function debouncedSaveRules() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(saveRules, 300);
}

document.addEventListener('DOMContentLoaded', () => {
  const rulesContainer = document.getElementById('rules');
  const addRuleButton = document.getElementById('addRule');

  chrome.storage.sync.get('rules', (data) => {
    if (data.rules && data.rules.length > 0) {
      data.rules.forEach(rule => {
        rulesContainer.appendChild(createRuleElement(rule));
      });
    } else {
      rulesContainer.appendChild(createRuleElement({}));
    }
  });

  addRuleButton.addEventListener('click', () => {
    rulesContainer.appendChild(createRuleElement({}));
    debouncedSaveRules();
  });

  rulesContainer.addEventListener('input', debouncedSaveRules);

  rulesContainer.addEventListener('click', (e) => {
    if (e.target.className === 'deleteRule') {
      e.target.closest('.rule').remove();
      debouncedSaveRules();
    }
  });
});
