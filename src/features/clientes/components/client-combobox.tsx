"use client";

import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";


import { Button } from "@/shared/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/shared/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Input } from "@/shared/components/ui/input";
import { registrarClienteInlineAction } from "@/features/clientes/actions/clientes.actions";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";

export type ClienteBase = {
    pk_id_cliente: number;
    nombre_completo: string;
    ci_o_cel: string;
    empresa?: string | null;
};

interface ClientComboboxProps {
    value?: number;
    onChange: (value: number) => void;
    clientes: ClienteBase[];
    placeholder?: string;
    onClientAdded?: (cliente: ClienteBase) => void;
}

export function ClientCombobox({
    value,
    onChange,
    clientes,
    placeholder = "Seleccionar cliente...",
    onClientAdded,
}: ClientComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");

    // Estado del form inline
    const [isCreating, setIsCreating] = React.useState(false);
    const [newName, setNewName] = React.useState("");
    const [newCi, setNewCi] = React.useState("");
    const [newEmpresa, setNewEmpresa] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);

    // Filter localmente si es necesario (el Command lo hace parcialmente pero dependemos del searchQuery para el inline)
    const handleCreateInline = async () => {
        if (!newName || !newCi) {
            toast.error("El nombre y el CI/Celular son requeridos.");
            return;
        }
        setIsLoading(true);
        const result = await registrarClienteInlineAction(newName, newCi, newEmpresa);
        if (result.success && result.data) {
            toast.success("Cliente registrado exitosamente.");
            const newClient = result.data;
            if (onClientAdded) {
                onClientAdded(newClient);
            }
            onChange(newClient.pk_id_cliente);
            setIsCreating(false);
            setOpen(false);
            setNewName("");
            setNewCi("");
            setNewEmpresa("");
        } else {
            toast.error(result.error || "Error al crear cliente.");
        }
        setIsLoading(false);
    };

    const selectedClient = clientes.find((c) => c.pk_id_cliente === value);

    return (
        <Popover open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) setIsCreating(false); // Resetear estado al cerrar
        }}>
            <PopoverTrigger render={<Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between" />}>
                {selectedClient
                    ? `${selectedClient.nombre_completo} (${selectedClient.ci_o_cel}) `
                    : placeholder}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                {!isCreating ? (
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Buscar cliente..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                        />
                        <CommandList>
                            <CommandEmpty className="p-2 text-sm text-center">
                                <p className="text-muted-foreground mb-2">No se encontró cliente.</p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    hidden
                                    className="w-full"
                                    onClick={() => {
                                        setNewName(searchQuery);
                                        setIsCreating(true);
                                    }}
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Registrar "{searchQuery}"
                                </Button>
                            </CommandEmpty>
                            <CommandGroup>
                                {clientes.flatMap((cliente) =>
                                    (cliente.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                     cliente.ci_o_cel.includes(searchQuery))
                                        ? [
                                              <CommandItem
                                                  key={cliente.pk_id_cliente}
                                                  value={cliente.nombre_completo}
                                                  onSelect={() => {
                                                      onChange(cliente.pk_id_cliente);
                                                      setOpen(false);
                                                  }}
                                              >
                                                  <Check
                                                      className={cn(
                                                          "mr-2 h-4 w-4",
                                                          value === cliente.pk_id_cliente ? "opacity-100" : "opacity-0"
                                                      )}
                                                  />
                                                  {cliente.nombre_completo} - <span className="text-muted-foreground ml-1">{cliente.ci_o_cel}</span>
                                              </CommandItem>
                                          ]
                                        : []
                                )}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                ) : (
                    <div className="p-4 space-y-3">
                        <h4 className="font-medium text-sm">Registrar Nuevo Cliente</h4>
                        <div className="space-y-2">
                            <Input
                                placeholder="Nombre Completo *"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                disabled={isLoading}
                            />
                            <Input
                                placeholder="CI / Celular *"
                                value={newCi}
                                onChange={(e) => setNewCi(e.target.value)}
                                disabled={isLoading}
                            />
                            <Input
                                placeholder="Empresa (Opcional)"
                                value={newEmpresa}
                                onChange={(e) => setNewEmpresa(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => setIsCreating(false)}
                                disabled={isLoading}
                            >
                                Volver
                            </Button>
                            <Button
                                size="sm"
                                className="flex-1"
                                onClick={handleCreateInline}
                                disabled={isLoading}
                            >
                                {isLoading ? "Guardando..." : "Guardar"}
                            </Button>
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
