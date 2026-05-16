"use client";

import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";

const ActiveShipmentsLeaflet = dynamic(
  () =>
    import("@/components/active-shipments-map-leaflet").then(
      (mod) => mod.ActiveShipmentsMapLeaflet,
    ),
  { ssr: false },
);

export function ActiveShipmentsMap() {
  const t = useTranslations("dashboard");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("activeMapTitle")}</CardTitle>
        <CardDescription>
          {t("activeMapDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ActiveShipmentsLeaflet />
      </CardContent>
    </Card>
  );
}
