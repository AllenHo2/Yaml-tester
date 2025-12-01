// import * as sst from "@serverless-stack/resources";

// export default function MyStack({ stack }: sst.StackContext) {
//   // Create a new HTTP API
//   const api = new sst.Api(stack, "Api", {
//     routes: {
//       "GET /": "functions/lambda.handler",
//     },
//   });

//   // Deploy a React static site and link it to the API
//   const site = new sst.ReactStaticSite(stack, "ReactSite", {
//     path: "frontend",
//     environment: {
//       REACT_APP_API_URL: api.url,
//     },
//   });

//   // Link the site to the API
//   stack.addOutputs({
//     API: api.url,
//     SITE: site.url,
//   });
// }
// ``` [7, 6]
