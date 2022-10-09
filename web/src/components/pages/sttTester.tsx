// REACT
import { useEffect, useRef, useState } from "react";

// Coqui STT Wasm
// import { STT } from "./../../assets/js/stt_wasm";
// import {  } from "stt-wasm"
import { TestResultType } from "./../../helpers/testHelper";

// Workers
const DOWNSAMPLING_WORKER = "/downsampling.worker.js";
const STT_WORKER = "/stt.worker.js";

const sentences: string[] = [
  "Hello, how are you?",
  "My name is Josh, what's yours?",
  "Hello world, said the program...",
];

//--------------------------------------------------------------
// ClientAudio Component
//--------------------------------------------------------------
const ClientAudio = (props: any) => {
  const [recordingStatus, setRecordingStatus] = useState<boolean>(false);

  // ref
  const isMounted = useRef(true);

  // state - Media/Audio
  const [audioContext, setAudioContext] = useState<AudioContext | undefined>(
    undefined,
  );
  const [mediaStream, setMediaStream] = useState<MediaStream | undefined>(
    undefined,
  );
  const [mediaStreamSource, setMediaStreamSource] = useState<
    MediaStreamAudioSourceNode | undefined
  >(undefined);
  const [processor, setProcessor] = useState<ScriptProcessorNode | undefined>(
    undefined,
  );

  // localVars
  let aContext: AudioContext;
  //let mStream: MediaStream;
  let mStreamSource: MediaStreamAudioSourceNode;
  let proc: ScriptProcessorNode;

  //
  // Function: createAudioProcessor
  //
  const createAudioProcessor = (
    aContext: AudioContext,
    aSource: MediaStreamAudioSourceNode,
  ) => {
    // debugSocketVoice && console.log("WA: Creating Audio Processor");
    if (aContext === undefined) console.log("audioContext NOT AVAILABLE");
    let lProcessor = aContext.createScriptProcessor(4096, 1, 1);
    if (!lProcessor) console.log("processor NOT AVAILABLE");
    if (lProcessor) {
      // debugSocketVoice && console.log("WA: Created Processor");
      const sampleRate = mStreamSource.context.sampleRate;
      const loc =
        window.location.protocol +
        "//" +
        window.location.hostname +
        ":" +
        window.location.port;
      const downsampler = new Worker(
        new URL(loc + DOWNSAMPLING_WORKER, import.meta.url),
      );
      downsampler.postMessage({
        command: "init",
        inputSampleRate: sampleRate,
      });
      downsampler.onmessage = (e) => {
        // if (socket.connected) {
        //   socket.emit("stream-data", e.data.buffer);
        // }
      };
      lProcessor.onaudioprocess = (event: AudioProcessingEvent) => {
        var data = event.inputBuffer.getChannelData(0);
        downsampler.postMessage({ command: "process", inputFrame: data });
      };
      lProcessor.connect(aContext.destination);
    }
    return lProcessor;
  };
  //
  // Function: startMicrophone
  //
  const startMicrophone = () => {
    // debugSocketVoice && console.log("WA: Starting Microphone");
    aContext = new AudioContext();
    setAudioContext(aContext);

    // SUCCESS function: User Media Obtained
    const success = (stream: MediaStream) => {
      // debugSocketVoice && console.log("WA: Starting Recording");
      // mStream = stream;
      setMediaStream(stream);
      mStreamSource = aContext.createMediaStreamSource(stream);
      setMediaStreamSource(mStreamSource);
      proc = createAudioProcessor(aContext, mStreamSource);
      setProcessor(proc);
      mStreamSource.connect(proc);
    };

    // FAIL function: User Media could not be obtained
    const fail = (e: MediaStreamError) => {
      // debugSocketVoice && console.error("WA: Recording failure-", e);
      // setTimedError(intl.get("err.recordingfailure", { msg: e.message }), 3000);
    };

    // TRY TO ACCESS USER MEDIA
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // debugSocketVoice && console.log("WA: TRYING SECURE");
      navigator.mediaDevices
        .getUserMedia({
          video: false,
          audio: true,
        })
        .then(success)
        .catch(fail);
    } else if (navigator.getUserMedia) {
      // This will not work with modern browsers
      // debugSocketVoice && console.log("WA: TRYING: navigator.getUserMedia");
      navigator.getUserMedia(
        {
          video: false,
          audio: true,
        },
        success,
        fail,
      );
    } else {
      // debugSocketVoice && console.log("WA: NO MIC AVAILABLE");
    }
    //return null;
  };

  //
  // Function: startRecording
  //
  const startRecording = () => {
    // debugSocketVoice && console.log("WA: Prep for recording");
    setRecordingStatus(true);
    startMicrophone();
  };

  //
  // Function: stopMicrophone
  //
  const stopMicrophone = () => {
    // debugSocketVoice && console.log("WA: stopMicrophone");
    if (mediaStream) {
      mediaStream.getTracks()[0].stop();
    }
    if (mediaStreamSource) {
      mediaStreamSource.disconnect();
    }
    if (processor) {
      //processor.shutdown();
    }
    if (audioContext) {
      audioContext.close();
    }
  };

  //
  // Function: stopRecording
  //
  const stopRecording = () => {
    // debugSocketVoice && console.log("WA: stopRecording");
    if (recordingStatus) {
      // if (socket?.connected) {
      //   socket.emit("stream-reset");
      // }
      //clearInterval(recordingInterval as NodeJS.Timeout); // TO-TEST
      setRecordingStatus(false);
      stopMicrophone();
    }
  };

  useEffect(() => {
    // debugSocketVoice && console.log("ClientAudio - USEEFFECT");
  }, []);

  // cleanup
  useEffect(() => {
    return () => {
      //stopRecording();
      // debugSocketVoice && console.log("ClientAudio - Unmount Cleanup");
      setAudioContext(undefined);
      setMediaStream(undefined);
      setMediaStreamSource(undefined);
      setProcessor(undefined);
      isMounted.current = false;
    };
  }, []);

  //
  // Click Handler
  //
  const handleMicrophoneClick = () => {
    // debugSocketVoice && console.log("MIC-Click");
    if (isMounted && !recordingStatus) {
      startRecording();
    } else if (isMounted && recordingStatus) {
      stopRecording();
    }
    // if (isMounted && connectedStatus && !recordingStatus) {
    //   startRecording();
    // } else if (isMounted && connectedStatus && recordingStatus) {
    //   stopRecording();
    // }
  };

  return (
    <>MicIcon</>
    // <MicrophoneIcon
    //   title={
    //     recordingStatus
    //       ? intl.get("ui.clientaudio.title.recording")
    //       : intl.get("ui.clientaudio.title.notrecording")
    //   }
    //   className={connectedStatus ? "svIconButton" : "svIconButtonDisabled"}
    //   /* size={iconSize} */
    //   color={recordingStatus ? iconActiveColor : iconButtonPassiveColor}
    //   onClick={handleMicrophoneClick}
    // />
  );
}; // client audio

//--------------------------------------------------------------
// InferenceEngine Component
//--------------------------------------------------------------
const InferenceEngine = (params: any) => {
  const testSet: TestResultType = params;
  const lc: string = testSet.lc;

  // TODO - Load async from remote
  const modelFile: string = "/assets/models/" + lc + "/" + lc + ".tflite";
  const scorerFile: string = "/assets/models/" + lc + "/" + lc + ".scorer";

  // Init Worker
  let audioContext: AudioContext;
  const loc =
    window.location.protocol +
    "//" +
    window.location.hostname +
    ":" +
    window.location.port;
  var sttRuntimeWorker: Worker = new Worker(
    new URL(loc + STT_WORKER, import.meta.url),
  );
  sttRuntimeWorker.onmessage = (e) => processWorkerResponses(e);

  //
  // Message Handler
  //
  const processWorkerResponses = (event: any) => {
    if (!event || !event.data || !("name" in event.data)) {
      console.log(`Ignoring malformed event`, event);
      return;
    }

    switch (event.data.name) {
      case "stt-initialized":
        // Now that we know the WASM module is ready, we can load the model
        loadModel(modelFile);
        break;
      case "stt-model-loaded":
        // Create an audio context for future processing.
        audioContext = new AudioContext({
          // Use the model's sample rate so that the decoder will resample for us.
          sampleRate: event.data.params.modelSampleRate,
        });
        loadScorer(scorerFile);
        break;

      //   case "stt-model-loaded":
      //     {
      //       // Create an audio context for future processing.
      //       audioContext = new AudioContext({
      //         // Use the model's sample rate so that the decoder will resample for us.
      //         sampleRate: event.data.params.modelSampleRate,
      //       });

      //       const scorerInput = document.getElementById("scorerpicker");
      //       scorerInput.addEventListener(
      //         "change",
      //         (e) => loadScorer(e.target.files[0]),
      //         false,
      //       );
      //       scorerInput.disabled = false;

      //       // Now that a model is available, enable opening the audio file.
      //       const audioInput = document.getElementById("audiopicker");
      //       audioInput.addEventListener(
      //         "change",
      //         (e) => processAudio(e.target.files[0]),
      //         false,
      //       );
      //       audioInput.disabled = false;
      //     }
      //     break;

      //   case "stt-done":
      //     {
      //       document.getElementById("result").textContent =
      //         event.data.params.transcription;
      //       document.getElementById("elapsedSeconds").textContent =
      //         event.data.params.elapsedTime;
      //     }
      //     break;
    }
  };

  const loadModel = (modelFile: any) => {
    console.log(`Loading model`, modelFile);

    let reader = new FileReader();
    reader.onload = (e) => {
      const modelData: Uint8Array = new Uint8Array(
        reader.result as ArrayBuffer,
      );
      sttRuntimeWorker.postMessage(
        {
          name: "load-model",
          params: {
            modelData,
          },
        },
        [modelData.buffer],
      );
    };
    reader.readAsArrayBuffer(modelFile);
  };

  function loadScorer(scorerFile: any) {
    console.log(`Loading scorer`, scorerFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      const scorerData: Uint8Array = new Uint8Array(
        reader.result as ArrayBuffer,
      );
      sttRuntimeWorker.postMessage(
        {
          name: "load-scorer",
          params: {
            scorerData,
          },
        },
        [scorerData.buffer],
      );
    };
    reader.readAsArrayBuffer(scorerFile);
  }

  const inference_worker = new Worker(STT_WORKER);

  return <></>;
};

const SingleSentenceInference = (props: any) => {
  const rec: TestResultType = props;

  return (
    <div>
      <h4>{rec.sentence}</h4>
      <ClientAudio />
      <InferenceEngine testSet={rec} />
    </div>
  );
};

const STTTester = (props: any) => {
  const lc = props;

  // Prepare the test list with defaults (inc undefined yet ones, "" and -1 are used for them)
  const testSet: TestResultType[] = [];
  sentences.map((s) => {
    testSet.push({
      lc: lc,
      projectId: 0,
      sentence: s,
      // following unknown yet
      inferred: "",
      cer: -1,
      wer: -1,
      similarity: -1,
      audioSecs: -1,
      inferenceSecs: -1,
      rtf: -1,
    });
  });

  let i: number = 0;

  return (
    <>
      <h3>Test For English Model</h3>
      <p>
        Press the microphone icon and speak the sentence aloud, then press it
        again to stop.
      </p>
      {testSet.map((t) => (
        <SingleSentenceInference key={i++} rec={t} />
      ))}
    </>
  );
};

export { STTTester };
