//@flow

import type { Viewport } from './Viewport';
import Rectangle from './Rectangle';

const windowViewport = (wnd: typeof window): Viewport => ({
  listenToScroll(listener: () => void): () => void {
    wnd.addEventListener('scroll', listener);
    return () => {
      wnd.removeEventListener('scroll', listener);
    };
  },

  getRectangle(): Rectangle {
    return new Rectangle(0, wnd.innerHeight);
  },

  scrollBy(offset) {
    const past = window.scrollY;
    window.scrollBy(0, offset);
    const next = window.scrollY;
    console.log('Actual scroll', next - past);
  }
});

export default windowViewport(window);
