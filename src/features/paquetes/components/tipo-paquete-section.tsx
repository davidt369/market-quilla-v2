"use client";

import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Warehouse } from "lucide-react";

import { PaqueteCompletoFormData } from "@/features/paquetes/schemas/paquetes.schema";
import { Field, FieldLabel, FieldError } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { SectionCard, SectionTitle } from "./form-layout";

export function TipoPaqueteSection() {
    const { control, setValue, getValues } = useFormContext<PaqueteCompletoFormData>();

    const dias = React.useMemo(() => ["D", "L", "M", "MI", "J", "V", "S"], []);
    const diaActual = React.useMemo(() => dias[new Date().getDay()], [dias]);

    const [dia, setDia] = React.useState(diaActual);
    const [nCaja, setNCaja] = React.useState("");
    const [nPaquete, setNPaquete] = React.useState("AUTO");
    const [extra, setExtra] = React.useState("");

    // Parse initial value from form if it exists (e.g. edit mode)
    React.useEffect(() => {
        const initialValue = getValues("ubicacionAlmacen") || "";
        if (initialValue.includes("/")) {
            const parts = initialValue.split("/");
            if (parts.length >= 2) {
                setDia(parts[0] || diaActual);
                setNCaja(parts[1] || "");
                setNPaquete(parts[2] || "");
                setExtra(parts[3] || "");
            }
        } else {
            setExtra(initialValue);
            // Default to AUTO for new packages
            if (!initialValue) {
                setNPaquete("AUTO");
            }
        }
    }, [getValues, diaActual]);

    // Synchronize individual inputs with the form's location string
    React.useEffect(() => {
        const ubicacion = `${dia}/${nCaja}/${nPaquete}/${extra}`;
        if (nCaja || nPaquete || extra) {
            setValue("ubicacionAlmacen", ubicacion, { shouldValidate: true });
        } else {
            setValue("ubicacionAlmacen", ubicacion);
        }
    }, [dia, nCaja, nPaquete, extra, setValue]);

    return (
        <SectionCard>
            <SectionTitle icon={Warehouse}>Tipo de Paquete</SectionTitle>

            <Controller
                name="ubicacionAlmacen"
                control={control}
                render={({ fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="mb-4">
                        <FieldLabel>Ubicación Almacén</FieldLabel>

                        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                            {/* Día automático editable */}
                            <Input
                                value={dia}
                                onChange={(e) => setDia(e.target.value.toUpperCase())}
                                placeholder="Día"
                                className="flex-1 min-w-[60px] sm:max-w-[80px] text-center font-semibold"
                            />

                            <span className="text-muted-foreground font-medium hidden sm:inline">/</span>

                            {/* N° Caja */}
                            <Input
                                value={nCaja}
                                onChange={(e) => setNCaja(e.target.value)}
                                placeholder="N°Caja"
                                className="flex-1 min-w-[80px] sm:max-w-[100px] text-center font-medium"
                            />

                            <span className="text-muted-foreground font-medium hidden sm:inline">/</span>

                            {/*Codigo */}
                            <Input
                                value={nPaquete}
                                readOnly
                                placeholder="Codigo"
                                className="flex-1 min-w-[80px] sm:max-w-[100px] text-center font-semibold bg-muted/40 cursor-default text-muted-foreground"
                                title="Se asignará un código correlativo automáticamente al guardar"
                            />

                            <span className="text-muted-foreground font-medium hidden sm:inline">/</span>

                            {/* Extra */}
                            <Input
                                value={extra}
                                onChange={(e) => setExtra(e.target.value)}
                                placeholder="Extra"
                                className="flex-1 min-w-[80px] sm:max-w-[100px] text-center font-medium"
                            />
                        </div>

                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                )}
            />

            <Controller
                name="tipoPaquete"
                control={control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="mb-4">
                        <FieldLabel htmlFor={field.name}>Tipo de Paquete</FieldLabel>
                        <textarea
                            {...field}
                            id={field.name}
                            aria-invalid={fieldState.invalid}
                            placeholder="Descripción única del contenido..."
                            rows={3}
                            className="flex w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                )}
            />
        </SectionCard>
    );
}
