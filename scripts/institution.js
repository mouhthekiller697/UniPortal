const dataUrl = "data/establishments.json";

const detailsSection = document.getElementById("institution-details");
const notFoundSection = document.getElementById("not-found");

const nameEl = document.getElementById("institution-name");
const metaEl = document.getElementById("institution-meta");
const foundedEl = document.getElementById("institution-founded");
const cityEl = document.getElementById("institution-city");
const typeEl = document.getElementById("institution-type");
const coordinatesEl = document.getElementById("institution-coordinates");
const formationsEl = document.getElementById("institution-formations");
const officialLink = document.getElementById("official-website");

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const formatCoordinates = (coordinates) =>
  `${coordinates.lat.toFixed(4)}, ${coordinates.lon.toFixed(4)}`;

const renderFormations = (formations) => {
  formationsEl.innerHTML = "";
  const levels = [
    { key: "licenses", label: "Licenses" },
    { key: "masters", label: "Masters" },
    { key: "doctorates", label: "Doctorates" },
  ];

  levels.forEach((level) => {
    const list = formations[level.key];
    if (!list || !list.length) {
      return;
    }

    const wrapper = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = level.label;
    const ul = document.createElement("ul");
    list.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      ul.appendChild(li);
    });
    wrapper.appendChild(title);
    wrapper.appendChild(ul);
    formationsEl.appendChild(wrapper);
  });
};

const renderMap = (coordinates) => {
  if (!window.L || !coordinates) {
    return;
  }

  const map = L.map("map").setView([coordinates.lat, coordinates.lon], 14);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  L.marker([coordinates.lat, coordinates.lon]).addTo(map);
};

const showNotFound = () => {
  detailsSection.hidden = true;
  notFoundSection.hidden = false;
};

if (!id) {
  showNotFound();
} else {
  fetch(dataUrl)
    .then((response) => response.json())
    .then((data) => {
      const establishment = data.find((item) => item.id === id);
      if (!establishment) {
        showNotFound();
        return;
      }

      nameEl.textContent = establishment.name;
      metaEl.textContent = `${establishment.type} in ${establishment.city}`;
      foundedEl.textContent = establishment.founded;
      cityEl.textContent = establishment.city;
      typeEl.textContent = establishment.type;
      coordinatesEl.textContent = formatCoordinates(establishment.coordinates);
      renderFormations(establishment.formations);

      if (establishment.website) {
        officialLink.href = establishment.website;
        officialLink.textContent = "Official Website";
      } else {
        officialLink.href = "#";
        officialLink.textContent = "Official Website unavailable";
        officialLink.classList.add("disabled");
      }

      renderMap(establishment.coordinates);
    })
    .catch(() => {
      showNotFound();
    });
}
