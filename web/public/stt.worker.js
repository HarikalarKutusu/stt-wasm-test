// eslint-disable-next-line no-undef
importScripts(["lib/stt_wasm.js"]);

const Lib = {
  locateFile: (file) => `lib/${file}`,
  onRuntimeInitialized: () => {
    // The STT Module is ready. Tell the web page.
    postMessage({ name: "stt-initialized" });
  },
  mainScriptUrlOrBlob: "stt_wasm.js",
};

var activeModel;
var stt;

// eslint-disable-next-line no-undef
STT(Lib).then((module) => {
  stt = module;
});

// https://stackoverflow.com/q/33738873/261698
function converFloat32ToInt16(buffer) {
  return Int16Array.from(buffer, (x) => x * 32767);
}

function loadModel(modelData) {
  activeModel = new stt.Model(modelData);
  const modelSampleRate = activeModel.getSampleRate();
  console.log(`STT.WORKER - Model sample rate: ${modelSampleRate}`);

  postMessage({
    name: "stt-model-loaded",
    params: {
      modelSampleRate,
    },
  });
}

function loadScorer(scorerData) {
  activeModel.enableExternalScorer(scorerData);
  console.log("STT.WORKER - Scorer loaded");
  postMessage({
    name: "stt-scorer-loaded",
    params: {},
  });
}

function processAudio(audioBuffer) {
  const processedAudio = converFloat32ToInt16(audioBuffer);

  // Convert the `processedAudio` to something that can be passed
  // across the WASM boundaries.
  const toPass = new stt.VectorShort();
  processedAudio.forEach((e) => toPass.push_back(e));

  const now = Date.now();
  const result = activeModel.speechToText(toPass);
  const elapsedSeconds = (Date.now() - now) / 1000;

  console.log(`STT.WORKER - Transcription: ${result}`);
  console.log(`STT.WORKER - Elapsed: ${elapsedSeconds} seconds`);

  postMessage({
    name: "stt-done",
    params: {
      transcription: result,
      elapsedTime: elapsedSeconds,
    },
  });
}

function processWorkerRequests(event) {
  if (
    !event ||
    event.type != "message" ||
    !event.data ||
    !("name" in event.data)
  ) {
    console.error(`STT.WORKER - Malformed event submitted to worker ${event}`);
    return;
  }

  switch (event.data.name) {
    case "load-model":
      console.log("STT.WORKER - load-model");
      loadModel(event.data.params.modelData);
      break;
    case "load-scorer":
      console.log("STT.WORKER - load-scorer");
      loadScorer(event.data.params.scorerData);
      break;
    case "process-audio":
      console.log("STT.WORKER - process-audio");
      processAudio(event.data.params.audioBuffer);
      break;
    default:
  }
}

onmessage = (e) => processWorkerRequests(e);
