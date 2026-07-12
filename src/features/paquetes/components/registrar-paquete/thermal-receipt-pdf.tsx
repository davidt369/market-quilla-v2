"use client";

import {
  Document,
  Image,
  Page,
  pdf,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import QRCode from "qrcode";
import { encodeId } from "@/shared/lib/id-encoder";

// ─── Dimensiones de salida ────────────────────────────────────────────────────
// 38mm × 28mm en PostScript points (72 DPI)
// 38 mm = 107.72 pt
// 28 mm = 79.37 pt
const W = 107.72;
const H = 79.37;

const s = StyleSheet.create({
  page: {
    width: W,
    height: H,
    backgroundColor: "#ffffff",
    padding: 3,
    flexDirection: "column",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 42,
    width: "100%",
  },
  logoPlaceholder: {
    width: 42,
    height: 42,
    backgroundColor: "#000000",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  logoPlaceholderText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#ffffff",
  },
  logo: {
    width: 42,
    height: 42,
    objectFit: "contain",
  },
  qrCode: {
    width: 42,
    height: 42,
    objectFit: "contain",
  },
  bottomRow: {
    marginTop: 3,
    flex: 1,

    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  ubicText: {
    fontFamily: "Helvetica-Bold",
    color: "#000",
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

      // Fondo blanco inicial
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Procesar pixel por pixel para alto contraste blanco/negro (térmico)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        if (lum > 180) {
          data[i] = 255; // Blanco puro
          data[i + 1] = 255;
          data[i + 2] = 255;
        } else {
          data[i] = 0; // Negro puro
          data[i + 1] = 0;
          data[i + 2] = 0;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ─── Utilidad: Ajustar dinámicamente el tamaño de fuente ──────────────────────
const getDynamicFontSize = (
  text: string,
  maxLength: number,
  defaultSize: number = 9,
  minSize: number = 5,
): number => {
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
  logoUrl: string;
  qrDataUrl: string;
  packageId: string;
}

const ReceiptDoc = ({
  ubicacion,
  logoUrl,
  qrDataUrl,
}: ReceiptDocProps) => {
  const ubicTextSize = getDynamicFontSize(ubicacion || "S/2/115/", 8, 20, 10);

  return (
    <Document>
      <Page size={[W, H]} style={s.page}>
        <View style={s.topRow}>
          {logoUrl ? (
            <Image style={s.logo} src={logoUrl} />
          ) : (
            <View style={s.logoPlaceholder}>
              <Text style={s.logoPlaceholderText}>LOGO</Text>
            </View>
          )}

          {qrDataUrl ? (
            <Image style={s.qrCode} src={qrDataUrl} />
          ) : (
            <View style={s.logoPlaceholder}>
              <Text style={s.logoPlaceholderText}>QR</Text>
            </View>
          )}
        </View>

        <View style={s.bottomRow}>
          <Text style={[s.ubicText, { fontSize: ubicTextSize }]}>
            {ubicacion || "S/2/115/"}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// ─── Función principal: genera y comparte/abre el PDF ─────────────────────────
export async function generateAndOpenReceiptPdf(pkg: any) {
  const ubicacion = String(pkg?.ubicacionAlmacen || "").toUpperCase();
  const packageId = String(pkg?.pk_id_paquete || "");

  // El PDF no soporta webp, así que convertimos el logo a PNG en memoria
  const webpUrl = `${window.location.origin}/market-quilla-600px.webp`;
  let logoUrl = "";
  try {
    logoUrl = await getPngDataUrl(webpUrl);
  } catch (e) {
    console.warn("No se pudo cargar el logo:", e);
  }

  // Generar el código QR apuntando a la ruta pública de seguimiento
  const trackingUrl = `${window.location.origin}/p/${encodeId(Number(packageId))}`;
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
      logoUrl={logoUrl}
      qrDataUrl={qrDataUrl}
      packageId={packageId}
    />,
  ).toBlob();

  const pdfFile = new File([blob], "ticket.pdf", { type: "application/pdf" });

  // ── Estrategia de apertura (orden de prioridad) ──────────────────────────
  const canShareFile =
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [pdfFile] });

  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
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
      a.download = `ticket_market_quilla_${packageId}.pdf`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
