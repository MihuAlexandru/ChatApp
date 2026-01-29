export async function loadTemplate() {
  const response = await fetch("templates/contact-template.tpl");
  const html = await response.text();
  document.body.insertAdjacentHTML("beforeend", html);
}

export async function loadChatTemplate() {
  const response = await fetch("templates/chat-template.tpl");
  const html = await response.text();
  document.body.insertAdjacentHTML("beforeend", html);
}
