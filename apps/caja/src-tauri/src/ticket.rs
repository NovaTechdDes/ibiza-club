use serde::Deserialize;

use crate::escpos::{
    AVANZAR_Y_CORTAR, CENTRADO, INICIAR, IZQUIERDA, NEGRITA_NO, NEGRITA_SI, TABLA_CP850,
    TEXTO_ALTO, TEXTO_GRANDE, TEXTO_NORMAL, a_cp850,
};

// Lo que manda la pantalla. Los textos ya vienen formateados (fecha, hora, medio de pago);
// los montos vienen como enteros en pesos y el formato lo pone el ticket.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LineaTicket {
    cantidad: u32,
    nombre: String,
    precio_unitario: i64,
    promocion_nombre: Option<String>,
    descuento: i64,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Ticket {
    letra: String,
    fecha: String,
    caja: String,
    numero: u32,
    lineas: Vec<LineaTicket>,
    total: i64,
    medio_pago: String,
    hora: String,
}

// 10000 -> "$10.000", -4000 -> "-$4.000"
fn plata(monto: i64) -> String {
    let digitos = monto.unsigned_abs().to_string();
    let mut con_puntos = String::new();
    for (posicion, digito) in digitos.chars().enumerate() {
        if posicion > 0 && (digitos.len() - posicion) % 3 == 0 {
            con_puntos.push('.');
        }
        con_puntos.push(digito);
    }
    let signo = if monto < 0 { "-" } else { "" };
    format!("{signo}${con_puntos}")
}

// Texto a la izquierda, monto pegado a la derecha. Si no entra, se recorta el texto:
// el monto nunca se corta. Se cuentan caracteres, no bytes ("ñ" son 2 bytes en UTF-8).
fn a_los_costados(izquierda: &str, derecha: &str, ancho: usize) -> String {
    let largo_derecha = derecha.chars().count();
    let lugar = ancho.saturating_sub(largo_derecha + 1);
    let izquierda: String = izquierda.chars().take(lugar).collect();
    let espacios = ancho.saturating_sub(izquierda.chars().count() + largo_derecha);
    format!("{izquierda}{}{derecha}\n", " ".repeat(espacios))
}

pub fn armar_ticket(ticket: &Ticket, ancho: usize) -> Vec<u8> {
    let mut datos = Vec::new();
    let separador = format!("{}\n", "-".repeat(ancho));

    datos.extend_from_slice(INICIAR);
    datos.extend_from_slice(TABLA_CP850);

    // Encabezado: la letra bien grande, para verla de lejos en la barra
    datos.extend_from_slice(CENTRADO);
    datos.extend_from_slice(TEXTO_GRANDE);
    datos.extend(a_cp850(&format!("* {} *\n", ticket.letra)));
    datos.extend_from_slice(TEXTO_NORMAL);
    datos.extend(a_cp850(&format!(
        "{} · {} · #{:04}\n",
        ticket.fecha, ticket.caja, ticket.numero
    )));

    // Ítems: una línea por producto para que el preparador la tache
    datos.extend_from_slice(IZQUIERDA);
    datos.extend(a_cp850(&separador));
    for linea in &ticket.lineas {
        let detalle = format!("{} x {}", linea.cantidad, linea.nombre);
        let importe = plata(linea.precio_unitario * i64::from(linea.cantidad));
        datos.extend(a_cp850(&a_los_costados(&detalle, &importe, ancho)));

        if let Some(promo) = &linea.promocion_nombre {
            if linea.descuento > 0 {
                let detalle = format!("    {promo}");
                datos.extend(a_cp850(&a_los_costados(
                    &detalle,
                    &plata(-linea.descuento),
                    ancho,
                )));
            }
        }
    }
    datos.extend(a_cp850(&separador));

    // Total: doble alto pero ancho normal, así siguen entrando las mismas columnas
    datos.extend_from_slice(NEGRITA_SI);
    datos.extend_from_slice(TEXTO_ALTO);
    datos.extend(a_cp850(&a_los_costados(
        "TOTAL",
        &plata(ticket.total),
        ancho,
    )));
    datos.extend_from_slice(TEXTO_NORMAL);
    datos.extend_from_slice(NEGRITA_NO);

    let pago = format!("Pago: {}", ticket.medio_pago);
    let hora = format!("{} hs", ticket.hora);
    datos.extend(a_cp850(&a_los_costados(&pago, &hora, ancho)));

    datos.extend(a_cp850("\n\n"));
    datos.extend_from_slice(AVANZAR_Y_CORTAR);
    datos
}

#[cfg(test)]
mod pruebas {
    use super::*;

    #[test]
    fn formatea_la_plata() {
        assert_eq!(plata(0), "$0");
        assert_eq!(plata(800), "$800");
        assert_eq!(plata(8000), "$8.000");
        assert_eq!(plata(1234567), "$1.234.567");
        assert_eq!(plata(-4000), "-$4.000");
    }

    #[test]
    fn el_monto_queda_pegado_a_la_derecha() {
        assert_eq!(
            a_los_costados("TOTAL", "$10.000", 20),
            "TOTAL        $10.000\n"
        );
    }

    #[test]
    fn recorta_el_texto_largo_y_no_el_monto() {
        let renglon = a_los_costados("2 x Vodka con speed (tanque grande)", "$8.000", 20);
        assert_eq!(renglon, "2 x Vodka con $8.000\n");
    }

    #[test]
    fn cuenta_caracteres_y_no_bytes() {
        let renglon = a_los_costados("Ñandú", "$1", 10);
        assert_eq!(renglon.chars().count(), 11); // 10 + el salto de línea
    }
}
