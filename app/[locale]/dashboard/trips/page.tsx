"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useTrips,
  useCreateTrip,
  useUpdateTrip,
  useDeleteTrip,
  useVessels,
} from "@/hooks/useShipments";
import type { Trip } from "@/services/shipment.service";
import { toast } from "sonner";
import { Loader2, MoreHorizontal, Plus, Edit2, Trash2, FileText } from "lucide-react";
import { getStatusColor, getStatusDisplay, generateTripName } from "@/lib/utils/shipment";
import { format } from "date-fns";
import { useDebounce } from "@/hooks/use-debounce";
import { AddTripLogSheet } from "@/components/sheets/AddTripLogSheet";
import { useTranslations } from "next-intl";
import { DatePicker } from "@/components/ui/date-picker";

// ─── Zod schema for the trip form ─────────────────────────────────────────────

const tripFormSchema = z.object({
  name: z.string().min(2),
  vesselId: z.string().optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  departureDate: z.string().optional(),
  arrivalDate: z.string().optional(),
  notes: z.string().optional(),
});

type TripFormValues = z.infer<typeof tripFormSchema>;

const TRIP_STATUSES = [
  { value: "pending" as const, labelKey: "statusPending" },
  { value: "in_transit" as const, labelKey: "statusInTransit" },
  { value: "delivered" as const, labelKey: "statusDelivered" },
  { value: "failed" as const, labelKey: "statusFailed" },
] as const;

type TripStatus = (typeof TRIP_STATUSES)[number]["value"];

// ─── Status labels are handled via translations in the component ─────────

export default function TripsPage() {
  const t = useTranslations("pages.trips");
  const tv = useTranslations("validation");
  const ts = useTranslations("forms.common.status");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  // Status dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Trip | null>(null);
  const [newStatus, setNewStatus] = useState<TripStatus>("pending");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Log sheet
  const [logSheetOpen, setLogSheetOpen] = useState(false);
  const [logTripId, setLogTripId] = useState("");

  const { data, isLoading } = useTrips(page, pageSize, debouncedSearch);
  const { data: vesselsData } = useVessels(1, 100, "");
  const vessels = useMemo(() => vesselsData?.data ?? [], [vesselsData]);

  const { mutateAsync: createTrip, isPending: isCreating } = useCreateTrip();
  const { mutateAsync: updateTrip, isPending: isUpdating } = useUpdateTrip();
  const { mutate: deleteTrip } = useDeleteTrip();

  // ─── Form ──────────────────────────────────────────────────────────────────

  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      name: "",
      vesselId: "",
      origin: "",
      destination: "",
      departureDate: "",
      arrivalDate: "",
      notes: "",
    },
  });

  const openCreate = () => {
    setEditingTrip(null);
    form.reset({
      name: generateTripName(),
      vesselId: "",
      origin: "",
      destination: "",
      departureDate: "",
      arrivalDate: "",
      notes: "",
    });
    setSheetOpen(true);
  };

  const openEdit = (trip: Trip) => {
    setEditingTrip(trip);
    form.reset({
      name: trip.name,
      vesselId: trip.vesselId ?? "",
      origin: trip.origin ?? "",
      destination: trip.destination ?? "",
      departureDate: trip.departureDate
        ? new Date(trip.departureDate).toISOString().slice(0, 10)
        : "",
      arrivalDate: trip.arrivalDate
        ? new Date(trip.arrivalDate).toISOString().slice(0, 10)
        : "",
      notes: trip.notes ?? "",
    });
    setSheetOpen(true);
  };

  const onSubmit = async (values: TripFormValues) => {
    const payload = {
      name: values.name.trim(),
      vesselId: values.vesselId || null,
      origin: values.origin || undefined,
      destination: values.destination || undefined,
      departureDate: values.departureDate ? new Date(values.departureDate) : null,
      arrivalDate: values.arrivalDate ? new Date(values.arrivalDate) : null,
      notes: values.notes || undefined,
    };

    try {
      if (editingTrip) {
        await updateTrip({ id: editingTrip.id, data: payload });
        toast.success(t("saveSuccess"));
      } else {
        await createTrip(payload);
        toast.success(t("createSuccess"));
      }
      setSheetOpen(false);
    } catch {
      toast.error(t("saveFailed"));
    }
  };

  const onUpdateStatus = async (notify: boolean) => {
    if (!statusTarget) return;
    setIsUpdatingStatus(true);
    try {
      await updateTrip({
        id: statusTarget.id,
        data: { status: newStatus, notifyRecipients: notify },
      });
      toast.success(t("statusUpdateSuccess"));
      setStatusDialogOpen(false);
    } catch {
      toast.error(t("statusUpdateFailed"));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // ─── Columns ───────────────────────────────────────────────────────────────

  const columns = useMemo<ColumnDef<Trip>[]>(
    () => [
      {
        accessorKey: "name",
        header: t("colName"),
        cell: ({ row }) => (
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-black truncate">{row.original.name}</span>
            {row.original.vessel && (
              <span className="text-[10px] text-gray-400 truncate">
                {row.original.vessel.name} · {row.original.vessel.imo}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "route",
        header: t("colRoute"),
        cell: ({ row }) => {
          const { origin, destination } = row.original;
          if (!origin && !destination) return <span className="text-gray-400">—</span>;
          return (
            <span className="text-sm text-gray-700 truncate max-w-[160px] block">
              {[origin, destination].filter(Boolean).join(" → ")}
            </span>
          );
        },
      },
      {
        id: "dates",
        header: t("colDates"),
        cell: ({ row }) => {
          const dep = row.original.departureDate;
          const arr = row.original.arrivalDate;
          if (!dep && !arr) return <span className="text-gray-400">—</span>;
          return (
            <div className="flex flex-col text-xs text-gray-600">
              {dep && <span>{t("departure")} : {format(new Date(dep), "dd/MM/yyyy")}</span>}
              {arr && <span>{t("arrival")} : {format(new Date(arr), "dd/MM/yyyy")}</span>}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: t("colStatus"),
        cell: (info) => {
          const status = info.getValue() as TripStatus;
          return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider border ${getStatusColor(status)}`}>
              {ts(status)}
            </span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: t("colCreated"),
        cell: ({ row }) => (
          <span className="text-sm text-gray-500">
            {format(new Date(row.original.createdAt), "dd/MM/yyyy")}
          </span>
        ),
      },
      {
        id: "actions",
        header: t("colActions"),
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-50 rounded-lg">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => openEdit(row.original)}>
                <Edit2 className="mr-2 h-4 w-4" />
                {t("editAction")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setStatusTarget(row.original);
                  setNewStatus(row.original.status as TripStatus);
                  setStatusDialogOpen(true);
                }}
              >
                {t("changeStatus")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setLogTripId(row.original.id);
                  setLogSheetOpen(true);
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                {t("addLog")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 font-medium"
                onClick={() => {
                  if (!confirm(t("deleteConfirm"))) return;
                  deleteTrip(row.original.id, {
                    onSuccess: () => toast.success(t("deleteSuccess")),
                    onError: () => toast.error(t("deleteFailed")),
                  });
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("deleteAction")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deleteTrip, t, ts],
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader title={t("title")} description={t("description")} />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        page={page}
        pageCount={data?.totalPages ?? 1}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        searchQuery={searchTerm}
        onSearchChange={(v) => { setSearchTerm(v); setPage(1); }}
        searchPlaceholder={t("searchPlaceholder")}
        actions={
          <Button onClick={openCreate} className="h-10 rounded-lg px-4 font-medium gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            {t("addButton")}
          </Button>
        }
      />

      {/* ─── Create / Edit Sheet ─────────────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="flex h-full max-h-dvh w-full flex-col gap-0 border-l border-white/5 bg-background p-0 sm:max-w-xl"
        >
          <SheetHeader className="px-6 py-5 border-b border-white/5 bg-muted/20">
            <SheetTitle className="text-lg font-semibold">
              {editingTrip ? t("sheetTitleEdit") : t("sheetTitleCreate")}
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground/70">
              {editingTrip ? t("sheetDescEdit") : t("sheetDescCreate")}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <Form {...form}>
              <form
                id="trip-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("fieldName")} <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("fieldNamePh")}
                          className="h-11 rounded-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage>
                        {form.formState.errors.name && tv("nameRequired")}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                {/* Vessel */}
                <FormField
                  control={form.control}
                  name="vesselId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("fieldVessel")}</FormLabel>
                      <Select
                        value={field.value || "__none__"}
                        onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-lg">
                            <SelectValue placeholder={t("fieldVesselNone")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">{t("fieldVesselNone")}</SelectItem>
                          {vessels.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.name} · {v.imo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Origin / Destination */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("fieldOrigin")}</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex. : Casablanca" className="h-11 rounded-lg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("fieldDestination")}</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex. : Marseille" className="h-11 rounded-lg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Departure / Arrival dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="departureDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                      <FormLabel>{t("fieldDeparture")}</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value ? new Date(field.value) : undefined}
                          onChange={(date) => field.onChange(date?.toISOString())}
                          placeholder={t("datePlaceholder") || "Select a date"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="arrivalDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                      <FormLabel>{t("fieldArrival")}</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value ? new Date(field.value) : undefined}
                          onChange={(date) => field.onChange(date?.toISOString())}
                          placeholder={t("datePlaceholder") || "Select a date"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    )}
                  />
                </div>

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("fieldNotes")}</FormLabel>
                      <FormControl>
                        <textarea
                          placeholder={t("fieldNotesPlaceholder")}
                          className="flex min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>

          <SheetFooter className="p-6 border-t border-white/5 bg-muted/20 flex-row-reverse justify-start gap-3">
            <Button
              type="submit"
              form="trip-form"
              disabled={isCreating || isUpdating}
              className="h-11 rounded-xl px-8 font-semibold btn-shiny"
            >
              {isCreating || isUpdating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : editingTrip ? (
                t("saveButton")
              ) : (
                t("createButton")
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSheetOpen(false)}
              disabled={isCreating || isUpdating}
              className="h-11 rounded-xl border-white/10"
            >
              Annuler
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ─── Status Update Dialog ─────────────────────────────────────────── */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden border border-border shadow-lg">
          <DialogHeader className="px-6 pt-8 pb-4">
            <DialogTitle>
              {t("statusDialogTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              {t("statusDialogDesc")}{" "}
              <span className="font-bold text-foreground">"{statusTarget?.name}"</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {t("statusLabel")}
              </label>
              <Select
                value={newStatus}
                onValueChange={(v) => setNewStatus(v as TripStatus)}
              >
                <SelectTrigger className="h-11 border-border bg-muted/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIP_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="py-2.5 font-medium">
                      {ts(s.value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="p-6 pt-2 flex flex-col sm:flex-row gap-3 border-t border-border bg-muted/5">
            <Button
              variant="outline"
              onClick={() => void onUpdateStatus(false)}
              disabled={isUpdatingStatus}
            >
              {t("updateWithoutNotify")}
            </Button>
            <Button
              onClick={() => void onUpdateStatus(true)}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t("updateAndNotify")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Add Trip Log Sheet ───────────────────────────────────────────── */}
      <AddTripLogSheet
        open={logSheetOpen}
        onOpenChange={setLogSheetOpen}
        tripId={logTripId}
      />
    </div>
  );
}
