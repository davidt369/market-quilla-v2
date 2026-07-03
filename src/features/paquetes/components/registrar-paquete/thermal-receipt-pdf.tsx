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
//  Para una impresora de 203 DPI y papel de 40mm × 30mm:
//    Ancho = 40mm × (203 Dpi / 25.4 mm) = 320 px
//    Alto  = 30mm × (203 DPI / 25.4 mm) = 240 px
//
//  @react-pdf/renderer usa puntos (pt). RawBT renderiza el PDF a 1pt → 1px,
//  por lo tanto debemos usar 320pt × 240pt como tamaño de página.
//
//  (En un visor de escritorio esto equivale a ~11cm × 8.5cm, pero el usuario
//   puede elegir "Ajustar al papel" y el resultado es correcto.)
//
const W = 320;   // puntos → RawBT los trata como 320 px
const H = 240;   // puntos → RawBT los trata como 240 px

// ─── Estilos (escalados a 320×240pt) ─────────────────────────────────────────
const s = StyleSheet.create({
    page: {
        width:           W,
        height:          H,
        margin:          0,
        padding:         6,
        backgroundColor: "#ffffff",
        fontFamily:      "Helvetica",
        flexDirection:   "column",
    },

    // CABECERA
    header: {
        flexDirection:    "row",
        justifyContent:   "space-between",
        alignItems:       "center",
        borderBottomWidth: 2,
        borderBottomColor: "#000000",
        paddingBottom:    3,
        marginBottom:     3,
    },
    headerLeft: {
        flexDirection:   "row",
        alignItems:      "center",
        gap:             5,
        overflow:        "hidden",
        flex:            1,
    },
    ubicBox: {
        borderWidth:       2,
        borderColor:       "#000000",
        paddingHorizontal: 5,
        paddingVertical:   2,
        borderRadius:      2,
    },
    ubicText: {
        fontSize:   20,
        fontFamily: "Helvetica-Bold",
    },
    costoText: {
        fontSize:   15,
        fontFamily: "Helvetica-Bold",
        marginLeft: 4,
    },
    logo: {
        width:     50,
        height:    38,
        objectFit: "contain",
        marginLeft: 4,
    },

    // CUERPO
    body: {
        flex:           1,
        flexDirection:  "column",
        justifyContent: "center",
        gap:            4,
    },
    grid: {
        flexDirection: "column",
        gap:           1,
    },
    row: {
        flexDirection: "row",
        alignItems:    "flex-start",
    },
    label: {
        width:      38,
        fontSize:   13,
        fontFamily: "Helvetica-Bold",
        color:      "#333333",
    },
    labelDest: {
        width:      38,
        fontSize:   14,
        fontFamily: "Helvetica-Bold",
        color:      "#000000",
    },
    value: {
        flex:          1,
        fontSize:      13,
        fontFamily:    "Helvetica",
        textTransform: "uppercase",
    },
    valueDest: {
        flex:          1,
        fontSize:      15,
        fontFamily:    "Helvetica-Bold",
        textTransform: "uppercase",
    },
    divider: {
        borderTopWidth: 1,
        borderTopStyle: "dashed",
        borderTopColor: "#888888",
        marginVertical: 4,
    },

    // PIE
    footer: {
        flexDirection:   "row",
        justifyContent:  "space-between",
        alignItems:      "flex-end",
        borderTopWidth:  2,
        borderTopColor:  "#000000",
        paddingTop:      3,
        marginTop:       "auto",
    },
    footerDate: {
        fontSize:   11,
        fontFamily: "Helvetica-Bold",
    },
    tipoBadge: {
        borderWidth:       1,
        borderColor:       "#000000",
        paddingHorizontal: 5,
        paddingVertical:   2,
        borderRadius:      2,
    },
    tipoText: {
        fontSize:      11,
        fontFamily:    "Helvetica-Bold",
        textTransform: "uppercase",
    },
});

// ─── Componente del documento PDF ─────────────────────────────────────────────
interface ReceiptDocProps {
    ubicacion:        string;
    costo:            string;
    remitenteNombre:  string;
    remitenteCel:     string;
    remitenteEmpresa: string;
    destNombre:       string;
    destCel:          string;
    destEmpresa:      string;
    fecha:            string;
    tipo:             string;
    logoUrl:          string;
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
    const ubicacion        = pkg?.ubicacionAlmacen || "";
    const remitenteNombre  = pkg?.remitente?.nombre_completo || "";
    const remitenteCel     = pkg?.remitente?.ci_o_cel || pkg?.remitente?.celular || "";
    const remitenteEmpresa = pkg?.remitente?.empresa || "";
    const destNombre       = pkg?.destinatario?.nombre_completo || "";
    const destCel          = pkg?.destinatario?.ci_o_cel || pkg?.destinatario?.celular || "";
    const destEmpresa      = pkg?.destinatario?.empresa || "";
    const costo            = pkg?.precioBase != null ? `Bs.${Number(pkg.precioBase).toFixed(2)}` : "";
    const fecha            = new Date().toLocaleDateString("es-BO", {
        day: "2-digit", month: "2-digit", year: "2-digit",
    });
    const tipo    = pkg?.tipoPaquete || pkg?.tipo || "PAQUETE";
    const logoUrl = `${window.location.origin}/market-quilla-600px.webp`;

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
        typeof navigator.share    === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [pdfFile] });

    if (canShareFile) {
        await navigator.share({
            files: [pdfFile],
            title: "Ticket de paquete",
        });
    } else {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement("a");
        a.href    = url;
        a.target  = "_blank";
        a.rel     = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
}
