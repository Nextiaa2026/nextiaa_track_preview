"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useCreatePayment } from "@/hooks/useShipments";
import { toast } from "sonner";

const paymentSchema = z.object({
  amount: z.string().min(1),
  reason: z.string().min(1),
  paidAt: z.string().min(1),
  notes: z.string().optional(),
  notifyParties: z.boolean(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

const REASONS = [
  { value: "acompte", label: "Acompte" },
  { value: "solde", label: "Solde" },
  { value: "assurance", label: "Prime assurance" },
  { value: "autre", label: "Autre" },
] as const;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipmentId: string;
  remaining?: number;
};

export function RecordPaymentSheet({
  open,
  onOpenChange,
  shipmentId,
  remaining,
}: Props) {
  const { mutateAsync: createPayment, isPending } = useCreatePayment();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: remaining && remaining > 0 ? String(remaining) : "",
      reason: "acompte",
      paidAt: new Date().toISOString().slice(0, 10),
      notes: "",
      notifyParties: true,
    },
  });

  const onSubmit = async (values: PaymentFormValues) => {
    const amountNum = Number(values.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      form.setError("amount", { message: "Montant invalide" });
      return;
    }

    try {
      await createPayment({
        shipmentId,
        data: {
          amount: amountNum,
          reason: values.reason,
          paidAt: new Date(values.paidAt).toISOString(),
          notes: values.notes,
          notifyParties: values.notifyParties,
        },
      });
      toast.success("Paiement enregistré — facture envoyée aux parties");
      onOpenChange(false);
      form.reset({
        amount: "",
        reason: "acompte",
        paidAt: new Date().toISOString().slice(0, 10),
        notes: "",
        notifyParties: true,
      });
    } catch {
      toast.error("Échec de l'enregistrement du paiement");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full max-h-dvh w-full flex-col gap-0 border-l p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b bg-muted/20 px-6 py-5">
          <SheetTitle>Enregistrer un paiement</SheetTitle>
          <SheetDescription>
            Plusieurs paiements peuvent être liés à la même expédition (acompte, solde…).
            Une facture mise à jour est envoyée par e-mail avec un lien de téléchargement.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <Form {...form}>
            <form id="payment-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant (EUR)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" className="h-11" {...field} />
                    </FormControl>
                    {remaining != null && (
                      <p className="text-xs text-muted-foreground">
                        Reste à payer : {remaining} €
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Raison</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REASONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paidAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de paiement</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optionnel)</FormLabel>
                    <FormControl>
                      <textarea
                        rows={3}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notifyParties"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(!!v)}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Envoyer la facture par e-mail (lien de téléchargement)
                    </FormLabel>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <SheetFooter className="flex-row-reverse justify-start gap-3 border-t bg-muted/20 p-6">
          <Button type="submit" form="payment-form" disabled={isPending} className="h-11 px-6">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : "Enregistrer"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            className="h-11"
          >
            Annuler
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
