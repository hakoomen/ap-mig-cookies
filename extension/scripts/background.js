/** @import { Message, EnvMode } from "../shared" */

/**
 * @param {EnvMode} env
 */
function getEnvironmentConfig(env) {
  const domain = {
    local: "localhost:3000",
    dev: "pwa-dev.tasn.ir",
    "prod-com": "m.asanpardakht.com",
    "prod-ir": "m.asanpardakht.ir",
  }[env];
  return { domain };
}

/**
 * @async
 * @param {EnvMode} env
 * @returns {Promise<chrome.cookies.Cookie[]>}
 */
async function getCookies(env) {
  const { domain } = getEnvironmentConfig(env);
  return new Promise((resolve) => {
    chrome.cookies.getAll({ domain }, (cookies) => {
      resolve(cookies);
    });
  });
}

/**
 * Read the entire page-localStorage as an object.
 * @param {number} tabId
 * @param {string} key
 */
async function readPageLocalStorage(tabId, key) {
  const [injection] = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: (key) => {
      return localStorage.getItem(key);
    },
    args: [key],
  });
  return injection.result;
}

/**
 * @param {number} tabId
 * @param {Record<string, string>} items
 */
async function writePageLocalStorage(tabId, items) {
  await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: (data) => {
      for (const [k, v] of Object.entries(data)) {
        localStorage.setItem(k, v);
      }
    },
    args: [items],
  });
}

/**
 * @param {number} tabId
 * @param {EnvMode} env
 */
async function migrateTokensOnTab(tabId, env) {
  const targetCookies = /**@type {const} */ ([
    "access_token",
    "refresh_token",
    "embedded_token",
    "lightweight_token",
  ]);
  const cookies = await getCookies(env);
  const authData = JSON.parse(
    (await readPageLocalStorage(tabId, "auth_data")) ?? "{}"
  );

  for (const targetCookie of targetCookies) {
    const foundCookie = cookies.find((v) => v.name === targetCookie);
    if (!foundCookie) {
      continue;
    }
    await chrome.cookies.remove({
      name: targetCookie,
      url: `https://${foundCookie.domain}`,
      storeId: foundCookie.storeId,
    });

    authData[targetCookie] = foundCookie.value;
  }

  // remove logical flag added to identify authenticated users
  delete authData["isAuthenticated"];

  await writePageLocalStorage(tabId, { auth_data: JSON.stringify(authData) });
}

chrome.runtime.onMessage.addListener(
  (/** @type {Message} */ msg, sender, sendResponse) => {
    if (msg.action === "migrate") {
      migrateTokensOnTab(msg.tabId, msg.payload.isDev).then(sendResponse);
      return true;
    }
  }
);
