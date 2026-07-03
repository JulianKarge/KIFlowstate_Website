/* KIFlowstate mobile card snapping powered by Swiper (MIT).
 * Native scroll-snap was inconsistent on real phones; Swiper gives a controlled
 * one-card-per-swipe carousel with momentum settling and no free linear drift.
 */
(function () {
  "use strict";

  const BREAKPOINT = "(max-width: 900px) and (hover: none), (max-width: 900px) and (pointer: coarse)";
  const instances = new WeakMap();

  function shouldUse() {
    return typeof window.Swiper === "function" && window.matchMedia(BREAKPOINT).matches;
  }

  function destroy(root) {
    const instance = instances.get(root);
    if (!instance) return;
    instance.destroy(true, true);
    instances.delete(root);
    root.classList.remove("kif-mobile-swiper", "swiper");
    const wrapper = root.querySelector(".swiper-wrapper");
    if (wrapper) wrapper.classList.remove("swiper-wrapper");
    root.querySelectorAll(".swiper-slide").forEach((slide) => slide.classList.remove("swiper-slide"));
  }

  function mount({ root, rail, slides, prev, next, dots }) {
    if (!root || !rail || !slides || !slides.length) return null;
    if (!shouldUse()) {
      destroy(root);
      return null;
    }

    const existing = instances.get(root);
    if (existing && !existing.destroyed) return existing;

    root.classList.add("kif-mobile-swiper", "swiper");
    rail.classList.add("swiper-wrapper");
    slides.forEach((slide) => slide.classList.add("swiper-slide"));

    const swiper = new window.Swiper(root, {
      slidesPerView: "auto",
      centeredSlides: true,
      centeredSlidesBounds: true,
      roundLengths: true,
      speed: 430,
      threshold: 8,
      resistanceRatio: 0.45,
      longSwipes: true,
      longSwipesRatio: 0.18,
      longSwipesMs: 220,
      followFinger: true,
      touchReleaseOnEdges: false,
      watchSlidesProgress: true,
      spaceBetween: 15,
      slidesOffsetAfter: 12,
      slideToClickedSlide: true,
      nested: true,
      preventClicks: true,
      preventClicksPropagation: true,
      on: {
        init(instance) {
          updateControls(instance, prev, next, dots);
        },
        slideChange(instance) {
          updateControls(instance, prev, next, dots);
        },
        resize(instance) {
          if (!shouldUse()) destroy(root);
          else updateControls(instance, prev, next, dots);
        }
      }
    });

    if (prev) prev.addEventListener("click", () => swiper.slidePrev());
    if (next) next.addEventListener("click", () => swiper.slideNext());
    if (dots && dots.length) {
      dots.forEach((dot, index) => {
        dot.addEventListener("click", () => swiper.slideTo(index));
      });
    }

    instances.set(root, swiper);
    updateControls(swiper, prev, next, dots);
    return swiper;
  }

  function updateControls(swiper, prev, next, dots) {
    if (!swiper || swiper.destroyed) return;
    if (prev) prev.disabled = swiper.isBeginning;
    if (next) next.disabled = swiper.isEnd;
    if (dots && dots.length) {
      dots.forEach((dot, index) => {
        const active = index === swiper.activeIndex;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-current", active ? "true" : "false");
      });
    }
  }

  function mountKiNewsItems(root, rail) {
    root = root || document.querySelector('.ki-items-wrap[data-rail="items"]');
    rail = rail || (root && root.querySelector(".ki-items-rail"));
    if (!root || !rail) return null;
    return mount({
      root,
      rail,
      slides: Array.from(rail.querySelectorAll(".ki-item")),
      prev: root.querySelector(".ki-rail-prev"),
      next: root.querySelector(".ki-rail-next"),
      dots: []
    });
  }

  function mountInvoice() {
    const root = document.querySelector("[data-invoice-carousel]");
    const rail = document.getElementById("invoice-capability-rail");
    if (!root || !rail) return null;
    return mount({
      root,
      rail,
      slides: Array.from(rail.querySelectorAll(".invoice-capability-card")),
      prev: document.querySelector("[data-invoice-capability-prev]"),
      next: document.querySelector("[data-invoice-capability-next]"),
      dots: Array.from(document.querySelectorAll("[data-invoice-capability-dot]"))
    });
  }

  window.KIMobileCardSwipers = {
    shouldUse,
    mountKiNewsItems,
    mountInvoice
  };

  window.addEventListener("resize", () => {
    mountKiNewsItems();
    mountInvoice();
  });

  document.addEventListener("DOMContentLoaded", () => {
    mountInvoice();
    mountKiNewsItems();
  });
})();
