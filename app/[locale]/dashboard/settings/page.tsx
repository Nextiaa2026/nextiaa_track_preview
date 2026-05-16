"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useCurrentUser, useUpdateProfile } from "@/hooks/useAuth";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  Settings01Icon,
  Notification01Icon,
} from "@hugeicons/core-free-icons";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickSettingsDialog } from "@/components/quick-settings-dialog";
import { toast } from "sonner";
import {
  SYSTEM_SETTINGS_KEY,
  type SystemSettings,
} from "@/lib/utils/currency";
import { useSettings } from "@/providers/SettingsProvider";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

const systemSchema = z.object({
  companyName: z.string().min(1),
  currency: z.string().min(1),
  taxRate: z.coerce.number().min(0).max(100),
});

const notificationsSchema = z.object({
  emailAlerts: z.boolean(),
  whatsappUpdates: z.boolean(),
});

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const t = useTranslations("pages.settings");
  const tv = useTranslations("validation");
  const { data: user } = useCurrentUser();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();

  const form = useForm<z.infer<typeof profileSchema>, unknown, z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", email: "" },
  });

  useEffect(() => {
    if (user) form.reset({ name: user.name ?? "", email: user.email ?? "" });
  }, [user, form]);

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    try {
      await updateProfile({ name: values.name });
      toast.success(t("saveSuccess"));
    } catch {
      toast.error(t("saveFailed"));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fieldFullName")}</FormLabel>
              <FormControl>
                <Input className="h-11 rounded-xl border-white/10 bg-background/50 focus:bg-background" {...field} />
              </FormControl>
              <FormMessage>
                {form.formState.errors.name && tv("nameRequired")}
              </FormMessage>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fieldEmail")}</FormLabel>
              <FormControl>
                <Input type="email" disabled className="h-11 rounded-xl border-white/10 bg-background/50 opacity-60 cursor-not-allowed" {...field} />
              </FormControl>
              <FormDescription className="text-xs text-muted-foreground/60">
                {t("emailLockedDesc")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="pt-2 flex justify-end">
          <Button type="submit" disabled={isPending} className="rounded-xl px-8 font-semibold btn-shiny">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─── System Tab ───────────────────────────────────────────────────────────────

function SystemTab() {
  const t = useTranslations("pages.settings");

  const { settings, updateSettings } = useSettings();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<SystemSettings, unknown, SystemSettings>({
    resolver: zodResolver(systemSchema),
    defaultValues: settings,
  });

  useEffect(() => {
    form.reset(settings);
  }, [settings, form]);

  const onSubmit = async (values: SystemSettings) => {
    try {
      setIsSaving(true);
      await updateSettings(values);
      toast.success(t("saveSuccess"));
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fieldCompany")}</FormLabel>
              <FormControl>
                <Input className="h-11 rounded-xl border-white/10 bg-background/50 focus:bg-background" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fieldCurrency")}</FormLabel>
              <FormControl>
                <Input
                  className="h-11 rounded-xl border-white/10 bg-background/50 focus:bg-background"
                  placeholder="EUR"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs text-muted-foreground/60">
                {t("currencyDesc")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="taxRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fieldTaxRate")}</FormLabel>
              <FormControl>
                <Input type="number" min={0} max={100} step={0.1} className="h-11 rounded-xl border-white/10 bg-background/50 focus:bg-background" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="pt-2 flex justify-end">
          <Button type="submit" disabled={isSaving} className="rounded-xl px-8 font-semibold btn-shiny">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

function NotificationsTab() {
  const t = useTranslations("pages.settings");

  const { settings, updateSettings } = useSettings();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof notificationsSchema>, unknown, z.infer<typeof notificationsSchema>>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      emailAlerts: settings.emailAlerts,
      whatsappUpdates: settings.whatsappUpdates,
    },
  });

  useEffect(() => {
    form.reset({
      emailAlerts: settings.emailAlerts,
      whatsappUpdates: settings.whatsappUpdates,
    });
  }, [settings, form]);

  const onSubmit = async (values: z.infer<typeof notificationsSchema>) => {
    try {
      setIsSaving(true);
      await updateSettings(values);
      toast.success(t("saveSuccess"));
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
        <FormField
          control={form.control}
          name="emailAlerts"
          render={({ field }) => (
            <FormItem className="flex items-start justify-between gap-4 rounded-xl border border-white/5 bg-muted/10 p-4 space-y-0">
              <div className="space-y-1">
                <FormLabel className="text-sm font-medium">{t("fieldEmailAlerts")}</FormLabel>
                <FormDescription className="text-xs text-muted-foreground/70">
                  {t("fieldEmailAlertsDesc")}
                </FormDescription>
              </div>
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="whatsappUpdates"
          render={({ field }) => (
            <FormItem className="flex items-start justify-between gap-4 rounded-xl border border-white/5 bg-muted/10 p-4 space-y-0">
              <div className="space-y-1">
                <FormLabel className="text-sm font-medium">{t("fieldWhatsapp")}</FormLabel>
                <FormDescription className="text-xs text-muted-foreground/70">
                  {t("fieldWhatsappDesc")}
                </FormDescription>
              </div>
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="pt-2 flex justify-end">
          <Button type="submit" disabled={isSaving} className="rounded-xl px-8 font-semibold btn-shiny">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const t = useTranslations("pages.settings");
  const { data: user } = useCurrentUser();
  const isAdmin = user?.role === "admin" || user?.role === "staff";

  const tabs = [
    {
      id: "profile",
      title: t("profileTitle"),
      description: t("profileDesc"),
      icon: UserIcon,
      content: <ProfileTab />,
    },
    ...(isAdmin
      ? [
          {
            id: "system",
            title: t("systemTitle"),
            description: t("systemDesc"),
            icon: Settings01Icon,
            content: <SystemTab />,
          },
        ]
      : []),
    {
      id: "notifications",
      title: t("notificationsTitle"),
      description: t("notificationsDesc"),
      icon: Notification01Icon,
      content: <NotificationsTab />,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={<QuickSettingsDialog />}
      />

      <Tabs defaultValue="profile" className="w-full space-y-6">
        <TabsList className="bg-muted/30 border border-white/5 p-1 h-auto rounded-xl backdrop-blur-sm flex-wrap gap-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={tab.icon} size={16} strokeWidth={2} />
                <span className="font-semibold text-sm">{tab.title}</span>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="focus-visible:outline-none focus-visible:ring-0">
            <Card className="border-white/5 bg-muted/20 backdrop-blur-sm overflow-hidden glass-card">
              <CardHeader className="border-b border-white/5 bg-muted/30">
                <CardTitle className="text-lg font-bold">{tab.title}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground/70">{tab.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-6">{tab.content}</CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
