"use client";

import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Coins } from "lucide-react";

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

export function InformacionPagoSection() {
    const { control, watch } = useFormContext<PaqueteCompletoFormData>();
    const momentoPago = watch("momentoPago");

    return (
        <SectionCard>
            <div className="mb-4 flex items-center justify-between">
                <SectionTitle icon={Coins}>Información de Pago</SectionTitle>
            </div>

            <Controller
                name="momentoPago"
                control={control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="mb-4">
                        <FieldLabel htmlFor={field.name}>Momento de Pago</FieldLabel>
                        <Select
                            name={field.name}
                            value={field.value ?? ""}
                            onValueChange={field.onChange}
                        >
                            <SelectTrigger id={field.name} aria-invalid={fieldState.invalid}>
                                <SelectValue placeholder="Seleccione cuándo pagará" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="al_registrar">
                                    Al registrar (Prepaid)
                                </SelectItem>
                                <SelectItem value="al_entregar">
                                    Al entregar (COD)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                            {momentoPago === "al_registrar"
                                ? "El remitente paga al registrar el paquete."
                                : "El destinatario paga al recibir el paquete."}
                        </p>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                )}
            />
            <Controller
                name="precioBase"
                control={control}
                render={({ field, fieldState }) => (
                    <div className="flex items-center justify-between border-t border-border/40 pt-4">
                        <div>
                            <span className="text-sm font-medium text-foreground block">
                                Costo Estimado (Base)
                            </span>
                            <span className="text-xs text-muted-foreground">
                                *Se duplica cada semana en almacén
                            </span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="relative w-32">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                                    Bs.
                                </span>
                                <Input
                                    {...field}
                                    id={field.name}
                                    type="number"
                                    step="0.10"
                                    min="0"
                                    className="pl-9 pr-3 text-right font-semibold tabular-nums"
                                    aria-invalid={fieldState.invalid}
                                />
                            </div>
                            {fieldState.invalid && (
                                <span className="text-xs text-destructive">
                                    {fieldState.error?.message}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            />
        </SectionCard>
    );
}
