import "server-only";

export async function uploadEvidenciaToPocketBase(paqueteId: number, file: File): Promise<string> {
    const pbFormData = new FormData();
    pbFormData.append("id_paquete", paqueteId.toString());
    pbFormData.append("fotoEntregadoUrl", file);

    const pbUrl = process.env.POCKETBASE;
    const pbToken = process.env.POCKETBASE_TOKEN;

    if (!pbUrl || !pbToken) {
        console.error("Faltan variables de entorno POCKETBASE o POCKETBASE_TOKEN.");
        throw new Error("Error interno de configuración del almacenamiento de imágenes.");
    }

    const pbRes = await fetch(`${pbUrl}/api/collections/paquete_evidencia/records`, {
        method: "POST",
        headers: {
            "Authorization": pbToken.startsWith("Bearer ") ? pbToken : `Bearer ${pbToken}`,
        },
        body: pbFormData,
    });

    if (pbRes.ok) {
        const pbData = await pbRes.json();
        return `${pbUrl}/api/files/${pbData.collectionId}/${pbData.id}/${pbData.fotoEntregadoUrl}`;
    } else {
        const errorText = await pbRes.text();
        console.error("PocketBase upload failed:", errorText);
        throw new Error("Error al subir la evidencia fotográfica a PocketBase.");
    }
}
