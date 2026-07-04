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
// 48mm × 28mm a 203 DPI → 384pt × 224pt
const W = 384;
const H = 224;

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    page: {
        width: W,
        height: H,
        margin: 0,
        padding: "8 10 6 10",
        backgroundColor: "#ffffff",
        fontFamily: "Helvetica",
        flexDirection: "column",
    },

    // ── CABECERA (UBIC + DE + LOGO) ──
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 4,
    },
    headerLeft: {
        flex: 1,
        flexDirection: "column",
        gap: 2,
    },
    ubicBox: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#000000",
        paddingHorizontal: 6,
        paddingVertical: 3,
        gap: 4,
        alignSelf: "flex-start",
    },
    ubicLabel: {
        fontSize: 14,
        fontFamily: "Helvetica-Bold",
    },
    ubicValue: {
        fontSize: 14,
        fontFamily: "Helvetica-Bold",
        borderBottomWidth: 1,
        borderBottomColor: "#000000",
        borderBottomStyle: "dashed",
        paddingBottom: 1,
        minWidth: 80,
    },
    headerDeRow: {
        flexDirection: "row",
        alignItems: "flex-end",
    },
    logo: {
        width: 40,  // 5mm × 8pt/mm
        height: 40, // 5mm × 8pt/mm
        objectFit: "contain",
        marginLeft: 6,
    },

    // ── CUERPO ──
    body: {
        flex: 1,
        flexDirection: "column",
        justifyContent: "space-between",
    },

    // Fila de formulario
    formRow: {
        flexDirection: "row",
        alignItems: "flex-end",
    },
    formLabel: {
        fontSize: 11,
        fontFamily: "Helvetica",
        marginRight: 3,
    },
    formLabelBold: {
        fontSize: 11,
        fontFamily: "Helvetica-Bold",
        marginRight: 3,
    },
    formValue: {
        flex: 1,
        fontSize: 11,
        fontFamily: "Helvetica",
        borderBottomWidth: 1,
        borderBottomColor: "#000000",
        paddingLeft: 3,
        paddingBottom: 1,
    },
    formValueBold: {
        flex: 1,
        fontSize: 11,
        fontFamily: "Helvetica-Bold",
        borderBottomWidth: 1,
        borderBottomColor: "#000000",
        paddingLeft: 3,
        paddingBottom: 1,
        textAlign: "center",
    },

    // Fila compuesta (FECHA + COSTO + TIEMPO)
    compositeRow: {
        flexDirection: "row",
        alignItems: "flex-end",
    },
    fechaValue: {
        width: "22%",
        fontSize: 11,
        fontFamily: "Helvetica",
        borderBottomWidth: 1,
        borderBottomColor: "#000000",
        paddingBottom: 1,
        textAlign: "center",
    },
    costoValue: {
        flex: 1,
        fontSize: 11,
        fontFamily: "Helvetica-Bold",
        borderBottomWidth: 1,
        borderBottomColor: "#000000",
        paddingBottom: 1,
        textAlign: "center",
    },
    tiempoText: {
        fontSize: 11,
        fontFamily: "Helvetica-Bold",
        marginLeft: 4,
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
}: ReceiptDocProps) => (
    <Document>
        <Page size={[W, H]} style={s.page}>
            {/* ── CABECERA (UBIC + DE + LOGO) ── */}
            <View style={s.header}>
                <View style={s.headerLeft}>
                    <View style={s.ubicBox}>
                        <Text style={s.ubicLabel}>UBIC:</Text>
                        <Text style={s.ubicValue}>{ubicacion}</Text>
                    </View>
                    <View style={s.headerDeRow}>
                        <Text style={s.formLabel}>DE:</Text>
                        <Text style={s.formValue}>{remitenteNombre}</Text>
                    </View>
                </View>
                {logoUrl ? <Image style={s.logo} src={logoUrl} /> : null}
            </View>

            {/* ── CUERPO ── */}
            <View style={s.body}>

                {/* EMPRESA */}
                <View style={s.formRow}>
                    <Text style={s.formLabel}>EMPRESA:</Text>
                    <Text style={s.formValue}>{remitenteEmpresa}</Text>
                </View>

                {/* CI/CEL remitente */}
                <View style={s.formRow}>
                    <Text style={s.formLabel}>CI/CEL:</Text>
                    <Text style={s.formValue}>{remitenteCel}</Text>
                </View>

                {/* PARA */}
                <View style={s.formRow}>
                    <Text style={s.formLabelBold}>PARA:</Text>
                    <Text style={s.formValue}>{destNombre}</Text>
                </View>

                {/* CI/CEL destinatario */}
                <View style={s.formRow}>
                    <Text style={s.formLabel}>CI/CEL:</Text>
                    <Text style={s.formValue}>{destCel}</Text>
                </View>

                {/* FECHA | COSTO | TIEMPO */}
                <View style={s.compositeRow}>
                    <Text style={s.formLabel}>FECHA:</Text>
                    <Text style={s.fechaValue}>{fecha}</Text>
                    <Text style={[s.formLabel, { marginLeft: 6 }]}>COSTO:</Text>
                    <Text style={s.costoValue}>{costoDisplay}</Text>
                    {tiempoDisplay ? (
                        <Text style={s.tiempoText}>{tiempoDisplay}</Text>
                    ) : null}
                </View>

                {/* PAGO */}
                <View style={s.formRow}>
                    <Text style={s.formLabel}>PAGO:</Text>
                    <Text style={s.formValue}>{estadoPago}</Text>
                </View>

                {/* TIPO DE PAQUETE */}
                <View style={s.formRow}>
                    <Text style={s.formLabel}>TIPO DE PAQUETE:</Text>
                    <Text style={s.formValue}>{tipo}</Text>
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

    // Lógica de precio / oferta
    const precioBase = pkg?.precioBase;
    const precioOferta = pkg?.precioOferta;
    const diasOferta = pkg?.diasOferta;

    let costoDisplay = "";
    let tiempoDisplay = "";
    if ((!precioBase || precioBase === 0) && precioOferta != null && diasOferta != null) {
        costoDisplay = `Bs. ${Number(precioOferta).toFixed(2)}`;
        tiempoDisplay = `${diasOferta} SEMANA`;
    } else if (precioBase != null && precioBase > 0) {
        costoDisplay = `Bs. ${Number(precioBase).toFixed(2)}`;
    }

    const fecha = new Date().toLocaleDateString("es-BO", {
        day: "numeric", month: "numeric", year: "numeric",
    });
    const tipo = pkg?.tipoPaquete || pkg?.tipo || "";
    const estadoPago = pkg?.estadoPago || "Pagado";

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
            const a = document.createElement("a");
            a.href = url;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
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

