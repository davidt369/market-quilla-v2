"use client";
import React from "react";
import QRCode from "qrcode";
import { formatBoliviaDateOnly } from "@/shared/lib/timezone";
import { encodeId } from "@/shared/lib/id-encoder";
import { toast } from "sonner";

// ─── Utilidad: Retraso para el envío por Bluetooth ──────────────────────────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Utilidad: Cargar imagen y convertir a BITMAP TSPL ───
async function getTsplBitmap(imgUrl: string, x: number, y: number, width: number, height: number): Promise<Uint8Array> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(new Uint8Array(0));

            // Forzar fondo blanco absoluto para evitar problemas de transparencia
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            const imgData = ctx.getImageData(0, 0, width, height);
            const pixels = imgData.data;
            const widthBytes = Math.ceil(width / 8);

            // ¡IMPORTANTE! Inversión de Bits:
            // En estas impresoras genéricas, para los comandos BITMAP: 1 = Blanco (Sin calor), 0 = Negro (Tinta).
            // Llenamos el array de 255 (11111111 en binario) para que el fondo sea completamente BLANCO.
            const bitmapData = new Uint8Array(widthBytes * height).fill(255);

            for (let cy = 0; cy < height; cy++) {
                for (let cx = 0; cx < width; cx++) {
                    const idx = (cy * width + cx) * 4;
                    const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];

                    const luminance = (r * 0.299) + (g * 0.587) + (b * 0.114);

                    // Si el pixel es oscuro (Texto/Logo), quemamos la tinta poniendo el bit en 0.
                    if (luminance < 128) {
                        bitmapData[cy * widthBytes + Math.floor(cx / 8)] &= ~(1 << (7 - (cx % 8)));
                    }
                }
            }

            const header = new TextEncoder().encode(`BITMAP ${x},${y},${widthBytes},${height},0,`);
            const crlf = new TextEncoder().encode("\r\n");

            const result = new Uint8Array(header.length + bitmapData.length + crlf.length);
            result.set(header, 0);
            result.set(bitmapData, header.length);
            result.set(crlf, header.length + bitmapData.length);
            resolve(result);
        };
        img.onerror = () => resolve(new Uint8Array(0));
        img.src = imgUrl;
    });
}

// ─── Utilidad: Crear texto en Canvas y devolver comando BITMAP TSPL ───
async function getTextTsplCommand(text: string, x: number, y: number, fontSize: number, bold: boolean = false, maxWidth?: number, wrapLines?: boolean): Promise<Uint8Array> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return new Uint8Array(0);

    const fontStr = `${bold ? '900' : 'normal'} ${fontSize}px sans-serif`;
    ctx.font = fontStr;

    const lines = [];
    if (wrapLines && maxWidth) {
        const words = text.split(' ');
        let currentLine = words[0] || '';
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width > maxWidth) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine += " " + word;
            }
        }
        lines.push(currentLine);
    } else {
        let fittedText = text;
        if (maxWidth && ctx.measureText(fittedText).width > maxWidth) {
            while (fittedText.length > 0 && ctx.measureText(fittedText).width > maxWidth) {
                fittedText = fittedText.slice(0, -1);
            }
        }
        lines.push(fittedText);
    }

    const maxLineWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
    const textWidth = Math.max(1, Math.ceil(maxWidth || maxLineWidth));
    const lineHeight = Math.ceil(fontSize * 1.2);
    const textHeight = lineHeight * lines.length;

    canvas.width = textWidth;
    canvas.height = textHeight;

    // Forzar fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, textWidth, textHeight);

    // Dibujar texto negro
    ctx.font = fontStr;
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#000000';
    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], 0, i * lineHeight);
    }

    const imgData = ctx.getImageData(0, 0, textWidth, textHeight);
    const pixels = imgData.data;
    const widthBytes = Math.ceil(textWidth / 8);

    // ¡IMPORTANTE! Inversión de Bits (Igual que arriba): 255 = Todo el bloque es fondo BLANCO.
    const bitmapData = new Uint8Array(widthBytes * textHeight).fill(255);

    for (let cy = 0; cy < textHeight; cy++) {
        for (let cx = 0; cx < textWidth; cx++) {
            const idx = (cy * textWidth + cx) * 4;
            const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];

            const luminance = (r * 0.299) + (g * 0.587) + (b * 0.114);

            // Texto negro -> Ponemos el bit en 0 para quemar la tinta.
            if (luminance < 128) {
                bitmapData[cy * widthBytes + Math.floor(cx / 8)] &= ~(1 << (7 - (cx % 8)));
            }
        }
    }

    const header = new TextEncoder().encode(`BITMAP ${x},${y},${widthBytes},${textHeight},0,`);
    const crlf = new TextEncoder().encode("\r\n");
    const result = new Uint8Array(header.length + bitmapData.length + crlf.length);
    result.set(header, 0);
    result.set(bitmapData, header.length);
    result.set(crlf, header.length + bitmapData.length);
    return result;
}

// ============================================================================
// LÓGICA DE TSPL 48x28mm Y BLUETOOTH
// ============================================================================
async function generarEtiquetaBuffer(pkgData: any, ofertaText: string): Promise<Uint8Array> {
    const { ubicacion, destNombre, destCel, costoDisplay, trackingUrl, remitente, remitenteCel, remitenteEmpresa, fechaRegistro, tipoPaquete, qrTsplUrl } = pkgData;
    const sanitize = (str: string) => (str || '').replace(/"/g, '').substring(0, 40);

    const sanUbic = sanitize(ubicacion);
    const sanDest = sanitize(destNombre);
    const sanDestCel = sanitize(destCel);
    const sanCosto = sanitize(costoDisplay);
    const sanUrl = (trackingUrl || '').replace(/"/g, '').substring(0, 80);
    const sanRemitente = sanitize(remitente);
    const sanRemitenteCel = sanitize(remitenteCel);
    const sanRemitenteEmp = sanitize(remitenteEmpresa);
    const sanFecha = (fechaRegistro || '').substring(0, 18);
    const sanTipo = sanitize(tipoPaquete);

    const encoder = new TextEncoder();

    // ─── CONFIGURACIÓN DE DISEÑO APLICANDO EL NUEVO LAYOUT (FOTO) ───
    const DESIGN = {
        // lblUbic: { x: 160, y: 25, size: 15, bold: false, text: "UBIC:" },
        valUbic: { x: 153, y: 21, size: 27, bold: true, maxWidth: 190 },

        lblDe: { x: 0, y: 70, size: 12, bold: true, text: "DE:" },
        valDe: { x: 30, y: 70, size: 16, bold: false, maxWidth: 215 },
        lblDeEmp: { x: 0, y: 92, size: 12, bold: true, text: "EMP:" },
        valDeEmp: { x: 40, y: 92, size: 16, bold: true, maxWidth: 205 },
        lblDeCel: { x: 0, y: 114, size: 12, bold: true, text: "CI/CEL:" },
        valDeCel: { x: 65, y: 114, size: 16, bold: false, maxWidth: 180 },

        lblPara: { x: 0, y: 140, size: 12, bold: true, text: "PARA:" },
        valPara: { x: 55, y: 140, size: 18, bold: false, maxWidth: 190 },
        lblParaCel: { x: 0, y: 162, size: 12, bold: true, text: "CI/CEL:" },
        valParaCel: { x: 70, y: 162, size: 18, bold: false, maxWidth: 175 },

        qr: { x: 252, y: 72, cell: 4 },

        lblFecha: { x: -1, y: 188, size: 14, bold: true, text: "REG:" },
        valFecha: { x: -1, y: 210, size: 18, bold: false, maxWidth: 85 },

        lblCosto: { x: 80, y: 188, size: 14, bold: true, text: "COSTO:" },
        valCosto: { x: 80, y: 210, size: 18, bold: false, maxWidth: 75 },

        lblVence: { x: 160, y: 188, size: 14, bold: true, text: "GRATIS:" },
        valVence: { x: 160, y: 210, size: 15, bold: false, maxWidth: 70 },

        lblTipo: { x: 238, y: 188, size: 12, bold: true, text: "TIPO DE PAQUETE:", maxWidth: 150, wrapLines: true },
        valTipo: { x: 238, y: 207, size: 15, bold: false, maxWidth: 150, wrapLines: true }
    };

    // Dibujamos las líneas de separación. (Usamos líneas continuas en TSPL para mayor fidelidad en térmico)
    const part1 = encoder.encode(
        `SIZE 50 mm,30 mm\nGAP 2 mm,0\nCLS\n` +
        `BAR 0,65,400,2\nBAR 0,184,400,2\nBAR 150,10,2,45\n`
    );
    const logo = await getTsplBitmap("/primt-img.png", 0, 8, 120, 56);

    const t = (item: any, text: string) => getTextTsplCommand(text, item.x, item.y, item.size, item.bold, item.maxWidth, item.wrapLines);

    const bufs = [];
    bufs.push(part1, logo);
    // bufs.push(await t(DESIGN.lblUbic, DESIGN.lblUbic.text));
    bufs.push(await t(DESIGN.valUbic, sanUbic));

    let remitenteY = 70;
    if (sanRemitente) {
        bufs.push(await t({ ...DESIGN.lblDe, y: remitenteY }, DESIGN.lblDe.text));
        bufs.push(await t({ ...DESIGN.valDe, y: remitenteY }, sanRemitente));
        remitenteY += 22;
    }
    if (sanRemitenteEmp) {
        bufs.push(await t({ ...DESIGN.lblDeEmp, y: remitenteY }, DESIGN.lblDeEmp.text));
        bufs.push(await t({ ...DESIGN.valDeEmp, y: remitenteY }, sanRemitenteEmp));
        remitenteY += 22;
    }
    if (sanRemitenteCel) {
        bufs.push(await t({ ...DESIGN.lblDeCel, y: remitenteY }, DESIGN.lblDeCel.text));
        bufs.push(await t({ ...DESIGN.valDeCel, y: remitenteY }, sanRemitenteCel));
        remitenteY += 22;
    }

    let destY = 140;
    if (sanDest) {
        bufs.push(await t({ ...DESIGN.lblPara, y: destY }, DESIGN.lblPara.text));
        bufs.push(await t({ ...DESIGN.valPara, y: destY }, sanDest));
        destY += 22;
    }
    if (sanDestCel) {
        bufs.push(await t({ ...DESIGN.lblParaCel, y: destY }, DESIGN.lblParaCel.text));
        bufs.push(await t({ ...DESIGN.valParaCel, y: destY }, sanDestCel));
        destY += 22;
    }

    bufs.push(await t(DESIGN.lblFecha, DESIGN.lblFecha.text));
    bufs.push(await t(DESIGN.valFecha, sanFecha || "-"));

    bufs.push(await t(DESIGN.lblCosto, DESIGN.lblCosto.text));
    bufs.push(await t(DESIGN.valCosto, sanCosto));

    if (ofertaText) {
        bufs.push(await t(DESIGN.lblVence, DESIGN.lblVence.text));
        bufs.push(await t(DESIGN.valVence, ofertaText));
    }

    bufs.push(await t(DESIGN.lblTipo, DESIGN.lblTipo.text));
    bufs.push(await t(DESIGN.valTipo, sanTipo || "-"));

    if (qrTsplUrl) {
        // Renderiza el QR como bitmap a 104x104 dots (13mm x 13mm en 203 DPI)
        const qrImg = await getTsplBitmap(qrTsplUrl, DESIGN.qr.x, DESIGN.qr.y, 104, 104);
        bufs.push(qrImg);
        bufs.push(encoder.encode("PRINT 1\r\n"));
    } else {
        const part3 = encoder.encode(`QRCODE ${DESIGN.qr.x},${DESIGN.qr.y},L,${DESIGN.qr.cell},A,0,"${sanUrl}"\nPRINT 1\r\n`);
        bufs.push(part3);
    }

    const totalLength = bufs.reduce((acc, c) => acc + c.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of bufs) {
        result.set(chunk, offset);
        offset += chunk.length;
    }

    return result;
}


async function printViaBLE(data: Uint8Array, signal?: AbortSignal) {
    const SERVICE_UUID = "49535343-fe7d-4ae5-8fa9-9fafd205e455";
    const nav: any = navigator;
    let hasBluetooth = !!nav.bluetooth;
    if (hasBluetooth && typeof nav.bluetooth.getAvailability === 'function') {
        hasBluetooth = await nav.bluetooth.getAvailability();
    }
    if (!hasBluetooth) throw new Error("Bluetooth no disponible.");

    if (signal?.aborted) throw new DOMException("Abortado por el usuario", "AbortError");

    // Algunas implementaciones de Web Bluetooth soportan signal en requestDevice.
    const reqOptions: any = {
        filters: [{ namePrefix: "T-IM" }], optionalServices: [SERVICE_UUID]
    };
    // if (signal) reqOptions.signal = signal; // Descomentar si tu navegador soporta signal en requestDevice.

    // Si el usuario cancela, el promise rejecteará si el navegador soporta abortar,
    // o simplemente verificamos justo después.
    const device = await nav.bluetooth.requestDevice(reqOptions);
    if (signal?.aborted) throw new DOMException("Abortado por el usuario", "AbortError");

    const server = await device.gatt.connect();
    if (signal?.aborted) {
        server.disconnect();
        throw new DOMException("Abortado por el usuario", "AbortError");
    }

    const service = await server.getPrimaryService(SERVICE_UUID);
    const chars = await service.getCharacteristics();
    let bleWrite: any = null;
    for (const c of chars) {
        if ((c as any).properties.write || (c as any).properties.writeWithoutResponse) {
            bleWrite = c; break;
        }
    }
    if (!bleWrite) throw new Error("No existe una característica WRITE");

    // Trozos pequeños (20 bytes) para no saturar memoria BLE
    for (let i = 0; i < data.length; i += 20) {
        if (signal?.aborted) {
            server.disconnect();
            throw new DOMException("Abortado por el usuario", "AbortError");
        }
        const bloque = data.slice(i, i + 20);
        if (bleWrite.properties.write) await bleWrite.writeValue(bloque);
        else await bleWrite.writeValueWithoutResponse(bloque);
        await sleep(30);
    }
}

async function printViaUSB(data: Uint8Array, signal?: AbortSignal) {
    const nav: any = navigator;
    if (signal?.aborted) throw new DOMException("Abortado por el usuario", "AbortError");

    const usbDevice = await nav.usb.requestDevice({ filters: [] });
    if (signal?.aborted) throw new DOMException("Abortado por el usuario", "AbortError");

    await usbDevice.open();
    if (usbDevice.configuration === null) await usbDevice.selectConfiguration(1);
    await usbDevice.claimInterface(0);

    const eps = usbDevice.configuration.interfaces[0].alternate.endpoints;
    const out = eps.find((e: any) => e.direction === "out");
    if (!out) throw new Error("Endpoint de salida no encontrado");

    if (signal?.aborted) throw new DOMException("Abortado por el usuario", "AbortError");
    await usbDevice.transferOut(out.endpointNumber, data);
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================
export async function generateAndOpenDetailedReceiptPdf(pkg: any, signal?: AbortSignal) {
    const ubicacion = String(pkg?.ubicacionAlmacen || "").toUpperCase();
    const destNombre = String(pkg?.destinatario?.nombre_completo || "").toUpperCase();
    const destCel = String(pkg?.destinatario?.ci_o_cel || pkg?.destinatario?.celular || "").toUpperCase();
    const packageId = String(pkg?.pk_id_paquete || "");
    const remitente = String(pkg?.remitente?.nombre_completo || "").toUpperCase();
    const remitenteCel = String(pkg?.remitente?.ci_o_cel || pkg?.remitente?.celular || "").toUpperCase();
    const remitenteEmpresa = String(pkg?.remitente?.empresa || pkg?.remitente?.nombre_empresa || pkg?.empresaRemitente || "").toUpperCase();

    let fechaRegistro = "";
    if (pkg?.fechaHoraRegistro) {
        const d = new Date(pkg.fechaHoraRegistro);
        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const anio = String(d.getFullYear()).substring(2);
        fechaRegistro = `${dia}/${mes}/${anio}`;
    }

    const tipoPaquete = String(pkg?.tipo_paquete || pkg?.tipoPaquete || "").toUpperCase();

    const precioBase = pkg?.precioBase;
    const precioOferta = pkg?.precioOferta;
    const diasOferta = pkg?.diasOferta;
    const estadoPago = String(pkg?.estadoPago || "Pagado").toUpperCase();

    let costoDisplay = "Bs. 0.00";
    if (precioBase != null) {
        costoDisplay = `Bs. ${Number(precioBase).toFixed(2)}`;
    }

    let ofertaText = "";
    if (precioOferta != null && diasOferta != null && diasOferta > 0 && estadoPago === "PAGADO") {
        if (pkg?.fechaHoraRegistro) {
            const fechaReg = new Date(pkg.fechaHoraRegistro);
            const fechaExp = new Date(fechaReg.getTime() + (diasOferta * 24 * 60 * 60 * 1000));
            const dia = String(fechaExp.getDate()).padStart(2, '0');
            const mes = String(fechaExp.getMonth() + 1).padStart(2, '0');
            const anio = String(fechaExp.getFullYear()).substring(2);
            ofertaText = `${dia}/${mes}/${anio}`;
        }
    }

    const trackingUrl = `${window.location.origin}/p/${encodeId(Number(packageId))}`;

    let qrTsplUrl = "";
    try {
        qrTsplUrl = await QRCode.toDataURL(trackingUrl, {
            margin: 0, width: 104, errorCorrectionLevel: 'M',
            color: { dark: '#000000', light: '#ffffff' },
        });
    } catch (e) { }

    if (signal?.aborted) return;

    // Generar la etiqueta con el bloque de "Mini-Bitmaps" optimizados
    const bufferData = await generarEtiquetaBuffer({
        ubicacion, destNombre, destCel, costoDisplay, trackingUrl, packageId, remitente, remitenteCel, remitenteEmpresa, fechaRegistro, tipoPaquete, qrTsplUrl
    }, ofertaText);

    if (signal?.aborted) return;

    try {
        const nav: any = navigator;
        let hasBluetooth = !!nav.bluetooth;
        if (hasBluetooth && typeof nav.bluetooth.getAvailability === 'function') {
            hasBluetooth = await nav.bluetooth.getAvailability();
        }

        if (hasBluetooth) {
            await printViaBLE(bufferData, signal);
        } else if (nav.usb) {
            await printViaUSB(bufferData, signal);
        } else {
            toast.warning("Este navegador no soporta Web Bluetooth ni Web USB. Usa Chrome o Edge para imprimir.");
        }
    } catch (e: any) {
        if (e.name === 'AbortError') {
            toast.info("Impresión cancelada.");
            return;
        }

        // Si el usuario simplemente canceló el diálogo de selección de dispositivo, no mostramos un error ruidoso
        if (e.name === 'NotFoundError' || e.message?.includes('No device selected') || e.message?.includes('User cancelled')) {
            toast.info("Selección de impresora cancelada.");
            return;
        }

        // Solo hacemos console.error si es un error real, para evitar que Next.js levante el overlay rojo
        console.error("PRINT ERROR:", e);

        toast.error(e.message ? "Error al imprimir: " + e.message : "Error desconocido al imprimir.");
    }
}
