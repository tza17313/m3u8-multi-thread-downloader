const { parentPort } = require("worker_threads");

parentPort.on(
  "message",
  require("./downloadFileAndSave")(
    (res) => {
      parentPort.postMessage(res);
    },
    (error) => {
      parentPort.postMessage(error);
    }
  )
);
