"use client";

import * as React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PackageOpen } from "lucide-react";
import { useRouter } from "next/navigation";

import {
    paqueteCompletoFormSchema,
    PaqueteCompletoFormData,
} from "@/features/paquetes/schemas/paquetes.schema";
import { registrarPaqueteAction } from "@/features/paquetes/actions/paquetes.actions";

import { Button } from "@/shared/components/ui/button";
import { ClienteBase } from "@/features/clientes/components/client-combobox";

// Import subcomponents
import { RemitenteSection } from "./remitente-section";
import { DestinatarioSection } from "./destinatario-section";
import { TipoPaqueteSection } from "./tipo-paquete-section";
import { InformacionPagoSection } from "./informacion-pago-section";
import { SectionCard, SectionTitle } from "./form-layout";

interface PaqueteFormProps {
    initialClientes: ClienteBase[];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PaqueteForm({ initialClientes }: PaqueteFormProps) {
    const router = useRouter();
    const [clientes, setClientes] = React.useState<ClienteBase[]>(initialClientes);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<PaqueteCompletoFormData>({
        resolver: zodResolver(paqueteCompletoFormSchema as any),
        defaultValues: {
            remitente: {
                nombre_completo: "",
                ci_o_cel: "",
                empresa: "",
            },
            destinatario: {
                nombre_completo: "",
                ci_o_cel: "",
                empresa: "",
            },
            ubicacionAlmacen: "",
            tipoPaquete: "",
            momentoPago: "al_entregar",
            precioBase: 3.00,
        },
    });

    const onSubmit = async (data: PaqueteCompletoFormData) => {
        setIsSubmitting(true);
        const result = await registrarPaqueteAction({}, data);

        if (result.success) {
            toast.success("Paquete registrado exitosamente!");
            form.reset();
            router.push("/dashboard/paquetes");
        } else {
            toast.error(result.error || "No se pudo registrar el paquete.");
        }
        setIsSubmitting(false);
    };

    const handleClientSelected = (type: "remitente" | "destinatario", clientId: number | undefined) => {
        if (!clientId) {
            form.setValue(`${type}.pk_id_cliente`, undefined);
            form.setValue(`${type}.nombre_completo`, "");
            form.setValue(`${type}.ci_o_cel`, "");
            form.setValue(`${type}.empresa`, "");
            return;
        }

        const client = clientes.find((c) => c.pk_id_cliente === clientId);
        if (client) {
            form.setValue(`${type}.pk_id_cliente`, client.pk_id_cliente, { shouldValidate: true });
            form.setValue(`${type}.nombre_completo`, client.nombre_completo, { shouldValidate: true });
            form.setValue(`${type}.ci_o_cel`, client.ci_o_cel, { shouldValidate: true });
            form.setValue(`${type}.empresa`, (client as any).empresa || "", { shouldValidate: true });
        }
    };

    return (
        <FormProvider {...form}>
            <div className="">
                {/* ── Page Header ── */}
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                            <PackageOpen className="h-5 w-5 text-primary" />
                            Registro de Paquetes
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Busque un cliente existente o complete sus datos para registrar uno nuevo automáticamente.
                        </p>
                    </div>


                </div>

                {/* ── Two-column layout ── */}
                <form
                    id="paquete-form"
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_740px]"
                >
                    {/* ── LEFT COLUMN ── */}
                    <div className="flex flex-col gap-4">
                        <RemitenteSection
                            clientes={clientes}
                            handleClientSelected={handleClientSelected}
                        />
                        <DestinatarioSection
                            clientes={clientes}
                            handleClientSelected={handleClientSelected}
                        />
                    </div>

                    {/* ── RIGHT COLUMN ── */}
                    <div className="flex flex-col gap-4">
                        <TipoPaqueteSection />
                        <InformacionPagoSection />
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                form="paquete-form"
                                disabled={isSubmitting}
                                className="min-w-[160px]"
                            >
                                {isSubmitting ? "Registrando..." : "Registrar Paquete"}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </FormProvider>
    );
}