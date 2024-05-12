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
setIntercept();

console.log("[return-yt-comment-usernames]: Loaded successfully");
