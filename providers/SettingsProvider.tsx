"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { settingsService } from "@/services/settings.service";
import { useCurrentUser } from "@/hooks/useAuth";
import { SYSTEM_SETTINGS_KEY } from "@/lib/utils/currency";
export interface SystemSettings {
  companyName: string;
  currency: string;
  taxRate: number;
  autoNotifyOnCreate: boolean;
  autoGenerateInvoice: boolean;
  defaultShipmentType: "international" | "local";
  emailAlerts: boolean;
  whatsappUpdates: boolean;
}

interface SettingsContextType {
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  isLoading: boolean;
}

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  companyName: "Nexiaa Track Logistics",
  currency: "EUR",
  taxRate: 0,
  autoNotifyOnCreate: false,
  autoGenerateInvoice: false,
  defaultShipmentType: "international",
  emailAlerts: true,
  whatsappUpdates: false,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { data: user } = useCurrentUser();
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async (userId: string) => {
    try {
      const dbSettings = await settingsService.getSettings();
      if (dbSettings.length > 0) {
        const merged = { ...DEFAULT_SYSTEM_SETTINGS };
        dbSettings.forEach((s) => {
          if (s.key === "companyName") merged.companyName = s.value;
          if (s.key === "currency") merged.currency = s.value;
          if (s.key === "taxRate") merged.taxRate = parseFloat(s.value) || 0;
          if (s.key === "autoNotifyOnCreate") merged.autoNotifyOnCreate = s.value === "true";
          if (s.key === "autoGenerateInvoice") merged.autoGenerateInvoice = s.value === "true";
          if (s.key === "defaultShipmentType") merged.defaultShipmentType = s.value as "international" | "local";
          if (s.key === "emailAlerts") merged.emailAlerts = s.value === "true";
          if (s.key === "whatsappUpdates") merged.whatsappUpdates = s.value === "true";
        });
        setSettings(merged);
        // Sync to local storage for quick access in non-hook contexts
        localStorage.setItem(SYSTEM_SETTINGS_KEY, JSON.stringify(merged));
      } else {
        // Fallback to localStorage for migration
        const localRaw = localStorage.getItem(SYSTEM_SETTINGS_KEY);
        if (localRaw) {
          try {
            const local = JSON.parse(localRaw);
            const initial = { ...DEFAULT_SYSTEM_SETTINGS, ...local };
            setSettings(initial);
            // Sync to DB
            await settingsService.updateSettings({
              companyName: initial.companyName,
              currency: initial.currency,
              taxRate: String(initial.taxRate),
              autoNotifyOnCreate: String(initial.autoNotifyOnCreate),
              autoGenerateInvoice: String(initial.autoGenerateInvoice),
              defaultShipmentType: initial.defaultShipmentType,
              emailAlerts: String(initial.emailAlerts),
              whatsappUpdates: String(initial.whatsappUpdates),
            });
          } catch (e) {
            console.error("Failed to parse local settings", e);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings from DB:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchSettings(user.id);
    } else if (user === null) {
      // User is explicitly not logged in
      setIsLoading(false);
    }
  }, [user, fetchSettings]);

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    // Update local storage
    localStorage.setItem(SYSTEM_SETTINGS_KEY, JSON.stringify(updated));

    // Persist to DB if logged in
    if (user?.id) {
      const toUpdate: Record<string, string> = {};
      if (newSettings.companyName !== undefined) toUpdate.companyName = newSettings.companyName;
      if (newSettings.currency !== undefined) toUpdate.currency = newSettings.currency;
      if (newSettings.taxRate !== undefined) toUpdate.taxRate = String(newSettings.taxRate);
      if (newSettings.autoNotifyOnCreate !== undefined) toUpdate.autoNotifyOnCreate = String(newSettings.autoNotifyOnCreate);
      if (newSettings.autoGenerateInvoice !== undefined) toUpdate.autoGenerateInvoice = String(newSettings.autoGenerateInvoice);
      if (newSettings.defaultShipmentType !== undefined) toUpdate.defaultShipmentType = newSettings.defaultShipmentType;
      if (newSettings.emailAlerts !== undefined) toUpdate.emailAlerts = String(newSettings.emailAlerts);
      if (newSettings.whatsappUpdates !== undefined) toUpdate.whatsappUpdates = String(newSettings.whatsappUpdates);
      
      if (Object.keys(toUpdate).length > 0) {
        try {
          await settingsService.updateSettings(toUpdate);
        } catch (error) {
          console.error("Failed to persist settings to DB:", error);
        }
      }
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
