// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "cloudflare-test",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "cloudflare",
    };
  },
  async run() {
    const worker = new sst.cloudflare.Worker("NextjsWorker", {
      handler: "sst-worker-entry.ts",
      url: true,
      assets: {
        directory: ".open-next/assets",
      },
    });

    return {
      url: worker.url,
    };
  },
});