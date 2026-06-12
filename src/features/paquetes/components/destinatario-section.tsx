"use client";

import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { MapPin, X } from "lucide-react";

import { PaqueteCompletoFormData } from "@/features/paquetes/schemas/paquetes.schema";
import { Field, FieldLabel, FieldError } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { SectionCard, SectionTitle } from "./form-layout";

export type ClienteBase = {
    pk_id_cliente: number;
    nombre_completo: string;
    ci_o_cel: string;
    empresa?: string | null;
};

interface DestinatarioSectionProps {
    clientes: ClienteBase[];
    handleClientSelected: (type: "remitente" | "destinatario", clientId: number | undefined) => void;
}

export function DestinatarioSection({ clientes, handleClientSelected }: DestinatarioSectionProps) {
    const { control, watch, setValue, clearErrors } = useFormContext<PaqueteCompletoFormData>();

    // Observamos si hay un ID para saber si debemos bloquear los inputs
    const destinatarioId = watch("destinatario.pk_id_cliente");
    const isClientSelected = !!destinatarioId;

    // Se ejecuta cada vez que el usuario escribe en el input de Nombre
    const handleNameChange = (value: string, onChangeReactHookForm: (val: string) => void) => {
        onChangeReactHookForm(value);

        // Buscamos si el texto coincide exactamente con algún cliente
        const clienteEncontrado = clientes.find((c) => c.nombre_completo.toLowerCase() === value.toLowerCase());

        if (clienteEncontrado) {
            // ¡Match! Autocompletamos, guardamos el ID y limpiamos errores
            setValue("destinatario.pk_id_cliente", clienteEncontrado.pk_id_cliente, { shouldValidate: true });
            setValue("destinatario.ci_o_cel", clienteEncontrado.ci_o_cel, { shouldValidate: true });
            setValue("destinatario.empresa", clienteEncontrado.empresa || "", { shouldValidate: true });

            handleClientSelected("destinatario", clienteEncontrado.pk_id_cliente);
            clearErrors(["destinatario.ci_o_cel", "destinatario.nombre_completo"]);
        } else {
            // Si está escribiendo alguien nuevo, aseguramos que el ID esté vacío
            setValue("destinatario.pk_id_cliente", undefined as any);
            handleClientSelected("destinatario", undefined);
        }
    };

    // Función para el botón "X" que limpia todo y permite empezar de cero
    const handleClear = () => {
        setValue("destinatario.pk_id_cliente", undefined as any, { shouldValidate: true });
        setValue("destinatario.nombre_completo", "", { shouldValidate: true });
        setValue("destinatario.ci_o_cel", "", { shouldValidate: true });
        setValue("destinatario.empresa", "", { shouldValidate: true });

        handleClientSelected("destinatario", undefined);
    };

    return (
        <SectionCard>
            <SectionTitle icon={MapPin}>Destinatario</SectionTitle>

            {/* Datalist único para el destinatario */}
            <datalist id="lista-clientes-destinatario">
                {clientes.map((cliente) => (
                    <option key={cliente.pk_id_cliente} value={cliente.nombre_completo}>
                        CI: {cliente.ci_o_cel}
                    </option>
                ))}
            </datalist>

            <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 mt-4">
                <Controller
                    name="destinatario.nombre_completo"
                    control={control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>
                                Nombre Completo <span className="text-destructive">*</span>
                            </FieldLabel>
                            <div className="relative">
                                <Input
                                    {...field}
                                    id={field.name}
                                    placeholder="Nombre completo..."
                                    list="lista-clientes-destinatario"
                                    onChange={(e) => handleNameChange(e.target.value, field.onChange)}
                                    autoComplete="off"
                                    autoCapitalize="words"
                                    disabled={isClientSelected}
                                    className={isClientSelected ? "pr-12 bg-slate-100 dark:bg-slate-900" : "pr-10"}
                                />
                                {isClientSelected && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleClear}
                                        className="absolute right-0 top-0 h-full px-4 hover:bg-transparent text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="h-5 w-5" />
                                        <span className="sr-only">Limpiar cliente</span>
                                    </Button>
                                )}
                            </div>
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                    )}
                />

                <Controller
                    name="destinatario.ci_o_cel"
                    control={control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>
                                CI / Celular <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                {...field}
                                id={field.name}
                                placeholder="Ej: 98765432"
                                type="tel"
                                inputMode="numeric"
                                disabled={isClientSelected}
                                className={isClientSelected ? "bg-slate-100 dark:bg-slate-900" : ""}
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                    )}
                />

                <Controller
                    name="destinatario.empresa"
                    control={control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                            <FieldLabel htmlFor={field.name}>Empresa (Opcional)</FieldLabel>
                            <Input
                                {...field}
                                id={field.name}
                                placeholder="Ej: TechCorp S.R.L."
                                autoCapitalize="words"
                                disabled={isClientSelected}
                                className={isClientSelected ? "bg-slate-100 dark:bg-slate-900" : ""}
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                    )}
                />
            </div>
        </SectionCard>
    );
}