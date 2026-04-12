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
const socialLinksEl = document.getElementById("social-links");
const galleryEl = document.getElementById("institution-gallery");
const galleryImageEl = document.getElementById("institution-image");
const galleryCaptionEl = document.getElementById("gallery-caption");
const galleryPrevEl = document.getElementById("gallery-prev");
const galleryNextEl = document.getElementById("gallery-next");

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

let galleryItems = [];
let galleryIndex = 0;

const socialPlatforms = [
  { key: "facebook", label: "Facebook", icon: "fa-facebook" },
  { key: "instagram", label: "Instagram", icon: "fa-instagram" },
  { key: "linkedin", label: "LinkedIn", icon: "fa-linkedin" },
  { key: "youtube", label: "YouTube", icon: "fa-youtube" },
];

const formatCoordinates = (coordinates) =>
  `${coordinates.lat.toFixed(4)}, ${coordinates.lon.toFixed(4)}`;

const isValidHttpUrl = (value) => {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

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

const getDefaultSocialLinks = (establishment) => {
  const query = encodeURIComponent(establishment.name);
  const hashtag = establishment.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");
  return {
    facebook: `https://www.facebook.com/search/top/?q=${query}`,
    instagram: `https://www.instagram.com/explore/tags/${encodeURIComponent(hashtag)}/`,
    linkedin: `https://www.linkedin.com/search/results/companies/?keywords=${query}`,
    youtube: `https://www.youtube.com/results?search_query=${query}`,
  };
};

const renderSocialLinks = (establishment) => {
  socialLinksEl.innerHTML = "";
  const links = {
    ...getDefaultSocialLinks(establishment),
    ...(establishment.socialMedia || {}),
  };

  socialPlatforms.forEach((platform) => {
    const href = links[platform.key];
    if (!isValidHttpUrl(href)) {
      return;
    }

    const link = document.createElement("a");
    link.className = "button-link social-button";
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.innerHTML = `<i class="fa-brands ${platform.icon}" aria-hidden="true"></i><span>${platform.label}</span>`;
    socialLinksEl.appendChild(link);
  });
};

const showGalleryImage = () => {
  if (!galleryItems.length) {
    galleryEl.hidden = true;
    return;
  }

  const current = galleryItems[galleryIndex];
  galleryImageEl.src = current.src;
  galleryImageEl.alt = current.alt;
  galleryCaptionEl.textContent = current.caption || "";
  galleryEl.hidden = false;

  const hasMultipleItems = galleryItems.length > 1;
  galleryPrevEl.hidden = !hasMultipleItems;
  galleryNextEl.hidden = !hasMultipleItems;
};

const renderGallery = (establishment) => {
  const fallbackImage = {
    src: `https://picsum.photos/seed/${encodeURIComponent(`${establishment.id}-campus`)}/1200/800`,
    alt: `${establishment.name} campus photo`,
    caption: `Campus visual for ${establishment.name}`,
  };

  galleryItems = (establishment.gallery || []).filter(
    (item) => item && item.src && isValidHttpUrl(item.src)
  );

  if (!galleryItems.length) {
    galleryItems = [fallbackImage];
  }

  galleryIndex = 0;
  showGalleryImage();
};

const showNotFound = () => {
  detailsSection.hidden = true;
  notFoundSection.hidden = false;
};

galleryPrevEl.addEventListener("click", () => {
  if (!galleryItems.length) {
    return;
  }
  galleryIndex = (galleryIndex - 1 + galleryItems.length) % galleryItems.length;
  showGalleryImage();
});

galleryNextEl.addEventListener("click", () => {
  if (!galleryItems.length) {
    return;
  }
  galleryIndex = (galleryIndex + 1) % galleryItems.length;
  showGalleryImage();
});

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
      renderGallery(establishment);
      renderSocialLinks(establishment);
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

      if (isValidHttpUrl(establishment.website)) {
        officialLink.href = establishment.website;
        officialLink.textContent = "Official Website";
        officialLink.classList.remove("disabled");
      } else {
        officialLink.href = "#";
        officialLink.textContent = "Official Website unavailable";
        officialLink.classList.add("disabled");
      }

      document.title = `${establishment.name} | UniPortSite`;
      renderMap(establishment.coordinates);
    })
    .catch(() => {
      showNotFound();
    });
}
