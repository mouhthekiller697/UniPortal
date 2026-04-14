(function attachUniPortalDataUtils(globalScope) {
  const normalizeText = (value) =>
    (value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const uniqueTextList = (values = []) => {
    const seen = new Set();
    return values
      .filter(Boolean)
      .map((value) => String(value).trim())
      .filter((value) => {
        const key = normalizeText(value);
        if (!key || seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
  };

  const getSearchTerms = (item) => [
    item.name,
    item.city,
    item.type,
    ...(item.aliases || []),
    ...(item.keywords || []),
  ];

  const getSearchableText = (item) => normalizeText(getSearchTerms(item).join(" "));

  const mergeFormations = (base = {}, other = {}) => {
    const levels = ["licenses", "masters", "doctorates"];
    const merged = { ...base };
    levels.forEach((level) => {
      merged[level] = uniqueTextList([...(base[level] || []), ...(other[level] || [])]);
    });
    return merged;
  };

  const mergeSocialMedia = (base = {}, other = {}) => ({ ...base, ...other });

  const getDedupKey = (item) => {
    const normalizedName = normalizeText(item.name);
    const normalizedCity = normalizeText(item.city);
    const normalizedWebsite = normalizeText(item.website || "");
    if (normalizedWebsite) {
      return `${normalizedName}|${normalizedCity}|${normalizedWebsite}`;
    }
    return `${normalizedName}|${normalizedCity}`;
  };

  const mergeEstablishments = (base, candidate) => {
    const merged = { ...base };
    merged.aliases = uniqueTextList([...(base.aliases || []), ...(candidate.aliases || []), candidate.name]);
    merged.keywords = uniqueTextList([...(base.keywords || []), ...(candidate.keywords || [])]);
    merged.languages = uniqueTextList([...(base.languages || []), ...(candidate.languages || [])]);
    merged.highlights = uniqueTextList([...(base.highlights || []), ...(candidate.highlights || [])]);
    merged.gallery = [...(base.gallery || []), ...(candidate.gallery || [])];
    merged.formations = mergeFormations(base.formations || {}, candidate.formations || {});
    merged.socialMedia = mergeSocialMedia(base.socialMedia || {}, candidate.socialMedia || {});

    if (!merged.description && candidate.description) merged.description = candidate.description;
    if (!merged.admissions && candidate.admissions) merged.admissions = candidate.admissions;
    if (!merged.studentLife && candidate.studentLife) merged.studentLife = candidate.studentLife;
    if (!merged.contact && candidate.contact) merged.contact = candidate.contact;
    if (!merged.website && candidate.website) merged.website = candidate.website;
    if (!merged.campus && candidate.campus) merged.campus = candidate.campus;
    if (!merged.coordinates && candidate.coordinates) merged.coordinates = candidate.coordinates;

    return merged;
  };

  const deduplicateEstablishments = (data = []) => {
    const byKey = new Map();
    data.forEach((item) => {
      if (!item || !item.id || !item.name) {
        return;
      }
      const key = getDedupKey(item);
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, { ...item });
        return;
      }
      byKey.set(key, mergeEstablishments(existing, item));
    });
    return Array.from(byKey.values());
  };

  globalScope.UniPortalDataUtils = {
    normalizeText,
    getSearchTerms,
    getSearchableText,
    deduplicateEstablishments,
  };
})(window);
