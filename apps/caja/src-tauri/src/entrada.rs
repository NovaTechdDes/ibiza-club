use crate::escpos::{
    AVANZAR_Y_CORTAR, CENTRADO, INICIAR, IZQUIERDA, NEGRITA_NO, NEGRITA_SI, TABLA_CP850,
    TEXTO_ALTO, TEXTO_GRANDE, TEXTO_NORMAL, a_cp850,
};
use crate::ticket::{Ticket, a_los_costados, partir, plata};

// Un papel por persona. `orden` y `de` forman el "2/3": si a alguien le dan menos
// papeles de los que pagó, se nota en la puerta.
fn armar_una(
    ticket: &Ticket,
    ancho: usize,
    nombre: &str,
    precio: i64,
    orden: u32,
    de: u32,
) -> Vec<u8> {
    let mut datos = Vec::new();
    let separador = format!("{}\n", "-".repeat(ancho));

    // Cada entrada arranca de cero, igual que las copias del retiro
    datos.extend_from_slice(INICIAR);
    datos.extend_from_slice(TABLA_CP850);

    // La letra grande: el de seguridad la mira de lejos, como el preparador en la barra
    datos.extend_from_slice(CENTRADO);
    datos.extend_from_slice(TEXTO_GRANDE);
    datos.extend(a_cp850(&format!("* {} *\n", ticket.letra)));
    datos.extend_from_slice(TEXTO_NORMAL);
    datos.extend(a_cp850(&format!(
        "{} · {} · #{:04}\n",
        ticket.fecha, ticket.caja, ticket.numero
    )));
    datos.extend(a_cp850(&separador));

    // El tipo de entrada, alto y en negrita. TEXTO_ALTO no cambia el ancho de las letras,
    // así que entran `ancho` columnas y se parte entre palabras, sin recortar el nombre
    datos.extend_from_slice(NEGRITA_SI);
    datos.extend_from_slice(TEXTO_ALTO);
    for renglon in partir(nombre, ancho, ancho) {
        datos.extend(a_cp850(&format!("{renglon}\n")));
    }
    datos.extend_from_slice(TEXTO_NORMAL);
    datos.extend_from_slice(NEGRITA_NO);
    datos.extend(a_cp850(&format!("Entrada {orden}/{de}\n")));

    datos.extend_from_slice(IZQUIERDA);
    datos.extend(a_cp850(&separador));
    datos.extend(a_cp850(&a_los_costados("Precio", &plata(precio), ancho)));
    let pago = format!("Pago: {}", ticket.medio_pago);
    let hora = format!("{} hs", ticket.hora);
    datos.extend(a_cp850(&a_los_costados(&pago, &hora, ancho)));

    datos.extend(a_cp850("\n\n"));
    datos.extend_from_slice(AVANZAR_Y_CORTAR);
    datos
}

// Todas las entradas van en un solo envío, igual que las dos copias del retiro
pub fn armar_entradas(ticket: &Ticket, ancho: usize) -> Vec<u8> {
    let de: u32 = ticket.lineas.iter().map(|linea| linea.cantidad).sum();
    let mut datos = Vec::new();
    let mut orden = 0;

    for linea in &ticket.lineas {
        for _ in 0..linea.cantidad {
            orden += 1;
            datos.extend(armar_una(
                ticket,
                ancho,
                &linea.nombre,
                linea.precio_unitario,
                orden,
                de,
            ));
        }
    }
    datos
}

#[cfg(test)]
mod pruebas {
    use super::*;
    use crate::ticket::LineaTicket;

    fn linea(nombre: &str, cantidad: u32, precio: i64) -> LineaTicket {
        LineaTicket {
            cantidad,
            nombre: nombre.into(),
            precio_unitario: precio,
            promocion_nombre: None,
            descuento: 0,
        }
    }

    fn venta(lineas: Vec<LineaTicket>) -> Ticket {
        Ticket {
            letra: "S".into(),
            fecha: "VIE 23/10".into(),
            caja: "Puerta 1".into(),
            numero: 7,
            lineas,
            total: 45000,
            medio_pago: "Efectivo".into(),
            hora: "01:15".into(),
        }
    }

    fn cortes(datos: &[u8]) -> usize {
        datos
            .windows(AVANZAR_Y_CORTAR.len())
            .filter(|ventana| *ventana == AVANZAR_Y_CORTAR)
            .count()
    }

    #[test]
    fn un_papel_por_entrada_con_su_numero() {
        let datos = armar_entradas(
            &venta(vec![linea("General", 2, 10000), linea("VIP", 1, 25000)]),
            42,
        );
        let texto = String::from_utf8_lossy(&datos);
        assert_eq!(texto.matches("* S *").count(), 3);
        assert!(texto.contains("Entrada 1/3"));
        assert!(texto.contains("Entrada 2/3"));
        assert!(texto.contains("Entrada 3/3"));
        assert_eq!(cortes(&datos), 3);
    }

    #[test]
    fn cada_papel_lleva_el_precio_de_su_entrada() {
        let datos = armar_entradas(
            &venta(vec![linea("General", 2, 10000), linea("VIP", 1, 25000)]),
            42,
        );
        let texto = String::from_utf8_lossy(&datos);
        assert_eq!(
            texto.matches(&a_los_costados("Precio", "$10.000", 42)).count(),
            2
        );
        assert_eq!(
            texto.matches(&a_los_costados("Precio", "$25.000", 42)).count(),
            1
        );
    }

    #[test]
    fn sin_lineas_no_imprime_nada() {
        assert!(armar_entradas(&venta(vec![]), 42).is_empty());
    }
}
