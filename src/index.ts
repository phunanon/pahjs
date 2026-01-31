import { InitGame, Render } from './game';

function fitCanvasToWindow(ctx: CanvasRenderingContext2D) {
  const dpr = window.devicePixelRatio || 1;

  // CSS size (layout)
  const cssWidth  = window.innerWidth;
  const cssHeight = window.innerHeight;

  // Backing store size (actual pixels)
  ctx.canvas.width  = Math.round(cssWidth  * dpr);
  ctx.canvas.height = Math.round(cssHeight * dpr);

  // Ensure the canvas fills the viewport
  ctx.canvas.style.width  = cssWidth  + "px";
  ctx.canvas.style.height = cssHeight + "px";

  const t = ctx.getTransform();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.transform(t.a, t.b, t.c, t.d, t.e, t.f);
}

async function createApp() {
  const canvas = document.querySelector('canvas');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) {
    alert('Canvas element not found');
    return;
  }

  canvas.style.touchAction = 'none';

  const onResize = () => {
    fitCanvasToWindow(ctx);
    Render(ctx);
  };

  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onResize, { passive: true });

  fitCanvasToWindow(ctx);

  await InitGame(ctx);
  const loop = () => {
    Render(ctx);
    requestAnimationFrame(loop);
  };

  loop();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createApp);
} else {
  createApp();
}
