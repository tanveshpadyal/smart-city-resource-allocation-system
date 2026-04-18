import apiClient from "./apiClient";

const issueTypeService = {
  getIssueTypes: async () => {
    const response = await apiClient.get("/issue-types");
    return response.data;
  },

  getAdminIssueTypes: async () => {
    const response = await apiClient.get("/issue-types/admin");
    return response.data;
  },

  createIssueType: async (payload) => {
    const response = await apiClient.post("/issue-types", payload);
    return response.data;
  },

  deleteIssueType: async (issueTypeId) => {
    const response = await apiClient.delete(`/issue-types/${issueTypeId}`);
    return response.data;
  },
};

export default issueTypeService;
