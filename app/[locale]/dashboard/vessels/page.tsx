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
  useCleanupOperationalData,
  useCreateVessel,
  useDeleteVessel,
  useUpdateVessel,
  useVessels,
} from "@/hooks/useShipments";
import type { Vessel } from "@/services/shipment.service";
import { toast } from "sonner";
import { Loader2, MoreHorizontal, Ship, Plane, Train, Edit2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDebounce } from "@/hooks/use-debounce";

// ─── Vessel form schema ───────────────────────────────────────────────────────

const vesselFormSchema = z.object({
  name: z.string().min(2),
  imo: z.string().min(3),
  type: z.string().min(1),
  customType: z.string().optional(),
});

type VesselFormValues = z.infer<typeof vesselFormSchema>;

const DEFAULT_VESSEL_TYPES = ["ship", "plane", "train"] as const;

function vesselTypeMeta(type: string): { icon: React.ElementType; label: string } {
  const n = type.toLowerCase();
  if (n.includes("plane") || n.includes("air")) return { icon: Plane, label: type };
  if (n.includes("train") || n.includes("rail")) return { icon: Train, label: type };
  return { icon: Ship, label: type };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VesselsPage() {
  const t = useTranslations("pages.vessels");
  const tc = useTranslations("forms.common");
  const tv = useTranslations("validation");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingVessel, setEditingVessel] = useState<Vessel | null>(null);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useVessels(page, pageSize, debouncedSearch);
  const { mutateAsync: createVessel, isPending: isCreating } = useCreateVessel();
  const { mutate: deleteVessel } = useDeleteVessel();
  const { mutateAsync: updateVessel, isPending: isUpdating } = useUpdateVessel();
  const { mutate: cleanupData, isPending: isCleaning } = useCleanupOperationalData();

  const vesselTypeOptions = useMemo(() => {
    const existing = (data?.data ?? []).map((v) => v.type.toLowerCase());
    return Array.from(new Set([...DEFAULT_VESSEL_TYPES, ...existing]));
  }, [data]);

  // ─── Form ────────────────────────────────────────────────────────────────

  const form = useForm<VesselFormValues>({
    resolver: zodResolver(vesselFormSchema),
    defaultValues: { name: "", imo: "", type: "ship", customType: "" },
  });

  const watchedType = form.watch("type");

  const openCreate = () => {
    setEditingVessel(null);
    form.reset({ name: "", imo: "", type: "ship", customType: "" });
    setSheetOpen(true);
  };

  const openEdit = (vessel: Vessel) => {
    setEditingVessel(vessel);
    const isKnown = vesselTypeOptions.includes(vessel.type.toLowerCase() as typeof DEFAULT_VESSEL_TYPES[number]);
    form.reset({
      name: vessel.name,
      imo: vessel.imo,
      type: isKnown ? vessel.type.toLowerCase() : "__custom__",
      customType: isKnown ? "" : vessel.type,
    });
    setSheetOpen(true);
  };

  const onSubmit = async (values: VesselFormValues) => {
    const finalType = values.type === "__custom__"
      ? (values.customType?.trim() ?? "")
      : values.type.trim();

    if (!finalType) {
      form.setError("customType", { message: tv("typeRequired") });
      return;
    }

    try {
      if (editingVessel) {
        await updateVessel({
          id: editingVessel.id,
          data: { name: values.name.trim(), imo: values.imo.trim(), type: finalType },
        });
        toast.success(t("saveSuccess"));
      } else {
        await createVessel({ name: values.name.trim(), imo: values.imo.trim(), type: finalType });
        toast.success(t("createSuccess"));
      }
      setSheetOpen(false);
    } catch {
      toast.error(t("saveFailed"));
    }
  };

  // ─── Columns ─────────────────────────────────────────────────────────────

  const columns = useMemo<ColumnDef<Vessel>[]>(
    () => [
      {
        accessorKey: "name",
        header: t("colName"),
        cell: ({ row }) => (
          <span className="font-medium text-black">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "imo",
        header: t("colImo"),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-gray-600">{row.original.imo}</span>
        ),
      },
      {
        accessorKey: "type",
        header: t("colType"),
        cell: ({ row }) => {
          const meta = vesselTypeMeta(row.original.type);
          const Icon = meta.icon;
          return (
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-black capitalize">{meta.label}</span>
            </div>
          );
        },
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
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => openEdit(row.original)}>
                <Edit2 className="mr-2 h-4 w-4" />
                {t("editAction")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 font-medium"
                onClick={() => {
                  if (!confirm(t("deleteConfirm"))) return;
                  deleteVessel(row.original.id, {
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
    [deleteVessel, t],
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Button onClick={openCreate} className="h-10 rounded-lg px-4 font-medium w-full sm:w-auto">
              {t("addButton")}
            </Button>
          </div>
        }
      />

      {/* ─── Create / Edit Sheet ─────────────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="flex h-full max-h-dvh w-full flex-col gap-0 border-l border-white/5 bg-background p-0 sm:max-w-xl"
        >
          <SheetHeader className="px-6 py-5 border-b border-white/5 bg-muted/20">
            <SheetTitle className="text-2xl font-bold tracking-tight">
              {editingVessel ? t("sheetTitleEdit") : t("sheetTitleCreate")}
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground/70">
              {editingVessel ? t("sheetDescEdit") : t("sheetDescCreate")}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <Form {...form}>
              <form id="vessel-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t("fieldName")}</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex. : CMA CGM MARCO POLO" className="h-11 rounded-lg" {...field} />
                        </FormControl>
                        <FormMessage>
                          {form.formState.errors.name && tv("nameRequired")}
                        </FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imo"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t("fieldImo")}</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex. : 9305374" className="h-11 rounded-lg" {...field} />
                        </FormControl>
                        <FormMessage>
                          {form.formState.errors.imo && tv("imoRequired")}
                        </FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("fieldType")}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vesselTypeOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                          <SelectItem value="__custom__">{t("fieldTypeCustom")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage>
                        {form.formState.errors.type && tv("typeRequired")}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                {watchedType === "__custom__" && (
                  <FormField
                    control={form.control}
                    name="customType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("fieldTypeCustomLabel")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("customTypePlaceholder")}
                            className="h-11 rounded-lg"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage>
                          {form.formState.errors.customType && tv("typeRequired")}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                )}
              </form>
            </Form>
          </div>

          <SheetFooter className="p-6 border-t border-white/5 bg-muted/20 flex-row-reverse justify-start gap-3">
            <Button
              type="submit"
              form="vessel-form"
              disabled={isCreating || isUpdating}
              className="h-11 rounded-xl px-8 font-semibold btn-shiny"
            >
              {isCreating || isUpdating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                tc("save")
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSheetOpen(false)}
              disabled={isCreating || isUpdating}
              className="h-11 rounded-xl border-white/10"
            >
              {tc("cancel")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
