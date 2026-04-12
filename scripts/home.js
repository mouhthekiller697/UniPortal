const dataUrl = "data/establishments.json";

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchFeedback = document.getElementById("search-feedback");
const searchResults = document.getElementById("search-results");
const datalist = document.getElementById("establishment-list");

let establishments = [];

const normalizeText = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

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

  const matches = establishments.filter((item) => {
    const name = normalizeText(item.name);
    const city = normalizeText(item.city);
    return name.includes(query) || city.includes(query);
  });

  const exactMatch = matches.find(
    (item) => normalizeText(item.name) === query
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
    data.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.name;
      datalist.appendChild(option);
    });
  })
  .catch(() => {
    searchFeedback.textContent =
      "Unable to load the establishment database right now.";
  });

searchForm.addEventListener("submit", handleSearch);
