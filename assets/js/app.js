const navLinks = document.querySelectorAll("[data-view]");
const viewLinks = document.querySelectorAll("[data-view-link]");
const panels = document.querySelectorAll("[data-view-panel]");
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".main-nav");

function showView(viewName) {
  const exists = [...panels].some((panel) => panel.dataset.viewPanel === viewName);
  const activeView = exists ? viewName : "accueil";

  panels.forEach((panel) => {
    const isActive = panel.dataset.viewPanel === activeView;
    panel.hidden = !isActive;
    panel.classList.toggle("is-visible", isActive);
  });

  navLinks.forEach((link) => {
    const isActive = link.dataset.view === activeView;
    link.classList.toggle("is-active", isActive);
    isActive ? link.setAttribute("aria-current", "page") : link.removeAttribute("aria-current");
  });

  document.title = activeView === "accueil"
    ? "XML Lab Gabon"
    : `${document.querySelector(`[data-view="${activeView}"]`).textContent} · XML Lab Gabon`;

  closeMenu();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function closeMenu() {
  nav.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
}

function openViewFromLink(event) {
  const viewName = event.currentTarget.dataset.view || event.currentTarget.dataset.viewLink;
  if (!viewName) return;
  event.preventDefault();
  history.pushState({ view: viewName }, "", `#${viewName}`);
  showView(viewName);
}

navLinks.forEach((link) => link.addEventListener("click", openViewFromLink));
viewLinks.forEach((link) => link.addEventListener("click", openViewFromLink));

menuToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

window.addEventListener("popstate", () => showView(location.hash.slice(1) || "accueil"));
showView(location.hash.slice(1) || "accueil");

const cnamgsExamples = {
  valid: `<?xml version="1.0" encoding="UTF-8"?>
<declaration_cnamgs version="1.0" mois="2026-06">
  <pharmacie>
    <code>PHA-0042</code>
    <nom>Pharmacie du Littoral</nom>
    <ville>Libreville</ville>
  </pharmacie>
  <prestations>
    <prestation>
      <reference>PRE-000001</reference>
      <numero_assure>123456789</numero_assure>
      <code_prestation>MEDICAMENT</code_prestation>
      <date_soin>2026-06-03</date_soin>
      <montant>12500.00</montant>
      <part_cnamgs>80.00</part_cnamgs>
    </prestation>
  </prestations>
</declaration_cnamgs>`,
  invalid: `<?xml version="1.0" encoding="UTF-8"?>
<declaration_cnamgs version="1.0" mois="2026-13">
  <pharmacie>
    <code>PHA-42</code>
    <nom>Pharmacie du Littoral</nom>
    <ville>Libreville</ville>
  </pharmacie>
  <prestations>
    <prestation>
      <reference>PRE-1</reference>
      <numero_assure>12345</numero_assure>
      <code_prestation>RADIOGRAPHIE</code_prestation>
      <date_soin>03-06-2026</date_soin>
      <montant>-12500.00</montant>
      <part_cnamgs>120</part_cnamgs>
    </prestation>
  </prestations>
</declaration_cnamgs>`,
};

function directChildren(element, tagName) {
  return [...element.children].filter((child) => child.tagName === tagName);
}

function childText(element, tagName) {
  return directChildren(element, tagName)[0]?.textContent.trim() ?? "";
}

function lineForTag(xml, tagName, occurrence = 0) {
  const matches = [...xml.matchAll(new RegExp(`<${tagName}(?:\\s|>)`, "g"))];
  const index = matches[occurrence]?.index ?? 0;
  return xml.slice(0, index).split(/\r\n|\r|\n/).length;
}

function isRealIsoDate(value) {
  if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#039;",
    "\"": "&quot;",
  })[character]);
}

function validateCnamgsXml(xml) {
  const parser = new DOMParser();
  const documentXml = parser.parseFromString(xml, "application/xml");
  const parserError = documentXml.querySelector("parsererror");
  if (parserError) return [`Erreur XML : ${parserError.textContent.trim().split("\n")[0]}`];

  const errors = [];
  const root = documentXml.documentElement;
  if (root.tagName !== "declaration_cnamgs") {
    return ["Ligne 1 : la racine du fichier doit être <declaration_cnamgs>."];
  }

  if (root.getAttribute("version") !== "1.0") {
    errors.push(`Ligne ${lineForTag(xml, "declaration_cnamgs")} : l'attribut version doit être égal à "1.0".`);
  }
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(root.getAttribute("mois"))) {
    errors.push(`Ligne ${lineForTag(xml, "declaration_cnamgs")} : le mois doit être au format AAAA-MM.`);
  }

  const pharmacy = directChildren(root, "pharmacie")[0];
  const prestations = directChildren(root, "prestations")[0];
  if (!pharmacy || !prestations || root.children.length !== 2) {
    errors.push("Ligne 1 : la déclaration doit contenir, dans cet ordre, <pharmacie> puis <prestations>.");
    return errors;
  }

  const pharmacyCode = childText(pharmacy, "code");
  if (!/^PHA-\d{4}$/.test(pharmacyCode)) {
    errors.push(`Ligne ${lineForTag(xml, "code")} : le code pharmacie doit respecter le format PHA-0000.`);
  }

  const entries = directChildren(prestations, "prestation");
  if (!entries.length) errors.push(`Ligne ${lineForTag(xml, "prestations")} : au moins une prestation est obligatoire.`);

  entries.forEach((entry, index) => {
    const line = lineForTag(xml, "prestation", index);
    const label = `Prestation ${index + 1} (ligne ${line})`;
    const expectedTags = ["reference", "numero_assure", "code_prestation", "date_soin", "montant", "part_cnamgs"];
    if (entry.children.length !== expectedTags.length || [...entry.children].some((child, position) => child.tagName !== expectedTags[position])) {
      errors.push(`${label} : les champs doivent être dans l'ordre imposé par le schéma XSD.`);
    }
    if (!/^PRE-\d{6}$/.test(childText(entry, "reference"))) errors.push(`${label} : la référence doit respecter le format PRE-000000.`);
    if (!/^\d{9}$/.test(childText(entry, "numero_assure"))) errors.push(`${label} : le numéro d'assuré doit contenir exactement 9 chiffres.`);
    if (!["CONSULTATION", "MEDICAMENT", "ANALYSE", "HOSPITALISATION"].includes(childText(entry, "code_prestation"))) errors.push(`${label} : le code de prestation n'est pas autorisé.`);
    if (!isRealIsoDate(childText(entry, "date_soin"))) errors.push(`${label} : la date de soin doit être une date valide au format AAAA-MM-JJ.`);
    if (!/^\d+(\.\d{1,2})?$/.test(childText(entry, "montant"))) errors.push(`${label} : le montant doit être positif et comporter au plus deux décimales.`);
    const share = Number(childText(entry, "part_cnamgs"));
    if (!/^\d+(\.\d{1,2})?$/.test(childText(entry, "part_cnamgs")) || share < 0 || share > 100) errors.push(`${label} : la part CNAMGS doit être comprise entre 0 et 100.`);
  });

  return errors;
}

function displayCnamgsResult(errors) {
  const result = document.querySelector("#cnamgs-result");
  result.hidden = false;
  result.className = `validation-result ${errors.length ? "is-invalid" : "is-valid"}`;
  if (!errors.length) {
    result.innerHTML = '<div class="result-summary"><span>✓</span>Fichier valide, prêt à l’envoi.</div>';
    return;
  }
  result.innerHTML = `<div class="result-summary"><span>!</span>Fichier invalide : ${errors.length} erreur(s) détectée(s).</div><ul class="error-list">${errors.map((error) => `<li>${escapeHtml(error)}</li>`).join("")}</ul>`;
}

function initializeCnamgsValidator() {
  const input = document.querySelector("#cnamgs-input");
  const upload = document.querySelector("#cnamgs-upload");
  const result = document.querySelector("#cnamgs-result");
  document.querySelector("#load-valid-xml").addEventListener("click", () => { input.value = cnamgsExamples.valid; result.hidden = true; });
  document.querySelector("#load-invalid-xml").addEventListener("click", () => { input.value = cnamgsExamples.invalid; result.hidden = true; });
  document.querySelector("#validate-cnamgs").addEventListener("click", () => displayCnamgsResult(validateCnamgsXml(input.value)));
  document.querySelector("#clear-cnamgs-result").addEventListener("click", () => { result.hidden = true; result.innerHTML = ""; });
  upload.addEventListener("change", async () => {
    const [file] = upload.files;
    if (!file) return;
    input.value = await file.text();
    result.hidden = true;
    upload.value = "";
  });
}

initializeCnamgsValidator();

const seegTariffs = {
  SOCIAL: [{ limit: 50, price: 50 }, { limit: null, price: 85 }],
  DOMESTIQUE: [{ limit: 100, price: 70 }, { limit: 150, price: 95 }, { limit: null, price: 125 }],
  PROFESSIONNEL: [{ limit: 150, price: 130 }, { limit: 250, price: 160 }, { limit: null, price: 190 }],
};
const seegServiceFees = { CLASSIQUE: 1000, EDAN: 750 };

function formatFcfa(value) {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(value))} FCFA`;
}

function calculateSeegInvoice({ client, tariff, mode, startIndex, endIndex }) {
  const consumption = endIndex - startIndex;
  if (!Number.isFinite(consumption) || consumption < 0) {
    throw new Error("L’index final doit être supérieur ou égal à l’index initial.");
  }
  let remaining = consumption;
  const lines = [];
  seegTariffs[tariff].forEach((band, index) => {
    if (!remaining) return;
    const volume = band.limit === null ? remaining : Math.min(remaining, band.limit);
    const label = band.limit === null ? `Tranche ${index + 1} (au-delà)` : `Tranche ${index + 1} (jusqu’à ${band.limit} kWh)`;
    lines.push({ label, volume, price: band.price, amount: volume * band.price });
    remaining -= volume;
  });
  const energyAmount = lines.reduce((total, line) => total + line.amount, 0);
  const serviceFee = seegServiceFees[mode];
  const ht = energyAmount + serviceFee;
  const tva = Math.round(ht * 0.18);
  const wasteContribution = Math.round(ht * 0.02);
  return { client, tariff, mode, startIndex, endIndex, consumption, lines, serviceFee, ht, tva, wasteContribution, total: ht + tva + wasteContribution };
}

function renderSeegInvoice(invoice) {
  document.querySelector("#invoice-client").textContent = invoice.client;
  document.querySelector("#invoice-contract").textContent = `${invoice.tariff} · ${invoice.mode}`;
  document.querySelector("#invoice-consumption").textContent = invoice.consumption;
  document.querySelector("#invoice-reference").textContent = `SEEG-WEB-${String(invoice.endIndex).slice(-5)}`;
  document.querySelector("#invoice-lines").innerHTML = [
    ...invoice.lines.map((line) => `<tr><td>${line.label}</td><td>${line.volume} kWh</td><td>${formatFcfa(line.price)}</td><td>${formatFcfa(line.amount)}</td></tr>`),
    `<tr><td>Frais de service (${invoice.mode})</td><td>—</td><td>—</td><td>${formatFcfa(invoice.serviceFee)}</td></tr>`,
  ].join("");
  document.querySelector("#invoice-ht").textContent = formatFcfa(invoice.ht);
  document.querySelector("#invoice-tva").textContent = formatFcfa(invoice.tva);
  document.querySelector("#invoice-om").textContent = formatFcfa(invoice.wasteContribution);
  document.querySelector("#invoice-ttc").textContent = formatFcfa(invoice.total);
}

function getSeegFormValues() {
  return {
    client: document.querySelector("#seeg-client").value.trim() || "Client SEEG",
    tariff: document.querySelector("#seeg-tarif").value,
    mode: document.querySelector("#seeg-mode").value,
    startIndex: Number(document.querySelector("#seeg-start-index").value),
    endIndex: Number(document.querySelector("#seeg-end-index").value),
  };
}

function downloadSeegInvoice() {
  const invoice = document.querySelector("#seeg-invoice");
  const documentHtml = `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Facture SEEG</title><style>body{max-width:850px;margin:30px auto;color:#102a43;font:15px Arial}.web-invoice{border:1px solid #d9e2ec;border-radius:16px;overflow:hidden}.web-invoice-header{display:flex;justify-content:space-between;padding:25px;color:#fff;background:#05616c}.web-invoice-header strong{font-size:28px}.web-invoice-header small{display:block}.web-invoice-body{padding:25px}.invoice-meta{display:flex;gap:15px;margin-bottom:20px}.invoice-meta div{flex:1;padding:10px;background:#f5f8fa}.invoice-meta span{display:block;font-size:11px;color:#486581}.invoice-table{width:100%;border-collapse:collapse}.invoice-table th,.invoice-table td{padding:10px;border-bottom:1px solid #d9e2ec;text-align:left}.invoice-table td:not(:first-child),.invoice-table th:not(:first-child){text-align:right}.invoice-totals{width:280px;margin:20px 0 0 auto}.invoice-totals p{display:flex;justify-content:space-between}.invoice-grand-total{padding-top:10px;border-top:2px solid #05616c;color:#05616c;font-weight:bold}.invoice-note{color:#486581;font-size:11px}.invoice-download{display:none}</style></head><body>${invoice.outerHTML}</body></html>`;
  const blob = new Blob([documentHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "facture-seeg-demo.html";
  link.click();
  URL.revokeObjectURL(url);
}

function initializeSeegSimulator() {
  const form = document.querySelector("#seeg-form");
  const upload = document.querySelector("#seeg-upload");
  const status = document.querySelector("#seeg-import-status");
  const updateInvoice = () => {
    try {
      renderSeegInvoice(calculateSeegInvoice(getSeegFormValues()));
      status.textContent = "Facture calculée avec les paramètres pédagogiques affichés à gauche.";
    } catch (error) {
      status.textContent = error.message;
    }
  };
  form.addEventListener("submit", (event) => { event.preventDefault(); updateInvoice(); });
  upload.addEventListener("change", async () => {
    const [file] = upload.files;
    if (!file) return;
    const xml = await file.text();
    const xmlDocument = new DOMParser().parseFromString(xml, "application/xml");
    if (xmlDocument.querySelector("parsererror")) {
      status.textContent = "Le fichier importé n’est pas un XML valide.";
      return;
    }
    const client = xmlDocument.querySelector("client");
    if (!client) {
      status.textContent = "Aucun élément <client> n’a été trouvé dans ce fichier XML.";
      return;
    }
    const text = (tag) => client.querySelector(tag)?.textContent.trim() || "";
    const tariff = text("tarif").toUpperCase();
    const mode = text("mode_facturation").toUpperCase();
    if (!seegTariffs[tariff] || !seegServiceFees[mode] || !text("index_debut") || !text("index_fin")) {
      status.textContent = "Le client XML doit contenir un tarif, un mode et deux index reconnus.";
      return;
    }
    document.querySelector("#seeg-client").value = text("nom") || client.getAttribute("id") || "Client SEEG";
    document.querySelector("#seeg-tarif").value = tariff;
    document.querySelector("#seeg-mode").value = mode;
    document.querySelector("#seeg-start-index").value = text("index_debut");
    document.querySelector("#seeg-end-index").value = text("index_fin");
    status.textContent = `Client ${client.getAttribute("id") || "XML"} importé. La facture a été mise à jour.`;
    renderSeegInvoice(calculateSeegInvoice(getSeegFormValues()));
    upload.value = "";
  });
  document.querySelector("#download-seeg-invoice").addEventListener("click", downloadSeegInvoice);
  updateInvoice();
}

initializeSeegSimulator();

let translationSourceXml = `<?xml version="1.0" encoding="UTF-8"?>
<application nom="Portail citoyen">
  <menu>
    <item id="home">Accueil</item>
    <item id="services">Services</item>
    <item id="documents">Mes documents</item>
    <item id="help">Aide</item>
  </menu>
  <messages>
    <message id="welcome">Bienvenue sur le portail citoyen</message>
    <message id="logout">Déconnexion réussie</message>
  </messages>
</application>`;
let translatedMenuXml = "";

function parseTranslationXml(xml) {
  const documentXml = new DOMParser().parseFromString(xml, "application/xml");
  if (documentXml.querySelector("parsererror")) throw new Error("Le fichier importé n’est pas un XML valide.");
  return documentXml;
}

function translationLeaves(documentXml) {
  return [...documentXml.getElementsByTagName("*")].filter((element) => {
    const hasElementChild = [...element.childNodes].some((child) => child.nodeType === Node.ELEMENT_NODE);
    return !hasElementChild && element.textContent.trim();
  });
}

function renderTranslationTerms() {
  const termsContainer = document.querySelector("#translation-terms");
  const terms = translationLeaves(parseTranslationXml(translationSourceXml));
  termsContainer.replaceChildren();
  terms.forEach((term, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "translation-term";
    const label = document.createElement("label");
    label.htmlFor = `translation-term-${index}`;
    const identity = term.getAttribute("id") ? `#${term.getAttribute("id")}` : term.tagName;
    label.textContent = `${identity} — ${term.textContent.trim()}`;
    const input = document.createElement("input");
    input.id = `translation-term-${index}`;
    input.dataset.translationIndex = index;
    input.type = "text";
    input.placeholder = "Traduction validée";
    input.setAttribute("aria-label", `Traduction de ${term.textContent.trim()}`);
    wrapper.append(label, input);
    termsContainer.append(wrapper);
  });
}

function generateTranslatedMenu() {
  const language = document.querySelector("#translation-language").value.trim();
  const status = document.querySelector("#translation-status");
  if (!language) {
    status.textContent = "Indique d’abord le nom de la langue cible.";
    return;
  }
  const documentXml = parseTranslationXml(translationSourceXml);
  const terms = translationLeaves(documentXml);
  const inputs = [...document.querySelectorAll("[data-translation-index]")];
  let translatedCount = 0;
  terms.forEach((term, index) => {
    const translation = inputs[index]?.value.trim();
    if (translation) {
      term.textContent = translation;
      translatedCount += 1;
    }
  });
  translatedMenuXml = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(documentXml)}`;
  document.querySelector("#translation-preview").textContent = translatedMenuXml;
  document.querySelector("#translation-preview-wrap").hidden = false;
  document.querySelector("#download-translation").disabled = false;
  status.textContent = `${translatedCount} traduction(s) intégrée(s) pour la langue ${language}. Les champs vides ont conservé le français.`;
}

function slugifyLanguage(language) {
  return language.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "traduction";
}

function downloadTranslatedMenu() {
  if (!translatedMenuXml) return;
  const language = document.querySelector("#translation-language").value.trim();
  const blob = new Blob([translatedMenuXml], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `menu_${slugifyLanguage(language)}.xml`;
  link.click();
  URL.revokeObjectURL(url);
}

function initializeTranslationTool() {
  const upload = document.querySelector("#translation-upload");
  const status = document.querySelector("#translation-status");
  const reset = () => {
    renderTranslationTerms();
    translatedMenuXml = "";
    document.querySelector("#translation-preview-wrap").hidden = true;
    document.querySelector("#download-translation").disabled = true;
    status.textContent = "Les champs de traduction ont été réinitialisés.";
  };
  document.querySelector("#generate-translation").addEventListener("click", generateTranslatedMenu);
  document.querySelector("#download-translation").addEventListener("click", downloadTranslatedMenu);
  document.querySelector("#reset-translations").addEventListener("click", reset);
  upload.addEventListener("change", async () => {
    const [file] = upload.files;
    if (!file) return;
    const candidate = await file.text();
    try {
      const terms = translationLeaves(parseTranslationXml(candidate));
      if (!terms.length) throw new Error("Le XML ne contient aucun élément texte à traduire.");
      translationSourceXml = candidate;
      reset();
      status.textContent = `${terms.length} texte(s) ont été chargés depuis ${file.name}.`;
    } catch (error) {
      status.textContent = error.message;
    }
    upload.value = "";
  });
  renderTranslationTerms();
}

initializeTranslationTool();

const routerAuditExamples = {
  risky: `<?xml version="1.0" encoding="UTF-8"?>
<configuration_routeur agence="Agence Mont-Bouët" equipement="RTR-LBV-01">
  <services>
    <telnet enabled="true" port="23"/>
    <ssh enabled="true" port="22" version="1"/>
  </services>
  <securite>
    <chiffrement protocole="DES" bits="56"/>
    <administration protocole="HTTP" port="80"/>
  </securite>
</configuration_routeur>`,
  secure: `<?xml version="1.0" encoding="UTF-8"?>
<configuration_routeur agence="Agence Akanda" equipement="RTR-LBV-02">
  <services>
    <telnet enabled="false" port="23"/>
    <ssh enabled="true" port="2222" version="2"/>
  </services>
  <securite>
    <chiffrement protocole="AES" bits="256"/>
    <administration protocole="HTTPS" port="8443"/>
  </securite>
</configuration_routeur>`,
};

function routerFinding(level, title, detail, recommendation) {
  return { level, title, detail, recommendation };
}

function auditRouterXml(xml) {
  const documentXml = new DOMParser().parseFromString(xml, "application/xml");
  if (documentXml.querySelector("parsererror")) {
    return [routerFinding("error", "XML invalide", "Le fichier ne peut pas être analysé car sa syntaxe XML est incorrecte.", "Corriger la structure XML avant de relancer l’audit.")];
  }
  const root = documentXml.documentElement;
  if (root.tagName !== "configuration_routeur") {
    return [routerFinding("error", "Racine XML inattendue", "Le document doit commencer par <configuration_routeur>.", "Utiliser le format de configuration prévu pour l’exercice.")];
  }
  const attribute = (selector, name) => root.querySelector(selector)?.getAttribute(name)?.trim() || "";
  const findings = [];
  const telnet = attribute("services > telnet", "enabled").toLowerCase();
  if (telnet !== "false") {
    findings.push(routerFinding("high", "Telnet est activé ou non déclaré comme désactivé", "Telnet transmet les identifiants et commandes sans chiffrement.", "Définir enabled=\"false\" pour Telnet et administrer le routeur avec SSH."));
  }
  const encryption = attribute("securite > chiffrement", "protocole").toUpperCase();
  const bits = Number(attribute("securite > chiffrement", "bits"));
  const strongProtocols = ["AES", "AES-128", "AES-192", "AES-256", "CHACHA20-POLY1305"];
  if (!strongProtocols.includes(encryption) || !Number.isFinite(bits) || bits < 128) {
    findings.push(routerFinding("high", "Chiffrement insuffisant", `Protocole détecté : ${encryption || "absent"} ; taille de clé : ${Number.isFinite(bits) ? bits : "absente"} bits.`, "Utiliser un protocole fort, par exemple AES avec une clé d’au moins 128 bits."));
  }
  const sshEnabled = attribute("services > ssh", "enabled").toLowerCase();
  const sshVersion = attribute("services > ssh", "version");
  if (sshEnabled !== "true" || sshVersion !== "2") {
    findings.push(routerFinding("high", "SSH version 2 n’est pas explicitement imposé", `SSH activé : ${sshEnabled || "non déclaré"} ; version : ${sshVersion || "non déclarée"}.`, "Activer SSH et déclarer version=\"2\"."));
  }
  const sshPort = attribute("services > ssh", "port");
  if (sshPort === "22") {
    findings.push(routerFinding("medium", "Port SSH par défaut détecté", "Le port d’administration SSH est 22.", "Pour le critère pédagogique, utiliser un port documenté différent de 22. Ce changement complète, mais ne remplace pas, les contrôles d’accès."));
  }
  const adminProtocol = attribute("securite > administration", "protocole").toUpperCase();
  const adminPort = attribute("securite > administration", "port");
  if (adminProtocol !== "HTTPS") {
    findings.push(routerFinding("high", "Interface d’administration non chiffrée", `Protocole d’administration détecté : ${adminProtocol || "absent"}.`, "Utiliser HTTPS pour l’interface Web d’administration."));
  }
  if (["80", "443"].includes(adminPort)) {
    findings.push(routerFinding("medium", "Port Web d’administration par défaut détecté", `Port détecté : ${adminPort}.`, "Pour le critère pédagogique, choisir un port documenté différent des ports Web par défaut et restreindre l’accès par pare-feu."));
  }
  return findings;
}

function renderRouterAudit(findings) {
  const result = document.querySelector("#audit-result");
  result.replaceChildren();
  result.hidden = false;
  const isSafe = findings.length === 0;
  result.className = `audit-result ${isSafe ? "is-safe" : "is-risky"}`;
  const summary = document.createElement("div");
  summary.className = "audit-summary";
  const icon = document.createElement("span");
  icon.textContent = isSafe ? "✓" : "!";
  const summaryText = document.createElement("div");
  summaryText.textContent = isSafe ? "Aucune vulnérabilité détectée selon les règles pédagogiques configurées." : `${findings.length} constat(s) à examiner dans la configuration.`;
  summary.append(icon, summaryText);
  result.append(summary);
  findings.forEach((finding) => {
    const card = document.createElement("article");
    card.className = `audit-finding ${finding.level}`;
    const title = document.createElement("h3");
    title.textContent = `${finding.level === "high" ? "ÉLEVÉE" : finding.level === "medium" ? "MOYENNE" : "ERREUR"} · ${finding.title}`;
    const detail = document.createElement("p");
    detail.textContent = finding.detail;
    const recommendation = document.createElement("p");
    const prefix = document.createElement("strong");
    prefix.textContent = "Action : ";
    recommendation.append(prefix, finding.recommendation);
    card.append(title, detail, recommendation);
    result.append(card);
  });
}

function initializeRouterAudit() {
  const input = document.querySelector("#audit-input");
  const upload = document.querySelector("#audit-upload");
  const result = document.querySelector("#audit-result");
  document.querySelector("#load-risky-router").addEventListener("click", () => { input.value = routerAuditExamples.risky; result.hidden = true; });
  document.querySelector("#load-secure-router").addEventListener("click", () => { input.value = routerAuditExamples.secure; result.hidden = true; });
  document.querySelector("#run-router-audit").addEventListener("click", () => renderRouterAudit(auditRouterXml(input.value)));
  document.querySelector("#clear-audit-result").addEventListener("click", () => { result.hidden = true; result.replaceChildren(); });
  upload.addEventListener("change", async () => {
    const [file] = upload.files;
    if (!file) return;
    input.value = await file.text();
    result.hidden = true;
    upload.value = "";
  });
}

initializeRouterAudit();

const defaultTransportOffers = [
  { agency: "Major Transport", departure: "Libreville", destination: "Oyem", vehicle: "Bus", price: 14000 },
  { agency: "Major Transport", departure: "Libreville", destination: "Oyem", vehicle: "VIP", price: 22000 },
  { agency: "Major Transport", departure: "Libreville", destination: "Franceville", vehicle: "Bus", price: 19000 },
  { agency: "Major Transport", departure: "Libreville", destination: "Franceville", vehicle: "VIP", price: 28000 },
  { agency: "Major Transport", departure: "Libreville", destination: "Bitam", vehicle: "Bus", price: 16000 },
  { agency: "Transporteur du Sud", departure: "Libreville", destination: "Mouila", vehicle: "Bus", price: 10000 },
  { agency: "Transporteur du Sud", departure: "Libreville", destination: "Mouila", vehicle: "VIP", price: 15500 },
  { agency: "Transporteur du Sud", departure: "Libreville", destination: "Franceville", vehicle: "Bus", price: 17000 },
  { agency: "Transporteur du Sud", departure: "Libreville", destination: "Franceville", vehicle: "VIP", price: 26000 },
  { agency: "Compagnie Nationale de Transport", departure: "Libreville", destination: "Mouila", vehicle: "Bus", price: 11000 },
  { agency: "Compagnie Nationale de Transport", departure: "Libreville", destination: "Franceville", vehicle: "Bus", price: 18000 },
  { agency: "Compagnie Nationale de Transport", departure: "Libreville", destination: "Franceville", vehicle: "VIP", price: 25500 },
  { agency: "Compagnie Nationale de Transport", departure: "Libreville", destination: "Bitam", vehicle: "Bus", price: 15000 },
  { agency: "Compagnie Nationale de Transport", departure: "Libreville", destination: "Bitam", vehicle: "VIP", price: 23500 },
];
let transportOffers = [...defaultTransportOffers];

function formatTransportPrice(price) {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(price))} FCFA`;
}

function fillTransportSelect(select, values, preferred) {
  select.replaceChildren();
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    option.selected = value === preferred;
    select.append(option);
  });
}

function refreshTransportFilters() {
  const departure = document.querySelector("#transport-departure");
  const destination = document.querySelector("#transport-destination");
  const previousDeparture = departure.value;
  const previousDestination = destination.value;
  const departures = [...new Set(transportOffers.map((offer) => offer.departure))].sort();
  const destinations = [...new Set(transportOffers.map((offer) => offer.destination))].sort();
  fillTransportSelect(departure, departures, departures.includes(previousDeparture) ? previousDeparture : departures[0]);
  fillTransportSelect(destination, destinations, destinations.includes(previousDestination) ? previousDestination : destinations[0]);
}

function renderTransportTable(offers) {
  const body = document.querySelector("#transport-lines");
  body.replaceChildren();
  offers.sort((first, second) => first.price - second.price).forEach((offer) => {
    const row = document.createElement("tr");
    [offer.agency, `${offer.departure} → ${offer.destination}`, offer.vehicle, formatTransportPrice(offer.price)].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    });
    body.append(row);
  });
}

function runTransportSearch() {
  const operation = document.querySelector("#transport-operation").value;
  const departure = document.querySelector("#transport-departure").value;
  const destination = document.querySelector("#transport-destination").value;
  const vehicle = document.querySelector("#transport-vehicle").value;
  const summary = document.querySelector(".transport-summary div");
  const matches = transportOffers.filter((offer) => offer.departure === departure && offer.destination === destination && (!vehicle || offer.vehicle === vehicle));
  const heading = document.createElement("small");
  heading.textContent = "RÉSULTAT";
  const resultText = document.createElement("strong");
  summary.replaceChildren(heading, resultText);
  if (!matches.length) {
    resultText.textContent = "Aucune offre ne correspond à cette recherche.";
    renderTransportTable([]);
    return;
  }
  if (operation === "cheapest") {
    const best = [...matches].sort((first, second) => first.price - second.price)[0];
    resultText.textContent = `Le moins cher : ${best.agency} en ${best.vehicle}, à ${formatTransportPrice(best.price)}.`;
  } else if (operation === "average") {
    const average = matches.reduce((total, offer) => total + offer.price, 0) / matches.length;
    resultText.textContent = `Prix moyen ${departure} → ${destination} : ${formatTransportPrice(average)} (${matches.length} offre(s)).`;
  } else {
    resultText.textContent = `${matches.length} offre(s) comparée(s) pour ${departure} → ${destination}.`;
  }
  renderTransportTable(matches);
}

function parseTransportXml(xml) {
  const documentXml = new DOMParser().parseFromString(xml, "application/xml");
  if (documentXml.querySelector("parsererror")) throw new Error("Le fichier importé n’est pas un XML valide.");
  const agencies = [...documentXml.getElementsByTagName("agence")];
  const offers = agencies.flatMap((agency) => {
    const agencyName = agency.getAttribute("nom") || "Agence sans nom";
    const routes = [...agency.children].filter((child) => child.tagName === "trajet");
    return routes.flatMap((route) => [...route.children]
      .filter((child) => child.tagName === "offre")
      .map((offer) => ({
        agency: agencyName,
        departure: route.getAttribute("depart") || "",
        destination: route.getAttribute("arrivee") || "",
        vehicle: offer.getAttribute("vehicule") || "Non précisé",
        price: Number(offer.getAttribute("prix")),
      }))
      .filter((offer) => offer.departure && offer.destination && Number.isFinite(offer.price)));
  });
  if (!offers.length) throw new Error("Le XML ne contient aucune offre de transport exploitable.");
  return offers;
}

function initializeTransportTool() {
  const form = document.querySelector("#transport-form");
  const upload = document.querySelector("#transport-upload");
  const status = document.querySelector("#transport-status");
  form.addEventListener("submit", (event) => { event.preventDefault(); runTransportSearch(); });
  document.querySelector("#transport-departure").addEventListener("change", runTransportSearch);
  document.querySelector("#transport-destination").addEventListener("change", runTransportSearch);
  document.querySelector("#transport-vehicle").addEventListener("change", runTransportSearch);
  upload.addEventListener("change", async () => {
    const [file] = upload.files;
    if (!file) return;
    try {
      transportOffers = parseTransportXml(await file.text());
      refreshTransportFilters();
      status.textContent = `${transportOffers.length} offre(s) ont été importées depuis ${file.name}.`;
      runTransportSearch();
    } catch (error) {
      status.textContent = error.message;
    }
    upload.value = "";
  });
  refreshTransportFilters();
  runTransportSearch();
}

initializeTransportTool();
