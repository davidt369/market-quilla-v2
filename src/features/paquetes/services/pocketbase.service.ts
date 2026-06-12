export async function uploadEvidenciaToPocketBase(paqueteId: number, file: File): Promise<string> {
    const pbFormData = new FormData();
    pbFormData.append("id_paquete", paqueteId.toString());
    pbFormData.append("fotoEntregadoUrl", file);

    const pbUrl = process.env.POCKETBASE!;

    const pbRes = await fetch(`${pbUrl}/api/collections/paquete_evidencia/records`, {
        method: "POST",
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
