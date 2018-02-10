//@flow

import type { Viewport } from './Viewport';
import Rectangle from './Rectangle';

const windowViewport = (wnd: any): Viewport => ({
  listenToScroll(listener: () => void): () => void {
    wnd.addEventListener('scroll', listener);
    return () => {
      wnd.removeEventListener('scroll', listener);
    };
  },

  getRectangle(): Rectangle {
    return new Rectangle(0, wnd.innerHeight);
  }
});

export default windowViewport(window);
