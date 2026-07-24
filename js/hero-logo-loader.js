const stage = document.getElementById('hero-logo-3d');
const desktopLogo = window.matchMedia('(min-width: 861px)');
let logoInstance = null;
let loading = false;

async function loadLogo() {
  if (!stage || logoInstance || loading) return;
  loading = true;

  try {
    const { mountHeroLogo } = await import('./flowstate-3d/hero-logo-3d.js');
    stage.classList.remove('is-fallback');
    logoInstance = mountHeroLogo(stage, {
      backgroundMode: !desktopLogo.matches,
    });
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
  loadLogo();
}

if (stage) {
  loadLogo();
  desktopLogo.addEventListener('change', onBreakpointChange);

  const onPageHide = (event) => {
    if (event.persisted) return;
    desktopLogo.removeEventListener('change', onBreakpointChange);
    logoInstance?.dispose();
    window.removeEventListener('pagehide', onPageHide);
  };

  window.addEventListener('pagehide', onPageHide);
}
