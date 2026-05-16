"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useSettings, SystemSettings } from "@/providers/SettingsProvider";

const quickSettingsSchema = z.object({
  autoNotifyOnCreate: z.boolean(),
  autoGenerateInvoice: z.boolean(),
  defaultShipmentType: z.enum(["international", "local"]),
});

export type QuickSettings = z.infer<typeof quickSettingsSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export function QuickSettingsDialog() {
  const t = useTranslations("pages.settings");
  const [open, setOpen] = useState(false);
  const { settings, updateSettings, isLoading } = useSettings();

  const form = useForm<Partial<SystemSettings>, unknown, Partial<SystemSettings>>({
    resolver: zodResolver(quickSettingsSchema),
    defaultValues: {
      autoNotifyOnCreate: settings.autoNotifyOnCreate,
      autoGenerateInvoice: settings.autoGenerateInvoice,
      defaultShipmentType: settings.defaultShipmentType,
    },
  });

  const onSubmit = async (values: Partial<SystemSettings>) => {
    try {
      await updateSettings(values);
      toast.success(t("saveSuccess"));
      setOpen(false);
    } catch {
      toast.error(t("saveFailed"));
    }
  };

  // Re-sync with global settings when dialog opens
  const handleOpenChange = (next: boolean) => {
    if (next) {
      form.reset({
        autoNotifyOnCreate: settings.autoNotifyOnCreate,
        autoGenerateInvoice: settings.autoGenerateInvoice,
        defaultShipmentType: settings.defaultShipmentType,
      });
    }
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-9 rounded-xl border-white/10">
          <HugeiconsIcon icon={Settings01Icon} size={15} strokeWidth={2} />
          {t("quickSettingsTitle")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("quickSettingsTitle")}</DialogTitle>
          <DialogDescription>{t("quickSettingsDesc")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-2">
            {/* Auto-notify on create */}
            <FormField
              control={form.control}
              name="autoNotifyOnCreate"
              render={({ field }) => (
                <FormItem className="flex items-start justify-between gap-4 space-y-0">
                  <div className="space-y-1">
                    <FormLabel className="text-sm font-medium leading-none">
                      {t("quickNotifyOnCreate")}
                    </FormLabel>
                    <FormDescription className="text-xs text-muted-foreground">
                      {t("quickNotifyOnCreateDesc")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Auto-generate invoice */}
            <FormField
              control={form.control}
              name="autoGenerateInvoice"
              render={({ field }) => (
                <FormItem className="flex items-start justify-between gap-4 space-y-0">
                  <div className="space-y-1">
                    <FormLabel className="text-sm font-medium leading-none">
                      {t("quickAutoInvoice")}
                    </FormLabel>
                    <FormDescription className="text-xs text-muted-foreground">
                      {t("quickAutoInvoiceDesc")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Default shipment type */}
            <FormField
              control={form.control}
              name="defaultShipmentType"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">
                    {t("quickDefaultType")}
                  </FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      {(["international", "local"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => field.onChange(type)}
                          className={`flex-1 h-9 rounded-lg border text-sm font-medium transition-colors ${
                            field.value === type
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background text-muted-foreground hover:bg-muted/30"
                          }`}
                        >
                          {type === "international" ? "International" : "Local"}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="rounded-xl"
              >
                {t("quickCancel")}
              </Button>
              <Button type="submit" className="rounded-xl btn-shiny">
                {t("quickSave")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
