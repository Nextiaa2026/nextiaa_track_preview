import { apiClient } from "@/lib/axios";

export const userService = {
  updateProfile: async (data: { name: string }): Promise<{ success: boolean }> => {
    const response = await apiClient.patch("/api/dashboard/profile", data);
    return response.data;
  },
};
