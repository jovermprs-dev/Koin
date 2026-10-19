export function formatNumber(value: number): string {
  return value.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCurrency(value: number): string {
  return formatNumber(value) + " €";
}

export function formatSaldo(value: number): string {
  return (value >= 0 ? "+" : "") + formatCurrency(value);
}

export function formatImporte(value: number, tipo: "gasto" | "ingreso"): string {
  return (tipo === "gasto" ? "-" : "+") + formatCurrency(value);
}

export function parseImporte(raw: string): number {
  return Number(raw.replace(",", "."));
}

export function formatFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
