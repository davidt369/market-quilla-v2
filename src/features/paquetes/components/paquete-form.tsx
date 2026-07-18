"use client";

import * as React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PackageOpen, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import {
    paqueteCompletoFormSchema,
    PaqueteCompletoFormData,
} from "@/features/paquetes/schemas/paquetes.schema";
import { registrarPaqueteAction, actualizarPaqueteCompletoAction } from "@/features/paquetes/actions/paquetes.actions";

import { Button } from "@/shared/components/ui/button";
import { PaqueteConfirmDialog } from "./paquete-confirm-dialog";
import { ClienteBase } from "@/features/clientes/components/client-combobox";

import { RemitenteSection } from "./remitente-section";
import { DestinatarioSection } from "./destinatario-section";
import { TipoPaqueteSection } from "./tipo-paquete-section";
import { InformacionPagoSection } from "./informacion-pago-section";
import { PrintOptionDialog } from "./registrar-paquete/print-option-dialog";
import { useCajaOcupacion } from "@/features/paquetes/hooks/use-caja-ocupacion";
import { parseUbicacion } from "@/features/paquetes/utils/ubicacion.util";

interface PaqueteFormProps {
    initialClientes: ClienteBase[];
    initialData?: PaqueteCompletoFormData;
    packageId?: number;
    isPagado?: boolean;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PaqueteForm({ initialClientes, initialData, packageId, isPagado = false }: PaqueteFormProps) {
    const router = useRouter();
    const [clientes, setClientes] = React.useState<ClienteBase[]>(initialClientes);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Modal states
    const [confirmModalOpen, setConfirmModalOpen] = React.useState(false);
    const [pendingData, setPendingData] = React.useState<PaqueteCompletoFormData | null>(null);
    const [cajaWarning, setCajaWarning] = React.useState({ critica: false, total: 0 });

    const { obtenerOcupacion, esCritica } = useCajaOcupacion();

    // Print states
    const [isPrintDialogOpen, setIsPrintDialogOpen] = React.useState(false);
    const [printPkg, setPrintPkg] = React.useState<any | null>(null);


    const form = useForm<PaqueteCompletoFormData>({
        resolver: zodResolver(paqueteCompletoFormSchema as any),
        defaultValues: initialData || {
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
            precioBase: "" as any,
        },
    });

    React.useEffect(() => {
        if (initialData) {
            form.reset(initialData);
        }
    }, [initialData, form]);

    const onSubmit = async (data: PaqueteCompletoFormData) => {
        const ubicacionInfo = parseUbicacion(data.ubicacionAlmacen);
        const caja = ubicacionInfo.caja;
        setCajaWarning({
            critica: caja ? esCritica(caja) : false,
            total: caja ? obtenerOcupacion(caja) : 0,
        });
        setPendingData(data);
        setConfirmModalOpen(true);
    };

    const submitData = async (data: PaqueteCompletoFormData) => {
        setIsSubmitting(true);
        try {
            const result = packageId
                ? await actualizarPaqueteCompletoAction(packageId, data)
                : await registrarPaqueteAction({}, data);

            if (result.success) {
                toast.success(packageId ? "Paquete actualizado" : "Paquete registrado exitosamente", {
                    description: packageId
                        ? `El paquete ha sido actualizado correctamente.`
                        : `El paquete de ${data.remitente.nombre_completo} ha sido procesado.`,
                    icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                });
                if (!packageId) {
                    const pkgForReceipt = {
                        ...result.data,
                        remitente: data.remitente,
                        destinatario: data.destinatario,
                        precioBase: data.precioBase,
                        tipoPaquete: (data as any).tipoPaquete
                    };
                    setPrintPkg(pkgForReceipt);
                    setIsPrintDialogOpen(true);
                    form.reset();
                } else {
                    router.push("/dashboard/paquetes");
                }
            } else {
                toast.error(packageId ? "Error al actualizar" : "Error al registrar", {
                    description: result.error || "No se pudo procesar la solicitud. Verifique los datos e intente nuevamente.",
                    icon: <AlertCircle className="h-5 w-5 text-destructive" />
                });
                setIsSubmitting(false);
            }
            setConfirmModalOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Error al guardar el paquete");
            setIsSubmitting(false);
            setConfirmModalOpen(false);
        }
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
            <div className="w-full mx-auto pb-4 animate-in fade-in duration-500">
                {/* ── Layout del Formulario ── */}
                <form
                    id="paquete-form"
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-4 items-start sm:px-6 mt-2"
                >
                    {/* ── COLUMNA IZQUIERDA (Personas) ── */}
                    <div className="flex flex-col gap-4 lg:col-span-6 xl:col-span-5">
                        <RemitenteSection
                            clientes={clientes}
                            handleClientSelected={handleClientSelected}
                        />
                        <DestinatarioSection
                            clientes={clientes}
                            handleClientSelected={handleClientSelected}
                        />
                    </div>

                    {/* ── COLUMNA DERECHA (Detalles y Pago) ── */}
                    <div className="flex flex-col gap-4 lg:col-span-6 xl:col-span-7">
                        <TipoPaqueteSection />
                        <InformacionPagoSection isPagado={isPagado} />
                    </div>
                </form>

                {/* ── ACTION BAR (Estático) ── */}
                <div className="mt-4 pt-4 border-t px-4 sm:px-6">
                    <div className="max-w-7xl mx-auto flex flex-col-reverse sm:flex-row justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={isSubmitting}
                            className="w-full sm:w-32 h-12 sm:h-11 font-medium"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            form="paquete-form"
                            disabled={isSubmitting}
                            className="w-full sm:w-48 h-12 sm:h-11 font-medium shadow-md transition-all active:scale-[0.98]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Procesando...
                                </>
                            ) : packageId ? (
                                "Guardar Cambios"
                            ) : (
                                "Registrar Paquete"
                            )}
                        </Button>
                    </div>
                </div>

                {/* ── Confirm Modal (Estilo Recibo Empresarial) ── */}
                <PaqueteConfirmDialog
                    open={confirmModalOpen}
                    onOpenChange={setConfirmModalOpen}
                    pendingData={pendingData}
                    isSubmitting={isSubmitting}
                    onConfirm={submitData}
                    isPagado={isPagado}
                    isEditing={!!packageId}
                    cajaCritica={cajaWarning.critica}
                    cajaOcupacionTotal={cajaWarning.total}
                />

                {/* ── Print Selection Modal ── */}
                {isPrintDialogOpen && (
                    <PrintOptionDialog
                        isOpen={isPrintDialogOpen}
                        onClose={() => {
                            setIsPrintDialogOpen(false);
                            router.push("/dashboard/paquetes");
                        }}
                        pkg={printPkg}
                    />
                )}
            </div>
        </FormProvider>
    );
}