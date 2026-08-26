import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "../globals.css";
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { SettingsProvider } from "@/providers/SettingsProvider";
import { Toaster } from "sonner";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "2NP",
  description: "Shipment tracking and management system",
  icons: {
    icon: "/favicon.png",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={cn(
        "h-full antialiased font-sans",
        inter.variable,
        geistMono.variable,
      )}
    >
      <body className="min-h-full flex flex-col font-sans">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <AuthProvider>
            <QueryProvider>
              <SettingsProvider>
                <TooltipProvider>{children}</TooltipProvider>
              </SettingsProvider>
            </QueryProvider>
          </AuthProvider>
          <Toaster position="top-right" richColors />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
