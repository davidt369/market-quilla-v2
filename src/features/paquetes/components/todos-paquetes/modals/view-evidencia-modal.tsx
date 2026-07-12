"use client";

import { Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/shared/components/ui/dialog";

import { ReactNode } from "react";

interface ViewEvidenciaModalProps {
    url: string;
    children?: ReactNode;
}

export function ViewEvidenciaModal({ url, children }: ViewEvidenciaModalProps) {
    return (
        <Dialog>
            {children ? (
                <DialogTrigger>
                    {children}
                </DialogTrigger>
            ) : (
                <DialogTrigger className="inline-flex w-fit items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline cursor-pointer">
                    <ImageIcon className="h-3 w-3" />
                    Ver evidencia
                </DialogTrigger>
            )}
            <DialogContent className="max-w-[95vw] sm:max-w-fit w-fit gap-2">
                <DialogHeader className="pb-2">
                    <DialogTitle>Evidencia de Entrega</DialogTitle>
                    <DialogDescription className="sr-only">
                        Fotografía de respaldo de la entrega del paquete.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-center rounded-md overflow-hidden bg-muted/10 border">
                    <Image 
                        src={url} 
                        alt="Evidencia de entrega"
                        width={1200}
                        height={1200}
                        unoptimized
                        className="max-h-[75vh] w-auto max-w-[100%] object-contain"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
