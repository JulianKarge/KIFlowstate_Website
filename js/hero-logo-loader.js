const stage = document.getElementById('hero-logo-3d');
const desktopLogo = window.matchMedia('(min-width: 861px)');
let logoInstance = null;
let loading = false;
let disposed = false;

async function loadLogo() {
  if (!stage || logoInstance || loading || disposed) return;
  loading = true;
  let mountedMode;

  try {
    const { mountHeroLogo } = await import('./flowstate-3d/hero-logo-3d.js?v=performance-20261013');
    if (disposed) return;
    mountedMode = !desktopLogo.matches;
    const instance = await mountHeroLogo(stage, {
      backgroundMode: mountedMode,
    });
    if (disposed || mountedMode !== !desktopLogo.matches) {
      instance.dispose();
    } else {
      logoInstance = instance;
      stage.classList.remove('is-fallback');
    }
  } catch (error) {
    stage.classList.add('is-fallback');
    console.warn('The interactive hero logo could not be loaded.', error);
  } finally {
    loading = false;
    if (!disposed && mountedMode !== undefined && mountedMode !== !desktopLogo.matches) loadLogo();
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
    disposed = true;
    desktopLogo.removeEventListener('change', onBreakpointChange);
    logoInstance?.dispose();
    window.removeEventListener('pagehide', onPageHide);
  };

  window.addEventListener('pagehide', onPageHide);
}
