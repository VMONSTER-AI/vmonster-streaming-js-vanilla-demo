import vmonsterRoom from "vmonster-streaming-js";
import { fetchStreams } from "./api.js";
import OpenAI from "openai";

// Store your OpenAI API key in the .env file to enable chat
const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

let room = null;
let sttResult = "";

const videoStyle = {
  borderRadius: "20px",
  width: "100%",
  height: "100%",
  backgroundColor: "none",
  objectFit: "cover",
};

function logText(text) {
  console.log(`[vmonster-streaming-js] - ${text}`);
}

function setupEventListeners() {
  if (!room) {
    return;
  }
  room.on("joining", () => {
    logText("Joining...");
  });
  room.on("joined", () => {
    if (!room) {
      return;
    }
    room.addVideo(videoStyle);
    logText("Joined!");
  });

  room.on("aiavatar-message", (msg) => {
    logText(`AI Avatar message: ${msg}`);
  });

  room.on("aiavatar-start-speaking", () => {
    logText("AI Avatar start speaking");
  });

  room.on("aiavatar-stop-speaking", () => {
    logText("AI Avatar stop speaking");
  });

  room.on("left", () => {
    if (!room) {
      return;
    }
    logText("connection closed");
    room.removeVideo();
    document.getElementById("speakInput").value = "";
    document.getElementById("chatInput").value = "";
    document.getElementById("sttResult").style.display = "none";
    sttResult = "";
  });
}

function getConfigs() {
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

  return {
    background,
    positionX: positionXInput || null,
    positionY: positionYInput || null,
    scale: scaleInput || null,
  };
}

function clearInputFields() {
  document.getElementById("speakInput").value = "";
  document.getElementById("chatInput").value = "";
  document.getElementById("backgroundInput").value = null;
  document.getElementById("positionXInput").value = null;
  document.getElementById("positionYInput").value = null;
  document.getElementById("scaleInput").value = null;
}

async function handleSpeak({ text }) {
  try {
    if (!room) {
      return;
    }
    const settings = getConfigs();
    if (!settings) {
      return;
    }

    await room.speak({
      text: text,
      ...settings,
    });

    clearInputFields();
  } catch (error) {
    console.error(error);
  }
}

// function that returns an async iterable for the OpenAI response
// You can implement additional buffer processing for natural speech synthesis.
const getOpenAiDeltaAsyncIterable = (response) => {
  // Adjust STREAM_SPEAK_THRESHOLD for your purpose.
  // If it's shorter, faster speech synthesis is possible. If it's longer, more natural speech synthesis is possible.
  const STREAM_SPEAK_THRESHOLD = 10;

  let buffer = "";
  return {
    async *[Symbol.asyncIterator]() {
      try {
        for await (const chunk of response) {
          if (chunk.choices[0]?.delta?.content) {
            buffer += chunk.choices[0].delta.content;
            if (buffer.length > STREAM_SPEAK_THRESHOLD) {
              yield buffer;
              buffer = "";
            }
          }
        }
        if (buffer.length > 0) {
          yield buffer;
        }
      } catch (error) {
        console.error("Error processing stream with async iterator:", error);
      }
    },
  };
};

async function handleChat({ text, isStream = false }) {
  try {
    if (text === "") {
      return;
    }
    const settings = getConfigs();

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "당신은 도움이 되는 AI 어시스턴트입니다.",
        },
        { role: "user", content: text || "안녕하세요!" },
      ],
      stream: isStream,
    });

    if (isStream) {
      // Streaming
      const textStream = getOpenAiDeltaAsyncIterable(response);
      await room.speak({
        isStream: true,
        stream: textStream,
        ...settings,
      });
    } else {
      // Non-Streaming
      text = response.choices[0].message.content;
      await room.speak({
        text: text,
        ...settings,
      });
    }
    clearInputFields();
  } catch (error) {
    console.error(error);
  }
}

document.getElementById("joinBtn").addEventListener("click", async () => {
  const languageInput = document.getElementById("languageInput").value;
  const settings = getConfigs();

  room = new vmonsterRoom({
    serverUrl: import.meta.env.VITE_SERVER_URL,
  });
  try {
    const response = await fetchStreams(
      languageInput,
      settings.background,
      settings.positionX,
      settings.positionY,
      settings.scale
    );
    setupEventListeners();
    await room.join({
      sessionId: response.session_id,
      streamId: response.stream_id,
      token: response.token,
    });
    clearInputFields();
    document.getElementById("languageDiv").style.display = "none";
  } catch (error) {
    logText("join error..");
    console.error(error);
  }
});

document.getElementById("speakBtn").addEventListener("click", async () => {
  const text = document.getElementById("speakInput").value;
  await handleSpeak({ text });
});

document
  .getElementById("speakInput")
  .addEventListener("keypress", async (event) => {
    if (event.key === "Enter") {
      const text = document.getElementById("speakInput").value;
      await handleSpeak({ text });
    }
  });

document.getElementById("streamChatBtn").addEventListener("click", async () => {
  const text = document.getElementById("chatInput").value;
  const isStream = document.getElementById("streamCheck").checked;
  await handleChat({ text, isStream });
});

document
  .getElementById("chatInput")
  .addEventListener("keypress", async (event) => {
    if (event.key === "Enter") {
      const text = document.getElementById("chatInput").value;
      const isStream = document.getElementById("streamCheck").checked;
      await handleChat({ text, isStream });
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

document.addEventListener("DOMContentLoaded", function () {
  const settingsToggle = document.getElementById("withSettings");
  const settingsPanel = document.getElementById("settings");
  settingsPanel.style.display = settingsToggle.checked ? "block" : "none";
  settingsToggle.addEventListener("change", function () {
    settingsPanel.style.display = this.checked ? "block" : "none";
  });
});

document.getElementById("addVideoBtn").addEventListener("click", () => {
  room.addVideo(videoStyle);
});

document.getElementById("removeVideoBtn").addEventListener("click", () => {
  room.removeVideo();
});

document.getElementById("logAiAvatarStateBtn").addEventListener("click", () => {
  logText(`room.aiAvatarState(): ${room.aiAvatarState()}`);
});

document.getElementById("logRoomStateBtn").addEventListener("click", () => {
  logText(`room.roomState(): ${room.roomState()}`);
});

document.getElementById("startRecordBtn").addEventListener("click", () => {
  room.startRecordingAudio();
});

document.getElementById("stopRecordBtn").addEventListener("click", async () => {
  try {
    const blob = await room.stopRecordingAudio();
    const text = await room.stt(blob, "ko");
    sttResult = text;
    // if (sttResult.trim() !== "") {
    document.getElementById("sttText").textContent = text;
    document.getElementById("sttResult").style.display = "block";
    // }
  } catch (error) {
    console.error(error);
  }
});
