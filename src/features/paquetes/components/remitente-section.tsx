"use client";

import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { User, X, Search } from "lucide-react";

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

interface RemitenteSectionProps {
    clientes: ClienteBase[];
    handleClientSelected: (type: "remitente", clientId: number | undefined) => void;
}

export function RemitenteSection({ clientes, handleClientSelected }: RemitenteSectionProps) {
    const { control, watch, setValue, clearErrors } = useFormContext<PaqueteCompletoFormData>();
    const [filteredClientes, setFilteredClientes] = React.useState<ClienteBase[]>([]);
    const [showDropdown, setShowDropdown] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Observamos si hay un ID para saber si debemos bloquear los inputs
    const remitenteId = watch("remitente.pk_id_cliente");
    const isClientSelected = !!remitenteId;

    // Cerrar dropdown al hacer clic fuera
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Función para filtrar clientes
    const filterClientes = (value: string) => {
        if (!value || value.trim() === "") {
            setFilteredClientes([]);
            setShowDropdown(false);
            return;
        }

        const searchTerm = value.toLowerCase().trim();
        const filtrados = clientes.filter((cliente) => {
            return (
                cliente.nombre_completo.toLowerCase().includes(searchTerm) ||
                cliente.ci_o_cel.includes(searchTerm) ||
                (cliente.empresa && cliente.empresa.toLowerCase().includes(searchTerm))
            );
        });

        console.log("Término de búsqueda:", searchTerm);
        console.log("Total clientes:", clientes.length);
        console.log("Clientes filtrados:", filtrados.length);

        setFilteredClientes(filtrados);
        setShowDropdown(filtrados.length > 0);
    };

    // Función para manejar el cambio en el input de nombre
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>, onChangeReactHookForm: (...event: any[]) => void) => {
        const value = e.target.value;
        onChangeReactHookForm(value); // Actualiza nombre_completo en react-hook-form
        filterClientes(value);

        if (value.trim() === "") {
            if (isClientSelected) {
                setValue("remitente.pk_id_cliente", undefined as any);
                handleClientSelected("remitente", undefined);
            }
            return;
        }

        // Buscar coincidencia exacta
        const clienteEncontrado = clientes.find(
            (c) => c.nombre_completo.toLowerCase() === value.toLowerCase().trim()
        );

        if (clienteEncontrado) {
            // Match exacto - autocompletar
            setValue("remitente.pk_id_cliente", clienteEncontrado.pk_id_cliente, { shouldValidate: true });
            setValue("remitente.ci_o_cel", clienteEncontrado.ci_o_cel, { shouldValidate: true });
            setValue("remitente.empresa", clienteEncontrado.empresa || "", { shouldValidate: true });
            handleClientSelected("remitente", clienteEncontrado.pk_id_cliente);
            clearErrors(["remitente.ci_o_cel", "remitente.nombre_completo"]);
            setShowDropdown(false);
        } else {
            // Si está escribiendo alguien nuevo, limpiar ID solo si había uno seleccionado
            if (isClientSelected) {
                setValue("remitente.pk_id_cliente", undefined as any);
                handleClientSelected("remitente", undefined);
            }
        }
    };

    // Seleccionar cliente del dropdown
    const handleSelectCliente = (cliente: ClienteBase) => {
        console.log("Cliente seleccionado:", cliente);
        setValue("remitente.pk_id_cliente", cliente.pk_id_cliente, { shouldValidate: true });
        setValue("remitente.nombre_completo", cliente.nombre_completo, { shouldValidate: true });
        setValue("remitente.ci_o_cel", cliente.ci_o_cel, { shouldValidate: true });
        setValue("remitente.empresa", cliente.empresa || "", { shouldValidate: true });
        handleClientSelected("remitente", cliente.pk_id_cliente);
        clearErrors(["remitente.ci_o_cel", "remitente.nombre_completo"]);
        setShowDropdown(false);
    };

    // Función para el botón "X" que limpia todo
    const handleClear = () => {
        setValue("remitente.pk_id_cliente", undefined as any, { shouldValidate: true });
        setValue("remitente.nombre_completo", "", { shouldValidate: true });
        setValue("remitente.ci_o_cel", "", { shouldValidate: true });
        setValue("remitente.empresa", "", { shouldValidate: true });
        setFilteredClientes([]);
        setShowDropdown(false);
        handleClientSelected("remitente", undefined);
    };

    return (
        <SectionCard>
            <SectionTitle icon={User}>Remitente</SectionTitle>

            <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 mt-4">
                <div className="relative" ref={dropdownRef}>
                    <Controller
                        name="remitente.nombre_completo"
                        control={control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>
                                    Nombre Completo <span className="text-destructive">*</span>
                                </FieldLabel>
                                <div className="relative">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            {...field}
                                            id={field.name}
                                            value={field.value || ""}
                                            placeholder="Buscar o escribir nombre..."
                                            onChange={(e) => handleNameChange(e, field.onChange)}
                                            onFocus={() => {
                                                if (field.value && field.value.trim() !== "" && filteredClientes.length > 0) {
                                                    setShowDropdown(true);
                                                }
                                            }}
                                            autoComplete="off"
                                            autoCapitalize="words"
                                            disabled={isClientSelected}
                                            className={
                                                isClientSelected
                                                    ? "pl-10 pr-12 bg-muted"
                                                    : "pl-10 pr-10"
                                            }
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
                                </div>
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />

                    {/* Dropdown de autocompletado */}
                    {showDropdown && !isClientSelected && filteredClientes.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto text-popover-foreground">
                            <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border">
                                {filteredClientes.length} cliente(s) encontrado(s)
                            </div>
                            <ul className="py-1">
                                {filteredClientes.map((cliente) => (
                                    <li
                                        key={cliente.pk_id_cliente}
                                        onClick={() => handleSelectCliente(cliente)}
                                        className="px-4 py-3 cursor-pointer hover:bg-accent hover:text-accent-foreground flex flex-col border-b border-border last:border-b-0"
                                    >
                                        <span className="font-medium">
                                            {cliente.nombre_completo}
                                        </span>
                                        <span className="text-sm text-muted-foreground mt-1">
                                            <strong>CI/Cel:</strong> {cliente.ci_o_cel}
                                            {cliente.empresa && (
                                                <span className="ml-2">• <strong>Empresa:</strong> {cliente.empresa}</span>
                                            )}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <Controller
                    name="remitente.ci_o_cel"
                    control={control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>
                                CI / Celular <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                {...field}
                                id={field.name}
                                placeholder="Ej: 12345678"
                                type="tel"
                                inputMode="numeric"
                                disabled={isClientSelected}
                                className={isClientSelected ? "bg-muted" : ""}
                            />
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
                            <Input
                                {...field}
                                id={field.name}
                                placeholder="Ej: Acme S.A."
                                autoCapitalize="words"
                                disabled={isClientSelected}
                                className={isClientSelected ? "bg-muted" : ""}
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                    )}
                />
            </div>
        </SectionCard>
    );
}