import apiClient from "./apiClient";

const sendMessage = async (message) => {
  const response = await apiClient.post("/chat", { message });
  return response.data;
};

export default {
  sendMessage,
};
