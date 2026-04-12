const dataUrl = "data/establishments.json";

const detailsSection = document.getElementById("institution-details");
const notFoundSection = document.getElementById("not-found");

const nameEl = document.getElementById("institution-name");
const metaEl = document.getElementById("institution-meta");
const foundedEl = document.getElementById("institution-founded");
const cityEl = document.getElementById("institution-city");
const typeEl = document.getElementById("institution-type");
const campusEl = document.getElementById("institution-campus");
const languagesEl = document.getElementById("institution-languages");
const coordinatesEl = document.getElementById("institution-coordinates");
const formationsEl = document.getElementById("institution-formations");
const descriptionEl = document.getElementById("institution-description");
const facultiesEl = document.getElementById("institution-faculties");
const admissionsEl = document.getElementById("institution-admissions");
const studentLifeEl = document.getElementById("institution-student-life");
const contactEl = document.getElementById("institution-contact");
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

  const refreshMapSize = () => map.invalidateSize();
  requestAnimationFrame(refreshMapSize);
  window.addEventListener("load", refreshMapSize, { once: true });
  window.addEventListener("resize", refreshMapSize);
};

const renderHighlights = (highlights) => {
  facultiesEl.innerHTML = "";
  if (!highlights || !highlights.length) {
    const li = document.createElement("li");
    li.textContent = "Multi-disciplinary programs and accredited pathways.";
    facultiesEl.appendChild(li);
    return;
  }

  highlights.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    facultiesEl.appendChild(li);
  });
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
      campusEl.textContent = establishment.campus || "Main campus and annexes";
      languagesEl.textContent = (establishment.languages || ["Arabic", "French"]).join(", ");
      coordinatesEl.textContent = formatCoordinates(establishment.coordinates);
      renderFormations(establishment.formations);
      renderHighlights(establishment.highlights);
      descriptionEl.textContent =
        establishment.description ||
        "This institution offers accredited higher-education programs across several disciplines.";
      admissionsEl.textContent =
        establishment.admissions ||
        "Admissions generally follow national orientation results and institution-specific criteria.";
      studentLifeEl.textContent =
        establishment.studentLife ||
        "Students benefit from campus clubs, mentoring, and scientific activities.";
      contactEl.textContent = establishment.contact || "Contact details are available on the official website.";

      if (establishment.website) {
        officialLink.href = establishment.website;
        officialLink.textContent = "Official Website";
        officialLink.classList.remove("disabled");
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
