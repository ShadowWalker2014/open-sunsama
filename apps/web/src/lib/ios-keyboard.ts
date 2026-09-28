/**
 * iOS raises the keyboard only for a `focus()` made while handling the tap.
 * A sheet whose field mounts later (its code still downloading, say) focuses
 * too late and opens with no keyboard. Call this from the tap handler: it
 * focuses an invisible input so the keyboard comes up now, and the sheet's own
 * `focus()` then moves it to the real field — iOS keeps the keyboard up when
 * focus moves between fields.
 */
export function raiseKeyboardForTap(): void {
  if (typeof window === "undefined") return;
  if (!window.matchMedia?.("(pointer: coarse)").matches) return;

  const proxy = document.createElement("input");
  proxy.type = "text";
  proxy.tabIndex = -1;
  proxy.setAttribute("aria-hidden", "true");
  // 16px keeps iOS from zooming in. It must stay rendered (no display:none)
  // or focus() does nothing.
  proxy.style.cssText =
    "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;border:0;padding:0;font-size:16px;pointer-events:none;";
  document.body.appendChild(proxy);
  proxy.focus({ preventScroll: true });

  proxy.addEventListener("blur", () => proxy.remove(), { once: true });
  // If the sheet never takes focus (its download failed), drop the keyboard
  // rather than leave it typing into nothing.
  window.setTimeout(() => {
    if (document.activeElement === proxy) proxy.blur();
    proxy.remove();
  }, 6000);
}
