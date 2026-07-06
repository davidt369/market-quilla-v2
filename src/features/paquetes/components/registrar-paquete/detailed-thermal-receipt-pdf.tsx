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
import QRCode from "qrcode";

// ─── Dimensiones de salida ────────────────────────────────────────────────────
// 38mm × 28mm en PostScript points (72 DPI)
// 38 mm = 107.72 pt
// 28 mm = 79.37 pt
const W = 107.72;
const H = 79.37;

// ─── Sin padding — maximizar espacio ──────────────────────────────────────────
const INNER_W = W;
const INNER_H = H;

// ─── Alturas de cada fila ─────────────────────────────────────────────────────
const ROW1_H = 28;      // Logo + UBIC + QR (~10mm)
const ROW2_H = 25;      // Remitente + Destinatario (Más alto para evitar desbordes con Empresa)
const ROW3_H = INNER_H - ROW1_H - ROW2_H; // Fecha/Costo/Tipo + Detalles

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    page: {
        width: W,
        height: H,
        backgroundColor: "#ffffff",
        padding: 0,
    },

    // ── Fila 1: Logo + UBIC + QR ──────────────────────────────────────────
    row1: {
        flexDirection: "row",
        height: ROW1_H,
        width: INNER_W,
    },
    logoContainer: {
        width: 30,
        height: ROW1_H,
        justifyContent: "center",
        alignItems: "center",
    },
    logo: {
        width: 28,
        height: 28,
        objectFit: "contain",
    },
    logoPlaceholder: {
        width: 28,
        height: 28,
        backgroundColor: "#e0e0e0",
        justifyContent: "center",
        alignItems: "center",
    },
    logoPlaceholderText: {
        fontFamily: "Helvetica-Bold",
        fontSize: 4,
        color: "#000000",
    },
    ubicContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    ubicBox: {
        paddingHorizontal: 3,
        paddingVertical: 1.5,
        alignItems: "center",
    },
    ubicLabel: {
        fontFamily: "Helvetica-Bold",
        fontSize: 6,
        color: "#000000",
        lineHeight: 1.1,
    },
    ubicValue: {
        fontFamily: "Helvetica-Bold",
        color: "#000000",
        lineHeight: 1.1,
        marginTop: 1,
    },
    qrContainer: {
        width: 30,
        height: ROW1_H,
        justifyContent: "center",
        alignItems: "center",
    },
    qrCode: {
        width: 28,
        height: 28,
        objectFit: "contain",
    },

    // ── Fila 2: Remitente + Destinatario ──────────────────────────────────
    row2: {
        flexDirection: "row",
        height: ROW2_H,
        width: INNER_W,
    },
    personSection: {
        flex: 1,
        paddingHorizontal: 2,
        paddingVertical: 1.5,
        justifyContent: "flex-start",
    },
    personHeader: {
        fontFamily: "Helvetica-Bold",
        fontSize: 5.5,
        color: "#000000",
        lineHeight: 1.1,
    },
    personName: {
        fontFamily: "Helvetica",
        fontSize: 6,
        color: "#000000",
        lineHeight: 1.1,
        marginTop: 0.8,
    },
    personCel: {
        fontFamily: "Helvetica",
        fontSize: 5.5,
        color: "#000000",
        lineHeight: 1.1,
        marginTop: 0.5,
    },

    // ── Fila 3: Datos + Detalles ──────────────────────────────────────────
    row3: {
        flexDirection: "row",
        height: ROW3_H,
        width: INNER_W,
    },
    datosSection: {
        width: INNER_W * 0.40,
        paddingHorizontal: 2,
        paddingVertical: 1.5,
        justifyContent: "flex-start",
    },
    datosLine: {
        fontFamily: "Helvetica",
        fontSize: 5.5,
        color: "#000000",
        lineHeight: 1.1,
    },
    datosLineBold: {
        fontFamily: "Helvetica-Bold",
    },
    datosLineMargin: {
        marginTop: 0.8,
    },
    detallesSection: {
        flex: 1,
        paddingHorizontal: 2,
        paddingVertical: 1.5,
        justifyContent: "flex-start",
    },
    detallesHeader: {
        fontFamily: "Helvetica-Bold",
        fontSize: 5.5,
        color: "#000000",
        lineHeight: 1.1,
    },
    detallesText: {
        fontFamily: "Helvetica",
        fontSize: 5.5,
        color: "#000000",
        lineHeight: 1.15,
        marginTop: 0.5,
    },

    // ── Utilidades de texto ───────────────────────────────────────────────
    textBold: {
        fontFamily: "Helvetica-Bold",
    },
});

// ─── Utilidad: Convierte WebP a JPEG Base64 para el PDF ────────────────────────
async function getPngDataUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new (globalThis as any).Image();
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
                const g = data[i + 1];
                const b = data[i + 2];

                // Calcular brillo (Luminosidad) del 0 al 255
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;

                // Si el pixel es claro (fondo blanco o colores suaves)
                if (lum > 180) {
                    data[i] = 220;     // R (Gris claro)
                    data[i + 1] = 220;   // G
                    data[i + 2] = 220;   // B
                } else {
                    // Si el pixel es oscuro (letras del logo)
                    data[i] = 0;       // R (Negro puro)
                    data[i + 1] = 0;     // G
                    data[i + 2] = 0;     // B
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

// ─── Utilidad: Ajustar dinámicamente el tamaño de fuente ──────────────────────
const getDynamicFontSize = (text: string, maxLength: number, defaultSize: number = 5.5, minSize: number = 3.5): number => {
    if (!text) return defaultSize;
    if (text.length > maxLength) {
        const calculated = defaultSize * (maxLength / text.length);
        return Math.max(calculated, minSize);
    }
    return defaultSize;
};



// ─── Componente del documento PDF ─────────────────────────────────────────────
interface ReceiptDocProps {
    ubicacion: string;
    remitenteNombre: string;
    remitenteCel: string;
    remitenteEmpresa: string;
    destNombre: string;
    destCel: string;
    fecha: string;
    costoDisplay: string;
    tiempoDisplay: string;
    estadoPago: string;
    tipo: string;
    detalles: string;
    logoUrl: string;
    qrDataUrl: string;
}

const ReceiptDoc = ({
    ubicacion, remitenteNombre, remitenteCel, remitenteEmpresa,
    destNombre, destCel, fecha, costoDisplay, tiempoDisplay,
    estadoPago, tipo, detalles, logoUrl, qrDataUrl,
}: ReceiptDocProps) => {
    const ubicTextSize = getDynamicFontSize(ubicacion || "S/2/115/", 9, 10, 6);
    const deNameSize = getDynamicFontSize(remitenteNombre, 10, 5.5, 4);
    const paraNameSize = getDynamicFontSize(destNombre, 10, 5.5, 4);
    const empresaSize = getDynamicFontSize(remitenteEmpresa, 12, 5.5, 4);

    return (
        <Document>
            <Page size={[W, H]} style={s.page}>
                {/* ═══ FILA 1: Logo + UBIC + QR ═══ */}
                <View style={s.row1}>
                    {/* Logo */}
                    <View style={s.logoContainer}>
                        {logoUrl ? (
                            <Image style={s.logo} src={logoUrl} />
                        ) : (
                            <View style={s.logoPlaceholder}>
                                <Text style={s.logoPlaceholderText}>LOGO</Text>
                            </View>
                        )}
                    </View>

                    {/* UBIC box centrado */}
                    <View style={s.ubicContainer}>
                        <View style={s.ubicBox}>
                            <Text style={s.ubicLabel}>UBIC:</Text>
                            <Text style={[s.ubicValue, { fontSize: ubicTextSize }]}>
                                {ubicacion || "S/2/115/"}
                            </Text>
                        </View>
                    </View>

                    {/* QR Code */}
                    <View style={s.qrContainer}>
                        {qrDataUrl ? (
                            <Image style={s.qrCode} src={qrDataUrl} />
                        ) : (
                            <View style={s.logoPlaceholder}>
                                <Text style={s.logoPlaceholderText}>QR</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ═══ FILA 2: Remitente + Destinatario ═══ */}
                <View style={s.row2}>
                    {/* REMITENTE (DE) */}
                    <View style={s.personSection}>
                        <Text style={[s.personCel, { fontSize: deNameSize }]}>
                            <Text style={s.textBold}>(DE): </Text>
                            {remitenteNombre}
                        </Text>
                        <Text style={s.personCel}>
                            <Text style={s.textBold}>C.I./Cel.: </Text>
                            {remitenteCel}
                        </Text>
                        {remitenteEmpresa && (
                            <Text style={[s.personCel, { fontSize: empresaSize }]}>
                                <Text style={s.textBold}>Empresa: </Text>
                                {remitenteEmpresa}
                            </Text>
                        )}
                    </View>

                    {/* DESTINATARIO (PARA) */}
                    <View style={[s.personSection, { borderLeftWidth: 0 }]}>
                        <Text style={[s.personCel, { fontSize: paraNameSize }]}>
                            <Text style={s.textBold}>(PARA): </Text>
                            {destNombre}
                        </Text>

                        <Text style={s.personCel}>
                            <Text style={s.textBold}>C.I./Cel.: </Text>
                            {destCel}
                        </Text>
                    </View>
                </View>

                {/* ═══ FILA 3: Datos + Detalles/Seguimiento ═══ */}
                <View style={s.row3}>
                    {/* FECHA / COSTO / TIPO */}
                    <View style={s.datosSection}>
                        <Text style={s.datosLine}>
                            <Text style={s.datosLineBold}>FECHA:  </Text>
                            {fecha}
                        </Text>
                        <Text style={[s.datosLine, s.datosLineMargin]}>
                            <Text style={s.datosLineBold}>COSTO:  </Text>
                            {costoDisplay}
                        </Text>
                        {tiempoDisplay ? (
                            <Text style={[s.datosLine, s.datosLineMargin, { fontSize: 4.5 }]}>
                                {tiempoDisplay}
                            </Text>
                        ) : null}

                    </View>

                    {/* DETALLES */}
                    <View style={s.detallesSection}>
                        <Text style={s.detallesHeader}>TIPO:</Text>
                        <Text style={s.detallesText}>
                            {detalles || "Sin detalles"}
                        </Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

// ─── Función principal: genera y comparte/abre el PDF ─────────────────────────
export async function generateAndOpenDetailedReceiptPdf(pkg: any) {
    const ubicacion = String(pkg?.ubicacionAlmacen || "").toUpperCase();
    const remitenteNombre = String(pkg?.remitente?.nombre_completo || "").toUpperCase();
    const remitenteCel = String(pkg?.remitente?.ci_o_cel || pkg?.remitente?.celular || "").toUpperCase();
    const remitenteEmpresa = String(pkg?.remitente?.empresa || "").toUpperCase();
    const destNombre = String(pkg?.destinatario?.nombre_completo || "").toUpperCase();
    const destCel = String(pkg?.destinatario?.ci_o_cel || pkg?.destinatario?.celular || "").toUpperCase();
    const packageId = String(pkg?.pk_id_paquete || "");

    // Lógica de precio / oferta
    const precioBase = pkg?.precioBase;
    const precioOferta = pkg?.precioOferta;
    const diasOferta = pkg?.diasOferta;
    const estadoPago = String(pkg?.estadoPago || "Pagado").toUpperCase();

    let costoDisplay = "Bs. 0.00";
    let tiempoDisplay = "";

    if (precioOferta != null && diasOferta != null && diasOferta > 0 && estadoPago === "PAGADO") {
        costoDisplay = `Bs. ${Number(precioOferta).toFixed(2)}`;

        const expDate = new Date();
        expDate.setDate(expDate.getDate() + diasOferta);
        const expStr = expDate.toLocaleDateString("es-BO", {
            day: "numeric", month: "numeric", year: "2-digit"
        });

        tiempoDisplay = `VENCE: ${expStr}`;
    } else if (precioBase != null) {
        costoDisplay = `Bs. ${Number(precioBase).toFixed(2)}`;
    }

    const fecha = new Date().toLocaleDateString("es-BO", {
        day: "numeric", month: "numeric", year: "numeric",
    });
    const tipo = String(pkg?.tipoPaquete || pkg?.tipo || "").toUpperCase();
    const detalles = String(pkg?.tipoPaquete || pkg?.tipo || "").trim();

    // El PDF no soporta webp, así que convertimos el logo a PNG en memoria
    const webpUrl = `${window.location.origin}/market-quilla-600px.webp`;
    let logoUrl = "";
    try {
        logoUrl = await getPngDataUrl(webpUrl);
    } catch (e) {
        console.warn("No se pudo cargar el logo:", e);
    }

    // Generar código QR apuntando a la ruta pública de seguimiento
    const trackingUrl = `${window.location.origin}/p/${packageId}`;
    let qrDataUrl = "";
    try {
        qrDataUrl = await QRCode.toDataURL(trackingUrl, {
            margin: 1,
            width: 150,
            color: {
                dark: "#000000",
                light: "#ffffff",
            },
        });
    } catch (e) {
        console.error("Error al generar código QR:", e);
    }

    const blob = await pdf(
        <ReceiptDoc
            ubicacion={ubicacion}
            remitenteNombre={remitenteNombre}
            remitenteCel={remitenteCel}
            remitenteEmpresa={remitenteEmpresa}
            destNombre={destNombre}
            destCel={destCel}
            fecha={fecha}
            costoDisplay={costoDisplay}
            tiempoDisplay={tiempoDisplay}
            estadoPago={estadoPago}
            tipo={tipo}
            detalles={detalles}
            logoUrl={logoUrl}
            qrDataUrl={qrDataUrl}
        />
    ).toBlob();

    const pdfFile = new File([blob], "ticket.pdf", { type: "application/pdf" });

    // ── Estrategia de apertura (orden de prioridad) ──────────────────────────
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
            // Crear un iframe oculto para lanzar el diálogo de impresión nativo directamente
            const iframe = document.createElement("iframe");
            iframe.style.position = "absolute";
            iframe.style.width = "0";
            iframe.style.height = "0";
            iframe.style.border = "none";
            iframe.src = url;
            document.body.appendChild(iframe);

            iframe.onload = () => {
                setTimeout(() => {
                    try {
                        iframe.contentWindow?.focus();
                        iframe.contentWindow?.print();
                    } catch (e) {
                        console.error("Print failed:", e);
                    }

                    // Limpieza opcional después de un tiempo prudente
                    setTimeout(() => {
                        if (document.body.contains(iframe)) {
                            document.body.removeChild(iframe);
                        }
                    }, 60000);
                }, 200);
            };

        } else {
            const a = document.createElement("a");
            a.href = url;
            a.download = `ticket_detallado_${packageId}.pdf`;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }

        setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
}
