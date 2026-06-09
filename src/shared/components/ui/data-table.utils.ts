export function extractValues(obj: unknown): string {
  if (obj == null) return ""
  if (typeof obj !== "object") return String(obj)
  if (Array.isArray(obj)) return obj.map(extractValues).join(" ")
  return Object.values(obj as Record<string, unknown>)
    .map(extractValues)
    .join(" ")
}

export function formatNumber(val: unknown): string {
  const num = Number(val)
  if (Number.isNaN(num)) return "0.00"
  return num.toLocaleString("es-ES", { minimumFractionDigits: 2 })
}
