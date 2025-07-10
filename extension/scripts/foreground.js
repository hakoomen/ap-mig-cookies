/**
 * @import { Message, Serializable } from "../shared"
 */

function main() {
  document.addEventListener("DOMContentLoaded", () => {
    const migrateBtn = document.querySelector("#migrate-btn");
    /** @type {HTMLInputElement} */
    const isDevCb = document.querySelector("#is-dev-cb");
    migrateBtn.addEventListener("click", async (e) => {
      migrateBtn.setAttribute("disabled", true);
      await migrate(isDevCb.checked);
      migrateBtn.removeAttribute("disabled");
    });
  });
}

async function getCurrentTab() {
  const tab = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab.at(0);
}

/**
 * @template {Serializable} TReturn
 * @param {Omit<Message, "tabId">} message
 * @returns {Promise<TReturn>}
 */
async function sendMessage(message) {
  const tab = await getCurrentTab();
  return await chrome.runtime.sendMessage({
    ...message,
    tabId: tab.id,
  });
}

/**
 * @param {boolean} isDev
 */
async function migrate(isDev) {
  setStatus("migrating...");
  try {
    await sendMessage({
      action: "migrate",
      payload: {
        isDev,
      },
    });
    setStatus("migrated!");
  } catch (e) {
    console.error(e);
    setStatus("an error has occurred!");
  } finally {
    setTimeout(() => {
      setStatus("");
    }, 1000);
  }
}

/**
 * @param {string} text
 */
function setStatus(text) {
  const statusP = /** @type {HTMLParagraphElement} */ (
    document.querySelector("#status")
  );
  statusP.innerText = text;
}

main();
