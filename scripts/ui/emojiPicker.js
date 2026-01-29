/// adaugare emojis
/// avem event listener pentru click pe selectorul de emojis
/// si dam insert in input cand apasam

export function wireEmojiPicker({
  inputId = "chat-input",
  menuSelector = ".dropdown-menu",
  emojiSelector = ".emoji",
} = {}) {
  const input = document.getElementById(inputId);
  const menu = document.querySelector(menuSelector);

  if (!input || !menu) {
    console.warn("Emoji picker: input or menu not found");
    return;
  }

  menu.addEventListener("click", (e) => {
    const emojiEl = e.target.closest(emojiSelector);
    if (!emojiEl) return;

    const emoji = emojiEl.textContent;
    if (!emoji) return;

    insertAtCursor(input, emoji);
  });
}

/// introduce emoji oriunde ai apasat in input (inceput, mijloc, sfarsit)
export function insertAtCursor(inputEl, textToInsert) {
  if (!inputEl) return;

  const start = inputEl.selectionStart ?? inputEl.value.length;
  const end = inputEl.selectionEnd ?? inputEl.value.length;

  const before = inputEl.value.slice(0, start);
  const after = inputEl.value.slice(end);

  inputEl.value = before + textToInsert + after;

  const newPos = start + textToInsert.length;
  inputEl.setSelectionRange(newPos, newPos);

  inputEl.focus();
}
