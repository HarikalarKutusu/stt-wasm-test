/* config-overrides.js */
/* eslint-disable react-hooks/rules-of-hooks */
const { useBabelRc, override, overrideDevServer } = require("customize-cra");
const path = require("path");

// module.exports = function override(config, env) {
//   const wasmExtensionRegExp = /\.wasm$/;

//   config.resolve.extensions.push(".wasm");

//   config.module.rules.forEach((rule) => {
//     (rule.oneOf || []).forEach((oneOf) => {
//       if (oneOf.loader && oneOf.loader.indexOf("file-loader") >= 0) {
//         // make file-loader ignore WASM files
//         oneOf.exclude.push(wasmExtensionRegExp);
//       }
//     });
//   });

//   // add a dedicated loader for WASM
//   config.module.rules.push({
//     test: wasmExtensionRegExp,
//     include: path.resolve(__dirname, "src"),
//     use: [{ loader: require.resolve("wasm-loader"), options: {} }],
//   });

//   config.devServerConfig.headers.push({
//     "Access-Control-Allow-Origin": "*",
//     "Cross-Origin-Opener-Policy": "same-origin",
//     "Cross-Origin-Embedder-Policy": "require-corp",
//   });

//   return config;
// };

// https://github.com/arackaf/customize-cra/issues/176
// https://gist.github.com/Dexterp37/4f8347d8b5f733af56ad1d1fa820a643
const devServerConfig = () => (config) => {
  return {
    ...config,
    // port: 9005,
    // index: "index.html",
    // historyApiFallback: true,
    // watchOptions: { aggregateTimeout: 300, poll: 1000 },
    headers: {
      //   "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      //   "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
      //   "Access-Control-Allow-Origin": "http://localhost:9005",
      "Access-Control-Allow-Origin": "*",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    //   "": "",
    },
    
  };
};

module.exports = {
  devServer: overrideDevServer(devServerConfig()),
};

// module.exports = override(useBabelRc());
