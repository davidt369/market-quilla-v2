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
// 48mm × 28mm en PostScript points (72 DPI)
// 48 mm = 136.06 pt
// 28 mm = 79.37 pt
const W = 136.06;
const H = 79.37;

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    page: {
        width: W,
        height: H,
        backgroundColor: "#ffffff",
    },
    rowContainer: {
        flexDirection: 'row',
        width: W,
        height: H,
        padding: 2.83, // ~1mm margin
    },
    colUbic: {
        width: 30,
        height: 73.71,
        position: 'relative',
    },
    colLogo: {
        width: 32,
        height: 73.71,
        position: 'relative',
    },
    colDe: {
        width: 25,
        height: 73.71,
        position: 'relative',
    },
    colPara: {
        width: 18,
        height: 73.71,
        position: 'relative',
    },
    colDatos: {
        width: 25.4,
        height: 73.71,
        position: 'relative',
    },
    ubicBox: {
        borderWidth: 1,
        borderColor: '#000000',
        paddingHorizontal: 3,
        paddingVertical: 2,
        alignItems: 'center',
    },
    ubicLabel: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 5,
        color: '#000000',
        lineHeight: 1.0,
    },
    ubicValue: {
        fontFamily: 'Helvetica-Bold',
        color: '#000000',
        lineHeight: 1.0,
        marginTop: 1,
    },
    logo: {
        width: 28.35,
        height: 28.35,
        objectFit: 'contain',
    },
    logoPlaceholder: {
        width: 28.35,
        height: 28.35,
        backgroundColor: '#e0e0e0',
        borderWidth: 1,
        borderColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoPlaceholderText: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 5,
        color: '#000000',
    },
    textLine: {
        color: '#000000',
        lineHeight: 1.0,
    },
    textBold: {
        fontFamily: 'Helvetica-Bold',
    },
    textNormal: {
        fontFamily: 'Helvetica',
    },
});

// ─── Utilidad: Convierte WebP a JPEG Base64 para el PDF ────────────────────────
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
const getDynamicFontSize = (text: string, maxLength: number, defaultSize: number = 5.5, minSize: number = 4): number => {
    if (!text) return defaultSize;
    if (text.length > maxLength) {
        const calculated = defaultSize * (maxLength / text.length);
        return Math.max(calculated, minSize);
    }
    return defaultSize;
};

const getRotatedStyle = (colWidth: number) => ({
    position: 'absolute' as const,
    width: 73.71,
    height: colWidth,
    left: (colWidth - 73.71) / 2,
    top: (73.71 - colWidth) / 2,
    transform: 'rotate(-90deg)',
    transformOrigin: 'center center',
    flexDirection: 'column' as const,
    justifyContent: 'center' as const,
});

const getRotatedTextStyle = (colWidth: number) => ({
    ...getRotatedStyle(colWidth),
    paddingLeft: 3,
    paddingRight: 3,
});

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
    logoUrl: string;
}

const ReceiptDoc = ({
    ubicacion, remitenteNombre, remitenteCel, remitenteEmpresa,
    destNombre, destCel, fecha, costoDisplay, tiempoDisplay,
    estadoPago, tipo, logoUrl,
}: ReceiptDocProps) => {
    const ubicTextSize = getDynamicFontSize(ubicacion || "S/2/115/", 9, 14, 8);
    const deNameSize = getDynamicFontSize(remitenteNombre, 15, 4.8, 3.8);
    const deEmpresaSize = getDynamicFontSize(remitenteEmpresa, 18, 4.8, 3.8);
    const deCelSize = getDynamicFontSize(remitenteCel, 12, 4.8, 3.8);

    const paraNameSize = getDynamicFontSize(destNombre, 15, 4.8, 3.8);
    const paraCelSize = getDynamicFontSize(destCel, 12, 4.8, 3.8);

    const tipoSize = getDynamicFontSize(tipo, 12, 4.8, 3.8);

    return (
        <Document>
            <Page size={[W, H]} style={s.page}>
                <View style={s.rowContainer}>
                    {/* Primera columna: UBIC */}
                    <View style={s.colUbic}>
                        <View style={[getRotatedStyle(30), { alignItems: 'center' }]}>
                            <View style={s.ubicBox}>
                                <Text style={s.ubicLabel}>UBIC:</Text>
                                <Text style={[s.ubicValue, { fontSize: ubicTextSize }]}>
                                    {ubicacion || "S/2/115/"}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Segunda columna: LOGO */}
                    <View style={s.colLogo}>
                        <View style={[getRotatedStyle(32), { alignItems: 'center' }]}>
                            {logoUrl ? (
                                <Image style={s.logo} src={logoUrl} />
                            ) : (
                                <View style={s.logoPlaceholder}>
                                    <Text style={s.logoPlaceholderText}>LOGO</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Tercera columna: DE */}
                    <View style={s.colDe}>
                        <View style={getRotatedTextStyle(25)}>
                            <Text style={[s.textLine, { fontSize: deNameSize }]}>
                                <Text style={s.textBold}>DE: </Text>
                                <Text style={s.textNormal}>{remitenteNombre}</Text>
                            </Text>
                            {remitenteEmpresa ? (
                                <Text style={[s.textLine, { fontSize: deEmpresaSize, marginTop: 1 }]}>
                                    <Text style={s.textBold}>EMPRESA: </Text>
                                    <Text style={s.textNormal}>{remitenteEmpresa}</Text>
                                </Text>
                            ) : null}
                            <Text style={[s.textLine, { fontSize: deCelSize, marginTop: 1 }]}>
                                <Text style={s.textBold}>CI/CEL: </Text>
                                <Text style={s.textNormal}>{remitenteCel}</Text>
                            </Text>
                        </View>
                    </View>

                    {/* Cuarta columna: PARA */}
                    <View style={s.colPara}>
                        <View style={getRotatedTextStyle(18)}>
                            <Text style={[s.textLine, { fontSize: paraNameSize }]}>
                                <Text style={s.textBold}>PARA: </Text>
                                <Text style={s.textNormal}>{destNombre}</Text>
                            </Text>
                            <Text style={[s.textLine, { fontSize: paraCelSize, marginTop: 1 }]}>
                                <Text style={s.textBold}>CI/CEL: </Text>
                                <Text style={s.textNormal}>{destCel}</Text>
                            </Text>
                        </View>
                    </View>

                    {/* Quinta columna: DATOS */}
                    <View style={s.colDatos}>
                        <View style={getRotatedTextStyle(25.4)}>
                            <Text style={[s.textLine, s.textNormal, { fontSize: 4.5 }]}>
                                <Text style={s.textBold}>FECHA: </Text>{fecha}
                            </Text>
                            <Text style={[s.textLine, s.textNormal, { fontSize: 4.5, marginTop: 1 }]}>
                                <Text style={s.textBold}>COSTO: </Text>{costoDisplay}
                            </Text>
                            {tiempoDisplay ? (
                                <Text style={[s.textLine, s.textNormal, { fontSize: 4.5, marginTop: 1 }]}>
                                    {tiempoDisplay}
                                </Text>
                            ) : null}
                            <Text style={[s.textLine, s.textNormal, { fontSize: tipoSize, marginTop: 1 }]}>
                                <Text style={s.textBold}>TIPO: </Text>{tipo}
                            </Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

// ─── Función principal: genera y comparte/abre el PDF ─────────────────────────
export async function generateAndOpenReceiptPdf(pkg: any) {
    const ubicacion = String(pkg?.ubicacionAlmacen || "").toUpperCase();
    const remitenteNombre = String(pkg?.remitente?.nombre_completo || "").toUpperCase();
    const remitenteCel = String(pkg?.remitente?.ci_o_cel || pkg?.remitente?.celular || "").toUpperCase();
    const remitenteEmpresa = String(pkg?.remitente?.empresa || "").toUpperCase();
    const destNombre = String(pkg?.destinatario?.nombre_completo || "").toUpperCase();
    const destCel = String(pkg?.destinatario?.ci_o_cel || pkg?.destinatario?.celular || "").toUpperCase();

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
            logoUrl={logoUrl}
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

