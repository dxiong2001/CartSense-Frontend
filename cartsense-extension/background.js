chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg.action === "AUTO_LOOKUP") {
    console.log("Auto lookup triggered:", msg.ingredients);

    try {
      const res = await fetch("http://localhost:3001/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: msg.ingredients }),
      });

      const data = await res.json();
      console.log("Results:", data);

      // Send results back to content script so it can update UI later
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "SHOW_RESULTS",
        results: data.results,
      });

      sendResponse({ success: true });
    } catch (err) {
      sendResponse({ success: false, error: err.toString() });
    }

    return true; // async response
  }
});
