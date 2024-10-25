let lastWrite = 0;
const WRITE_INTERVAL = 1000;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ rules: [] });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.storage.sync.get('rules', (data) => {
      const matchingRule = data.rules.find(rule => {
        // Check if rule matches URL AND is enabled
        const matchesUrl = rule.sourceUrl && tab.url.includes(rule.sourceUrl);
        const isEnabled = rule.enabled === true; // Explicitly check for true
        return matchesUrl && isEnabled;
      });
      
      if (matchingRule && isRuleComplete(matchingRule)) {
        console.log('Matching active rule found:', matchingRule);
        const key = `visits_${matchingRule.id}`;
        chrome.storage.sync.get(key, (visitData) => {
          let visits = (visitData[key] || []).filter(time => 
            time > Date.now() - matchingRule.timeFrame * 3600000
          );
          visits.push(Date.now());
          
          if (Date.now() - lastWrite >= WRITE_INTERVAL) {
            chrome.storage.sync.set({ [key]: visits }, () => {
              lastWrite = Date.now();
              console.log('Visits updated:', visits, 'Rule enabled:', matchingRule.enabled);
            });
          }
          
          if (visits.length > matchingRule.maxVisits) {
            console.log('Redirecting to:', matchingRule.redirectUrl, 'Rule enabled:', matchingRule.enabled);
            chrome.tabs.update(tabId, { url: matchingRule.redirectUrl });
          }
        });
      }
    });
  }
});

function isRuleComplete(rule) {
  return rule.sourceUrl && 
         rule.maxVisits && 
         rule.timeFrame && 
         rule.redirectUrl &&
         rule.enabled === true;  // Also check enabled state here
}

// Add logging for debugging
chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${JSON.stringify(oldValue)}", new value is "${JSON.stringify(newValue)}".`
    );
  }
});