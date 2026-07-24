const stage = document.getElementById('hero-logo-3d');
const desktopLogo = window.matchMedia('(min-width: 861px)');
let logoInstance = null;
let loading = false;

async function loadLogo() {
  if (!stage || !desktopLogo.matches || logoInstance || loading) return;
  loading = true;

  try {
    const { mountHeroLogo } = await import('./flowstate-3d/hero-logo-3d.js');
    if (!desktopLogo.matches) return;
    stage.classList.remove('is-fallback');
    logoInstance = mountHeroLogo(stage);
  } catch (error) {
    stage.classList.add('is-fallback');
    console.warn('The interactive hero logo could not be loaded.', error);
  } finally {
    loading = false;
  }
}

function onBreakpointChange() {
  if (logoInstance) {
    logoInstance.dispose();
    logoInstance = null;
  }
  if (desktopLogo.matches) loadLogo();
}

if (stage) {
  if (desktopLogo.matches) loadLogo();
  desktopLogo.addEventListener('change', onBreakpointChange);

  const onPageHide = (event) => {
    if (event.persisted) return;
    desktopLogo.removeEventListener('change', onBreakpointChange);
    logoInstance?.dispose();
    window.removeEventListener('pagehide', onPageHide);
  };

  window.addEventListener('pagehide', onPageHide);
}
