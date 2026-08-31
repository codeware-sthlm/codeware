/**
 * Decide whether an anchor click should be handled by the router.
 *
 * An internal link is a real `<a href>` so the browser keeps everything it
 * gives for free — middle-click, "open in new tab", "copy link address",
 * crawlers. Intercepting *every* click throws that away, so only a plain
 * left-click is taken over; anything the user modified is left to the browser.
 *
 * @example
 * ```tsx
 * <a href="/posts" onClick={(e) => { if (!handleAsRoute(e)) return; navigate('/posts'); }}>
 * ```
 *
 * @returns `true` when the router should handle it — `preventDefault` has
 * already been called. `false` when the browser should.
 */
export function handleAsRoute(event: React.MouseEvent<HTMLAnchorElement>) {
  // Modified clicks mean "open elsewhere"; button !== 0 is middle/right click
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.defaultPrevented
  ) {
    return false;
  }

  event.preventDefault();
  return true;
}
