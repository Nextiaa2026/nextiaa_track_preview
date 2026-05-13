"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCleanupOperationalData,
  useCreateVessel,
  useDeleteVessel,
  useUpdateVessel,
  useVessels,
} from "@/hooks/useShipments";
import { Vessel } from "@/services/shipment.service";
import { toast } from "sonner";
import { Loader2, MoreHorizontal, Ship, Plane, Train, Edit2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

const DEFAULT_VESSEL_TYPES = ["ship", "plane", "train"] as const;

const SHIPMENT_STATUSES = [
  { value: "pending", label: "En attente", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "in_transit", label: "En transit", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "delivered", label: "Livré", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "failed", label: "Échec", color: "bg-red-100 text-red-800 border-red-200" },
] as const;

function vesselTypeMeta(type: string): { icon: React.ElementType; label: string } {
  const normalized = type.toLowerCase();
  if (normalized.includes("plane") || normalized.includes("air")) {
    return { icon: Plane, label: type };
  }
  if (normalized.includes("train") || normalized.includes("rail")) {
    return { icon: Train, label: type };
  }
  return { icon: Ship, label: type };
}

export default function VesselsPage() {
  const t = useTranslations("pages.vessels");
  const tc = useTranslations("forms.common");
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  
  // Create state
  const [name, setName] = useState("");
  const [imo, setImo] = useState("");
  const [type, setType] = useState("ship");
  const [customType, setCustomType] = useState("");
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  
  // Edit/Status state
  const [editingVessel, setEditingVessel] = useState<Vessel | null>(null);
  const [newStatus, setNewStatus] = useState<Vessel["status"] | "">("");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useVessels(page, pageSize, search);
  const { mutateAsync: createVessel, isPending: isCreating } = useCreateVessel();
  const { mutate: deleteVessel } = useDeleteVessel();
  const { mutateAsync: updateVessel } = useUpdateVessel();
  const { mutate: cleanupData, isPending: isCleaning } = useCleanupOperationalData();

  const vesselTypeOptions = useMemo(() => {
    const existing = (data?.data ?? [])
      .map((v) => v.type)
      .filter(Boolean)
      .map((v) => v.toLowerCase());
    return Array.from(new Set([...DEFAULT_VESSEL_TYPES, ...existing]));
  }, [data]);

  const onUpdateStatus = async (notify: boolean) => {
    if (!editingVessel || !newStatus) return;
    
    setIsUpdating(true);
    try {
      await updateVessel({
        id: editingVessel.id,
        data: {
          status: newStatus as Vessel["status"],
          notifyRecipients: notify
        }
      });
      toast.success("Statut du navire et des expéditions mis à jour");
      setStatusDialogOpen(false);
      setEditingVessel(null);
      setNewStatus("");
    } catch {
      toast.error("Échec de la mise à jour");
    } finally {
      setIsUpdating(false);
    }
  };

  const columns = useMemo<ColumnDef<Vessel>[]>(
    () => [
      { accessorKey: "name", header: "Nom" },
      { accessorKey: "imo", header: "IMO" },
      {
        accessorKey: "type",
        header: "Type",
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
        accessorKey: "status",
        header: "Statut",
        cell: ({ row }) => {
          const status = SHIPMENT_STATUSES.find(s => s.value === row.original.status);
          return (
            <Badge variant="outline" className={status?.color || ""}>
              {status?.label || row.original.status}
            </Badge>
          );
        }
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-gray-50 rounded-lg"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                className="font-medium"
                onClick={() => {
                  setEditingVessel(row.original);
                  setNewStatus(row.original.status);
                  setStatusDialogOpen(true);
                }}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Modifier le statut
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 font-medium"
                onClick={() => {
                  if (!confirm("Supprimer ce navire ?")) return;
                  deleteVessel(row.original.id, {
                    onSuccess: () => toast.success("Navire supprimé"),
                    onError: () => toast.error("Échec suppression navire"),
                  });
                }}
              >
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [deleteVessel],
  );

  const onCreate = async () => {
    const finalType = type === "__custom__" ? customType.trim() : type.trim();
    if (!name.trim() || !imo.trim() || !finalType) {
      toast.error("Nom, IMO et type requis");
      return;
    }
    try {
      await createVessel({
        name: name.trim(),
        imo: imo.trim(),
        type: finalType,
      });
      setName("");
      setImo("");
      setType("ship");
      setCustomType("");
      setCreateSheetOpen(false);
      toast.success("Navire créé");
    } catch {
      toast.error("Échec de création du navire");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

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
        searchQuery={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder={t("searchPlaceholder")}
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCreateSheetOpen(true)}
              className="h-10 rounded-lg px-4 font-medium"
            >
              {t("addButton")}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 rounded-lg px-3 border-gray-200">
                  <MoreHorizontal className="mr-2 h-4 w-4" />
                  {tc("more")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem
                  className="text-red-600 font-medium"
                  disabled={isCleaning}
                  onClick={() => {
                    if (
                      !confirm(
                        "Confirmer la suppression de toutes les données opérationnelles ?",
                      )
                    )
                      return;
                    cleanupData(undefined, {
                      onSuccess: () =>
                        toast.success("Données supprimées (admin conservé)"),
                      onError: () => toast.error("Échec du nettoyage"),
                    });
                  }}
                >
                  Supprimer toutes les données (hors admin)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <Sheet open={createSheetOpen} onOpenChange={setCreateSheetOpen}>
        <SheetContent
          side="right"
          className="flex h-full max-h-dvh w-full flex-col gap-0 border-l border-white/5 bg-background p-0 sm:max-w-2xl"
        >
          <SheetHeader className="px-6 py-5 border-b border-white/5 bg-muted/20">
            <SheetTitle className="text-2xl font-bold tracking-tight">
              Créer un navire
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground/70">
              Renseignez les informations pour enregistrer un nouveau navire.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <div className="space-y-2">
               <label className="text-sm font-medium text-gray-700">Nom du navire</label>
               <Input
                 placeholder={t("namePlaceholder")}
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 className="h-11 rounded-lg border-gray-200"
               />
            </div>
            <div className="space-y-2">
               <label className="text-sm font-medium text-gray-700">IMO</label>
               <Input
                 placeholder={t("imoPlaceholder")}
                 value={imo}
                 onChange={(e) => setImo(e.target.value)}
                 className="h-11 rounded-lg border-gray-200"
               />
            </div>
            <div className="space-y-2">
               <label className="text-sm font-medium text-gray-700">Type de transport</label>
               <Select value={type} onValueChange={setType}>
                 <SelectTrigger className="h-11 rounded-lg border-gray-200">
                   <SelectValue placeholder="Type de navire" />
                 </SelectTrigger>
                 <SelectContent>
                   {vesselTypeOptions.map((opt) => (
                     <SelectItem key={opt} value={opt}>
                       {opt}
                     </SelectItem>
                   ))}
                   <SelectItem value="__custom__">Personnalisé…</SelectItem>
                 </SelectContent>
               </Select>
            </div>
            {type === "__custom__" ? (
              <div className="space-y-2">
                 <label className="text-sm font-medium text-gray-700">Type personnalisé</label>
                 <Input
                   placeholder={t("customTypePlaceholder")}
                   value={customType}
                   onChange={(e) => setCustomType(e.target.value)}
                   className="h-11 rounded-lg border-gray-200"
                 />
              </div>
            ) : null}
          </div>

          <SheetFooter className="p-6 border-t border-white/5 bg-muted/20 flex-row-reverse justify-start gap-3">
            <Button onClick={() => void onCreate()} disabled={isCreating} className="h-11 rounded-xl px-8 font-semibold btn-shiny">
              {isCreating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                tc("save")
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setCreateSheetOpen(false)}
              disabled={isCreating}
              className="h-11 rounded-xl border-white/10"
            >
              {tc("cancel")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden border border-border shadow-lg">
          <DialogHeader className="px-6 pt-8 pb-4">
            <DialogTitle className="text-xl font-bold text-foreground tracking-tight">
              Mettre à jour le statut du navire
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm leading-relaxed mt-2 font-medium">
              Cela mettra également à jour toutes les expéditions associées à ce navire <span className="font-bold text-foreground">({editingVessel?.name})</span>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nouveau statut</label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as Vessel["status"])}>
                <SelectTrigger className="h-11 border-border bg-muted/30 focus:ring-primary/20">
                  <SelectValue placeholder="En attente" />
                </SelectTrigger>
                <SelectContent className="border-border">
                  {SHIPMENT_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="cursor-pointer py-2.5 font-medium">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="p-6 pt-2 flex flex-row gap-3 border-t border-border bg-muted/5">
            <Button
              variant="outline"
              onClick={() => onUpdateStatus(false)}
              disabled={isUpdating || !newStatus}
              className="flex-1 h-11 rounded-lg font-bold text-[11px] tracking-wider"
            >
              Mettre à jour sans notifier
            </Button>
            <Button
              onClick={() => onUpdateStatus(true)}
              disabled={isUpdating || !newStatus}
              className="flex-1 h-11 rounded-lg font-bold text-[11px] tracking-wider btn-shiny bg-primary text-primary-foreground"
            >
              Mettre à jour et notifier les parties
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
