"use strict";

const flagsElement = document.getElementById("flags");
const textsToChange = document.querySelectorAll("[data-section]");
const burger = document.getElementById("burger");
const themeToggle = document.getElementById("themeToggle");
const downloadCvLink = document.getElementById("downloadCv");

const cvByLanguage = {
  es: "drc_cv_es.pdf",
  en: "drc_cv_en.pdf",
};

const techBadges = {
  js: { label: { es: "JavaScript", en: "JavaScript" }, icon: "fa-brands fa-js" },
  docker: { label: { es: "Docker", en: "Docker" }, icon: "fa-brands fa-docker" },
  cloudflare: { label: { es: "Cloudflare", en: "Cloudflare" }, icon: "fa-solid fa-cloud" },
  go: { label: { es: "Go (proxy)", en: "Go (proxy)" }, icon: "fa-brands fa-golang" },
  python: { label: { es: "Python", en: "Python" }, icon: "fa-brands fa-python" },
  vision: { label: { es: "Visión", en: "Computer vision" }, icon: "fa-solid fa-camera" },
  face: { label: { es: "Face ID", en: "Face ID" }, icon: "fa-solid fa-user" },
  ml: { label: { es: "ML", en: "ML" }, icon: "fa-solid fa-brain" },
  scanner: { label: { es: "Scanner", en: "Scanner" }, icon: "fa-solid fa-barcode" },
  diff: { label: { es: "Diff", en: "Diff" }, icon: "fa-solid fa-code-branch" },
  tooling: { label: { es: "Tooling", en: "Tooling" }, icon: "fa-solid fa-screwdriver-wrench" },
  esp32: { label: { es: "ESP32", en: "ESP32" }, icon: "fa-solid fa-microchip" },
  espnow: { label: { es: "ESP-NOW", en: "ESP-NOW" }, icon: "fa-solid fa-tower-broadcast" },
  iot: { label: { es: "IoT", en: "IoT" }, icon: "fa-solid fa-wifi" },
  embedded: { label: { es: "Embebido", en: "Embedded" }, icon: "fa-solid fa-gears" },
  edge: { label: { es: "Edge", en: "Edge" }, icon: "fa-solid fa-network-wired" },
  data: { label: { es: "Data", en: "Data" }, icon: "fa-solid fa-database" },
  paper: { label: { es: "Paper", en: "Paper" }, icon: "fa-solid fa-file-lines" },
};

function renderBadges(tagIds, language) {
  return (tagIds || [])
    .filter((id) => techBadges[id])
    .map((id) => {
      const b = techBadges[id];
      const label = b.label?.[language] ?? b.label?.en ?? id;
      return `<span class="badge-tech"><i class="${b.icon}" aria-hidden="true"></i>${label}</span>`;
    })
    .join("");
}

function renderProjects(projectsDict, language) {
  const grid = document.getElementById("projectsGrid");
  if (!grid) return;

  const items = projectsDict?.items || [];

  grid.innerHTML = items
    .map((p) => {
      const tagsHtml = renderBadges(p.tags, language);
      const demoBtn = p.demo
        ? `<a class="btn small" href="${p.demo}" target="_blank" rel="noopener noreferrer">${projectsDict.btnDemo}</a>`
        : "";

      return `
        <article class="project-card">
          <h4 class="project-title">${p.name}</h4>
          <p class="project-desc">${p.desc}</p>
          <div class="tags">${tagsHtml}</div>
          <div class="project-actions">
            <a class="btn small primary" href="${p.repo}" target="_blank" rel="noopener noreferrer">${projectsDict.btnRepo}</a>
            ${demoBtn}
          </div>
        </article>
      `;
    })
    .join("");
}

function setActiveFlag(lang) {
  const buttons = flagsElement?.querySelectorAll("[data-language]") ?? [];
  buttons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.language === lang));
}

async function changeLanguage(language) {
  const requestJSON = await fetch(`languages/${language}.json`, { cache: "no-store" });
  const texts = await requestJSON.json();

  for (const el of textsToChange) {
    const section = el.dataset.section;
    const value = el.dataset.value;
    const translated = texts?.[section]?.[value];
    if (translated !== undefined) el.innerHTML = translated;
  }

  if (downloadCvLink && cvByLanguage[language]) {
    downloadCvLink.href = cvByLanguage[language];
  }

  if (texts.projects) {
    renderProjects(texts.projects, language);
  }

  document.documentElement.lang = language;
  localStorage.setItem("lang", language);
  setActiveFlag(language);
}

function initLanguage() {
  const saved = localStorage.getItem("lang");
  const browserPrefersEn = (navigator.language || "").toLowerCase().startsWith("en");
  const defaultLang = saved || (browserPrefersEn ? "en" : "es");
  changeLanguage(defaultLang);
}

function toggleNav() {
  const isOpen = document.body.classList.toggle("nav-open");
  burger?.setAttribute("aria-expanded", String(isOpen));
}

function closeNav() {
  document.body.classList.remove("nav-open");
  burger?.setAttribute("aria-expanded", "false");
}

function initNav() {
  if (!burger) return;

  burger.addEventListener("click", toggleNav);

  // Cerrar al click en un link
  document.querySelectorAll('nav a[href^="#"]').forEach((a) => {
    a.addEventListener("click", closeNav);
  });

  // ESC cierra menú
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNav();
  });
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved) {
    document.body.classList.toggle("theme-dark", saved === "dark");
    return;
  }

  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.body.classList.toggle("theme-dark", prefersDark);
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("theme-dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

function initSkillsAnimation() {
  const skills = document.querySelectorAll(".skill");
  if (!skills.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      }
    },
    { threshold: 0.25 }
  );

  skills.forEach((s) => io.observe(s));
}

function initActiveSectionNav() {
  const nav = document.querySelector("nav[data-nav]") || document.getElementById("primary-nav");
  if (!nav) return;

  const navLinks = Array.from(nav.querySelectorAll('a[href^="#"]'));
  if (!navLinks.length) return;

  const linkByHash = new Map(navLinks.map((a) => [a.getAttribute("href"), a]));

  const sections = Array.from(document.querySelectorAll("section[id]")).filter((sec) =>
    linkByHash.has(`#${sec.id}`)
  );
  if (!sections.length) return;

  const setActive = (id) => {
    navLinks.forEach((a) => {
      const isActive = a.getAttribute("href") === `#${id}`;
      a.classList.toggle("is-active", isActive);
      if (isActive) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  };

  // Si hay hash inicial, respétalo
  if (location.hash && linkByHash.has(location.hash)) {
    setActive(location.hash.slice(1));
  }

  // Scrollspy robusto:
  // - threshold: 0 (primer pixel)
  // - rootMargin crea una “franja” activa en el centro del viewport
  const observer = new IntersectionObserver(
    (entries) => {
      // Nos quedamos con la entrada que esté intersectando (en la franja central)
      const entry = entries.find((e) => e.isIntersecting);
      if (entry?.target?.id) setActive(entry.target.id);
    },
    {
      threshold: 0,
      // Top y bottom negativos => "encogen" el viewport efectivo a una banda central
      rootMargin: "-45% 0px -50% 0px",
    }
  ); 

  sections.forEach((sec) => observer.observe(sec));

  window.addEventListener("hashchange", () => {
    if (location.hash && linkByHash.has(location.hash)) {
      setActive(location.hash.slice(1));
    }
  });
}


/* Selector de idioma (click robusto + teclado) */
if (flagsElement) {
  flagsElement.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-language]");
    if (!btn) return;
    changeLanguage(btn.dataset.language);
  });

  flagsElement.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const btn = e.target.closest("[data-language]");
    if (!btn) return;
    e.preventDefault();
    changeLanguage(btn.dataset.language);
  });
}

themeToggle?.addEventListener("click", toggleTheme);

initNav();
initTheme();
initLanguage();
initSkillsAnimation();
initActiveSectionNav();
