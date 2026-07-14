"use client";

import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Coins, Info } from "lucide-react";

import { PaqueteCompletoFormData } from "@/features/paquetes/schemas/paquetes.schema";
import { Field, FieldLabel, FieldError } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select";
import { SectionCard, SectionTitle } from "./form-layout";

export function InformacionPagoSection({ isPagado = false }: { isPagado?: boolean }) {
    const { control, watch, setValue } = useFormContext<PaqueteCompletoFormData>();
    const momentoPago = watch("momentoPago");
    const precioOferta = watch("precioOferta");
    const hasOferta = precioOferta && Number(precioOferta) > 0;

    React.useEffect(() => {
        if (hasOferta && momentoPago !== "al_registrar") {
            setValue("momentoPago", "al_registrar", { shouldValidate: true });
        }
    }, [hasOferta, momentoPago, setValue]);

    return (
        <SectionCard step={4}>
            <div className="mb-5 flex items-center justify-between">
                <SectionTitle icon={Coins} accent="violet">Información de Pago</SectionTitle>
                {isPagado && (
                    <span className="text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Ya cobrado
                    </span>
                )}
            </div>

            <Controller
                name="momentoPago"
                control={control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="mb-6">
                        <FieldLabel htmlFor={field.name} className="mb-2 block">
                            Momento de Pago
                        </FieldLabel>
                            <Select
                                name={field.name}
                                value={field.value ?? ""}
                                onValueChange={field.onChange}
                                disabled={Boolean(hasOferta)}
                            >
                                <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                                <SelectValue placeholder="Seleccione cuándo pagará" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="al_registrar">
                                    Al registrar
                                </SelectItem>
                                <SelectItem value="al_entregar">
                                    Al entregar
                                </SelectItem>
                            </SelectContent>
                        </Select>



                        {fieldState.invalid ? (
                            <div className="mt-2">
                                <FieldError errors={[fieldState.error]} />
                            </div>
                        ) : null}
                    </Field>
                )}
            />

            <Controller
                name="precioBase"
                control={control}
                render={({ field, fieldState }) => (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border/40 pt-5">
                        <div className="space-y-1">
                            <span className="text-sm font-semibold text-foreground block">
                                Costo Estimado (Base)
                            </span>
                            <span className="text-xs text-muted-foreground block">
                                *Se duplica cada semana en almacén
                            </span>
                        </div>

                        <div className="flex flex-col w-full sm:w-auto sm:items-end gap-1">
                            <div className="relative w-full sm:w-36">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground pointer-events-none select-none">
                                    Bs.
                                </span>
                                <Input
                                    {...field}
                                    value={field.value ?? ""}
                                    id={field.name}
                                    type="number"
                                    inputMode="decimal"
                                    step="0.10"
                                    min="0"
                                    className={`pl-10 pr-3 w-full text-right font-semibold tabular-nums text-base sm:text-sm h-11 sm:h-10 ${isPagado ? "bg-muted cursor-not-allowed" : ""}`}
                                    aria-invalid={fieldState.invalid}
                                    disabled={isPagado}
                                />
                            </div>
                            {fieldState.invalid ? (
                                <span className="text-xs text-destructive mt-1">
                                    {fieldState.error?.message}
                                </span>
                            ) : null}
                        </div>
                    </div>
                )}
            />

            <div className="flex flex-col sm:flex-row gap-4 border-t border-border/40 pt-5 mt-5">
                <Controller
                    name="precioOferta"
                    control={control}
                    render={({ field, fieldState }) => (
                        <div className="flex-1 space-y-2">
                            <FieldLabel htmlFor={field.name} className="block">
                                Precio Oferta (Opcional)
                            </FieldLabel>
                            <div className="relative w-full">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground pointer-events-none select-none">
                                    Bs.
                                </span>
                                <Input
                                    {...field}
                                    value={field.value ?? ""}
                                    id={field.name}
                                    type="number"
                                    inputMode="decimal"
                                    step="0.10"
                                    min="0"
                                    placeholder="Ej. 2.00"
                                    className={`pl-10 pr-3 w-full text-right font-semibold tabular-nums text-base sm:text-sm h-11 sm:h-10 ${isPagado ? "bg-muted cursor-not-allowed" : ""}`}
                                    aria-invalid={fieldState.invalid}
                                    disabled={isPagado}
                                />
                            </div>
                            {fieldState.invalid ? (
                                <span className="text-xs text-destructive">
                                    {fieldState.error?.message}
                                </span>
                            ) : null}
                        </div>
                    )}
                />

                <Controller
                    name="diasOferta"
                    control={control}
                    render={({ field, fieldState }) => (
                        <div className="flex-1 space-y-2">
                            <FieldLabel htmlFor={field.name} className="block">
                                Días de Oferta (Opcional)
                            </FieldLabel>
                            <div className="relative w-full">
                                <Input
                                    {...field}
                                    value={field.value ?? ""}
                                    id={field.name}
                                    type="number"
                                    inputMode="numeric"
                                    step="1"
                                    min="0"
                                    placeholder="Ej. 3"
                                    className={`pr-10 w-full font-semibold tabular-nums text-base sm:text-sm h-11 sm:h-10 ${isPagado ? "bg-muted cursor-not-allowed" : ""}`}
                                    aria-invalid={fieldState.invalid}
                                    disabled={isPagado}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground pointer-events-none select-none">
                                    días
                                </span>
                            </div>
                            {fieldState.invalid ? (
                                <span className="text-xs text-destructive">
                                    {fieldState.error?.message}
                                </span>
                            ) : null}
                        </div>
                    )}
                />
            </div>
        </SectionCard>
    );
}