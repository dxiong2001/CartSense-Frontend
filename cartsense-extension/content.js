// List of words to remove (units, descriptors, etc.)
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
  "minced",
  "diced",
  "chopped",
  "grated",
  "sliced",
  "softened",
  "melted",
  "fresh",
  "freshly",
  "ground",
  "crushed",
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
]);

// function cleanIngredient(str) {
//   if (!str) return "";

//   // Lowercase
//   let s = str.toLowerCase();

//   // Keep only letters and spaces
//   s = s.replace(/[^a-z\s]/g, " ");

//   // Collapse multiple spaces
//   s = s.replace(/\s+/g, " ").trim();

//   // Remove stop words
//   const words = s.split(" ").filter((word) => !STOP_WORDS.has(word));

//   return words.join(" ");
// }

function cleanIngredient(str) {
  if (!str) return "";

  // Lowercase
  let s = str.toLowerCase();

  // Keep only letters and spaces
  s = s.replace(/[^a-z\s]/g, " ");

  // Collapse multiple spaces
  s = s.replace(/\s+/g, " ").trim();

  return s;
}

// -------- Extract ingredients --------
function extractIngredients() {
  // -------- 1. Try JSON-LD first (most reliable) --------
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
            node.recipeIngredient &&
            Array.isArray(node.recipeIngredient)
          ) {
            return node.recipeIngredient;
          }
        }
      } catch (e) {
        // ignore parse errors
      }
    }
    return null;
  })();

  if (jsonLdIngredients && jsonLdIngredients.length > 0) {
    return [...new Set(jsonLdIngredients.map(cleanIngredient))];
  }

  // -------- 2. Fall back to CSS selectors --------
  const selectors = [
    "[class*=ingredient]",
    "[class*=Ingredients]",
    ".ingredient",
    ".ingredients",
    "li[data-ingredient]",
    "li[class*=Ingredient]",
  ];

  let ingredientNodes = [];
  for (const sel of selectors) {
    ingredientNodes.push(...document.querySelectorAll(sel));
  }

  const ingredients = ingredientNodes
    .map((n) => cleanIngredient(n.innerText))
    .filter(Boolean);

  return [...new Set(ingredients)];
}

// -------- Chrome message listener --------
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "GET_INGREDIENTS") {
    const ingredients = extractIngredients();
    sendResponse({ ingredients });
  }
});
