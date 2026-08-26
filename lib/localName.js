const KEY = "nexus:display-name";

/** The free-text name someone types into "Your name" — remembered per browser, not an account. */
export function getLocalName() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(KEY) || "";
}

export function setLocalName(name) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, name);
}
