/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  dev: {
    port: 8002,
  },
  tailwind: true,
  cacheDirectory: "./node_modules/.cache/remix",
  ignoredRouteFiles: ["**/.*"],
  serverModuleFormat: "cjs",
  serverDependenciesToBundle: [
    /^remix-utils.*/,
    "marked",
    "axios",
    "@trigger.dev/core",
    "@trigger.dev/core-backend",
    "@trigger.dev/sdk",
    "@trigger.dev/billing",
    "@trigger.dev/yalt",
    "emails",
    "highlight.run",
    "random-words",
    "superjson",
    "prismjs/components/prism-json",
    "prismjs/components/prism-typescript",
  ],
  browserNodeBuiltinsPolyfill: { modules: { path: true, os: true, crypto: true } },
  watchPaths: async () => {
    return [
      "../../packages/core/src/**/*",
      "../../packages/core-backend/src/**/*",
      "../../packages/trigger-sdk/src/**/*",
      "../../packages/yalt/src/**/*",
      "../../packages/emails/src/**/*",
    ];
  },
};
