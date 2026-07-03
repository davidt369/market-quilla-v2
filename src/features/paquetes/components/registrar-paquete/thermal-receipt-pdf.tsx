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

// ─── Dimensiones del papel térmico ───────────────────────────────────────────
const WIDTH_MM  = 40;
const HEIGHT_MM = 30;
// 1mm ≈ 2.8346 pt
const MM = 2.8346;

// ─── Estilos ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    page: {
        width:           WIDTH_MM  * MM,
        height:          HEIGHT_MM * MM,
        padding:         1.5,
        backgroundColor: "#ffffff",
        fontFamily:      "Helvetica",
        flexDirection:   "column",
    },

    // CABECERA
    header: {
        flexDirection:   "row",
        justifyContent:  "space-between",
        alignItems:      "center",
        borderBottomWidth: 1,
        borderBottomColor: "#000000",
        paddingBottom:   1,
        marginBottom:    1,
    },
    headerLeft: {
        flexDirection:  "row",
        alignItems:     "center",
        gap:            2,
        overflow:       "hidden",
        flex:           1,
    },
    ubicBox: {
        borderWidth:    1,
        borderColor:    "#000000",
        paddingHorizontal: 2,
        paddingVertical: 1,
        borderRadius:   1,
    },
    ubicText: {
        fontSize:       7,
        fontFamily:     "Helvetica-Bold",
    },
    costoText: {
        fontSize:       5.5,
        fontFamily:     "Helvetica-Bold",
        marginLeft:     2,
    },
    logo: {
        width:          18,
        height:         14,
        objectFit:      "contain",
        marginLeft:     2,
    },

    // CUERPO
    body: {
        flex:           1,
        flexDirection:  "column",
        justifyContent: "center",
        gap:            1.5,
    },
    grid: {
        flexDirection:  "column",
        gap:            0.5,
    },
    row: {
        flexDirection:  "row",
        alignItems:     "flex-start",
    },
    label: {
        width:          14,
        fontSize:       4.8,
        fontFamily:     "Helvetica-Bold",
        color:          "#333333",
    },
    labelDest: {
        width:          14,
        fontSize:       5,
        fontFamily:     "Helvetica-Bold",
        color:          "#000000",
    },
    value: {
        flex:           1,
        fontSize:       4.8,
        fontFamily:     "Helvetica",
        textTransform:  "uppercase",
    },
    valueDest: {
        flex:           1,
        fontSize:       5.5,
        fontFamily:     "Helvetica-Bold",
        textTransform:  "uppercase",
    },
    divider: {
        borderTopWidth: 0.5,
        borderTopStyle: "dashed",
        borderTopColor: "#888888",
        marginVertical: 1.5,
    },

    // PIE
    footer: {
        flexDirection:   "row",
        justifyContent:  "space-between",
        alignItems:      "flex-end",
        borderTopWidth:  1,
        borderTopColor:  "#000000",
        paddingTop:      1,
        marginTop:       "auto",
    },
    footerDate: {
        fontSize:       4,
        fontFamily:     "Helvetica-Bold",
    },
    tipoBadge: {
        borderWidth:    0.5,
        borderColor:    "#000000",
        paddingHorizontal: 2,
        paddingVertical: 0.5,
        borderRadius:   1,
    },
    tipoText: {
        fontSize:       4,
        fontFamily:     "Helvetica-Bold",
        textTransform:  "uppercase",
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
        <Page size={[WIDTH_MM * MM, HEIGHT_MM * MM]} style={s.page}>
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

// ─── Función principal: genera y abre el PDF ─────────────────────────────────
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
    const tipo = pkg?.tipoPaquete || pkg?.tipo || "PAQUETE";

    // URL absoluta del logo (funciona en server y client side)
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

    // Abre el PDF en una nueva pestaña → el navegador lo muestra con su visor nativo
    // Desktop: puede imprimir directamente desde el visor
    // Android: el visor de PDF de Chrome incluye botón de impresión e imprime al tamaño exacto del PDF (40x30mm)
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");

    // Limpia la URL del blob después de un momento
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
