"use client";

import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Warehouse, AlertTriangle } from "lucide-react";

import { PaqueteCompletoFormData } from "@/features/paquetes/schemas/paquetes.schema";
import { Field, FieldLabel, FieldError } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { SectionCard, SectionTitle } from "./form-layout";
import { useCajaOcupacion } from "@/features/paquetes/hooks/use-caja-ocupacion";

const LIMITE_CRITICO = 6;

export function TipoPaqueteSection() {
    const { control, setValue, getValues } = useFormContext<PaqueteCompletoFormData>();
    const { obtenerOcupacion, esCritica, cargando } = useCajaOcupacion();

    const dias = React.useMemo(() => ["D", "L", "M", "MI", "J", "V", "S"], []);
    const diaActual = React.useMemo(() => dias[new Date().getDay()], [dias]);

    const [dia, setDia] = React.useState(() => {
        const initialValue = getValues("ubicacionAlmacen") || "";
        if (initialValue.includes("/")) {
            return initialValue.split("/")[0] || diaActual;
        }
        return diaActual;
    });

    const [nCaja, setNCaja] = React.useState(() => {
        const initialValue = getValues("ubicacionAlmacen") || "";
        if (initialValue.includes("/")) {
            return initialValue.split("/")[1] || "";
        }
        return "";
    });

    const [nPaquete, setNPaquete] = React.useState(() => {
        const initialValue = getValues("ubicacionAlmacen") || "";
        if (initialValue.includes("/")) {
            return initialValue.split("/")[2] || "";
        }
        return initialValue ? "" : "AUTO";
    });

    const [extra, setExtra] = React.useState(() => {
        const initialValue = getValues("ubicacionAlmacen") || "";
        if (initialValue.includes("/")) {
            return initialValue.split("/")[3] || "";
        }
        return initialValue;
    });

    // Synchronize individual inputs with the form's location string
    React.useEffect(() => {
        const ubicacion = `${dia}/${nCaja}/${nPaquete}/${extra}`;
        if (nCaja || nPaquete || extra) {
            setValue("ubicacionAlmacen", ubicacion, { shouldValidate: true });
        } else {
            setValue("ubicacionAlmacen", ubicacion);
        }
    }, [dia, nCaja, nPaquete, extra, setValue]);

    // Estado de advertencia de la caja
    const cajaCritica = !cargando && nCaja.trim() !== "" && esCritica(nCaja.trim());
    const ocupacionCaja = nCaja.trim() !== "" ? obtenerOcupacion(nCaja.trim()) : 0;

    return (
        <SectionCard step={3}>
            <SectionTitle icon={Warehouse} accent="blue">Detalles del Paquete</SectionTitle>

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
                                maxLength={2}
                                className="flex-1 min-w-[60px] sm:max-w-[80px] text-center font-semibold"
                            />

                            <span className="text-muted-foreground font-medium hidden sm:inline">/</span>

                            {/* N° Caja — con indicador de advertencia */}
                            <div className="flex-1 min-w-[80px] sm:max-w-[100px] relative">
                                <Input
                                    value={nCaja}
                                    onChange={(e) => setNCaja(e.target.value)}
                                    placeholder="N°Caja"
                                    maxLength={5}
                                    className={`text-center font-medium w-full ${cajaCritica
                                        ? "border-amber-500 focus-visible:ring-amber-500/30 bg-amber-50 dark:bg-amber-950/20"
                                        : ""
                                        }`}
                                />
                                {cajaCritica && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
                                        <AlertTriangle className="h-2.5 w-2.5" />
                                    </span>
                                )}
                            </div>

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
                                maxLength={6}
                                className="flex-1 min-w-[80px] sm:max-w-[100px] text-center font-medium"
                            />
                        </div>

                        {/* Banner de advertencia de caja llena */}
                        {cajaCritica && (
                            <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2">
                                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                <p className="text-xs text-amber-700 dark:text-amber-400 leading-snug">
                                    <span className="font-bold">Caja {nCaja} llena:</span>{" "}
                                    ya tiene <span className="font-bold">{ocupacionCaja} paquetes</span> sin entregar
                                    (límite recomendado: {LIMITE_CRITICO}).
                                    Considera usar otra caja.
                                </p>
                            </div>
                        )}

                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                )}
            />

            <Controller
                name="tipoPaquete"
                control={control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="mb-4">
                        <FieldLabel htmlFor={field.name}>Tipo de Paquete (Opcional)</FieldLabel>
                        <textarea
                            {...field}
                            id={field.name}
                            aria-invalid={fieldState.invalid}
                            placeholder="Ej: Ropa, Electrónico..."
                            maxLength={25}
                            rows={2}
                            className="flex w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                )}
            />
        </SectionCard>
    );
}
