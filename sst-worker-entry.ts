// This entry forwards to the OpenNext-generated worker
// We use a relative path at runtime; SST bundles this file.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import worker from "./.open-next/worker.js";

export default worker;