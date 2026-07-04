"use client";

import {
    Document,
    Page,
    Text,
    View,
    Image,
    StyleSheet,
    pdf,
} from "@react-pdf/renderer";

// ─── Dimensiones de salida ────────────────────────────────────────────────────
//
//  RawBT imprime imágenes mapeando 1px de la imagen → 1 punto térmico.
//  Para una impresora de 203 DPI y papel de 49mm × 29mm:
//    Ancho = 49mm × 8 puntos/mm = 392 px
//    Alto  = 29mm × 8 puntos/mm = 232 px
//
//  @react-pdf/renderer usa puntos (pt). RawBT renderiza el PDF a 1pt → 1px,
//  por lo tanto debemos usar 392pt × 232pt como tamaño de página.
//
// const W = 392;   // puntos → RawBT los trata como 392 px
// const H = 232;   // puntos → RawBT los trata como 232 px
const W = 304; // 38 mm
const H = 224; // 28 mm
// ─── Estilos (escalados a 304×224pt) ─────────────────────────────────────────
const s = StyleSheet.create({
    page: {
        width: W,
        height: H,
        margin: 0,
        padding: 4,
        backgroundColor: "#ffffff",
        fontFamily: "Helvetica",
        flexDirection: "column",
    },

    // CABECERA
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 2,
        borderBottomColor: "#000000",
        paddingBottom: 2,
        marginBottom: 2,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        overflow: "hidden",
        flex: 1,
    },
    ubicBox: {
        borderWidth: 2,
        borderColor: "#000000",
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 2,
    },
    ubicText: {
        fontSize: 18,
        fontFamily: "Helvetica-Bold",
    },
    costoText: {
        fontSize: 13,
        fontFamily: "Helvetica-Bold",
        marginLeft: 4,
    },
    logo: {
        width: 42,
        height: 32,
        objectFit: "contain",
        marginLeft: 4,
    },

    // CUERPO
    body: {
        flex: 1,
        flexDirection: "column",
        justifyContent: "center",
        gap: 2,
    },
    grid: {
        flexDirection: "column",
        gap: 0,
    },
    row: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    label: {
        width: 34,
        fontSize: 11,
        fontFamily: "Helvetica-Bold",
        color: "#333333",
    },
    labelDest: {
        width: 34,
        fontSize: 12,
        fontFamily: "Helvetica-Bold",
        color: "#000000",
    },
    value: {
        flex: 1,
        fontSize: 11,
        fontFamily: "Helvetica",
        textTransform: "uppercase",
    },
    valueDest: {
        flex: 1,
        fontSize: 13,
        fontFamily: "Helvetica-Bold",
        textTransform: "uppercase",
    },
    divider: {
        borderTopWidth: 1,
        borderTopStyle: "dashed",
        borderTopColor: "#888888",
        marginVertical: 2,
    },

    // PIE
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        borderTopWidth: 2,
        borderTopColor: "#000000",
        paddingTop: 2,
        marginTop: "auto",
    },
    footerDate: {
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
    },
    tipoBadge: {
        borderWidth: 1,
        borderColor: "#000000",
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 2,
    },
    tipoText: {
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
        textTransform: "uppercase",
    },
});

// ─── Utilidad: Convierte WebP a JPEG Base64 para el PDF ────────────────────────
// (Usamos fondo blanco para evitar que las transparencias salgan negras en la impresora térmica)
async function getPngDataUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject(new Error("No 2d context"));
            
            // 1. Fondo blanco inicial por si hay transparencias
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            
            // 2. Procesar pixel por pixel
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i+1];
                const b = data[i+2];
                
                // Calcular brillo (Luminosidad) del 0 al 255
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                
                // Si el pixel es claro (fondo blanco o colores suaves)
                if (lum > 180) {
                    data[i] = 220;     // R (Gris claro)
                    data[i+1] = 220;   // G
                    data[i+2] = 220;   // B
                } else {
                    // Si el pixel es oscuro (letras del logo)
                    data[i] = 0;       // R (Negro puro)
                    data[i+1] = 0;     // G
                    data[i+2] = 0;     // B
                }
            }
            ctx.putImageData(imageData, 0, 0);
            
            // Exportar como JPEG
            resolve(canvas.toDataURL("image/jpeg", 0.9));
        };
        img.onerror = reject;
        img.src = url;
    });
}

// ─── Componente del documento PDF ─────────────────────────────────────────────
interface ReceiptDocProps {
    ubicacion: string;
    costo: string;
    remitenteNombre: string;
    remitenteCel: string;
    remitenteEmpresa: string;
    destNombre: string;
    destCel: string;
    destEmpresa: string;
    fecha: string;
    tipo: string;
    logoUrl: string;
}

const ReceiptDoc = ({
    ubicacion, costo, remitenteNombre, remitenteCel, remitenteEmpresa,
    destNombre, destCel, destEmpresa, fecha, tipo, logoUrl,
}: ReceiptDocProps) => (
    <Document>
        {/*
          * size=[320, 240]pt → RawBT lo renderiza a 320×240px
          * = exactamente 40mm × 30mm a 203 DPI → impresión perfecta 1:1
          */}
        <Page size={[W, H]} style={s.page}>
            {/* CABECERA */}
            <View style={s.header}>
                <View style={s.headerLeft}>
                    <View style={s.ubicBox}>
                        <Text style={s.ubicText}>{ubicacion || "N/A"}</Text>
                    </View>
                    {costo ? <Text style={s.costoText}>{costo}</Text> : null}
                </View>
                <Image style={s.logo} src={logoUrl} />
            </View>

            {/* CUERPO */}
            <View style={s.body}>
                {/* Remitente */}
                <View style={s.grid}>
                    <View style={s.row}>
                        <Text style={s.label}>DE:</Text>
                        <Text style={s.value}>{remitenteNombre}</Text>
                    </View>
                    {remitenteEmpresa ? (
                        <View style={s.row}>
                            <Text style={s.label}>EMP:</Text>
                            <Text style={s.value}>{remitenteEmpresa}</Text>
                        </View>
                    ) : null}
                    <View style={s.row}>
                        <Text style={s.label}>CEL:</Text>
                        <Text style={s.value}>{remitenteCel}</Text>
                    </View>
                </View>

                <View style={s.divider} />

                {/* Destinatario */}
                <View style={s.grid}>
                    <View style={s.row}>
                        <Text style={s.labelDest}>PARA:</Text>
                        <Text style={s.valueDest}>{destNombre}</Text>
                    </View>
                    {destEmpresa ? (
                        <View style={s.row}>
                            <Text style={s.labelDest}>EMP:</Text>
                            <Text style={s.value}>{destEmpresa}</Text>
                        </View>
                    ) : null}
                    <View style={s.row}>
                        <Text style={s.labelDest}>CEL:</Text>
                        <Text style={s.value}>{destCel}</Text>
                    </View>
                </View>
            </View>

            {/* PIE */}
            <View style={s.footer}>
                <Text style={s.footerDate}>{fecha}</Text>
                <View style={s.tipoBadge}>
                    <Text style={s.tipoText}>{tipo}</Text>
                </View>
            </View>
        </Page>
    </Document>
);

// ─── Función principal: genera y comparte/abre el PDF ─────────────────────────
export async function generateAndOpenReceiptPdf(pkg: any) {
    const ubicacion = pkg?.ubicacionAlmacen || "";
    const remitenteNombre = pkg?.remitente?.nombre_completo || "";
    const remitenteCel = pkg?.remitente?.ci_o_cel || pkg?.remitente?.celular || "";
    const remitenteEmpresa = pkg?.remitente?.empresa || "";
    const destNombre = pkg?.destinatario?.nombre_completo || "";
    const destCel = pkg?.destinatario?.ci_o_cel || pkg?.destinatario?.celular || "";
    const destEmpresa = pkg?.destinatario?.empresa || "";
    const costo = pkg?.precioBase != null ? `Bs.${Number(pkg.precioBase).toFixed(2)}` : "";
    const fecha = new Date().toLocaleDateString("es-BO", {
        day: "2-digit", month: "2-digit", year: "2-digit",
    });
    const tipo = pkg?.tipoPaquete || pkg?.tipo || "PAQUETE";

    // El PDF no soporta webp, así que convertimos el logo a PNG en memoria
    const webpUrl = `${window.location.origin}/market-quilla-600px.webp`;
    let logoUrl = "";
    try {
        logoUrl = await getPngDataUrl(webpUrl);
    } catch (e) {
        console.warn("No se pudo cargar el logo:", e);
    }

    const blob = await pdf(
        <ReceiptDoc
            ubicacion={ubicacion}
            costo={costo}
            remitenteNombre={remitenteNombre}
            remitenteCel={remitenteCel}
            remitenteEmpresa={remitenteEmpresa}
            destNombre={destNombre}
            destCel={destCel}
            destEmpresa={destEmpresa}
            fecha={fecha}
            tipo={tipo}
            logoUrl={logoUrl}
        />
    ).toBlob();

    const pdfFile = new File([blob], "ticket.pdf", { type: "application/pdf" });

    // ── Estrategia de apertura (orden de prioridad) ──────────────────────────
    //
    // 1. Web Share API + archivo → panel de compartir de Android.
    //    En PWA standalone es la única forma de salir de la app.
    //    Al compartir a RawBT, el PDF llega con 320×240pt → RawBT lo
    //    renderiza a 320×240px → impresión perfecta en 40mm×30mm a 203 DPI.
    //
    // 2. Anchor target="_blank" → abre el visor de PDF del navegador.
    //    Para navegador de escritorio o móvil sin modo standalone.

    const canShareFile =
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [pdfFile] });

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );

    if (isMobile && canShareFile) {
        await navigator.share({
            files: [pdfFile],
            title: "Ticket de paquete",
        });
    } else {
        const url = URL.createObjectURL(blob);
        
        if (!isMobile) {
            // Chrome bloquea el acceso al iframe oculto por seguridad (Cross-Origin Frame) 
            // al usar blobs. La forma segura y nativa es abrir el visor en una pestaña/ventana emergente.
            const a = document.createElement("a");
            a.href = url;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            // Móvil (sin soporte de share): forzamos descarga manual
            const a = document.createElement("a");
            a.href = url;
            a.download = "ticket_market_quilla.pdf";
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
        
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
}
