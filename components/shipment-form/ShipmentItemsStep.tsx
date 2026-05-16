"use client";

import { useFormContext, Controller } from "react-hook-form";
import type { ShipmentFormValues } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TripSearchCombobox } from "@/components/shipment-form/trip-search-combobox";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";
import { useSettings } from "@/providers/SettingsProvider";
import {
  currencySymbol,
  isSuffixCurrency,
  formatCurrency,
} from "@/lib/utils/currency";

// Shipment types are technically IDs, labels come from translations
const SHIPMENT_TYPE_OPTIONS = ["international", "local"] as const;

export function ShipmentItemsStep() {
  const t = useTranslations("forms.items");
  const tw = useTranslations("forms.shipmentWizard");
  const it = {
    tracking: t("tracking"),
    chassisNumber: t("chassisNumber"),
    chassisNumberPh: t("chassisNumberPh"),
    itemTitle: t("itemTitle"),
    itemTitlePh: t("itemTitlePh"),
    description: t("description"),
    descriptionPh: t("descriptionPh"),
    weight: t("weight"),
    weightPh: t("weightPh"),
    dimensions: t("dimensions"),
    dimensionsPh: t("dimensionsPh"),
    shippingCost: t("shippingCost"),
    shipmentType: t("shipmentType"),
    shipmentTypePlaceholder: t("shipmentTypePlaceholder"),
    estimatedDelivery: t("estimatedDelivery"),
    datePlaceholder: t("datePlaceholder"),
    trip: t("trip"),
  };

  const SHIPMENT_TYPE_LABEL: Record<(typeof SHIPMENT_TYPE_OPTIONS)[number], string> = {
    international: tw("shipmentTypeInternational"),
    local: tw("shipmentTypeLocal"),
  };

  const locale = useLocale();
  const { settings } = useSettings();
  const currency = settings.currency || "EUR";
  const sym = currencySymbol(currency);
  const isEur = isSuffixCurrency(currency);

  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<ShipmentFormValues>();

  const shippingCostValue = watch("shippingCost");

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Tracking Number */}
      <Field className="md:col-span-2" data-invalid={!!errors.trackingNumber}>
        <FieldLabel htmlFor="ship-tracking">{it.tracking}</FieldLabel>
        <Input
          id="ship-tracking"
          aria-invalid={!!errors.trackingNumber}
          {...register("trackingNumber")}
        />
        {errors.trackingNumber && <FieldError>{errors.trackingNumber.message}</FieldError>}
      </Field>

      {/* Chassis Number */}
      <Field className="md:col-span-2" data-invalid={!!errors.chassisNumber}>
        <FieldLabel htmlFor="ship-chassis">
          {it.chassisNumber}
          <span className="ml-1 text-destructive">*</span>
        </FieldLabel>
        <Input
          id="ship-chassis"
          placeholder={it.chassisNumberPh}
          aria-invalid={!!errors.chassisNumber}
          {...register("chassisNumber")}
        />
        {errors.chassisNumber && <FieldError>{errors.chassisNumber.message}</FieldError>}
      </Field>

      {/* Item Name */}
      <Field className="md:col-span-2" data-invalid={!!errors.itemName}>
        <FieldLabel htmlFor="ship-item-name">{it.itemTitle}</FieldLabel>
        <Input
          id="ship-item-name"
          placeholder={it.itemTitlePh}
          aria-invalid={!!errors.itemName}
          {...register("itemName")}
        />
        {errors.itemName && <FieldError>{errors.itemName.message}</FieldError>}
      </Field>

      {/* Description */}
      <Field className="md:col-span-2" data-invalid={!!errors.itemDescription}>
        <FieldLabel htmlFor="ship-item-desc">{it.description}</FieldLabel>
        <textarea
          id="ship-item-desc"
          placeholder={it.descriptionPh}
          aria-invalid={!!errors.itemDescription}
          {...register("itemDescription")}
          className="flex min-h-28 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
        />
        {errors.itemDescription && <FieldError>{errors.itemDescription.message}</FieldError>}
      </Field>

      {/* Weight */}
      <Field data-invalid={!!errors.itemWeight}>
        <FieldLabel htmlFor="ship-weight">{it.weight}</FieldLabel>
        <Input
          id="ship-weight"
          placeholder={it.weightPh}
          aria-invalid={!!errors.itemWeight}
          {...register("itemWeight")}
        />
        {errors.itemWeight && <FieldError>{errors.itemWeight.message}</FieldError>}
      </Field>

      {/* Dimensions */}
      <Field data-invalid={!!errors.itemDimensions}>
        <FieldLabel htmlFor="ship-dims">{it.dimensions}</FieldLabel>
        <Input
          id="ship-dims"
          placeholder={it.dimensionsPh}
          aria-invalid={!!errors.itemDimensions}
          {...register("itemDimensions")}
        />
        {errors.itemDimensions && <FieldError>{errors.itemDimensions.message}</FieldError>}
      </Field>

      {/* Shipping Cost — whole units, currency-aware symbol */}
      <Field data-invalid={!!errors.shippingCost}>
        <FieldLabel htmlFor="ship-cost">
          {it.shippingCost}{" "}
          <span className="text-muted-foreground font-normal text-xs">({currency})</span>
        </FieldLabel>
        <div className="relative">
          {!isEur && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
              {sym}
            </span>
          )}
          <Input
            id="ship-cost"
            type="number"
            min={0}
            step={1}
            placeholder="0"
            aria-invalid={!!errors.shippingCost}
            className={cn(!isEur && "pl-8", isEur && "pr-12")}
            {...register("shippingCost", { valueAsNumber: true })}
          />
          {isEur && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
              {sym}
            </span>
          )}
        </div>
        {typeof shippingCostValue === "number" && !isNaN(shippingCostValue) && shippingCostValue > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {formatCurrency(shippingCostValue, currency, locale)}
          </p>
        )}
        {errors.shippingCost && <FieldError>{errors.shippingCost.message}</FieldError>}
      </Field>

      {/* Shipment Type */}
      <Field data-invalid={!!errors.shipmentType}>
        <FieldLabel htmlFor="ship-shipment-type">{it.shipmentType}</FieldLabel>
        <Controller
          control={control}
          name="shipmentType"
          render={({ field }) => (
            <Select value={field.value ?? "international"} onValueChange={field.onChange}>
              <SelectTrigger
                id="ship-shipment-type"
                className={cn("w-full justify-between h-11 rounded-xl", errors.shipmentType && "border-destructive")}
              >
                <SelectValue placeholder={it.shipmentTypePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {SHIPMENT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{SHIPMENT_TYPE_LABEL[opt]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.shipmentType && <FieldError>{errors.shipmentType.message}</FieldError>}
      </Field>

      {/* Estimated Delivery */}
      <Field data-invalid={!!errors.estimatedDelivery}>
        <FieldLabel htmlFor="ship-delivery">{it.estimatedDelivery}</FieldLabel>
        <Controller
          control={control}
          name="estimatedDelivery"
          render={({ field }) => (
            <DatePicker
              value={field.value}
              onChange={field.onChange}
              placeholder={it.datePlaceholder}
              className={errors.estimatedDelivery ? "border-destructive" : ""}
            />
          )}
        />
        {errors.estimatedDelivery && <FieldError>{errors.estimatedDelivery.message}</FieldError>}
      </Field>

      {/* Trip (optional) */}
      <Field className="md:col-span-2" data-invalid={!!errors.tripId}>
        <FieldLabel htmlFor="trip-combobox">{it.trip}</FieldLabel>
        <Controller
          control={control}
          name="tripId"
          render={({ field }) => (
            <TripSearchCombobox
              id="trip-combobox"
              value={field.value ?? undefined}
              onChange={(id) => field.onChange(id ?? undefined)}
              error={!!errors.tripId}
            />
          )}
        />
        {errors.tripId && <FieldError>{errors.tripId.message}</FieldError>}
      </Field>
    </div>
  );
}
