const { buildContext } = require("../services/contextBuilder");
const { generateChatResponse } = require("../services/chatService");

const chat = async (req, res) => {
  try {
    console.log("\n=== CHAT REQUEST ===");
    console.log(
      "Chat endpoint called with body:",
      JSON.stringify(req.body, null, 2),
    );
    console.log("User:", req.user);

    const userId = req.user?.userId;
    const role = req.user?.role;
    const message =
      typeof req.body?.message === "string" ? req.body.message.trim() : "";

    if (!userId || !role) {
      console.log("❌ Auth failed - userId:", userId, "role:", role);
      return res.status(401).json({
        success: false,
        error: "User authentication is required",
        code: "NOT_AUTHENTICATED",
      });
    }

    if (!message) {
      console.log("❌ No message provided");
      return res.status(400).json({
        success: false,
        error: "Message is required",
        code: "MESSAGE_REQUIRED",
      });
    }

    console.log("✓ Building context for userId:", userId, "role:", role);
    const context = await buildContext({ userId, role });

    console.log("✓ Generating response for message:", message);
    const response = await generateChatResponse({ role, context, message });

    console.log("✓ Response generated successfully");
    return res.status(200).json({
      success: true,
      data: {
        response,
      },
    });
  } catch (error) {
    console.error("\n❌ CHAT ERROR:", {
      message: error.message,
      status: error.status,
      code: error.code,
    });
    return res.status(error.status || 500).json({
      success: false,
      error: error.message || "Failed to process chat request",
      code: error.code || "CHAT_ERROR",
    });
  }
};

module.exports = {
  chat,
};
