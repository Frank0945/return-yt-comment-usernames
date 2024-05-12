const setElementsText = (ids) => {
  ids.forEach((id) => {
    const element = document.getElementById(id);
    element.textContent = chrome.i18n.getMessage(id);
  });
};

setElementsText([
  "title",
  "onlyShowUsername",
  "remind",
  "buymeacoffee",
  "contact",
]);

const hideHandleCheckbox = document.getElementById("hideHandle");
let initHideHandle = false;

chrome.storage.sync.get((data) => {
  console.log(data);
  if (data?.settings?.hideHandle !== undefined) {
    initHideHandle = data.settings.hideHandle;
    hideHandleCheckbox.checked = data.settings.hideHandle;
  }
});

hideHandleCheckbox.addEventListener("change", function () {
  chrome.storage.sync.set({
    settings: {
      hideHandle: this.checked,
    },
  });
  if (this.checked !== initHideHandle) {
    document.getElementById("remind").style.display = "block";
  } else {
    document.getElementById("remind").style.display = "none";
  }
});
