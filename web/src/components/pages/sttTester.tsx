// REACT
import { useEffect, useRef, useState } from "react";

// MUI
import MicIcon from "@mui/icons-material/Mic";

// Coqui STT Wasm
// import { STT } from "./../../assets/js/stt_wasm";
// import {  } from "stt-wasm"
import { TestResultType } from "./../../helpers/testHelper";

// Workers
const DOWNSAMPLING_WORKER = "/downsampling.worker.js";
const STT_WORKER = "/stt.worker.js";

const sentences: string[] = [
  // "Hello, how are you?",
  // "My name is Josh, what's yours?",
  // "Hello world, said the program...",
  "Move pawn to alpha six",
  "Bishop takes pawn",
  "Pawn in echo four takes pawn",
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
    let _processor = aContext.createScriptProcessor(4096, 1, 1);
    if (!_processor) console.log("processor NOT AVAILABLE");
    if (_processor) {
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
      _processor.onaudioprocess = (event: AudioProcessingEvent) => {
        var data = event.inputBuffer.getChannelData(0);
        downsampler.postMessage({ command: "process", inputFrame: data });
      };
      _processor.connect(aContext.destination);
    }
    return _processor;
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
    // <>MicIcon</>
    <MicIcon
      color={recordingStatus ? "primary" : "secondary"}
      onClick={handleMicrophoneClick}
    />

    // <MicIcon
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
// Sentence Tester
//--------------------------------------------------------------
const SingleSentenceInference = (props: any) => {
  const rec = props.rec;
  console.log(rec);
  return (
    <div>
      <h4>{rec.sentence}</h4>
      <ClientAudio />
      {/* <InferenceEngine testSet={rec} /> */}
    </div>
  );
};

interface ISTTTesterProps {
  lc: string;
}

const STTTester = ({ lc }: ISTTTesterProps) => {
  // status string
  const [sttStatusText, setSttStatusText] = useState<string>("");
  const [sttReady, setSttReady] = useState<boolean>(false);
  const [sttError, setSttError] = useState<boolean>(false);

  // Prepare the test list with defaults (inc undefined yet ones, "" and -1 are used for them)
  const testSet: TestResultType[] = [];
  sentences.forEach((s) => {
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

  let sttRuntimeWorkerRef = useRef<Worker>();

  const modelFile: string = "/assets/models/" + lc + ".tflite";
  const scorerFile: string = "/assets/models/" + lc + ".scorer";
  const loc =
    window.location.protocol +
    "//" +
    window.location.hostname +
    ":" +
    window.location.port;

  //
  // Loaders
  //
  const loadModel = (modelFN: string) => {
    console.log("STT - Loading model: " + modelFN);

    const res = fetch(modelFN).then((response) => {
      if (!response.ok) {
        console.log("STT - Error reading the model file!");
        setSttStatusText("Error reading the model file: " + modelFN);
        setSttError(true);
      } else {
        // return response.arrayBuffer();
        response.arrayBuffer().then((modelData) =>
          sttRuntimeWorkerRef.current?.postMessage(
            {
              name: "load-model",
              params: {
                modelData,
              },
            },
            [modelData],
          ),
        );
      }
    });
  };

  const loadScorer = (scorerFN: any) => {
    console.log(`STT - Loading scorer`, scorerFN);

    const res = fetch(scorerFN).then((response) => {
      if (!response.ok) {
        console.log("STT - Error reading the scorer file!");
        setSttStatusText("Error reading the scorer file: " + scorerFN);
        setSttError(true);
      } else {
        // return response.arrayBuffer();
        response.arrayBuffer().then((scorerData) =>
          sttRuntimeWorkerRef.current?.postMessage(
            {
              name: "load-scorer",
              params: {
                scorerData,
              },
            },
            [scorerData],
          ),
        );
      }
    });
  };

  //
  // Message Handler
  //
  const processWorkerResponses = (event: any) => {
    if (!event || !event.data || !("name" in event.data)) {
      console.log(`Ignoring malformed event`, event);
      return;
    }

    let audioContext: AudioContext;

    switch (event.data.name) {
      case "stt-initialized":
        // Now that we know the WASM module is ready, we can load the model
        console.log("STT - stt-initialized");
        setSttStatusText("STT initialized, start loading model");
        loadModel(modelFile);
        break;
      case "stt-model-loaded":
        // Create an audio context for future processing.
        console.log("STT - stt-model-loaded");
        setSttStatusText("Model loaded, start loading scorer");
        audioContext = new AudioContext({
          // Use the model's sample rate so that the decoder will resample for us.
          sampleRate: event.data.params.modelSampleRate,
        });
        loadScorer(scorerFile);
        break;
      case "stt-scorer-loaded":
        // So we are ready
        console.log("STT - stt-scorer-loaded");
        setSttStatusText("Scorer loaded, STT is ready for inference.");
        setSttReady(true);
        break;
      case "stt-done":
        console.log("STT - stt-done");
        console.log("TRANSCRIPTION: " + event.data.params.transcription);
        console.log("ELAPSED TIME : " + event.data.params.elapsedTime);
        break;
    }
  };

  // Load InferenceEngine for the requested language
  useEffect(() => {
    if (!sttRuntimeWorkerRef.current) {
      sttRuntimeWorkerRef.current = new Worker(
        new URL(loc + STT_WORKER, import.meta.url),
      );
      sttRuntimeWorkerRef.current.onmessage = (e) => processWorkerResponses(e);
    }
  });

  return (
    <>
      <h3>Test For English Model</h3>
      {!sttReady ? (
        <div>Initializing STT: {sttStatusText}</div>
      ) : (
        <>
          <p>
            Press the microphone icon and speak the sentence aloud, then press
            it again to stop.
          </p>
          {testSet.map((t, index) => (
            <SingleSentenceInference key={index} rec={t} />
          ))}
        </>
      )}
    </>
  );
};

export { STTTester };
