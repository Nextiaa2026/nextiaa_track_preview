"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema, type CustomerInput } from "@/lib/validations";
import type { AddressResult } from "@/lib/nominatim";
import { useCreateCustomer, useUpdateCustomer } from "@/hooks/useCustomers";
import type { Customer } from "@/services/customer.service";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";
import { Loader2 } from "lucide-react";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { LocationMapPreview } from "@/components/ui/location-map-preview";
import { useTranslations } from "next-intl";

interface CreateCustomerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  customer?: Customer | null;
}

export function CreateCustomerSheet({
  open,
  onOpenChange,
  onSuccess,
  customer,
}: CreateCustomerSheetProps) {
  const cs = useTranslations("forms.customerSheet");
  const p = useTranslations("forms.party");
  const ad = useTranslations("forms.address");
  const fc = useTranslations("forms.common");
  const tsw = useTranslations("forms.shipmentWizard");
  const tl = useTranslations("forms.login");
  const { mutate: createCustomer, isPending: isCreating } = useCreateCustomer();
  const { mutate: updateCustomer, isPending: isUpdating } = useUpdateCustomer();
  const isPending = isCreating || isUpdating;
  const isEditing = !!customer;
  const [mapCoords, setMapCoords] = useState<{ lat: number; lon: number } | null>(
    null,
  );
  const [mapCounty, setMapCounty] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      country: "Cameroon",
    },
  });

  useEffect(() => {
    register("locality");
    register("latitude");
    register("longitude");
  }, [register]);

  useEffect(() => {
    if (!open) return;
    if (customer) {
      reset({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zipCode: customer.zipCode,
        country: customer.country,
        locality: customer.locality ?? undefined,
        latitude: customer.latitude ?? undefined,
        longitude: customer.longitude ?? undefined,
      });
      if (customer.latitude != null && customer.longitude != null) {
        setMapCoords({ lat: customer.latitude, lon: customer.longitude });
      } else {
        setMapCoords(null);
      }
      setMapCounty("");
    } else {
      reset({ country: "Cameroon" });
      setMapCoords(null);
      setMapCounty("");
    }
  }, [open, customer, reset]);

  const onSubmit = (data: CustomerInput) => {
    const toastId = toast.loading(isEditing ? cs("updating") : cs("adding"));

    const onSuccessHandler = () => {
      toast.dismiss(toastId);
      toast.success(isEditing ? cs("updateSuccess") : cs("success"));
      reset();
      setMapCoords(null);
      setMapCounty("");
      onOpenChange(false);
      onSuccess?.();
    };

    const onErrorHandler = (err: unknown) => {
      toast.dismiss(toastId);
      toast.error(isEditing ? cs("updateFailTitle") : cs("failTitle"), {
        description: err instanceof Error ? err.message : cs("failGeneric"),
      });
    };

    if (customer) {
      updateCustomer({ id: customer.id, data }, { onSuccess: onSuccessHandler, onError: onErrorHandler });
    } else {
      createCustomer(data, { onSuccess: onSuccessHandler, onError: onErrorHandler });
    }
  };

  const applyGeocode = (r: AddressResult) => {
    setValue("address", r.address, { shouldValidate: true, shouldDirty: true });
    setValue("city", r.city, { shouldValidate: true, shouldDirty: true });
    setValue("state", r.state, { shouldValidate: true, shouldDirty: true });
    setValue("zipCode", r.zipCode, { shouldValidate: true, shouldDirty: true });
    setValue("country", r.country, { shouldValidate: true, shouldDirty: true });
    setValue("locality", r.locality || undefined, {
      shouldValidate: true,
      shouldDirty: true,
    });
    if (Number.isFinite(r.latitude)) {
      setValue("latitude", r.latitude, { shouldValidate: true, shouldDirty: true });
    } else {
      setValue("latitude", undefined, { shouldDirty: true });
    }
    if (Number.isFinite(r.longitude)) {
      setValue("longitude", r.longitude, { shouldValidate: true, shouldDirty: true });
    } else {
      setValue("longitude", undefined, { shouldDirty: true });
    }
    setMapCounty(r.county || "");
    if (Number.isFinite(r.latitude) && Number.isFinite(r.longitude)) {
      setMapCoords({ lat: r.latitude, lon: r.longitude });
    } else {
      setMapCoords(null);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setMapCoords(null);
          setMapCounty("");
        }
        onOpenChange(next);
      }}
    >
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 border-border bg-background p-0 sm:max-w-4xl md:max-w-5xl lg:max-w-6xl"
      >
        <SheetHeader className="px-6 py-4 border-b border-gray-100">
          <SheetTitle className="text-lg font-semibold">
            {isEditing ? cs("editTitle") : cs("title")}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground mt-1">
            {isEditing ? cs("editDescription") : cs("description")}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <form
            id="customer-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="customer-name">{p("fullName")}</FieldLabel>
                <Input
                  id="customer-name"
                  placeholder={tsw("placeholderNameSender")}
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
                {errors.name && (
                  <FieldError>{errors.name.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="customer-email">{fc("email")}</FieldLabel>
                <Input
                  id="customer-email"
                  type="email"
                  placeholder={tl("emailPlaceholder")}
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                {errors.email && (
                  <FieldError>{errors.email.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="customer-phone">{p("phone")}</FieldLabel>
                <Input
                  id="customer-phone"
                  placeholder="+237 6XX XXX XXX"
                  aria-invalid={!!errors.phone}
                  {...register("phone")}
                />
                {errors.phone && (
                  <FieldError>{errors.phone.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="address-search">{p("addressSearch")}</FieldLabel>
                <AddressAutocomplete
                  placeholder={ad("placeholderDetailed")}
                  onAddressSelect={applyGeocode}
                />
                <FieldDescription>
                  {ad("customerAutocompleteHint")}
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="customer-address">{p("streetAddress")}</FieldLabel>
                <Input
                  id="customer-address"
                  placeholder={ad("streetExample")}
                  aria-invalid={!!errors.address}
                  {...register("address")}
                />
                {errors.address && (
                  <FieldError>{errors.address.message}</FieldError>
                )}
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="customer-city">{p("city")}</FieldLabel>
                  <Input
                    id="customer-city"
                    placeholder="Douala"
                    aria-invalid={!!errors.city}
                    {...register("city")}
                  />
                  {errors.city && (
                    <FieldError>{errors.city.message}</FieldError>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="customer-state">{p("state")}</FieldLabel>
                  <Input
                    id="customer-state"
                    placeholder="Littoral"
                    aria-invalid={!!errors.state}
                    {...register("state")}
                  />
                  {errors.state && (
                    <FieldError>{errors.state.message}</FieldError>
                  )}
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="customer-locality">
                  {p("areaNeighbourhood")}
                </FieldLabel>
                <Input
                  id="customer-locality"
                  placeholder={p("areaPlaceholder")}
                  aria-invalid={!!errors.locality}
                  {...register("locality")}
                />
                {errors.locality && (
                  <FieldError>{errors.locality.message}</FieldError>
                )}
                {mapCounty ? (
                  <FieldDescription>
                    {p("countyDistrictLabel")} : {mapCounty}
                  </FieldDescription>
                ) : null}
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="customer-zip">{p("zipCode")}</FieldLabel>
                  <Input
                    id="customer-zip"
                    placeholder="00000"
                    aria-invalid={!!errors.zipCode}
                    {...register("zipCode")}
                  />
                  {errors.zipCode && (
                    <FieldError>{errors.zipCode.message}</FieldError>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="customer-country">{p("country")}</FieldLabel>
                  <Input
                    id="customer-country"
                    placeholder="Cameroun"
                    aria-invalid={!!errors.country}
                    {...register("country")}
                  />
                  {errors.country && (
                    <FieldError>{errors.country.message}</FieldError>
                  )}
                </Field>
              </div>

              {mapCoords ? (
                <LocationMapPreview
                  latitude={mapCoords.lat}
                  longitude={mapCoords.lon}
                  height={176}
                />
              ) : null}

              <Field>
                <div className="flex flex-row-reverse justify-start gap-3 w-full">
                  <Button
                    type="submit"
                    className="flex-1 sm:flex-none h-11 rounded-xl px-8 font-semibold btn-shiny"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {fc("saving")}
                      </>
                    ) : isEditing ? (
                      cs("updateCustomer")
                    ) : (
                      cs("saveCustomer")
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 sm:flex-none h-11 rounded-xl border-gray-200"
                    onClick={() => {
                      setMapCoords(null);
                      setMapCounty("");
                      onOpenChange(false);
                    }}
                  >
                    {fc("cancel")}
                  </Button>
                </div>
              </Field>
            </FieldGroup>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
