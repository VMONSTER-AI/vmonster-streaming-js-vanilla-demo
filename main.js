import vmonsterRoom from "vmonster-streaming-js";
import { fetchStreams } from "./api.js";

let room = null;
let sttResult = "";

const videoStyle = {
  borderRadius: "20px",
  width: "100%",
  height: "100%",
  backgroundColor: "none",
  objectFit: "cover",
};

function logClient(text) {
  console.log(`[Client] - ${text}`);
}

function updateJoinStatus(isJoined) {
  document.getElementById("joinStatus").textContent = isJoined
    ? "Joined!"
    : "Not Joined..";
}

function updateSpeakingStatus(isAgentSpeaking) {
  document.getElementById("speakingStatus").textContent = isAgentSpeaking
    ? "Agent is Speaking!"
    : "Agent is not Speaking..";
}

function setupEventListeners() {
  room.on("joining", () => {
    logClient("joining...");
  });
  room.on("joined", () => {
    room.addVideo(videoStyle);

    updateJoinStatus(true);
    updateSpeakingStatus(false);
  });
  room.on("join-timeout", () => {
    logClient("join-timeout");
  });

  room.on("agent-message", (msg) => {
    logClient(msg);
  });

  room.on("agent-start-speaking", () => {
    updateSpeakingStatus(true);
  });

  room.on("agent-stop-speaking", () => {
    updateSpeakingStatus(false);
  });

  room.on("left", () => {
    logClient("connection closed");
    room.removeVideo();
    updateJoinStatus(false);
    updateSpeakingStatus(false);
    document.getElementById("textInput").value = "";
    document.getElementById("sttResult").style.display = "none";
    sttResult = "";
  });
}

document.getElementById("joinBtn").addEventListener("click", async () => {
  const languageInput = document.getElementById("languageInput").value;
  const backgroundInput = document.getElementById("backgroundInput");
  const positionXInput = document.getElementById("positionXInput").value;
  const positionYInput = document.getElementById("positionYInput").value;
  const scaleInput = document.getElementById("scaleInput").value;

  let background = null;
  if (backgroundInput.files.length > 0) {
    const file = backgroundInput.files[0];
    const useAsBlob = confirm("Treat as Blob? Cancel for File.");

    if (useAsBlob) {
      const newBlob = new Blob([file], { type: file.type });
      background = newBlob;
    } else {
      background = file;
    }
  }

  room = new vmonsterRoom({
    serverUrl: import.meta.env.VITE_SERVER_URL,
  });

  try {
    const response = await fetchStreams(
      languageInput,
      background || null,
      positionXInput || null,
      positionYInput || null,
      scaleInput || null
    );

    setupEventListeners();
    await room.join({
      sessionId: response.session_id,
      streamId: response.stream_id,
      token: response.token,
    });

    document.getElementById("backgroundInput").value = null;
    document.getElementById("positionXInput").value = null;
    document.getElementById("positionYInput").value = null;
    document.getElementById("scaleInput").value = null;
    document.getElementById("languageDiv").style.display = "none";
  } catch (error) {
    logClient("join error..");
    console.error(error);
  }
});

document.getElementById("speakBtn").addEventListener("click", async () => {
  const text = document.getElementById("textInput").value;
  const backgroundInput = document.getElementById("backgroundInput");
  const positionXInput = document.getElementById("positionXInput").value;
  const positionYInput = document.getElementById("positionYInput").value;
  const scaleInput = document.getElementById("scaleInput").value;

  let background = null;
  if (backgroundInput.files.length > 0) {
    const file = backgroundInput.files[0];
    const useAsBlob = confirm("Treat as Blob? Cancel for File.");

    if (useAsBlob) {
      const newBlob = new Blob([file], { type: file.type });
      background = newBlob;
    } else {
      background = file;
    }
  }

  try {
    await room.speak({
      text: text,
      background: background || null,
      positionX: positionXInput || null,
      positionY: positionYInput || null,
      scale: scaleInput || null,
    });
    document.getElementById("textInput").value = "";
    document.getElementById("backgroundInput").value = null;
    document.getElementById("positionXInput").value = null;
    document.getElementById("positionYInput").value = null;
    document.getElementById("scaleInput").value = null;
  } catch (error) {
    console.error(error);
  }
});
document
  .getElementById("stopSpeakingBtn")
  .addEventListener("click", async () => {
    try {
      await room.stopSpeaking();
    } catch (error) {
      console.error(error);
    }
  });

document.getElementById("leaveBtn").addEventListener("click", () => {
  room.leave();
  document.getElementById("languageDiv").style.display = "block";
});

document.getElementById("addVideoBtn").addEventListener("click", () => {
  room.addVideo(videoStyle);
});

document.getElementById("removeVideoBtn").addEventListener("click", () => {
  room.removeVideo();
});

document.getElementById("logAgentStateBtn").addEventListener("click", () => {
  logClient(room.agentState());
});

document.getElementById("logRoomStateBtn").addEventListener("click", () => {
  logClient(room.roomState());
});

document.getElementById("startRecordBtn").addEventListener("click", () => {
  room.startRecordingAudio();
});

document.getElementById("stopRecordBtn").addEventListener("click", async () => {
  try {
    const blob = await room.stopRecordingAudio();
    const text = await room.stt(blob, "ko");
    sttResult = text;
    if (sttResult.trim() !== "") {
      document.getElementById("sttText").textContent = text;
      document.getElementById("sttResult").style.display = "block";
    }
  } catch (error) {
    console.error(error);
  }
});
