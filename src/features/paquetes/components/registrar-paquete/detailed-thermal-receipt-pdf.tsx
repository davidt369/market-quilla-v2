"use client";
import React from "react";
import QRCode from "qrcode";
import { formatBoliviaDateOnly } from "@/shared/lib/timezone";

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
    const { ubicacion, destNombre, destCel, costoDisplay, trackingUrl, remitente, remitenteCel, remitenteEmpresa, fechaRegistro, tipoPaquete } = pkgData;
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

        qr: { x: 252, y: 75, cell: 4 },

        lblFecha: { x: -1, y: 188, size: 14, bold: true, text: "REG:" },
        valFecha: { x: -1, y: 210, size: 18, bold: false, maxWidth: 85 },

        lblCosto: { x: 90, y: 188, size: 14, bold: true, text: "COSTO:" },
        valCosto: { x: 90, y: 210, size: 18, bold: false, maxWidth: 75 },

        lblVence: { x: 170, y: 188, size: 14, bold: true, text: "GRATIS:" },
        valVence: { x: 170, y: 210, size: 18, bold: false, maxWidth: 70 },

        lblTipo: { x: 245, y: 188, size: 12, bold: true, text: "TIPO DE PAQUETE:", maxWidth: 150, wrapLines: true },
        valTipo: { x: 245, y: 207, size: 15, bold: false, maxWidth: 150, wrapLines: true }
    };

    // Dibujamos las líneas de separación. (Usamos líneas continuas en TSPL para mayor fidelidad en térmico)
    const part1 = encoder.encode(
        `SIZE 50 mm,30 mm\nGAP 2 mm,0\nCLS\n` +
        `BAR 0,65,400,2\nBAR 0,180,400,2\nBAR 150,10,2,45\n`
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

    const part3 = encoder.encode(`QRCODE ${DESIGN.qr.x},${DESIGN.qr.y},L,${DESIGN.qr.cell},A,0,"${sanUrl}"\nPRINT 1\r\n`);
    bufs.push(part3);

    const totalLength = bufs.reduce((acc, c) => acc + c.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of bufs) {
        result.set(chunk, offset);
        offset += chunk.length;
    }

    return result;
}

// ─── Vista Previa para Bluetooth (DISEÑO CLARO/BLANCO) ───
function showPreviewModal(data: {
    ubic: string; dest: string; cel: string; costo: string;
    qrUrl: string; packageId: string; trackingUrl: string;
    ofertaText: string; remitente: string; remitenteCel: string; remitenteEmpresa: string; fecha: string; tipoPaquete: string;
}): Promise<boolean> {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', inset: '0',
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: '99999', display: 'flex', justifyContent: 'center',
            alignItems: 'center', backdropFilter: 'blur(2px)',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        });

        const modal = document.createElement('div');
        Object.assign(modal.style, {
            backgroundColor: '#ffffff', borderRadius: '12px',
            padding: '24px', width: '420px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)', color: '#111827',
            display: 'flex', flexDirection: 'column', gap: '20px',
            alignItems: 'center',
        });

        const title = document.createElement('div');
        Object.assign(title.style, {
            fontSize: '16px', fontWeight: '700', textAlign: 'center',
            color: '#111827'
        });
        title.innerText = '📦 Vista Previa de Impresión';

        // ── ETIQUETA ESCALADA 1:1 PROFESIONAL (50x30mm) ──
        const label = document.createElement('div');
        Object.assign(label.style, {
            width: '400px', height: '240px',
            backgroundColor: '#ffffff', color: '#000000',
            position: 'relative', overflow: 'hidden',
            fontFamily: 'monospace', border: '1px solid #e5e7eb',
        });

        const addDiv = (style: any) => {
            const el = document.createElement('div');
            Object.assign(el.style, { position: 'absolute', backgroundColor: '#000', ...style });
            label.appendChild(el);
        };

        // Líneas sólidas
        addDiv({ top: '65px', left: '0px', right: '0px', height: '2px' });
        addDiv({ top: '180px', left: '0px', right: '0px', height: '2px' });
        addDiv({ top: '10px', left: '150px', width: '2px', height: '45px' });

        // Se han quitado las líneas punteadas interiores para dar más espacio

        const addText = (text: string, x: number, y: number, size: number, bold: boolean = false, maxWidth?: number, wrapLines?: boolean) => {
            const el = document.createElement('div');
            Object.assign(el.style, {
                position: 'absolute', left: `${x}px`, top: `${y}px`,
                fontSize: `${size}px`, fontWeight: bold ? '900' : 'bold',
                lineHeight: '1.2',
                whiteSpace: wrapLines ? 'normal' : 'nowrap',
                overflow: 'hidden',
                wordBreak: wrapLines ? 'break-word' : 'normal'
            });
            if (maxWidth) el.style.maxWidth = `${maxWidth}px`;
            el.innerText = text;
            label.appendChild(el);
        };

        const logoImg = document.createElement('img');
        logoImg.src = '/primt-img.png';
        Object.assign(logoImg.style, {
            position: 'absolute', left: '0px', top: '8px',
            width: '120px', height: '56px', objectFit: 'contain'
        });
        label.appendChild(logoImg);

        addText("UBIC:", 160, 25, 14, false);
        addText(data.ubic.substring(0, 40), 205, 21, 27, true, 190);

        let remY = 70;
        if (data.remitente) {
            addText("DE:", 0, remY, 12, true);
            addText(data.remitente.substring(0, 40), 30, remY, 16, false, 215);
            remY += 22;
        }
        if (data.remitenteEmpresa) {
            addText("EMP:", 0, remY, 12, true);
            addText(data.remitenteEmpresa.substring(0, 40), 40, remY, 16, true, 205);
            remY += 22;
        }
        if (data.remitenteCel) {
            addText("CI/CEL:", 0, remY, 12, true);
            addText(data.remitenteCel, 65, remY, 16, false, 180);
            remY += 22;
        }

        let destY = 140;
        if (data.dest) {
            addText("PARA:", 0, destY, 12, true);
            addText(data.dest.substring(0, 40), 55, destY, 18, false, 190);
            destY += 22;
        }
        if (data.cel) {
            addText("CI/CEL:", 0, destY, 12, true);
            addText(data.cel, 70, destY, 18, false, 175);
            destY += 22;
        }

        const qrImg = document.createElement('img');
        qrImg.src = data.qrUrl;
        Object.assign(qrImg.style, {
            position: 'absolute', left: '252px', top: '75px',
            width: '104px', height: '104px', imageRendering: 'pixelated'
        });
        label.appendChild(qrImg);

        addText("REGISTRO:", 0, 188, 14, true);
        addText(data.fecha, 0, 210, 18, false, 85);

        addText("COSTO:", 90, 188, 14, true);
        addText(data.costo, 90, 210, 18, false, 75);

        if (data.ofertaText) {
            addText("GRATIS:", 170, 188, 14, true);
            addText(data.ofertaText, 170, 210, 18, false, 70);
        }

        addText("TIPO DE PAQUETE:", 245, 188, 12, true, 150, true);
        addText(data.tipoPaquete || "-", 245, 210, 18, false, 150, true);

        // Actions
        const btnRow = document.createElement('div');
        Object.assign(btnRow.style, { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' });

        const mkBtn = (text: string, primary: boolean) => {
            const btn = document.createElement('button');
            btn.innerHTML = text;
            Object.assign(btn.style, {
                padding: '10px 0', border: primary ? 'none' : '1px solid #d1d5db',
                borderRadius: '6px', backgroundColor: primary ? '#2563eb' : '#ffffff',
                color: primary ? '#ffffff' : '#374151', fontWeight: '600', fontSize: '14px',
                cursor: 'pointer', width: '100%'
            });
            return btn;
        };

        const btnCancel = mkBtn('Cancelar', false);
        const btnPrint = mkBtn('Imprimir', true);
        btnCancel.onclick = () => { document.body.removeChild(overlay); resolve(false); };
        btnPrint.onclick = () => {
            btnPrint.innerHTML = 'Imprimiendo...';
            setTimeout(() => { document.body.removeChild(overlay); resolve(true); }, 100);
        };

        btnRow.appendChild(btnCancel);
        btnRow.appendChild(btnPrint);

        modal.appendChild(title);
        modal.appendChild(label);
        modal.appendChild(btnRow);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    });
}

async function printViaBLE(data: Uint8Array) {
    const SERVICE_UUID = "49535343-fe7d-4ae5-8fa9-9fafd205e455";
    const nav: any = navigator;
    let hasBluetooth = !!nav.bluetooth;
    if (hasBluetooth && typeof nav.bluetooth.getAvailability === 'function') {
        hasBluetooth = await nav.bluetooth.getAvailability();
    }
    if (!hasBluetooth) throw new Error("Bluetooth no disponible.");

    const device = await nav.bluetooth.requestDevice({
        filters: [{ namePrefix: "T-IM" }], optionalServices: [SERVICE_UUID],
    });
    const server = await device.gatt.connect();
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
        const bloque = data.slice(i, i + 20);
        if (bleWrite.properties.write) await bleWrite.writeValue(bloque);
        else await bleWrite.writeValueWithoutResponse(bloque);
        await sleep(30);
    }
}

async function printViaUSB(data: Uint8Array) {
    const nav: any = navigator;
    const usbDevice = await nav.usb.requestDevice({ filters: [] });
    await usbDevice.open();
    if (usbDevice.configuration === null) await usbDevice.selectConfiguration(1);
    await usbDevice.claimInterface(0);

    const eps = usbDevice.configuration.interfaces[0].alternate.endpoints;
    const out = eps.find((e: any) => e.direction === "out");
    if (!out) throw new Error("Endpoint de salida no encontrado");
    await usbDevice.transferOut(out.endpointNumber, data);
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================
export async function generateAndOpenDetailedReceiptPdf(pkg: any) {
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

    const trackingUrl = `${window.location.origin}/p/${packageId}`;

    let qrTsplUrl = "";
    try {
        qrTsplUrl = await QRCode.toDataURL(trackingUrl, {
            margin: 2, width: 200, errorCorrectionLevel: 'M',
            color: { dark: '#000000', light: '#ffffff' },
        });
    } catch (e) { }

    const confirmed = await showPreviewModal({
        ubic: ubicacion, dest: destNombre, cel: destCel,
        costo: costoDisplay, qrUrl: qrTsplUrl, packageId, trackingUrl, ofertaText,
        remitente, remitenteCel, remitenteEmpresa, fecha: fechaRegistro, tipoPaquete
    });

    if (!confirmed) return;

    // Generar la etiqueta con el bloque de "Mini-Bitmaps" optimizados
    const bufferData = await generarEtiquetaBuffer({
        ubicacion, destNombre, destCel, costoDisplay, trackingUrl, packageId, remitente, remitenteCel, remitenteEmpresa, fechaRegistro, tipoPaquete
    }, ofertaText);

    try {
        const nav: any = navigator;
        let hasBluetooth = !!nav.bluetooth;
        if (hasBluetooth && typeof nav.bluetooth.getAvailability === 'function') {
            hasBluetooth = await nav.bluetooth.getAvailability();
        }

        if (hasBluetooth) {
            await printViaBLE(bufferData);
        } else if (nav.usb) {
            await printViaUSB(bufferData);
        } else {
            alert("Este navegador no soporta Web Bluetooth ni Web USB.");
        }
    } catch (e: any) {
        console.error("PRINT ERROR:", e);
        if (e.message) alert("Error de impresión TSPL: " + e.message);
    }
}
