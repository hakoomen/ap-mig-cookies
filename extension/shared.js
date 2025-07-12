/**
 * @exports
 * @typedef {Record<string, string | number | boolean>} Serializable
 */

/**
 * @exporta
 * @typedef { "local" | "dev" | "prod-com" | "prod-id" } EnvMode
 */

/**
 * @exports
 * @typedef {{action: "migrate", payload: {env: EnvMode}} & {tabId: number}} Message
 */
