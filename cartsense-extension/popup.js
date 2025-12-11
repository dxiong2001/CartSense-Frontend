document.getElementById("scan").addEventListener("click", async () => {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "<p>Scanning page…</p>";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // ---------- 1. GET INGREDIENTS FROM PAGE ----------
  let ingredientsResponse;
  try {
    ingredientsResponse = await chrome.tabs.sendMessage(tab.id, {
      action: "GET_INGREDIENTS",
    });
  } catch (e) {
    resultsDiv.innerHTML =
      "<p style='color:red;'>Content script not found on this page.</p>";
    return;
  }

  if (!ingredientsResponse || !ingredientsResponse.ingredients) {
    resultsDiv.innerHTML =
      "<p style='color:red;'>Could not extract ingredients on this page.</p>";
    return;
  }

  const cleanedIngredients = ingredientsResponse.ingredients;

  if (!cleanedIngredients.length) {
    resultsDiv.innerHTML = "<p>No ingredients found on this page.</p>";
    return;
  }

  // ---------- 1a. Display the cleaned ingredients for testing ----------
  resultsDiv.innerHTML =
    "<p><strong>Cleaned ingredients:</strong></p><ul>" +
    cleanedIngredients.map((i) => `<li>${i}</li>`).join("") +
    "</ul><p><em>Fetching prices…</em></p>";

  // ---------- 2. QUERY BACKEND ----------
  let pricesResponse;
  try {
    pricesResponse = await chrome.runtime.sendMessage({
      action: "LOOKUP_PRICES",
      ingredients: cleanedIngredients,
    });
  } catch (err) {
    resultsDiv.innerHTML =
      "<p style='color:red;'>Backend request failed.</p><pre>" + err + "</pre>";
    return;
  }

  if (!pricesResponse || !pricesResponse.success) {
    resultsDiv.innerHTML =
      "<p style='color:red;'>Error:</p><pre>" +
      (pricesResponse ? pricesResponse.error : "No response") +
      "</pre>";
    return;
  }

  const items = pricesResponse.data.results;

  // ---------- 3. SHOW RESULTS ----------
  resultsDiv.innerHTML +=
    "<h3>Prices:</h3><ul>" +
    items
      .map(
        (item) =>
          `<li><strong>${item.name}</strong><br/>$${item.price} — ${item.store}</li>`
      )
      .join("") +
    "</ul>";
});
