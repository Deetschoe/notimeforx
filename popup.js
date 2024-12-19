let saveTimeout = null;

function cleanUrl(url) {
  if (!url) return '';
  // Remove protocol (http://, https://)
  return url.replace(/^(https?:)?\/\//i, '');
}

function createRuleElement(rule) {
  const ruleDiv = document.createElement('div');
  ruleDiv.className = 'rule';
  const isEnabled = rule.enabled !== false;
  const isExpanded = rule.expanded !== false;
  
  const cleanSourceUrl = cleanUrl(rule.sourceUrl);
  const cleanRedirectUrl = cleanUrl(rule.redirectUrl);
  
  ruleDiv.innerHTML = `
    <div class="rule-header">
      <div class="rule-summary ${isExpanded ? '' : 'expanded'} ${!isEnabled ? 'disabled' : ''}">
        <span class="rule-title">
          ${rule.sourceUrl ? `${cleanSourceUrl}${cleanRedirectUrl ? ` -> ${cleanRedirectUrl}` : ''}` : 'New Rule'}
        </span>
        <span class="toggle-rule">
          ${isEnabled ? 'active' : 'sleep'}
        </span>
      </div>
    </div>
    <div class="rule-content ${isExpanded ? '' : 'collapsed'}">
      <input type="text" class="sourceUrl" placeholder="Source URL" value="${rule.sourceUrl || ''}">
      <input type="number" class="maxVisits" placeholder="Max Visits" value="${rule.maxVisits || ''}">
      <input type="number" class="timeFrame" placeholder="Time Frame (hours)" value="${rule.timeFrame || ''}">
      <input type="text" class="redirectUrl" placeholder="Redirect URL" value="${rule.redirectUrl || ''}">
      <button class="deleteRule">Delete</button>
    </div>
  `;
  return ruleDiv;
}


function saveRules() {
  const rules = Array.from(document.querySelectorAll('.rule'))
    .map((ruleElement) => {
      const summary = ruleElement.querySelector('.rule-summary');
      const content = ruleElement.querySelector('.rule-content');
      
      // Check if the summary has the disabled class
      const isDisabled = summary.classList.contains('disabled');
      
      return {
        sourceUrl: ruleElement.querySelector('.sourceUrl').value,
        maxVisits: ruleElement.querySelector('.maxVisits').value,
        timeFrame: ruleElement.querySelector('.timeFrame').value,
        redirectUrl: ruleElement.querySelector('.redirectUrl').value,
        enabled: !isDisabled, // This is key - enabled is the opposite of disabled
        expanded: !content.classList.contains('collapsed')
      };
    });


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
  rulesContainer.addEventListener('click', (e) => {
    const ruleDiv = e.target.closest('.rule');
      
    // Handle toggle rule state
    if (e.target.classList.contains('toggle-rule')) {
      const summary = ruleDiv.querySelector('.rule-summary');
      const toggleButton = e.target;
      
      // Toggle disabled state on the summary
      summary.classList.toggle('disabled');
      
      // Update button text based on summary state
      toggleButton.textContent = summary.classList.contains('disabled') ? 'sleep' : 'active';
      
      // Force a repaint for immediate visual feedback
      summary.style.opacity = summary.style.opacity;
      
      // Save the new state
      debouncedSaveRules();
      e.stopPropagation();
    }
  
  
    // Handle rule expansion (clicking anywhere on summary except toggle)
    if (e.target.closest('.rule-summary') && !e.target.classList.contains('toggle-rule')) {
      const content = ruleDiv.querySelector('.rule-content');
      const summary = ruleDiv.querySelector('.rule-summary');
      content.classList.toggle('collapsed');
      summary.classList.toggle('expanded');
      debouncedSaveRules();
    }
  
    // Handle delete
    if (e.target.className === 'deleteRule') {
      ruleDiv.remove();
      debouncedSaveRules();
    }
  });
  
  rulesContainer.addEventListener('input', (e) => {
    const ruleDiv = e.target.closest('.rule');
    const summary = ruleDiv.querySelector('.rule-title');
    const sourceUrl = ruleDiv.querySelector('.sourceUrl').value;
    const redirectUrl = ruleDiv.querySelector('.redirectUrl').value;
    
    summary.textContent = sourceUrl ? 
      `${cleanUrl(sourceUrl)}${redirectUrl ? ` -> ${cleanUrl(redirectUrl)}` : ''}` : 
      'New Rule';
    
    debouncedSaveRules();
  });
  

  addRuleButton.addEventListener('click', () => {
    rulesContainer.appendChild(createRuleElement({}));
  });
});