"use client";

import { useParams } from "next/navigation";
import { useTrip } from "@/hooks/useShipments";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getStatusColor, getStatusDisplay } from "@/lib/utils/shipment";
import { Loader2, ArrowLeft, Ship, MapPin, Calendar, FileText, CheckCircle, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PackageIcon,
  TruckIcon,
  Calendar01Icon,
  CargoShipIcon,
  Location01Icon,
  ArrowLeft02Icon,
} from "@hugeicons/core-free-icons";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";

export default function TripDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const t = useTranslations("pages.trips");
  const ts = useTranslations("forms.common.status");
  const tship = useTranslations("pages.shipments");

  const { data: trip, isLoading, error } = useTrip(id);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading trip information...</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-semibold text-destructive">Trip not found</p>
        <p className="text-sm text-muted-foreground">
          We couldn't retrieve the details for this trip. It may have been deleted.
        </p>
        <Button asChild className="mt-2 rounded-xl">
          <Link href="/dashboard/trips">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Trips
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          asChild
          className="h-10 rounded-xl px-3 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
        >
          <Link href="/dashboard/trips">
            <HugeiconsIcon icon={ArrowLeft02Icon} size={18} className="mr-2" />
            Back to Trips
          </Link>
        </Button>
        <span className="text-xs text-muted-foreground font-mono">ID: {trip.id}</span>
      </div>

      {/* Header Panel */}
      <div className="rounded-3xl border border-border bg-gradient-to-br from-card to-muted/20 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HugeiconsIcon icon={CargoShipIcon} size={20} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {trip.name}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Track and manage all shipments associated with this voyage.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest border shadow-sm backdrop-blur-sm",
                getStatusColor(trip.status)
              )}
            >
              {ts(trip.status)}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Overview Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Route Details */}
        <Card className="p-6 border-border bg-card/50 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-muted-foreground group-hover:scale-110 transition-transform">
            <MapPin className="h-16 w-16" />
          </div>
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Route Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-primary">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Origin</p>
                  <p className="text-sm font-semibold text-foreground">{trip.origin || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-destructive">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Destination</p>
                  <p className="text-sm font-semibold text-foreground">{trip.destination || "—"}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Dates Card */}
        <Card className="p-6 border-border bg-card/50 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-muted-foreground group-hover:scale-110 transition-transform">
            <Calendar className="h-16 w-16" />
          </div>
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Schedule / Timeline
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Departure</p>
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                  <HugeiconsIcon icon={Calendar01Icon} size={14} className="text-muted-foreground" />
                  {trip.departureDate ? format(new Date(trip.departureDate), "dd MMM yyyy") : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Arrival</p>
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                  <HugeiconsIcon icon={Calendar01Icon} size={14} className="text-muted-foreground" />
                  {trip.arrivalDate ? format(new Date(trip.arrivalDate), "dd MMM yyyy") : "—"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Vessel Info */}
        <Card className="p-6 border-border bg-card/50 backdrop-blur-sm sm:col-span-2 lg:col-span-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-muted-foreground group-hover:scale-110 transition-transform">
            <Ship className="h-16 w-16" />
          </div>
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Vessel / Transport Carrier
            </h3>
            {trip.vessel ? (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Transporteur</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{trip.vessel.carrierName || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Nom du bateau</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{trip.vessel.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">N° bateau (IMO)</p>
                    <p className="text-xs font-mono font-semibold text-foreground mt-0.5">{trip.vessel.imo}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">Type</p>
                    <p className="text-xs font-semibold text-foreground capitalize mt-0.5">{trip.vessel.type}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center border border-dashed border-border rounded-xl">
                <Ship className="h-8 w-8 text-muted-foreground/40 mb-1" />
                <p className="text-xs text-muted-foreground">No vessel assigned to this trip.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Allocated Shipments List */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-border bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border bg-muted/20 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={PackageIcon} size={18} className="text-primary" />
                <h2 className="font-bold text-foreground tracking-tight">
                  Allocated Shipments
                </h2>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                {trip.shipments?.length ?? 0} total
              </span>
            </div>

            {trip.shipments && trip.shipments.length > 0 ? (
              <div className="overflow-x-auto">
                {/* Desktop Table View */}
                <table className="hidden md:table w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/5 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="px-6 py-3.5">Tracking ID</th>
                      <th className="px-6 py-3.5">Content Item</th>
                      <th className="px-6 py-3.5">Sender / Origin</th>
                      <th className="px-6 py-3.5">Receiver / Dest</th>
                      <th className="px-6 py-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {trip.shipments.map((shipment) => (
                      <tr key={shipment.id} className="transition-colors hover:bg-muted/5">
                        <td className="px-6 py-4">
                          <Link
                            href={`/dashboard/shipments/${shipment.id}`}
                            className="font-medium text-primary hover:underline font-mono"
                          >
                            {shipment.trackingNumber}
                          </Link>
                          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                            {shipment.chassisNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-foreground max-w-[150px] truncate">
                            {shipment.itemName}
                          </div>
                          {shipment.itemWeight && (
                            <div className="text-[10px] text-muted-foreground font-normal">
                              {shipment.itemWeight} kg
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-foreground font-medium">{shipment.sender.name}</div>
                          <div className="text-[10px] text-muted-foreground">{shipment.sender.city}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-foreground font-medium">{shipment.receiver.name}</div>
                          <div className="text-[10px] text-muted-foreground">{shipment.receiver.city}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                              getStatusColor(shipment.status)
                            )}
                          >
                            {ts(shipment.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Collapsed Cards View */}
                <div className="md:hidden divide-y divide-border">
                  {trip.shipments.map((shipment) => (
                    <div key={shipment.id} className="p-4 hover:bg-muted/5 transition-colors space-y-3">
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/dashboard/shipments/${shipment.id}`}
                          className="font-semibold text-primary hover:underline font-mono text-sm"
                        >
                          {shipment.trackingNumber}
                        </Link>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border",
                            getStatusColor(shipment.status)
                          )}
                        >
                          {ts(shipment.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase font-medium">Chassis #</p>
                          <p className="font-mono text-foreground font-medium mt-0.5">{shipment.chassisNumber}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase font-medium">Cargo Item</p>
                          <p className="text-foreground font-medium truncate max-w-[120px] mt-0.5">{shipment.itemName}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase font-medium">Sender</p>
                          <p className="text-foreground font-medium mt-0.5">{shipment.sender.name}</p>
                          <p className="text-[10px] text-muted-foreground">{shipment.sender.city}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase font-medium">Receiver</p>
                          <p className="text-foreground font-medium mt-0.5">{shipment.receiver.name}</p>
                          <p className="text-[10px] text-muted-foreground">{shipment.receiver.city}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="rounded-full bg-muted/20 p-4 text-muted-foreground mb-4">
                  <Package className="h-10 w-10 text-muted-foreground/60" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  No Shipments Allocated
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                  There are no shipments assigned to this trip yet. Assign shipments from the Shipment List.
                </p>
                <Button asChild className="rounded-xl">
                  <Link href="/dashboard/shipments">
                    Manage Shipments
                  </Link>
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar Trip Activity Logs */}
        <div className="space-y-6">
          <Card className="border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/20 px-6 py-5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="font-bold text-foreground tracking-tight">
                  Trip History Logs
                </h2>
              </div>
            </div>

            <div className="p-6">
              {trip.logs && trip.logs.length > 0 ? (
                <div className="relative border-l border-border pl-6 space-y-8 py-2">
                  {trip.logs.map((log) => (
                    <div key={log.id} className="relative">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[31px] top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-border ring-4 ring-card">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </span>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border",
                              getStatusColor(log.status)
                            )}
                          >
                            {ts(log.status)}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {format(new Date(log.timestamp), "dd MMM yyyy, HH:mm")}
                          </span>
                        </div>
                        {log.location && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-medium">
                            <MapPin className="h-3 w-3 text-destructive" />
                            {log.location}
                          </div>
                        )}
                        <p className="text-xs text-foreground font-normal leading-relaxed">
                          {log.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-xl">
                  <CheckCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">No history logged yet.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
