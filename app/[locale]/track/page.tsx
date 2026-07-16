"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trackingSchema, type TrackingInput } from "@/lib/validations";
import { useTrackShipment } from "@/hooks/useShipments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Search,
  Package,
  Ship,
  User,
  MapPin,
  Clock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { WordLogo } from "@/components/logo";
import { getStatusColor } from "@/lib/utils/shipment";

const TrackingMap = dynamic(
  () => import("@/components/tracking-map").then((mod) => mod.TrackingMap),
  { ssr: false },
);

export default function TrackingPage() {
  const t = useTranslations("tracking");
  const ts = useTranslations("forms.common.status");
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasSearched, setHasSearched] = useState(false);
  const { mutate: trackShipment, isPending, error, data: result } = useTrackShipment();

  const statusLabel = (s: string) => {
    try {
      return ts(s);
    } catch {
      return s;
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrackingInput>({
    resolver: zodResolver(trackingSchema),
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const onSubmit = (data: TrackingInput) => {
    setHasSearched(true);
    trackShipment(data.trackingNumber, {
      onSuccess: () => undefined,
    });
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="relative min-h-screen w-full bg-background">
      <div className="absolute inset-0 z-0">
        <TrackingMap markerPosition={null} />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-2xl px-4 pt-8">
        <div className="mb-4 text-center">
          <div className="flex justify-center">
            <WordLogo className="text-[40px]" />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {t("publicSubtitle")}
          </p>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-xl border border-gray-200 bg-white/95 p-3 shadow-sm backdrop-blur-sm"
        >
          <div className="flex gap-2">
            <Input
              placeholder={t("inputPlaceholder")}
              {...register("trackingNumber")}
              className="h-11 flex-1 bg-white text-base"
            />
            <Button
              type="submit"
              disabled={isPending}
              size="icon"
              className="h-11 w-11 shrink-0"
              aria-label={t("searchButtonAria")}
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </Button>
          </div>
          {errors.trackingNumber ? (
            <p className="mt-2 text-sm text-red-600">
              {errors.trackingNumber.message}
            </p>
          ) : null}
          {hasSearched && error ? (
            <p className="mt-2 text-sm text-red-600">
              {error instanceof Error ? error.message : t("notFound")}
            </p>
          ) : null}
        </form>

        {result ? (
          <div className="mt-4 mb-8 max-h-[70vh] space-y-5 overflow-y-auto rounded-xl border border-gray-200 bg-white/95 p-5 shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  {t("details")}
                </span>
                <h2 className="mt-0.5 truncate text-lg font-semibold text-gray-900">
                  {result.itemName}
                </h2>
                {result.itemDescription ? (
                  <p className="mt-0.5 text-sm text-gray-500">
                    {result.itemDescription}
                  </p>
                ) : null}
              </div>
              <span
                className={`shrink-0 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusColor(
                  result.status,
                )}`}
              >
                {statusLabel(result.status)}
              </span>
            </div>

            {result.itemImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.itemImage}
                alt={result.itemName}
                className="max-h-48 w-full rounded-lg border border-gray-100 object-cover"
              />
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                icon={<Package className="h-4 w-4 text-primary" />}
                label={t("trackingNumber")}
                value={result.trackingNumber}
                mono
              />
              <Field
                icon={<Package className="h-4 w-4 text-primary" />}
                label={t("chassisNumber")}
                value={result.chassisNumber}
                mono
              />
              {result.tripName ? (
                <Field
                  icon={<MapPin className="h-4 w-4 text-primary" />}
                  label={t("trip")}
                  value={result.tripName}
                />
              ) : null}
              {result.vesselName ? (
                <Field
                  icon={<Ship className="h-4 w-4 text-primary" />}
                  label={t("vessel")}
                  value={
                    result.vesselImo
                      ? `${result.vesselName} (${t("imo")} ${result.vesselImo})`
                      : result.vesselName
                  }
                />
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <PartyCard
                label={t("from")}
                name={result.sender.name}
                phone={result.sender.phone}
                email={result.sender.email}
              />
              <PartyCard
                label={t("to")}
                name={result.receiver.name}
                phone={result.receiver.phone}
                email={result.receiver.email}
              />
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                {t("history")}
              </h3>
              {result.logs.length > 0 ? (
                <ol className="relative ml-2 space-y-4 border-l border-gray-200 pl-5">
                  {result.logs.map((log) => (
                    <li key={log.id} className="relative">
                      <span className="absolute left-[-27px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary bg-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getStatusColor(
                            log.status,
                          )}`}
                        >
                          {statusLabel(log.status)}
                        </span>
                        {log.location ? (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            {log.location}
                          </span>
                        ) : null}
                      </div>
                      {log.message ? (
                        <p className="mt-1 text-sm text-gray-700">{log.message}</p>
                      ) : null}
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {formatDate(log.timestamp)}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-gray-400">—</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
  mono,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-gray-100 bg-gray-50/60 p-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
          {label}
        </p>
        <p
          className={`truncate text-sm font-medium text-gray-900 ${
            mono ? "font-mono" : ""
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function PartyCard({
  label,
  name,
  phone,
  email,
}: {
  label: string;
  name: string;
  phone: string;
  email: string;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-3">
      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-gray-400">
        <User className="h-3 w-3" />
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-900">{name}</p>
      {phone ? <p className="text-xs text-gray-500">{phone}</p> : null}
      {email ? <p className="truncate text-xs text-gray-500">{email}</p> : null}
    </div>
  );
}
