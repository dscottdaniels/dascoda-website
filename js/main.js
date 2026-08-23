const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

const CONTACT_SUBMITTED_KEY = "dascoda_contact_submitted";
const contactForm = document.querySelector(".contact-page form");

const trackGaEvent = (eventName) => {
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, {
      form_name: "contact",
    });
  }
};

if (contactForm) {
  let contactFormStarted = false;
  const markContactFormStarted = () => {
    if (contactFormStarted) return;
    contactFormStarted = true;
    trackGaEvent("contact_form_start");
  };

  contactForm.addEventListener("focusin", markContactFormStarted);
  contactForm.addEventListener("change", markContactFormStarted);

  contactForm.addEventListener("submit", () => {
    try {
      window.sessionStorage.setItem(CONTACT_SUBMITTED_KEY, "true");
    } catch (error) {
      // Analytics should never interfere with the FormSubmit POST.
    }

    trackGaEvent("contact_form_submit");
  });
}

if (window.location.pathname === "/thank-you" || window.location.pathname === "/thank-you.html") {
  try {
    if (window.sessionStorage.getItem(CONTACT_SUBMITTED_KEY) === "true") {
      trackGaEvent("contact_form_success");
      window.sessionStorage.removeItem(CONTACT_SUBMITTED_KEY);
    }
  } catch (error) {
    // Ignore storage restrictions so the thank-you page still loads normally.
  }
}

document.querySelectorAll("[data-founder-photo]").forEach((image) => {
  const markMissing = () => image.classList.add("is-missing");

  if (image.complete && image.naturalWidth === 0) {
    markMissing();
  }

  image.addEventListener("error", markMissing);
});

const rotatingHero = document.querySelector("[data-rotating-hero]");

if (rotatingHero) {
  const slides = Array.from(rotatingHero.querySelectorAll("[data-hero-slide]"));
  const industryLabel = rotatingHero.querySelector("[data-hero-industry-label]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const tabletViewport = window.matchMedia("(max-width: 980px)");
  const mobileViewport = window.matchMedia("(max-width: 640px)");
  const heroItems = [
    {
      label: "HOSPITALITY",
      image: "assets/images/Hospitality Hero Image.png",
      desktopPosition: "68% center",
      tabletPosition: "64% center",
      mobilePosition: "62% center",
    },
    {
      label: "MULTIFAMILY / MDU",
      image: "assets/images/Multifamily Hero Image.png",
      desktopPosition: "62% center",
      tabletPosition: "58% center",
      mobilePosition: "56% center",
    },
    {
      label: "COMMERCIAL REAL ESTATE",
      image: "assets/images/Commercial Hero Image.png",
      desktopPosition: "64% center",
      tabletPosition: "60% center",
      mobilePosition: "58% center",
    },
    {
      label: "HEALTHCARE",
      image: "assets/images/Healthcare Hero Image.png",
      desktopPosition: "66% center",
      tabletPosition: "62% center",
      mobilePosition: "60% center",
    },
    {
      label: "MANUFACTURING & DISTRIBUTION",
      image: "assets/images/Manufacturing Hero Image.png",
      desktopPosition: "62% center",
      tabletPosition: "58% center",
      mobilePosition: "57% center",
    },
    {
      label: "MULTI-SITE OPERATIONS",
      image: "assets/images/Multi-Site Hero Image.png",
      desktopPosition: "58% center",
      tabletPosition: "55% center",
      mobilePosition: "52% center",
    },
  ];

  let activeIndex = 0;
  let activeSlide = 0;
  let nextPreload = null;

  const getPosition = (item) => {
    if (mobileViewport.matches) return item.mobilePosition;
    if (tabletViewport.matches) return item.tabletPosition;
    return item.desktopPosition;
  };

  const setSlide = (slide, item) => {
    slide.style.backgroundImage = `url("${item.image}")`;
    slide.style.backgroundPosition = getPosition(item);
  };

  const preloadNext = (index) => {
    const nextItem = heroItems[(index + 1) % heroItems.length];
    nextPreload = new Image();
    nextPreload.src = nextItem.image;
  };

  const updateLabel = (item) => {
    if (!industryLabel) return;

    industryLabel.classList.add("is-changing");
    window.setTimeout(() => {
      industryLabel.textContent = item.label;
      industryLabel.classList.remove("is-changing");
    }, 280);
  };

  const updateVisiblePosition = () => {
    const currentItem = heroItems[activeIndex];
    slides[activeSlide].style.backgroundPosition = getPosition(currentItem);
  };

  if (slides.length >= 2) {
    setSlide(slides[0], heroItems[0]);
    preloadNext(0);

    if (!reduceMotion.matches) {
      window.setInterval(() => {
        const nextIndex = (activeIndex + 1) % heroItems.length;
        const nextSlide = activeSlide === 0 ? 1 : 0;
        const nextItem = heroItems[nextIndex];

        setSlide(slides[nextSlide], nextItem);
        slides[nextSlide].classList.add("is-active");
        slides[activeSlide].classList.remove("is-active");
        updateLabel(nextItem);

        activeIndex = nextIndex;
        activeSlide = nextSlide;
        preloadNext(activeIndex);
      }, 4000);
    }

    window.addEventListener("resize", updateVisiblePosition);
  }
}

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
