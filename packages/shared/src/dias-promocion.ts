export const DIAS_SEMANA = [0, 1, 2, 3, 4, 5, 6] as const;
export type DiaSemana = (typeof DIAS_SEMANA)[number];

export const NOMBRE_DIA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

export const diasATexto = (dias: readonly number[]): string => dias.join(",");

// "5,6" → [5, 6]. Lo que no sea un día válido se ignora.
// Los vacíos se sacan antes de Number: Number("") da 0 y sería domingo.
export const textoADias = (texto: string): number[] =>
    texto
        .split(",")
        .filter((t) => t.trim() !== "")
        .map(Number)
        .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
