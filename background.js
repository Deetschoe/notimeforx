let lastWrite = 0;
const WRITE_INTERVAL = 1000; // Minimum time between writes (1 second)

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ rules: [] });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.storage.sync.get('rules', (data) => {
      const matchingRule = data.rules.find(rule => 
        rule.sourceUrl && tab.url.includes(rule.sourceUrl)
      );
      if (matchingRule && isRuleComplete(matchingRule)) {
        console.log('Matching rule found:', matchingRule);
        const key = `visits_${matchingRule.id}`;
        chrome.storage.sync.get(key, (visitData) => {
          let visits = (visitData[key] || []).filter(time => time > Date.now() - matchingRule.timeFrame * 3600000);
          visits.push(Date.now());
          
          if (Date.now() - lastWrite >= WRITE_INTERVAL) {
            chrome.storage.sync.set({ [key]: visits }, () => {
              lastWrite = Date.now();
              console.log('Visits updated:', visits);
            });
          }
          
          if (visits.length > matchingRule.maxVisits) {
            console.log('Redirecting to:', matchingRule.redirectUrl);
            chrome.tabs.update(tabId, { url: matchingRule.redirectUrl });
          }
        });
      }
    });
  }
});

function isRuleComplete(rule) {
  return rule.sourceUrl && rule.maxVisits && rule.timeFrame && rule.redirectUrl;
}

// Add this function to help with debugging
chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${JSON.stringify(oldValue)}", new value is "${JSON.stringify(newValue)}".`
    );
  }
});
