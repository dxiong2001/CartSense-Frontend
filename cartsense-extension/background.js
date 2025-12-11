chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg.action === "LOOKUP_PRICES") {
    try {
      const res = await fetch("http://localhost:3001/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: msg.ingredients }),
      });

      const data = await res.json();
      sendResponse({ success: true, data });
    } catch (err) {
      sendResponse({ success: false, error: err.toString() });
    }
    return true;
  }
});
