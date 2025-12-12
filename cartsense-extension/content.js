// ===============================
// STOP WORDS (your original list)
// ===============================
const STOP_WORDS = new Set([
  "cup",
  "cups",
  "tbsp",
  "tablespoon",
  "tablespoons",
  "tsp",
  "teaspoon",
  "teaspoons",
  "oz",
  "ounce",
  "ounces",
  "lb",
  "lbs",
  "pound",
  "pounds",
  "g",
  "gram",
  "grams",
  "kg",
  "kilogram",
  "kilograms",
  "ml",
  "milliliter",
  "milliliters",
  "l",
  "liter",
  "liters",
  "diced",
  "fresh",
  "freshly",
  "optional",
  "to",
  "taste",
  "clove",
  "cloves",
  "slice",
  "slices",
  "package",
  "packages",
  "can",
  "cans",
  "bag",
  "bags",
]);

// ===============================
// CLEANING FUNCTION (unchanged)
// ===============================
function cleanIngredient(str) {
  if (!str) return "";
  let s = str.toLowerCase();
  s = s.replace(/[^a-z\s]/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  const words = s.split(" ").filter((w) => !STOP_WORDS.has(w));
  return words.join(" ");
}

// ========================================
// HIGHLIGHTING — now compatible with toggle
// ========================================
let currentlyHighlightedNodes = [];

function highlightIngredientNodes(nodes) {
  removeHighlights(); // clear any old

  nodes.forEach((node) => {
    node.style.outline = "2px solid #ffe9916b";
    node.style.background = "rgba(250,204,21,0.18)";

    node.style.padding = "2px 2px";
    currentlyHighlightedNodes.push(node);
  });
}

function removeHighlights() {
  currentlyHighlightedNodes.forEach((node) => {
    node.style.outline = "";
    node.style.background = "";
    node.style.borderRadius = "";
    node.style.padding = "";
  });
  currentlyHighlightedNodes = [];
}

// ===================================================
// INGREDIENT EXTRACTION — your full logic preserved
// ===================================================
function extractIngredients() {
  let nodesToHighlight = [];

  // ---- 1) JSON-LD ----
  const jsonLdIngredients = (() => {
    const scripts = [
      ...document.querySelectorAll('script[type="application/ld+json"]'),
    ];
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        const graph = Array.isArray(data["@graph"]) ? data["@graph"] : [data];
        for (const node of graph) {
          if (
            node["@type"] === "Recipe" &&
            Array.isArray(node.recipeIngredient)
          ) {
            return node.recipeIngredient;
          }
        }
      } catch {}
    }
    return null;
  })();

  if (jsonLdIngredients?.length) {
    return [...new Set(jsonLdIngredients.map(cleanIngredient))];
  }

  // ---- 2) UL ingredient LIs ----
  const uls = [...document.querySelectorAll("ul")].filter((ul) =>
    ul.querySelector("li[class*='ingredient' i]")
  );

  const items = [];
  for (const ul of uls) {
    const lis = [...ul.querySelectorAll("li")];
    nodesToHighlight.push(...lis);
    for (const li of lis) items.push(cleanIngredient(li.innerText.trim()));
  }

  if (items.length > 0) {
    return { items: [...new Set(items)], nodes: nodesToHighlight };
  }

  // ---- 3) CSS fallback ----
  const selectors = [
    "[class*=ingredient]",
    "[class*=Ingredients]",
    ".ingredient",
    ".ingredients",
    "li[data-ingredient]",
    "li[class*=Ingredient]",
  ];

  let nodes = [];
  for (const sel of selectors) nodes.push(...document.querySelectorAll(sel));
  nodesToHighlight.push(...nodes);

  const ingredients = nodes
    .map((n) => cleanIngredient(n.innerText))
    .filter(Boolean);

  return {
    items: [...new Set(ingredients)],
    nodes: nodesToHighlight,
  };
}

// =====================================================
// FLOATING BUTTON + EXPANDING MENU (NEW FEATURE)
// =====================================================

let csButton = null;
let csMenu = null;
let highlightsEnabled = false;

const Z_TOP = 2147483647; // max z-index

function createCartSenseButton() {
  if (csButton) return; // already exists

  // Floating bubble
  csButton = document.createElement("div");
  csButton.id = "cartsense-floating";
  csButton.innerHTML = `
  <img id="cartsense-logo" src="${chrome.runtime.getURL(
    "icons/cartsense.png"
  )}" 
  style="
    width: 70px;
    height: 70px;
    object-fit: contain;
    pointer-events: none;
  ">
`;

  csButton.style = `
    position: fixed;
    bottom: 22px;
    right: 22px;
    width: 56px;
    height: 56px;
    background: #1c1a1aff;
    color: white;
    border-radius: 50%;
    font-size: 26px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    z-index: ${Z_TOP};
    transition: 0.2s;
  `;

  document.body.appendChild(csButton);

  // Expanded hover menu
  csMenu = document.createElement("div");
  csMenu.style = `
    position: fixed;
    bottom: 90px;
    right: 22px;
    display: none;
    flex-direction: column;
    gap: 8px;
    z-index: ${Z_TOP};
  `;

  // Disable button
  const disableBtn = document.createElement("button");
  disableBtn.innerText = "✖ Disable Highlights";
  disableBtn.style = `
    padding: 8px 12px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  `;

  disableBtn.onclick = () => {
    removeHighlights();
    highlightsEnabled = false;
  };

  csMenu.appendChild(disableBtn);
  document.body.appendChild(csMenu);

  // Hover → expand menu
  csButton.addEventListener("mouseenter", () => {
    csMenu.style.display = "flex";
  });
  csButton.addEventListener("mouseleave", () => {
    csMenu.style.display = "none";
  });
  csMenu.addEventListener("mouseenter", () => {
    csMenu.style.display = "flex";
  });
  csMenu.addEventListener("mouseleave", () => {
    csMenu.style.display = "none";
  });

  // Toggle highlights
  csButton.onclick = () => {
    const { items, nodes } = extractIngredients();
    console.log(nodes);
    if (!highlightsEnabled) {
      highlightIngredientNodes(nodes);
    } else {
      removeHighlights();
    }
    highlightsEnabled = !highlightsEnabled;
  };
}

// =====================================================
// AUTO-SHOW BUTTON ONLY IF INGREDIENTS FOUND
// =====================================================
function initCartSense() {
  const extracted = extractIngredients();

  // You originally displayed the button regardless — now we show only if found.
  if (Array.isArray(extracted.items) && extracted.items.length > 0) {
    createCartSenseButton();
  }
}

initCartSense();

// =====================================================
// POPUP MESSAGE LISTENER — KEEPING YOUR ORIGINAL FEATURE
// =====================================================
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "GET_INGREDIENTS") {
    const extracted = extractIngredients();
    sendResponse({ ingredients: extracted.items });
  }

  if (msg.action === "activateHighlightingManually") {
    createCartSenseButton();
    const { nodes } = extractIngredients();
    highlightIngredientNodes(nodes);
    highlightsEnabled = true;
  }
});
