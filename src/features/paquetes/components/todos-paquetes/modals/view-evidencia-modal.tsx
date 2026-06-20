"use client";

import { Image as ImageIcon } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/shared/components/ui/dialog";

interface ViewEvidenciaModalProps {
    url: string;
}

export function ViewEvidenciaModal({ url }: ViewEvidenciaModalProps) {
    return (
        <Dialog>
            <DialogTrigger 
                className="inline-flex w-fit items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline cursor-pointer"
            >
                <ImageIcon className="h-3 w-3" />
                Ver evidencia
            </DialogTrigger>
            <DialogContent className="max-w-md sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Evidencia de Entrega</DialogTitle>
                    <DialogDescription>
                        Fotografía de respaldo de la entrega del paquete.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-center p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                        src={url} 
                        alt="Evidencia de entrega" 
                        className="max-h-[70vh] max-w-full rounded-md object-contain border bg-muted/20"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
