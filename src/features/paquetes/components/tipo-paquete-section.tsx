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

    const [nCaja, setNCaja] = React.useState("");
    const [nPaquete, setNPaquete] = React.useState("");
    const [extra, setExtra] = React.useState("");

    // Parse initial value from form if it exists (e.g. edit mode)
    React.useEffect(() => {
        const initialValue = getValues("ubicacionAlmacen") || "";
        if (initialValue.includes("/")) {
            const parts = initialValue.split("/");
            if (parts.length >= 2) {
                setNCaja(parts[1] || "");
                setNPaquete(parts[2] || "");
                setExtra(parts[3] || "");
            }
        } else {
            setExtra(initialValue);
        }
    }, [getValues]);

    // Synchronize individual inputs with the form's location string
    React.useEffect(() => {
        const ubicacion = `${diaActual}/${nCaja}/${nPaquete}/${extra}`;
        if (nCaja || nPaquete || extra) {
            setValue("ubicacionAlmacen", ubicacion, { shouldValidate: true });
        } else {
            setValue("ubicacionAlmacen", ubicacion);
        }
    }, [diaActual, nCaja, nPaquete, extra, setValue]);

    return (
        <SectionCard>
            <SectionTitle icon={Warehouse}>Tipo de Paquete</SectionTitle>

            <Controller
                name="ubicacionAlmacen"
                control={control}
                render={({ fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="mb-4">
                        <FieldLabel>Ubicación Almacén</FieldLabel>

                        <div className="flex items-center gap-2">
                            {/* Día automático */}
                            <Input
                                value={diaActual}
                                readOnly
                                className="w-20 text-center font-semibold bg-muted/40 cursor-default"
                            />

                            <span className="text-muted-foreground font-medium">/</span>

                            {/* N° Caja */}
                            <Input
                                value={nCaja}
                                onChange={(e) => setNCaja(e.target.value)}
                                placeholder="N°Caja"
                                className="w-24 text-center font-medium"
                            />

                            <span className="text-muted-foreground font-medium">/</span>

                            {/*Codigo */}
                            <Input
                                value={nPaquete}
                                onChange={(e) => setNPaquete(e.target.value)}
                                placeholder="Codigo"
                                className="w-24 text-center font-medium"
                            />

                            <span className="text-muted-foreground font-medium">/</span>

                            {/* Extra */}
                            <Input
                                value={extra}
                                onChange={(e) => setExtra(e.target.value)}
                                placeholder="Extra"
                                className="w-24 text-center font-medium"
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
