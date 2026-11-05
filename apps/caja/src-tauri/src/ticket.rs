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

// Los renglones que siguen a un ítem (y la promo) van corridos para que se lean como parte de él
const SANGRIA: &str = "    ";

// Parte el texto en renglones cortando entre palabras. El primero mide `primero` y los
// demás `siguientes` (el primero es más corto porque a la derecha va el monto).
// Una palabra que no entra ni en un renglón entero se corta donde haga falta.
fn partir(texto: &str, primero: usize, siguientes: usize) -> Vec<String> {
    let mut renglones: Vec<String> = Vec::new();
    let mut actual = String::new();

    for palabra in texto.split_whitespace() {
        let mut resto: Vec<char> = palabra.chars().collect();
        while !resto.is_empty() {
            let lugar = if renglones.is_empty() {
                primero
            } else {
                siguientes
            }
            .max(1);
            let ocupado = actual.chars().count();
            let espacio = if ocupado == 0 { 0 } else { 1 };

            if ocupado + espacio + resto.len() <= lugar {
                if espacio == 1 {
                    actual.push(' ');
                }
                actual.extend(resto.drain(..));
            } else if ocupado > 0 {
                // No entra en este renglón: se cierra y la palabra pasa al siguiente
                renglones.push(std::mem::take(&mut actual));
            } else {
                // No entra ni sola: se llena el renglón con el principio de la palabra
                actual.extend(resto.drain(..lugar));
                renglones.push(std::mem::take(&mut actual));
            }
        }
    }

    if !actual.is_empty() || renglones.is_empty() {
        renglones.push(actual);
    }
    renglones
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

        // El nombre no se recorta: el envase va al final y es lo que mira el preparador
        let renglones = partir(
            &detalle,
            ancho.saturating_sub(importe.chars().count() + 1),
            ancho.saturating_sub(SANGRIA.len()),
        );
        let (primero, siguientes) = renglones
            .split_first()
            .expect("partir siempre da un renglón");
        datos.extend(a_cp850(&a_los_costados(primero, &importe, ancho)));
        for renglon in siguientes {
            datos.extend(a_cp850(&format!("{SANGRIA}{renglon}\n")));
        }

        if let Some(promo) = &linea.promocion_nombre {
            if linea.descuento > 0 {
                let detalle = format!("{SANGRIA}{promo}");
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
    fn parte_entre_palabras_con_el_primer_renglon_mas_corto() {
        let renglones = partir(
            "1 x Gin tonic con pepino, frutos rojos y romero (vaso)",
            35,
            38,
        );
        assert_eq!(
            renglones,
            ["1 x Gin tonic con pepino, frutos", "rojos y romero (vaso)"]
        );
    }

    #[test]
    fn un_texto_corto_queda_en_un_renglon() {
        assert_eq!(
            partir("1 x Fernet (tanque)", 35, 38),
            ["1 x Fernet (tanque)"]
        );
        assert_eq!(partir("", 35, 38), [""]);
    }

    #[test]
    fn corta_una_palabra_que_no_entra_en_ningun_renglon() {
        assert_eq!(partir("Superespumante", 5, 6), ["Super", "espuma", "nte"]);
    }

    #[test]
    fn el_ticket_no_pierde_el_envase() {
        let ticket = Ticket {
            letra: "S".into(),
            fecha: "VIE 23/10".into(),
            caja: "Caja 2".into(),
            numero: 1,
            lineas: vec![LineaTicket {
                cantidad: 1,
                nombre: "Gin tonic con pepino, frutos rojos y romero (vaso)".into(),
                precio_unitario: 3500,
                promocion_nombre: None,
                descuento: 0,
            }],
            total: 3500,
            medio_pago: "Efectivo".into(),
            hora: "23:47".into(),
        };
        let datos = armar_ticket(&ticket, 42);
        let texto = String::from_utf8_lossy(&datos);
        assert!(texto.contains("1 x Gin tonic con pepino, frutos    $3.500\n"));
        assert!(texto.contains("\n    rojos y romero (vaso)\n"));
    }

    #[test]
    fn cuenta_caracteres_y_no_bytes() {
        let renglon = a_los_costados("Ñandú", "$1", 10);
        assert_eq!(renglon.chars().count(), 11); // 10 + el salto de línea
    }
}
