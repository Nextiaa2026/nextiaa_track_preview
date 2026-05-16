import { apiClient } from "@/lib/axios";

export interface AppSetting {
  key: string;
  value: string;
}

export const settingsService = {
  getSettings: async (): Promise<AppSetting[]> => {
    const response = await apiClient.get("/api/dashboard/settings");
    return response.data.settings;
  },

  updateSetting: async (key: string, value: string): Promise<void> => {
    await apiClient.post("/api/dashboard/settings", { key, value });
  },

  updateSettings: async (settings: Record<string, string>): Promise<void> => {
    await apiClient.post("/api/dashboard/settings/bulk", { settings });
  },
};
