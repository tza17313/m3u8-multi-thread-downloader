const { AsyncResource } = require("async_hooks");
const { EventEmitter } = require("events");
const path = require("path");
const { Worker } = require("worker_threads");
const kTaskInfo = Symbol("kTaskInfo");
const kWorkerFreedEvent = Symbol("kWorkerFreedEvent");
const utils = require("../lib/utils");

class WorkerPoolTaskInfo extends AsyncResource {
  constructor(callback) {
    super("WorkerPoolTaskInfo");
    this.callback = callback;
  }

  done(err, result) {
    this.runInAsyncScope(this.callback, null, result);
    this.emitDestroy(); // `TaskInfo`s are used only once.
  }
}
class WorkerPool extends EventEmitter {
  constructor(numThreads) {
    super();
    this.numThreads = numThreads;
    this.workers = [];
    this.freeWorkers = [];
    this.setMaxListeners(numThreads);

    this.errorCallback = function (worker) {
      return (err) => {
        // In case of an uncaught exception: Call the callback that was passed to
        // `runTask` with the error.
        if (worker[kTaskInfo]) worker[kTaskInfo].done(err, { error: err });
        else this.emit("error", err);
        // Remove the worker from the list and start a new Worker to replace the
        // current one.
        this.workers.splice(this.workers.indexOf(worker), 1);
        this.addNewWorker();
        // 也需要触发重新消费
        this.emit(kWorkerFreedEvent);
      };
    };

    this.successCallback = function (worker) {
      return (result) => {
        // In case of success: Call the callback that was passed to `runTask`,
        // remove the `TaskInfo` associated with the Worker, and mark it as free
        // again.
        worker[kTaskInfo].done(null, result);
        worker[kTaskInfo] = null;
        this.freeWorkers.push(worker);
        this.emit(kWorkerFreedEvent);
      };
    };

    utils.log("已初始化线程池，线程数量为: " + this.numThreads);
    for (let i = 0; i < numThreads; i++) this.addNewWorker();
  }

  addNewWorker() {
    const worker = new Worker(path.resolve(__dirname, "./task_processor.js"));
    worker.on("message", this.successCallback(worker));
    worker.on("error", this.errorCallback(worker));
    this.workers.push(worker);
    this.freeWorkers.push(worker);
  }

  runTask(task, callback) {
    if (this.freeWorkers.length === 0) {
      // No free threads, wait until a worker thread becomes free.
      this.once(kWorkerFreedEvent, () => {
        this.runTask(task, callback);
      });
      return;
    }

    const worker = this.freeWorkers.pop();
    worker[kTaskInfo] = new WorkerPoolTaskInfo(callback);
    worker.postMessage(task);
    // 这里很快会将所有的worker消费完
  }

  close() {
    for (const worker of this.workers) worker.terminate();
  }
}

module.exports = WorkerPool;
