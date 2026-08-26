import { redirect } from "@/lib/navigation";
import { auth } from "@/lib/auth";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "@/lib/has-locale";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const session = await auth();

  if (session?.user) {
    redirect({ href: "/dashboard", locale });
  }

  redirect({ href: "/login", locale });
}
