"use client";

import { formatDistanceToNow } from "date-fns";
import { useTripLogs } from "@/hooks/useShipments";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusDisplay } from "@/lib/utils/shipment";
import { useTranslations } from "next-intl";

export function ResendActivityList() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("forms.common");
  const ts = useTranslations("forms.common.status");
  const { data, isLoading } = useTripLogs(1, 6);
  const logs = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("resendTitle")}</CardTitle>
        <CardDescription>{t("resendDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">{tc("loading")}</div>
        ) : logs.length === 0 ? (
          <div className="text-sm text-muted-foreground">{t("noResendLogs")}</div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  {log.trip?.name ?? `Trip #${log.tripId.slice(0, 8)}`}
                </div>
                <div className="text-xs text-muted-foreground">{log.message}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{ts(log.status)}</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
