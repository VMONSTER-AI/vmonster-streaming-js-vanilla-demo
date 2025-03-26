const apiUrl = import.meta.env.VITE_SERVER_URL;
const apiKey = import.meta.env.VITE_API_KEY;
const aiAvatarId = import.meta.env.VITE_AIAVATAR_ID;

export async function fetchStreams(
  language,
  background,
  positionX,
  positionY,
  scale
) {
  try {
    const formData = new FormData();
    formData.append("aiavatar_id", aiAvatarId);
    formData.append("language", language);
    if (background) {
      const backgroundName =
        background.type === "image/png" ? "background.png" : "background.jpg";
      formData.append("background", background, backgroundName);
    }
    if (positionX) {
      formData.append("position_x", positionX);
    }
    if (positionY) {
      formData.append("position_y", positionY);
    }
    if (scale) {
      formData.append("scale", scale);
    }

    const response = await fetch(`${apiUrl}/streams`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch stream configuration");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching stream configuration:", error);
    throw error;
  }
}
