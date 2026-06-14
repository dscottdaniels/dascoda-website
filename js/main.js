const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

const contactForm = document.querySelector("[data-contact-form]");
const formMessage = document.querySelector("[data-form-message]");

if (contactForm && formMessage) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    formMessage.classList.add("is-visible");
    contactForm.reset();
  });
}

document.querySelectorAll("[data-founder-photo]").forEach((image) => {
  const markMissing = () => image.classList.add("is-missing");

  if (image.complete && image.naturalWidth === 0) {
    markMissing();
  }

  image.addEventListener("error", markMissing);
});

const revealTargets = document.querySelectorAll(
  ".section, .card, .split, .cta-band, .visual-placeholder, .page-visual"
);

revealTargets.forEach((element, index) => {
  element.classList.add("reveal");
  if (element.classList.contains("industry-card")) {
    element.style.transitionDelay = `${Math.min(index * 35, 180)}ms`;
  }
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

revealTargets.forEach((element) => revealObserver.observe(element));
