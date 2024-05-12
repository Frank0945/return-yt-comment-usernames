/**
 * Inject interception function into the website.
 */
const setIntercept = () => {
  const s = document.createElement("script");
  s.src = chrome.runtime.getURL("js/injected.js");
  s.type = "module";

  s.onload = async function () {
    (this as any).remove();
  };
  (document.head || document.documentElement).appendChild(s);
};

const getSettings = async () => {
  const storage = await chrome.storage.sync.get("settings");

  window.localStorage.setItem(
    "hideHandle",
    // default to false if not set
    storage?.settings?.hideHandle ?? false
  );
};

getSettings().finally(() => setIntercept());

console.log("[return-yt-comment-usernames]: Loaded successfully");
