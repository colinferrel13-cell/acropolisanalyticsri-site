/* One release contract shared by the reader, editor and pull-request checks. */
(function (root) {
  "use strict";
  const obj = v => v !== null && typeof v === "object" && !Array.isArray(v);
  const clean = v => typeof v === "string" && v.length > 0 && v === v.trim();
  const slug = v => clean(v) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
  // Slugs in this register are permanent print destinations. Labels and scope can evolve;
  // never repurpose a printed URL, even when a group has no released material.
  const group = (label, description) => ({label, description, kind: "topic"});
  const groups = {
    "cardiovascular-disease": group("Cardiovascular & Blood Health", "Cardiovascular disease and blood disorders, including coronary artery disease, stroke, high blood pressure, anemia, and sickle cell disease."),
    "metabolic-health": group("Diabetes, Metabolism & Kidney Disease", "Diabetes, obesity, cholesterol disorders, and kidney disease, including research on how these conditions overlap."),
    "respiratory-health": group("Respiratory Health", "Asthma, chronic obstructive pulmonary disease (COPD), occupational lung disease, and other respiratory conditions."),
    "cancer": group("Cancer", "Cancer by site or type, along with research on screening, prevention, outcomes, and access to care."),
    "brain-nerves-senses": group("Neurologic & Sensory Health", "Dementia, neurologic and neurodevelopmental conditions, and conditions affecting hearing or vision."),
    "mental-health": group("Mental Health & Substance Use", "Depression, anxiety, mental health conditions, alcohol and drug use disorders, and overdose."),
    "infectious-disease": group("Infectious Diseases & Outbreaks", "Communicable diseases, outbreaks, and post-infectious conditions. Research may concern respiratory, foodborne, vector-borne, or sexually transmitted infections."),
    "reproductive-health-stis": group("Reproductive Health & STIs", "Conditions affecting the reproductive organs outside of pregnancy and childhood, such as endometriosis, as well as sexually transmitted infections (STIs), including chlamydia, gonorrhea, syphilis, and HIV. A condition does not have to be infectious to belong here."),
    "digestive-liver-oral": group("Digestive, Liver & Oral Health", "Digestive conditions, liver and gallbladder disease, pancreatitis, and conditions affecting teeth and gums."),
    "bones-joints-immune": group("Musculoskeletal & Immune Health", "Musculoskeletal and autoimmune conditions, including arthritis, osteoporosis, spinal disorders, and lupus."),
    "reproductive-early-life": group("Maternal & Child Health", "Health during pregnancy, after birth, and through childhood. Topics include gestational diabetes, pregnancy-related hypertension, preterm birth, low birth weight, and congenital conditions, including congenital syphilis."),
    "injuries-exposures": group("Injury, Violence & Environmental Exposures", "Falls, traffic injuries, violence, poisoning, and occupational or environmental exposures."),
    "psa": group("Public Service Announcements (PSAs)", "Public-facing announcements and educational materials about health and safety. A PSA can address any condition or stand on its own."),
    "agriculture": group("Agriculture & Food Systems", "Agricultural research and public health, including farmworker health, occupational exposures, food safety, and the relationships among people, animals, and their environment.")
  };
  const groupEntries = Object.entries(groups);
  // Earlier v1 records used this field for two topic IDs. Never ask authors
  // to retag existing releases, or write this field for new releases.
  const collections = Object.fromEntries(["psa","agriculture"].map(id => [id,groups[id].label]));
  // Preserve earlier topic IDs and cross-cutting research subjects. A topic match
  // does not imply a particular diagnosis, release, or surveillance designation.
  const subjects = {
    ...Object.fromEntries(groupEntries.map(([id,g]) => [id,[g.label]])),
    "dementia-caregiving": ["Dementia & caregiving", "adrd", "caregiver"],
    "access-and-equity": ["Health care access & equity", "access to care", "health equity", "inequality"],
    "population-health": ["Population health", "surveillance", "public health"],
    "epidemiologic-methods": ["Epidemiologic methods", "epidemiology", "study design", "statistics", "measurement"]
  };
  const aliases = {
    "cardiovascular-disease":["heart, blood & circulation","cardiovascular disease","heart disease","heart health","cvd"],
    "metabolic-health":["diabetes, metabolism & kidney health","metabolic health","metabolic disorders","renal"],
    "respiratory-health":["lungs & breathing","lung health","respiratory disease"],
    "brain-nerves-senses":["brain, nerves & senses","neurology","neurologic","sensory"],
    "infectious-disease":["infections & outbreaks","infectious disease","communicable disease"],
    cancer:["oncology"],
    "mental-health":["behavioral health"],
    "digestive-liver-oral":["gastrointestinal","hepatic","dental"],
    "bones-joints-immune":["bones, joints & immune conditions","musculoskeletal","autoimmune"],
    "reproductive-early-life":["reproductive, pregnancy & early-life health","reproductive, maternal & early-life health","maternal","child health","perinatal","neonatal","pediatric"],
    "reproductive-health-stis":["reproductive organ conditions","reproductive health","STI","STIs","STD","sexually transmitted diseases","sexually transmitted infections"],
    "injuries-exposures":["injuries, violence & harmful exposures","injury","environmental health","occupational health"]
  };
  for (const [id, terms] of Object.entries(aliases)) subjects[id].push(...terms);
  const topics = Object.fromEntries(Object.entries(subjects).map(([id, names]) => [id, names[0]]));
  const projects = {paeon: "Population-Adjusted Epidemiology Outcomes Network"};
  const services = {mapping:"Geographic analysis & mapping", surveys:"Survey & program evaluation", reporting:"Reporting & communication"};
  const types = {factsheet:"Factsheet", report:"Full report", publication:"Publication"};
  const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  const releaseURL = id => "/release.html?id=" + encodeURIComponent(id);
  const groupURL = id => "/topics/" + encodeURIComponent(id) + "/";
  const topicURL = id => own(groups,id) ? groupURL(id) : "/outputs.html?topic=" + encodeURIComponent(id);
  const itemTopics = item => [...new Set([...(item.topics || []), ...(item.collections || [])])];
  function topicFilters(params) {
    const topic = params.get("topic") || params.get("collection") || "";
    const secondary = params.get("alsoTopic") || params.get("collection") || "";
    return {topic, alsoTopic: secondary !== topic ? secondary : ""};
  }
  function searchText(item) {
    return [item.title,item.summary,item.takeaway,item.authors,item.lesson,item.geography,item.dataPeriod,
      types[item.type],item.series === "epidemiology-explained" ? "Epidemiology Explained" : "",
      ...itemTopics(item).flatMap(id => subjects[id] || [])].filter(Boolean).join(" ").toLowerCase();
  }
  const validDate = v => {
    if (!clean(v) || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    const parsed = new Date(v + "T00:00:00Z");
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === v;
  };
  function validURL(v) {
    if (!clean(v) || !/^https:\/\//i.test(v)) return false;
    try {
      const u = new URL(v);
      return Boolean(u.hostname && u.protocol === "https:" && !u.username && !u.password);
    } catch { return false; }
  }
  function validate(catalog) {
    if (!obj(catalog) || catalog.version !== 1 || !Array.isArray(catalog.items))
      return ["Expected catalog version 1 with an items list."];
    const ids = new Set(), lessons = new Set(), paths = new Set(), errors = [];
    let featuredCount = 0;
    for (const [i, item] of catalog.items.entries()) {
      const err = msg => errors.push("Entry " + (i + 1) + ": " + msg);
      if (!obj(item)) { err("expected an object."); continue; }
      if (!clean(item.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id) || ids.has(item.id))
        err("use a unique lowercase, hyphenated ID.");
      ids.add(item.id);
      if (!["factsheet", "report", "publication"].includes(item.type)) err("unknown item type.");
      for (const key of ["title", "summary", "authors"]) if (!clean(item[key])) err("supply " + key + ".");
      if (!validDate(item.date)) err("supply a valid release date (YYYY-MM-DD).");
      for (const key of ["takeaway","geography","dataPeriod","citation","version","revision"])
        if (item[key] !== undefined && !clean(item[key])) err("supply nonempty text for " + key + ".");
      for (const [key, accepts] of [["topics", v => own(topics,v)], ["collections", v => own(collections,v)], ["services", v => own(services,v)], ["related", slug]])
        if (item[key] !== undefined && (!Array.isArray(item[key]) || item[key].some(v => !clean(v) || !accepts(v)) ||
            new Set(item[key]).size !== item[key].length)) err("use distinct supported " + key + " IDs.");
      if (item.featured !== undefined && typeof item.featured !== "boolean") err("featured must be true or false.");
      if (item.featured === true && ++featuredCount > 1) err("only one homepage finding can be featured.");
      if (item.project !== undefined && (!clean(item.project) || !own(projects,item.project))) err("unknown project.");
      if (item.study !== undefined && !slug(item.study)) err("invalid study ID.");
      if (item.supersedes !== undefined && !slug(item.supersedes)) err("invalid earlier release ID.");
      if (item.series || item.lesson) {
        if (item.type !== "factsheet" || item.series !== "epidemiology-explained" ||
          !clean(item.lesson) || !/^EE (0|[1-9]\d*)\.\d{2}$/.test(item.lesson) || lessons.has(item.lesson))
          err("use a unique EE lesson such as EE 0.00, on a series factsheet only.");
        lessons.add(item.lesson);
      }
      if (item.url && !validURL(item.url)) err("use an https publication link without credentials.");
      if (!Array.isArray(item.files)) { err("files must be a list."); continue; }
      if (!item.files.length && !(item.type === "publication" && validURL(item.url)))
        err("supply a PDF, or a publisher link for an external publication.");
      const labels = new Set();
      for (const f of item.files) {
        if (!obj(f)) { err("invalid file."); continue; }
        if (!clean(f.name) || !/^[a-z0-9][a-z0-9._-]*\.pdf$/i.test(f.name) ||
            paths.has(String(f.name).toLowerCase())) err("use a unique PDF basename (no spaces or folders).");
        paths.add(String(f.name).toLowerCase());
        if (!["Showcase", "Printer-friendly", "PDF"].includes(f.label) || labels.has(f.label))
          err("use a distinct supported edition for each file.");
        labels.add(f.label);
        if (!Number.isSafeInteger(f.bytes) || f.bytes < 1) err("file size must be in bytes.");
      }
    }
    if (errors.length) return errors;
    const byId = new Map(catalog.items.map(item => [item.id, item]));
    for (const item of catalog.items) {
      for (const ref of [...(item.related || []), ...(item.supersedes ? [item.supersedes] : [])])
        if (ref === item.id || !byId.has(ref)) errors.push(item.id + ": invalid or missing referenced release " + ref + ".");
      const seen = new Set([item.id]);
      let next = item.supersedes;
      while (next && byId.has(next)) {
        if (seen.has(next)) { errors.push(item.id + ": revision references form a cycle."); break; }
        seen.add(next); next = byId.get(next).supersedes;
      }
    }
    return errors;
  }
  const api = { validate, topics, collections, groups, projects, services, types, itemTopics, topicFilters, searchText, releaseURL, topicURL, groupURL };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PublicationCatalog = api;
})(globalThis);
