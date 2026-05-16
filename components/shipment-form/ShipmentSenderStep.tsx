"use client";

import { useFormContext, Controller } from "react-hook-form";
import type { ShipmentFormValues } from "@/lib/validations";
import type { Customer } from "@/services/customer.service";
import { Input } from "@/components/ui/input";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { LocationMapPreview } from "@/components/ui/location-map-preview";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { setPartyAddressFromGeocode } from "./shipment-address-helpers";
import { CustomerCombobox } from "./CustomerCombobox";
import { useTranslations } from "next-intl";

type Props = {
  customers: Customer[];
  senderMode: "existing" | "new";
  onSenderModeChange: (m: "existing" | "new") => void;
  mapPreview: { lat: number; lon: number } | null;
  onMapPreviewChange: (v: { lat: number; lon: number } | null) => void;
};

export function ShipmentSenderStep({
  customers,
  senderMode,
  onSenderModeChange,
  mapPreview,
  onMapPreviewChange,
}: Props) {
  const p = useTranslations("forms.party");
  const ad = useTranslations("forms.address");
  const sw = useTranslations("forms.shipmentWizard");
  const fc = useTranslations("forms.common");
  const tl = useTranslations("forms.login");
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<ShipmentFormValues>();

  return (
    <FieldGroup className="gap-6">
      {/* Mode toggle */}
      <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
        <button
          type="button"
          className={cn(
            "rounded-md px-4 py-2 text-xs font-semibold transition-colors",
            senderMode === "existing"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
          onClick={() => { onSenderModeChange("existing"); onMapPreviewChange(null); }}
        >
          {p("existingCustomer")}
        </button>
        <button
          type="button"
          className={cn(
            "rounded-md px-4 py-2 text-xs font-semibold transition-colors",
            senderMode === "new"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
          onClick={() => { onSenderModeChange("new"); onMapPreviewChange(null); }}
        >
          {p("newProfile")}
        </button>
      </div>

      {senderMode === "existing" ? (
        <Field data-invalid={!!errors.senderId}>
          <FieldLabel htmlFor="sender-customer">{p("editCardSender")}</FieldLabel>
          <Controller
            control={control}
            name="senderId"
            render={({ field }) => (
              <CustomerCombobox
                customers={customers}
                value={field.value}
                onSelect={field.onChange}
                placeholder={sw("placeholderSender")}
                error={!!errors.senderId}
              />
            )}
          />
          {errors.senderId && <FieldError>{errors.senderId.message}</FieldError>}
          {typeof errors.sender?.message === "string" && (
            <FieldError>{errors.sender.message}</FieldError>
          )}
        </Field>
      ) : (
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/20 p-4 md:grid-cols-2 md:p-6">
          <Field data-invalid={!!errors.sender?.name}>
            <FieldLabel htmlFor="sender-name">{p("fullName")}</FieldLabel>
            <Input id="sender-name" placeholder={sw("placeholderNameSender")} aria-invalid={!!errors.sender?.name} {...register("sender.name")} />
            {errors.sender?.name && <FieldError>{errors.sender.name.message}</FieldError>}
          </Field>

          <Field data-invalid={!!errors.sender?.email}>
            <FieldLabel htmlFor="sender-email">{fc("email")}</FieldLabel>
            <Input id="sender-email" type="email" placeholder={tl("emailPlaceholder")} aria-invalid={!!errors.sender?.email} {...register("sender.email")} />
            {errors.sender?.email && <FieldError>{errors.sender.email.message}</FieldError>}
          </Field>

          <Field data-invalid={!!errors.sender?.phone}>
            <FieldLabel htmlFor="sender-phone">{p("phone")}</FieldLabel>
            <Input id="sender-phone" placeholder="+237 …" aria-invalid={!!errors.sender?.phone} {...register("sender.phone")} />
            {errors.sender?.phone && <FieldError>{errors.sender.phone.message}</FieldError>}
          </Field>

          <Field className="md:col-span-2" data-invalid={!!errors.sender?.address}>
            <FieldLabel htmlFor="sender-address-search">{p("addressSearch")}</FieldLabel>
            <AddressAutocomplete
              placeholder={ad("placeholder")}
              onAddressSelect={(addr) => {
                setPartyAddressFromGeocode(setValue, "sender", addr);
                if (Number.isFinite(addr.latitude) && Number.isFinite(addr.longitude)) {
                  onMapPreviewChange({ lat: addr.latitude, lon: addr.longitude });
                } else {
                  onMapPreviewChange(null);
                }
              }}
            />
            <input type="hidden" {...register("sender.address")} />
            {errors.sender?.address && <FieldError>{errors.sender.address.message}</FieldError>}
            {mapPreview && (
              <LocationMapPreview latitude={mapPreview.lat} longitude={mapPreview.lon} height={160} className="mt-3" />
            )}
          </Field>

          <p className="md:col-span-2 -mt-2 text-xs text-muted-foreground">{ad("hintPartyMissing")}</p>

          <Field data-invalid={!!errors.sender?.city}>
            <FieldLabel htmlFor="sender-city">{p("city")}</FieldLabel>
            <Input id="sender-city" placeholder={ad("autofilled")} aria-invalid={!!errors.sender?.city} {...register("sender.city")} />
            {errors.sender?.city && <FieldError>{errors.sender.city.message}</FieldError>}
          </Field>

          <Field data-invalid={!!errors.sender?.state}>
            <FieldLabel htmlFor="sender-state">{p("state")}</FieldLabel>
            <Input id="sender-state" placeholder={ad("statePlaceholder")} aria-invalid={!!errors.sender?.state} {...register("sender.state")} />
            {errors.sender?.state && <FieldError>{errors.sender.state.message}</FieldError>}
          </Field>

          <Field data-invalid={!!errors.sender?.zipCode}>
            <FieldLabel htmlFor="sender-zip">{p("zipCode")}</FieldLabel>
            <Input id="sender-zip" placeholder={ad("zipPlaceholder")} aria-invalid={!!errors.sender?.zipCode} {...register("sender.zipCode")} />
            {errors.sender?.zipCode && <FieldError>{errors.sender.zipCode.message}</FieldError>}
          </Field>

          <Field data-invalid={!!errors.sender?.country}>
            <FieldLabel htmlFor="sender-country">{p("country")}</FieldLabel>
            <Input id="sender-country" placeholder={ad("countryPlaceholder")} aria-invalid={!!errors.sender?.country} {...register("sender.country")} />
            {errors.sender?.country && <FieldError>{errors.sender.country.message}</FieldError>}
          </Field>
        </div>
      )}
    </FieldGroup>
  );
}
