/**
 * Synthetic pointer events for the swipe tests. A real touch would make the browser track the
 * pointer; a dispatched event has no active pointer, so `setPointerCapture` would throw
 * "NotFoundError", so a no-op stands in for capture while the gesture runs.
 */
export async function swipe(
  element: HTMLElement,
  fraction: number,
  /** Time between the first move and the release. A flick is fast; a slow drag is not. */
  holdMs = 0,
): Promise<void> {
  // The handlers read `currentTarget`, which may be an ancestor of `element`, so the stand-in
  // goes on the prototype for the length of the gesture.
  const proto = Element.prototype;
  const { setPointerCapture, releasePointerCapture } = proto;
  proto.setPointerCapture = () => {};
  proto.releasePointerCapture = () => {};
  try {
    await gesture(element, fraction, holdMs);
  } finally {
    proto.setPointerCapture = setPointerCapture;
    proto.releasePointerCapture = releasePointerCapture;
  }
}

async function gesture(element: HTMLElement, fraction: number, holdMs: number) {
  const box = element.getBoundingClientRect();
  const y = box.top + box.height / 2;
  const startX = box.left + box.width / 2;
  const endX = startX + box.width * fraction;

  const fire = (type: string, x: number) =>
    element.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: 7,
        pointerType: 'touch',
        isPrimary: true,
        button: 0,
        clientX: x,
        clientY: y,
      }),
    );

  fire('pointerdown', startX);
  fire('pointermove', startX + (endX - startX) / 2);
  fire('pointermove', endX);
  if (holdMs > 0) await pause(holdMs);
  fire('pointerup', endX);
}

/** Sleeps in the page, for the "nothing happened" assertions. */
export const pause = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
