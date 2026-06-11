"use client";

import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { User } from "lucide-react";

import { PaqueteCompletoFormData } from "@/features/paquetes/schemas/paquetes.schema";
import { ClientCombobox, ClienteBase } from "@/features/clientes/components/client-combobox";
import { Field, FieldLabel, FieldError } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { SectionCard, SectionTitle } from "./form-layout";

interface RemitenteSectionProps {
    clientes: ClienteBase[];
    handleClientSelected: (type: "remitente" | "destinatario", clientId: number | undefined) => void;
}

export function RemitenteSection({ clientes, handleClientSelected }: RemitenteSectionProps) {
    const { control, watch } = useFormContext<PaqueteCompletoFormData>();
    const remitenteId = watch("remitente.pk_id_cliente");

    return (
        <SectionCard>
            <SectionTitle icon={User}>Remitente</SectionTitle>

            <div className="mb-4">
                <FieldLabel>Autocompletar con cliente existente</FieldLabel>
                <div className="relative mt-1.5">
                    <ClientCombobox
                        clientes={clientes}
                        value={remitenteId}
                        onChange={(val) => handleClientSelected("remitente", val)}
                        placeholder="Nombre, CI/Celular, o empresa..."
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-lg border border-border/50 bg-slate-50/50 dark:bg-slate-900/20 p-4">
                <Controller
                    name="remitente.nombre_completo"
                    control={control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>
                                Nombre Completo <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input {...field} id={field.name} placeholder="Ej: Juan Pérez" />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                    )}
                />
                <Controller
                    name="remitente.ci_o_cel"
                    control={control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>
                                CI / Celular <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input {...field} id={field.name} placeholder="Ej: 12345678" />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                    )}
                />
                <Controller
                    name="remitente.empresa"
                    control={control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                            <FieldLabel htmlFor={field.name}>Empresa (Opcional)</FieldLabel>
                            <Input {...field} id={field.name} placeholder="Ej: Acme S.A." />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                    )}
                />
            </div>
        </SectionCard>
    );
}
