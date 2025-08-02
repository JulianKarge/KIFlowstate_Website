document.addEventListener("DOMContentLoaded", () => {
  /* ▸ Dynamic copyright year */
  const yearElement = document.getElementById("year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  /* ▸ Mobile‑nav toggle */
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.querySelector(".nav-links");

  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("open");
    hamburger.classList.toggle("is-active");
  });

  /* ▸ Smooth‑scroll for internal links */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", e => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
        // close mobile nav after click
        navLinks.classList.remove("open");
        hamburger.classList.remove("is-active");
      }
    });
  });

  /* ▸▸ LANGUAGE SWITCHER ------------------------------------------------ */
  const langDeBtn = document.getElementById('lang-de');
  const langEnBtn = document.getElementById('lang-en');

  const setLanguage = (lang) => {
    // Set active button style
    langDeBtn.classList.toggle('active', lang === 'de');
    langEnBtn.classList.toggle('active', lang === 'en');

    // Update HTML lang attribute
    document.documentElement.lang = lang;

    // Translate all elements with data-translate attribute
    document.querySelectorAll('[data-translate]').forEach(element => {
      const key = element.getAttribute('data-translate');
      if (translations[lang][key]) {
        // Use innerHTML to allow for HTML tags in translations
        element.innerHTML = translations[lang][key];
      }
    });

    // Re-insert dynamic year after translation
    if (document.getElementById("year")) {
      document.getElementById("year").textContent = new Date().getFullYear();
    }
  };

  langDeBtn.addEventListener('click', () => setLanguage('de'));
  langEnBtn.addEventListener('click', () => setLanguage('en'));

  // Set initial language to German
  setLanguage('de');
});