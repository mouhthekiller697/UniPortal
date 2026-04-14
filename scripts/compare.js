const dataUrl = "data/establishments.json";

const compareForm = document.getElementById("compare-form");
const firstSelect = document.getElementById("compare-first");
const secondSelect = document.getElementById("compare-second");
const compareFeedback = document.getElementById("compare-feedback");
const compareGrid = document.getElementById("compare-grid");
const compareCardA = document.getElementById("compare-card-a");
const compareCardB = document.getElementById("compare-card-b");

let establishments = [];

const formatList = (items = []) => (items.length ? items.map((item) => `<li>${item}</li>`).join("") : "<li>Not available</li>");

const formatFormations = (formations = {}) => {
  const levels = [
    { key: "licenses", label: "Licenses" },
    { key: "masters", label: "Masters" },
    { key: "doctorates", label: "Doctorates" },
  ];

  return levels
    .map((level) => {
      const list = formations[level.key] || [];
      if (!list.length) {
        return "";
      }
      return `<div><strong>${level.label}</strong><ul>${formatList(list)}</ul></div>`;
    })
    .join("");
};

const renderCard = (target, establishment) => {
  target.innerHTML = `
    <h2>${establishment.name}</h2>
    <p class="compare-meta">${establishment.type} • ${establishment.city}</p>
    <ul class="compare-facts">
      <li><strong>Founded:</strong> ${establishment.founded || "Not available"}</li>
      <li><strong>Campus:</strong> ${establishment.campus || "Not available"}</li>
      <li><strong>Languages:</strong> ${(establishment.languages || []).join(", ") || "Not available"}</li>
      <li><strong>Website:</strong> ${
        establishment.website
          ? `<a href="${establishment.website}" target="_blank" rel="noopener">Visit website</a>`
          : "Not available"
      }</li>
      <li><strong>Contact:</strong> ${establishment.contact || "Not available"}</li>
    </ul>
    <div class="compare-block">
      <h3>Formations</h3>
      ${formatFormations(establishment.formations)}
    </div>
    <div class="compare-block">
      <h3>Highlights</h3>
      <ul>${formatList(establishment.highlights || [])}</ul>
    </div>
    <div class="compare-block">
      <h3>Admissions</h3>
      <p>${establishment.admissions || "Not available"}</p>
    </div>
  `;
};

const updateUrl = (a, b) => {
  const url = new URL(window.location.href);
  url.searchParams.set("a", a);
  url.searchParams.set("b", b);
  window.history.replaceState({}, "", url);
};

const runComparison = () => {
  const firstId = firstSelect.value;
  const secondId = secondSelect.value;

  compareFeedback.textContent = "";
  compareGrid.hidden = true;

  if (!firstId || !secondId) {
    compareFeedback.textContent = "Please choose two institutions.";
    return;
  }
  if (firstId === secondId) {
    compareFeedback.textContent = "Please choose two different institutions.";
    return;
  }

  const first = establishments.find((item) => item.id === firstId);
  const second = establishments.find((item) => item.id === secondId);
  if (!first || !second) {
    compareFeedback.textContent = "One or both selected institutions could not be found.";
    return;
  }

  updateUrl(firstId, secondId);
  renderCard(compareCardA, first);
  renderCard(compareCardB, second);
  compareGrid.hidden = false;
};

const populateSelects = () => {
  const options = establishments
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => `<option value="${item.id}">${item.name} (${item.city})</option>`)
    .join("");
  firstSelect.insertAdjacentHTML("beforeend", options);
  secondSelect.insertAdjacentHTML("beforeend", options);
};

const loadFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const first = params.get("a");
  const second = params.get("b");
  if (first) firstSelect.value = first;
  if (second) secondSelect.value = second;
  if (first && second) {
    runComparison();
  }
};

fetch(dataUrl)
  .then((response) => response.json())
  .then((data) => {
    establishments = window.UniPortalDataUtils.deduplicateEstablishments(data);
    populateSelects();
    loadFromUrl();
  })
  .catch(() => {
    compareFeedback.textContent = "Unable to load institutions for comparison right now.";
  });

compareForm.addEventListener("submit", (event) => {
  event.preventDefault();
  runComparison();
});
