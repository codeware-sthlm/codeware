/** Platform-aware shortcut label for UI hints. */
export function paletteShortcutLabel(): string {
  const isMac =
    typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);
  return isMac ? '⌘K' : 'Ctrl K';
}
