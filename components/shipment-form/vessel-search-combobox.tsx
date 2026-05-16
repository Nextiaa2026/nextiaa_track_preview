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
import { useVessels } from "@/hooks/useShipments";
import type { Vessel } from "@/services/shipment.service";
import { useTranslations } from "next-intl";

export type VesselSearchComboboxProps = {
  id?: string;
  value?: string | null;
  onChange: (vesselId: string | undefined, vessel: Vessel | null) => void;
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
};

export function VesselSearchCombobox({
  id,
  value,
  onChange,
  disabled,
  error,
  placeholder,
}: VesselSearchComboboxProps) {
  const sw = useTranslations("forms.shipmentWizard");
  const displayPlaceholder = placeholder || sw("vesselSearch");
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const deferredQuery = React.useDeferredValue(query.trim());
  const [pickedSnapshot, setPickedSnapshot] = React.useState<Vessel | null>(
    null,
  );

  const { data: vesselsData, isFetching } = useVessels(1, 100, deferredQuery);
  const vessels = vesselsData?.data ?? [];

  const resolved =
    value != null
      ? vessels.find((v) => v.id === value) ??
        (pickedSnapshot?.id === value ? pickedSnapshot : null)
      : null;

  const label = resolved
    ? `${resolved.name} · ${resolved.imo} · ${resolved.type}`
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
          <span className="truncate text-left">{label ?? displayPlaceholder}</span>
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
          label={sw("vesselCommandLabel")}
        >
           <Command.Input
            placeholder={displayPlaceholder}
            value={query}
            onValueChange={setQuery}
            className="flex h-11 w-full border-b border-border bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Command.List className="max-h-52 overflow-y-auto p-1">
             {isFetching ? (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                {sw("vesselLoading")}
              </div>
             ) : vessels.length === 0 ? (
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                {sw("vesselEmpty")}
              </Command.Empty>
            ) : (
              <Command.Group>
                {vessels.map((v) => (
                  <Command.Item
                    key={v.id}
                    value={String(v.id)}
                    keywords={[v.name, v.imo, v.type]}
                    onSelect={() => {
                      setPickedSnapshot(v);
                      onChange(v.id, v);
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
                        value === v.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate font-normal">{v.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {v.imo} · {v.type}
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
