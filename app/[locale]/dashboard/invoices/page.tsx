"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/lib/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInvoices, usePrintInvoice } from "@/hooks/useShipments";
import { useDebounce } from "@/hooks/use-debounce";
import type { Invoice } from "@/services/shipment.service";
import {
  EuroCircleIcon,
  Invoice01Icon,
  MoreHorizontalIcon,
  PackageIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { useSettings } from "@/providers/SettingsProvider";
import { formatCurrency } from "@/lib/utils/currency";
import { openPrintHtml } from "@/lib/print-shipment-documents";
import { TableDateCell } from "@/components/table-date-cell";

const STATUS_OPTIONS = ["all", "draft", "issued", "paid", "overdue", "cancelled"] as const;

function invoiceStatusClass(status: string): string {
  switch (status.toLowerCase()) {
    case "paid":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "overdue":
      return "bg-red-50 text-red-700 border-red-100";
    case "draft":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "cancelled":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-gray-50 text-black border-gray-100";
  }
}

export default function InvoicesPage() {
  const t = useTranslations("pages.invoices");
  const tc = useTranslations("forms.common");
  const tis = useTranslations("forms.common.invoiceStatus");
  const locale = useLocale();
  const { settings } = useSettings();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const { data: paginatedData, isLoading } = useInvoices(
    page,
    pageSize,
    debouncedSearch,
    statusFilter === "all" ? undefined : statusFilter,
    startDate,
    endDate,
  );

  const invoices = useMemo(() => paginatedData?.data || [], [paginatedData]);
  const { mutateAsync: printInvoice, isPending: isPrinting } = usePrintInvoice();

  const handlePrintInvoice = async (invoiceId: string) => {
    try {
      const { html } = await printInvoice(invoiceId);
      if (!openPrintHtml(html)) {
        toast.error(t("printFailed"));
      }
    } catch {
      toast.error(t("printFailed"));
    }
  };

  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        accessorKey: "invoiceNumber",
        header: t("colInvoice"),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <button
              type="button"
              title={t("printInvoice")}
              disabled={isPrinting}
              onClick={() => void handlePrintInvoice(row.original.id)}
              className="size-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-black shrink-0 shadow-sm hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
            >
               <HugeiconsIcon icon={Invoice01Icon} size={16} />
            </button>
            <div className="flex flex-col">
              <span className="text-black font-medium leading-none mb-1">{row.original.invoiceNumber}</span>
              <span className="text-xs text-gray-400 font-normal uppercase tracking-wider">
                {t("shipmentRef", { id: row.original.shipmentId })}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "shipment.trackingNumber",
        header: t("colShipment"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-gray-600 font-normal">
            <HugeiconsIcon icon={PackageIcon} size={14} className="text-gray-400" />
            {row.original.shipment?.trackingNumber || "-"}
          </div>
        ),
      },
      {
        accessorKey: "receiver.name",
        header: t("colBillTo"),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-black font-medium leading-tight">{row.original.receiver?.name || "-"}</span>
            <span className="text-xs text-gray-400 font-normal">
              {row.original.receiver?.email || "-"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: t("colTotal"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-black font-medium">
            <HugeiconsIcon icon={EuroCircleIcon} size={14} className="text-gray-400" />
            {formatCurrency(row.original.totalAmount / 100, row.original.currency || settings.currency, locale)}
          </div>
        ),
      },
      {
        accessorKey: "issuedAt",
        header: t("colIssued"),
        cell: ({ row }) => <TableDateCell value={row.original.issuedAt} />,
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
        accessorKey: "status",
        header: t("colStatus"),
        cell: ({ row }) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wider border ${invoiceStatusClass(
              row.original.status,
            )}`}
          >
            {tis(row.original.status.toLowerCase())}
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
                <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => void handlePrintInvoice(row.original.id)}
              >
                {t("printInvoice")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(row.original.invoiceNumber);
                  toast.success(t("copySuccess"));
                }}
              >
                {t("copyInvoiceNum")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  row.original.shipmentId
                    ? router.push(`/dashboard/shipments/${row.original.shipmentId}`)
                    : null
                }
              >
                {t("openShipment")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [router, t, settings.currency, locale, tis, isPrinting],
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <DataTable
        columns={columns}
        data={invoices}
        isLoading={isLoading}
        page={page}
        pageCount={paginatedData?.totalPages || 1}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        searchQuery={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}        searchPlaceholder={t("searchPlaceholder")}
        filters={
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-[160px] rounded-lg border-gray-200">
                <SelectValue placeholder={t("statusFilterPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt === "all" ? t("allStatuses") : tis(opt)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DateRangeFilter
              startDate={startDate}
              onStartDateChange={setStartDate}
              endDate={endDate}
              onEndDateChange={setEndDate}
            />
          </div>
        }
      />
    </div>
  );
}
