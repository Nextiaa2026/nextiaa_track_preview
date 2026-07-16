"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "@/lib/navigation";
import { ColumnDef } from "@tanstack/react-table";
import {
  useShipments,
  useUpdateShipment,
  useResendNotification,
  useTrips,
  useBulkAssignTrip,
  useDeleteShipment,
} from "@/hooks/useShipments";
import type { Shipment } from "@/services/shipment.service";
import { CreateShipmentSheet } from "@/components/sheets/CreateShipmentSheet";
import { DataTable } from "@/components/data-table";
import { TableDateCell } from "@/components/table-date-cell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStatusColor, getStatusDisplay } from "@/lib/utils/shipment";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontalIcon,
  ViewIcon,
  PackageIcon,
  WeightIcon,
  Location01Icon,
  CircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useDebounce } from "@/hooks/use-debounce";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { PageHeader } from "@/components/page-header";
import { useTranslations } from "next-intl";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { Loader2, Link2, Pencil, Trash2 } from "lucide-react";

export default function ShipmentsPage() {
  const t = useTranslations("pages.shipments");
  const tc = useTranslations("forms.common");
  const ts = useTranslations("forms.common.status");
  const tsw = useTranslations("forms.shipmentWizard");
  const router = useRouter();

  // Pagination & filters
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tripFilter, setTripFilter] = useState("");

  // Sheet / selection
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [editingShipmentId, setEditingShipmentId] = useState<string | null>(null);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // Bulk assign dialog
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkTripId, setBulkTripId] = useState("");

  const { mutate: updateShipment } = useUpdateShipment();
  const { mutate: deleteShipment } = useDeleteShipment();
  const { mutate: resendNotification, isPending: isResending } = useResendNotification();
  const { mutateAsync: bulkAssign, isPending: isBulkAssigning } = useBulkAssignTrip();

  const { data: paginatedData, isLoading, error } = useShipments(
    page, pageSize, debouncedSearch, startDate, endDate, tripFilter || undefined,
  );
  const { data: tripsData } = useTrips(1, 100, "");
  const trips = useMemo(() => tripsData?.data ?? [], [tripsData]);
  const shipments = useMemo(() => paginatedData?.data ?? [], [paginatedData]);

  // Selected shipment IDs — DataTable uses record IDs as rowSelection keys
  const selectedIds = useMemo(
    () => Object.entries(rowSelection).filter(([, v]) => v).map(([id]) => id),
    [rowSelection],
  );

  const handleStatusUpdate = useCallback(
    (shipmentId: string, newStatus: string) => {
      const status = newStatus as "pending" | "in_transit" | "delivered" | "failed";
      updateShipment({ id: shipmentId, data: { status } });
    },
    [updateShipment],
  );

  const openCreate = () => {
    setSheetMode("create");
    setEditingShipmentId(null);
    setSheetOpen(true);
  };

  const openEdit = (id: string) => {
    setSheetMode("edit");
    setEditingShipmentId(id);
    setSheetOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm(tsw("deleteConfirm") || "Are you sure?")) return;
    deleteShipment(id, {
      onSuccess: () => toast.success(tsw("toastDeleted") || "Shipment deleted"),
      onError: () => toast.error(tsw("toastDeleteFail") || "Failed to delete"),
    });
  };

  const handleBulkAssign = async () => {
    if (!bulkTripId || selectedIds.length === 0) return;
    try {
      await bulkAssign({ shipmentIds: selectedIds, tripId: bulkTripId });
      toast.success(t("bulkAssignSuccess"));
      setBulkDialogOpen(false);
      setBulkTripId("");
      setRowSelection({});
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || err?.message || t("bulkAssignError");
      toast.error(errMsg);
    }
  };

  const columns = useMemo<ColumnDef<Shipment>[]>(
    () => [
      {
        accessorKey: "chassisNumber",
        header: t("colChassis"),
        cell: (info) => (
          <span className="font-mono text-sm font-semibold text-black">
            {String(info.getValue())}
          </span>
        ),
      },
      {
        accessorKey: "trackingNumber",
        header: t("colTracking"),
        cell: (info) => (
          <div className="flex flex-col">
            <span className="font-medium text-black tracking-tight leading-none mb-1">
              {String(info.getValue())}
            </span>
            <span className="text-xs text-gray-400 font-normal uppercase tracking-wider">
              {t("standardFreight")}
            </span>
          </div>
        ),
      },
      {
        id: "trip",
        header: t("colTrip"),
        cell: ({ row }) => {
          const trip = row.original.trip;
          if (!trip) return <span className="text-gray-400">—</span>;
          return (
            <div className="flex flex-col">
              <span className="font-medium text-black leading-tight truncate max-w-[140px]">
                {trip.name}
              </span>
              {trip.vessel && (
                <span className="text-xs text-gray-400 font-normal">
                  {trip.vessel.name} {trip.vessel.imo ? `(${trip.vessel.imo})` : ""}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "shipmentType",
        header: t("colShipmentType"),
        cell: ({ row }) => (
          <span className="inline-flex items-center rounded-full bg-gray-50 border border-gray-100 px-2.5 py-1 text-xs uppercase tracking-wider text-gray-600 font-medium">
            {row.original.shipmentType === "international" 
              ? tsw("shipmentTypeInternational") 
              : tsw("shipmentTypeLocal")}
          </span>
        ),
      },
      {
        accessorKey: "itemName",
        header: t("colContent"),
        cell: (info) => (
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-black shrink-0 shadow-sm">
              <HugeiconsIcon icon={PackageIcon} size={16} strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <span className="text-black font-medium leading-tight truncate max-w-[150px]">
                {String(info.getValue())}
              </span>
              <span className="text-xs text-gray-400 font-normal flex items-center gap-1">
                <HugeiconsIcon icon={WeightIcon} size={10} />
                {String(info.row.original.itemWeight ?? "—")} {t("weightKg")}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "sender.name",
        header: t("colOrigin"),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-black font-medium leading-tight">
              {row.original.sender.name}
            </span>
            <span className="text-xs text-gray-400 font-normal flex items-center gap-1 uppercase tracking-wider">
              <HugeiconsIcon icon={Location01Icon} size={10} />
              {row.original.sender.city}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "receiver.name",
        header: t("colDestination"),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-black font-medium leading-tight">
              {row.original.receiver.name}
            </span>
            <span className="text-xs text-gray-400 font-normal flex items-center gap-1 uppercase tracking-wider">
              <HugeiconsIcon icon={Location01Icon} size={10} />
              {row.original.receiver.city}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: t("colStatus"),
        cell: (info) => {
          const status = String(info.getValue());
          return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-widest border ${getStatusColor(status)}`}>
              {ts(status)}
            </span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: t("colCreatedAt"),
        cell: ({ row }) => <TableDateCell value={row.original.createdAt} />,
      },
      {
        accessorKey: "updatedAt",
        header: t("colUpdatedAt"),
        cell: ({ row }) => <TableDateCell value={row.original.updatedAt} />,
      },
      {
        id: "actions",
        header: t("colActions"),
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-50 rounded-lg">
                <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>{t("menuControls")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="font-normal"
                onClick={() => router.push(`/dashboard/shipments/${row.original.id}`)}
              >
                <HugeiconsIcon icon={ViewIcon} size={14} className="mr-2 text-black" />
                {t("detailedView")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="font-normal"
                onClick={() => resendNotification(row.original.id)}
                disabled={isResending}
              >
                <HugeiconsIcon icon={CircleIcon} size={14} className="mr-2 text-black" />
                {isResending ? t("sending") : t("resendNotif")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="font-normal">
                  <HugeiconsIcon icon={CircleIcon} size={14} className="mr-2 text-black" />
                  {t("updateStatus")}
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-40">
                    {[
                      { value: "pending", label: t("statusPending") },
                      { value: "in_transit", label: t("statusInTransit") },
                      { value: "delivered", label: t("statusDelivered") },
                      { value: "failed", label: t("statusFailed") },
                    ].map((s) => (
                      <DropdownMenuItem
                        key={s.value}
                        onClick={() => handleStatusUpdate(row.original.id, s.value)}
                        className={row.original.status === s.value ? "bg-gray-50 text-black font-semibold" : ""}
                      >
                        {s.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="font-normal"
                onClick={() => openEdit(row.original.id)}
              >
                <Pencil className="mr-2 h-4 w-4 text-black" />
                {tc("edit")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="font-normal text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={() => handleDelete(row.original.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {tc("delete") || "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [router, handleStatusUpdate, t, tc, resendNotification, isResending, openEdit, handleDelete, tsw],
  );

  if (error) {
    return (
      <ErrorState
        title={t("syncErrorTitle")}
        description={t("syncErrorDesc")}
        onRetry={() => window.location.reload()}
      />
    );
  }

  const hasSelection = selectedIds.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader title={t("title")} description={t("description")} />

      {isLoading || shipments.length > 0 || searchTerm || startDate || endDate || tripFilter ? (
        <DataTable
          columns={columns}
          data={shipments}
          isLoading={isLoading}
          page={page}
          pageCount={paginatedData?.totalPages ?? 1}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          searchQuery={searchTerm}
          onSearchChange={(val) => { setSearchTerm(val); setPage(1); }}
          searchPlaceholder={t("searchPlaceholder")}
          actions={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              {hasSelection && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-lg px-3 gap-2 border-primary/30 text-primary hover:bg-primary/5 w-full sm:w-auto"
                  onClick={() => { setBulkTripId(""); setBulkDialogOpen(true); }}
                >
                  <Link2 className="h-4 w-4" />
                  {t("bulkAssignTrip")}
                  <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold">
                    {selectedIds.length}
                  </span>
                </Button>
              )}
              <Button
                onClick={openCreate}
                className="h-10 rounded-lg px-4 font-medium w-full sm:w-auto"
              >
                {t("addButton")}
              </Button>
            </div>
          }
          filters={
            <div className="flex flex-wrap items-center gap-2">
              <DateRangeFilter
                startDate={startDate}
                onStartDateChange={setStartDate}
                endDate={endDate}
                onEndDateChange={setEndDate}
              />
              <Select
                value={tripFilter || "__all__"}
                onValueChange={(v) => { setTripFilter(v === "__all__" ? "" : v); setPage(1); }}
              >
                <SelectTrigger className="h-10 rounded-xl border-gray-200 bg-white text-sm w-full sm:min-w-[160px]">
                  <SelectValue placeholder={t("filterAllTrips")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{t("filterAllTrips")}</SelectItem>
                  <SelectItem value="none">{t("filterNoTrip")}</SelectItem>
                  {trips.map((trip) => (
                    <SelectItem key={trip.id} value={trip.id}>
                      {trip.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />
      ) : (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDesc")}
          action={
            <Button onClick={openCreate} className="gap-2">
              <HugeiconsIcon icon={PackageIcon} size={18} />
              {t("addButton")}
            </Button>
          }
        />
      )}

      <CreateShipmentSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        shipmentId={editingShipmentId ?? undefined}
        onSuccess={() => setPage(1)}
      />

      {/* Bulk Assign to Trip Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("bulkAssignTitle")}</DialogTitle>
            <DialogDescription>
              {t("bulkAssignDesc", { count: selectedIds.length })}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3">
            <Select
              value={bulkTripId || "__none__"}
              onValueChange={(v) => setBulkTripId(v === "__none__" ? "" : v)}
            >
              <SelectTrigger className="h-11 rounded-xl border-border">
                <SelectValue placeholder={t("bulkAssignNoTrip")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t("bulkAssignNoTrip")}</SelectItem>
                {trips.map((trip) => (
                    <SelectItem key={trip.id} value={trip.id}>
                      <div className="flex flex-col">
                        <span>{trip.name}</span>
                        <div className="flex flex-col text-[10px] text-muted-foreground">
                          {trip.vessel && (
                            <span>{trip.vessel.name} {trip.vessel.imo ? `(${trip.vessel.imo})` : ""}</span>
                          )}
                          {(trip.origin || trip.destination) && (
                            <span>{[trip.origin, trip.destination].filter(Boolean).join(" → ")}</span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setBulkDialogOpen(false)}
              className="rounded-xl"
            >
              Annuler
            </Button>
            <Button
              onClick={() => void handleBulkAssign()}
              disabled={!bulkTripId || isBulkAssigning}
              className="rounded-xl btn-shiny"
            >
              {isBulkAssigning ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t("bulkAssignButton")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
