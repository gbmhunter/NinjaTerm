/**
 * Returns true if the keyboard event originated from an editable element (input, textarea,
 * select, or contenteditable). Used to suppress plain-letter app shortcuts while the user
 * is typing into a form field.
 */
export function isTypingInField(event: React.KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  if (!target) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}
