const dataUrl = "data/establishments.json";

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchFeedback = document.getElementById("search-feedback");
const searchResults = document.getElementById("search-results");
const datalist = document.getElementById("establishment-list");

let establishments = [];

const normalizeText = (value) =>
  (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getSearchTerms = (item) => [
  item.name,
  item.city,
  item.type,
  ...(item.aliases || []),
  ...(item.keywords || []),
];

const getSearchableText = (item) => normalizeText(getSearchTerms(item).join(" "));

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

const renderResults = (items) => {
  searchResults.innerHTML = "";
  if (!items.length) {
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("a");
    card.className = "result-card";
    card.href = `institution.html?id=${encodeURIComponent(item.id)}`;
    card.innerHTML = `
      <h3>${item.name}</h3>
      <p>${item.type} • ${item.city}</p>
    `;
    searchResults.appendChild(card);
  });
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

  const exactMatch = matches.find((item) =>
    getSearchTerms(item).some((term) => normalizeText(term) === query)
  );

  if (exactMatch) {
    window.location.href = `institution.html?id=${encodeURIComponent(
      exactMatch.id
    )}`;
    return;
  }

  if (matches.length === 1) {
    window.location.href = `institution.html?id=${encodeURIComponent(
      matches[0].id
    )}`;
    return;
  }

  if (!matches.length) {
    searchFeedback.textContent =
      "No matches found. Please try another university or superior school.";
    return;
  }

  searchFeedback.textContent = `${matches.length} matches found.`;
  renderResults(matches);
};

fetch(dataUrl)
  .then((response) => response.json())
  .then((data) => {
    establishments = data;
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
  })
  .catch(() => {
    searchFeedback.textContent =
      "Unable to load the establishment database right now.";
  });

searchForm.addEventListener("submit", handleSearch);
