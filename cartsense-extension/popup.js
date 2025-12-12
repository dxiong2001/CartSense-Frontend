document.getElementById("scan").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.sendMessage(tab.id, { action: "scanIngredients" }, (response) => {
    if (!response) {
      document.getElementById("results").innerHTML = "No response from page.";
      return;
    }

    const resultsDiv = document.getElementById("results");

    resultsDiv.innerHTML = `
      <h3>Detected Ingredients:</h3>
      <ul>
        ${response.ingredients
          .map(
            (i) =>
              `<li><b>${i.cleaned}</b> <span style="color:#888;">(${i.raw})</span></li>`
          )
          .join("")}
      </ul>
    `;
  });
});
