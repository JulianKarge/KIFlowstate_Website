document.addEventListener("DOMContentLoaded", () => {
  /* ▸ Dynamic copyright year */
  document.getElementById("year").textContent = new Date().getFullYear();

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
});
