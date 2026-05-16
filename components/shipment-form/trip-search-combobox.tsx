"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Command } from "cmdk";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTrips } from "@/hooks/useShipments";
import type { Trip } from "@/services/shipment.service";

export type TripSearchComboboxProps = {
  id?: string;
  value?: string | null;
  onChange: (tripId: string | undefined, trip: Trip | null) => void;
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
};

export function TripSearchCombobox({
  id,
  value,
  onChange,
  disabled,
  error,
  placeholder = "Rechercher et sélectionner un trajet",
}: TripSearchComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const deferredQuery = React.useDeferredValue(query.trim());
  const [pickedSnapshot, setPickedSnapshot] = React.useState<Trip | null>(null);

  const { data: tripsData, isFetching } = useTrips(1, 100, deferredQuery);
  const trips = tripsData?.data ?? [];

  const resolved =
    value != null
      ? trips.find((t) => t.id === value) ??
        (pickedSnapshot?.id === value ? pickedSnapshot : null)
      : null;

  const label = resolved
    ? `${resolved.name}${resolved.origin ? ` · ${resolved.origin}` : ""}${resolved.destination ? ` → ${resolved.destination}` : ""}`
    : null;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-expanded={open}
          aria-invalid={error}
          className={cn(
            "w-full justify-between font-normal h-11 rounded-xl",
            !value && "text-muted-foreground",
          )}
        >
          <span className="truncate text-left">{label ?? placeholder}</span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) min-w-[280px] max-w-[calc(100vw-2rem)] p-0"
        align="start"
      >
        <Command
          shouldFilter={false}
          className="flex max-h-72 flex-col overflow-hidden rounded-lg bg-popover text-popover-foreground"
          label="Rechercher des trajets"
        >
          <Command.Input
            placeholder={placeholder}
            value={query}
            onValueChange={setQuery}
            className="flex h-11 w-full border-b border-border bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Command.List className="max-h-52 overflow-y-auto p-1">
            {isFetching ? (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                Chargement…
              </div>
            ) : trips.length === 0 ? (
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                Aucun trajet trouvé.
              </Command.Empty>
            ) : (
              <Command.Group>
                {trips.map((t) => (
                  <Command.Item
                    key={t.id}
                    value={String(t.id)}
                    keywords={[t.name, t.origin ?? "", t.destination ?? ""]}
                    onSelect={() => {
                      setPickedSnapshot(t);
                      onChange(t.id, t);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={cn(
                      "relative flex cursor-pointer items-center rounded-md px-2 py-2 text-sm outline-none select-none",
                      "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4 shrink-0",
                        value === t.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate font-normal">{t.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {[t.origin, t.destination].filter(Boolean).join(" → ") || t.status}
                        {t.vessel ? ` · ${t.vessel.name}` : ""}
                      </span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
