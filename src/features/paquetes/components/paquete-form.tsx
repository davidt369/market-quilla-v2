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
import { generateAndOpenReceiptPdf } from "./registrar-paquete/thermal-receipt-pdf";

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
            precioBase: 3.00,
        },
    });

    React.useEffect(() => {
        if (initialData) {
            form.reset(initialData);
        }
    }, [initialData, form]);

    const onSubmit = async (data: PaqueteCompletoFormData) => {
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
                        tipoPaquete: data.tipoPaquete
                    };
                    generateAndOpenReceiptPdf(pkgForReceipt).catch(err => {
                        console.error("Error al generar PDF:", err);
                        toast.error("Error al generar el recibo para impresión.");
                    });
                    
                    form.reset();
                }
                
                router.push("/dashboard/paquetes");
            } else {
                toast.error(packageId ? "Error al actualizar" : "Error al registrar", {
                    description: result.error || "No se pudo procesar la solicitud. Verifique los datos e intente nuevamente.",
                    icon: <AlertCircle className="h-5 w-5 text-destructive" />
                });
            }
        } catch (error) {
            toast.error("Error inesperado", {
                description: "Ocurrió un problema de conexión. Intente nuevamente."
            });
        } finally {
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
            <div className="w-full mx-auto pb-32 lg:pb-12 animate-in fade-in duration-500">

                {/* ── Page Header (Enterprise Style) ── */}
                <div className="mb-6 sm:mb-8 border-b pb-6 px-4 sm:px-6 sm:pt-6">
                    <button
                        onClick={() => router.back()}
                        className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 w-fit"
                    >
                        <div className="p-1 rounded-md bg-muted/50 group-hover:bg-muted transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                        </div>
                        Regresar al listado
                    </button>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-foreground">
                                <div className="p-2.5 bg-primary/10 rounded-xl shadow-sm border border-primary/10">
                                    <PackageOpen className="h-6 w-6 text-primary" />
                                </div>
                                {packageId ? "Editar Registro de Paquete" : "Nuevo Registro de Paquete"}
                            </h1>
                            <p className="mt-2 text-muted-foreground max-w-2xl text-sm md:text-base">
                                {packageId ? "Modifique los detalles operativos del envío." : "Ingrese los detalles operativos del envío. Busque clientes existentes para autocompletar la información."}
                            </p>
                        </div>
                        {/* Indicador opcional de estado de formulario */}
                        <div className="hidden md:flex text-sm text-muted-foreground bg-muted/40 px-4 py-2 rounded-full border">
                            Formulario de Operaciones
                        </div>
                    </div>
                </div>

                {/* ── Layout del Formulario ── */}
                <form
                    id="paquete-form"
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-6 lg:gap-8 items-start sm:px-6"
                >
                    {/* ── COLUMNA IZQUIERDA (Personas) ── */}
                    <div className="flex flex-col gap-6 lg:col-span-6 xl:col-span-5">
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
                    <div className="flex flex-col gap-6 lg:col-span-6 xl:col-span-7">
                        <TipoPaqueteSection />
                        <InformacionPagoSection isPagado={isPagado} />
                    </div>
                </form>

                {/* ── ACTION BAR (Estático) ── */}
                <div className="mt-8 pt-6 border-t px-4 sm:px-6">
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
                />
            </div>
        </FormProvider>
    );
}