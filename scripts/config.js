export const STORAGE_KEY = "chat-app-contacts-v1";

export const WS_URL = "ws://localhost:8080";

const AVATARS_BY_ID = {
  1: "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava1-bg.webp",
  2: "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava2-bg.webp",
  3: "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava3-bg.webp",
  4: "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava4-bg.webp",
  5: "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava5-bg.webp",
  6: "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava6-bg.webp",
};

const DEFAULT_AVATAR = AVATARS_BY_ID[1];

export function getMyAvatar(userId) {
  return AVATARS_BY_ID[userId] ?? DEFAULT_AVATAR;
}
