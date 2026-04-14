const dataUrl = "data/establishments.json";

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchFeedback = document.getElementById("search-feedback");
const searchResults = document.getElementById("search-results");
const datalist = document.getElementById("establishment-list");
const autocompleteList = document.getElementById("autocomplete-list");
const compareForm = document.getElementById("compare-form");
const compareFirst = document.getElementById("compare-first");
const compareSecond = document.getElementById("compare-second");
const compareFeedback = document.getElementById("compare-feedback");

const { normalizeText, getSearchTerms, getSearchableText, deduplicateEstablishments } = window.UniPortalDataUtils;

let establishments = [];
let suggestions = [];
let activeSuggestionIndex = -1;

const clearFeedback = () => {
  searchFeedback.textContent = "";
  compareFeedback.textContent = "";
};

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const makeHighlightText = (text, query) => {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return escapeHtml(text);
  }

  const tokens = normalizedQuery.split(" ").filter(Boolean);
  let highlighted = escapeHtml(text);
  tokens.forEach((token) => {
    if (!token) {
      return;
    }
    const pattern = new RegExp(`(${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
    highlighted = highlighted.replace(pattern, "<mark>$1</mark>");
  });
  return highlighted;
};

const getMatchScore = (item, query) => {
  const searchableText = getSearchableText(item);
  if (!searchableText) {
    return 0;
  }
  if (searchableText === query) {
    return 100;
  }

  let score = 0;
  const name = normalizeText(item.name);
  if (name.startsWith(query)) score += 80;
  if (name.includes(query)) score += 55;

  const terms = getSearchTerms(item).map((term) => normalizeText(term));
  terms.forEach((term) => {
    if (term === query) score += 45;
    if (term.startsWith(query)) score += 25;
    if (term.includes(query)) score += 10;
  });

  query
    .split(" ")
    .filter(Boolean)
    .forEach((token) => {
      if (searchableText.includes(token)) {
        score += 8;
      }
    });

  return score;
};

const isQueryMatch = (item, query) => {
  const searchableText = getSearchableText(item);
  if (searchableText.includes(query)) {
    return true;
  }
  return query
    .split(" ")
    .filter(Boolean)
    .every((token) => searchableText.includes(token));
};

const closeAutocomplete = () => {
  suggestions = [];
  activeSuggestionIndex = -1;
  autocompleteList.hidden = true;
  autocompleteList.innerHTML = "";
  searchInput.setAttribute("aria-expanded", "false");
};

const applySuggestion = (item) => {
  searchInput.value = item.name;
  closeAutocomplete();
};

const renderAutocomplete = (query) => {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    closeAutocomplete();
    return;
  }

  suggestions = establishments
    .map((item) => ({ item, score: getMatchScore(item, normalizedQuery) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
    .slice(0, 8)
    .map(({ item }) => item);

  if (!suggestions.length) {
    closeAutocomplete();
    return;
  }

  autocompleteList.hidden = false;
  searchInput.setAttribute("aria-expanded", "true");
  autocompleteList.innerHTML = suggestions
    .map(
      (item, index) => `
      <li role="option" id="autocomplete-option-${index}" aria-selected="false">
        <button type="button" data-index="${index}">
          <span class="suggestion-name">${makeHighlightText(item.name, normalizedQuery)}</span>
          <span class="suggestion-meta">${item.type} • ${item.city}</span>
        </button>
      </li>
    `
    )
    .join("");
};

const refreshSuggestionSelection = () => {
  const options = autocompleteList.querySelectorAll("li");
  options.forEach((option, index) => {
    const selected = index === activeSuggestionIndex;
    option.setAttribute("aria-selected", String(selected));
    option.classList.toggle("active", selected);
  });

  if (activeSuggestionIndex >= 0) {
    searchInput.setAttribute("aria-activedescendant", `autocomplete-option-${activeSuggestionIndex}`);
  } else {
    searchInput.removeAttribute("aria-activedescendant");
  }
};

const renderResults = (items) => {
  searchResults.innerHTML = "";
  if (!items.length) {
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("a");
    card.className = "result-card";
    card.href = `institution.html?id=${encodeURIComponent(item.id)}`;

    const title = document.createElement("h3");
    title.textContent = item.name;
    const meta = document.createElement("p");
    meta.textContent = `${item.type} • ${item.city}`;

    card.append(title, meta);
    searchResults.appendChild(card);
  });
};

const navigateToInstitution = (id) => {
  window.location.href = `institution.html?id=${encodeURIComponent(id)}`;
};

const handleSearch = (event) => {
  event.preventDefault();
  const query = normalizeText(searchInput.value);
  searchResults.innerHTML = "";

  if (!query) {
    searchFeedback.textContent = "Please enter the name of an establishment.";
    return;
  }

  const matches = establishments.filter((item) => isQueryMatch(item, query));
  const exactMatch = matches.find((item) => getSearchTerms(item).some((term) => normalizeText(term) === query));
  if (exactMatch) {
    navigateToInstitution(exactMatch.id);
    return;
  }
  if (matches.length === 1) {
    navigateToInstitution(matches[0].id);
    return;
  }
  if (!matches.length) {
    searchFeedback.textContent = "No matches found. Please try another university or superior school.";
    return;
  }

  searchFeedback.textContent = `${matches.length} matches found.`;
  renderResults(matches);
};

const populateSearchDataList = (data) => {
  datalist.innerHTML = "";
  const options = new Set();
  data.forEach((item) => {
    options.add(item.name);
    (item.aliases || []).forEach((alias) => options.add(alias));
  });
  Array.from(options)
    .sort((a, b) => a.localeCompare(b))
    .forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      datalist.appendChild(option);
    });
};

const populateCompareSelects = (data) => {
  const optionsHtml = data
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => `<option value="${item.id}">${item.name} (${item.city})</option>`)
    .join("");
  compareFirst.insertAdjacentHTML("beforeend", optionsHtml);
  compareSecond.insertAdjacentHTML("beforeend", optionsHtml);
};

fetch(dataUrl)
  .then((response) => response.json())
  .then((data) => {
    establishments = deduplicateEstablishments(data);
    populateSearchDataList(establishments);
    populateCompareSelects(establishments);
  })
  .catch(() => {
    searchFeedback.textContent = "Unable to load the establishment database right now.";
  });

searchInput.addEventListener("input", (event) => {
  clearFeedback();
  activeSuggestionIndex = -1;
  renderAutocomplete(event.target.value);
  refreshSuggestionSelection();
});

searchInput.addEventListener("keydown", (event) => {
  if (autocompleteList.hidden || !suggestions.length) {
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    activeSuggestionIndex = (activeSuggestionIndex + 1) % suggestions.length;
    refreshSuggestionSelection();
    return;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    activeSuggestionIndex = (activeSuggestionIndex - 1 + suggestions.length) % suggestions.length;
    refreshSuggestionSelection();
    return;
  }
  if (event.key === "Enter" && activeSuggestionIndex >= 0) {
    event.preventDefault();
    applySuggestion(suggestions[activeSuggestionIndex]);
  }
  if (event.key === "Escape") {
    closeAutocomplete();
  }
});

autocompleteList.addEventListener("click", (event) => {
  const targetButton = event.target.closest("button[data-index]");
  if (!targetButton) {
    return;
  }
  const index = Number(targetButton.getAttribute("data-index"));
  if (Number.isNaN(index) || !suggestions[index]) {
    return;
  }
  applySuggestion(suggestions[index]);
  searchInput.focus();
});

document.addEventListener("click", (event) => {
  const clickedInside = event.target.closest("#autocomplete");
  if (!clickedInside) {
    closeAutocomplete();
  }
});

searchForm.addEventListener("submit", handleSearch);

compareForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const first = compareFirst.value;
  const second = compareSecond.value;
  compareFeedback.textContent = "";

  if (!first || !second) {
    compareFeedback.textContent = "Please choose two institutions.";
    return;
  }
  if (first === second) {
    compareFeedback.textContent = "Please choose two different institutions.";
    return;
  }
  window.location.href = `compare.html?a=${encodeURIComponent(first)}&b=${encodeURIComponent(second)}`;
});
