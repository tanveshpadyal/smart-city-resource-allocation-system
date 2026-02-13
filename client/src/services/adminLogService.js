import apiClient from "./apiClient";

const adminLogService = {
  getLogs: async (filters = {}) => {
    const response = await apiClient.get("/admin/logs", { params: filters });
    return response.data;
  },
};

export default adminLogService;
