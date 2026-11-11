use serde::Deserialize;

use crate::escpos::{
    AVANZAR_Y_CORTAR, CENTRADO, INICIAR, IZQUIERDA, NEGRITA_NO, NEGRITA_SI, TABLA_CP850,
    TEXTO_ALTO, TEXTO_NORMAL, a_cp850,
};
use crate::ticket::{a_los_costados, plata};

// Lo que manda la pantalla: textos ya formateados y montos en pesos enteros.
// TS manda campos de más (ResultadoCierre completo): serde los ignora.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Cierre {
    caja: String,
    fecha: String, // jornada de la apertura ("VIE 23/10")
    hora: String,  // hora real del cierre
    cajero: String,
    cerro: String, // encargado que puso el PIN
    pendiente: bool,
    fondo: i64,
    efectivo: i64,
    retiros: i64,
    esperado: i64,
    contado: i64,
    diferencia: i64,
    tarjeta: i64,
    transferencia: i64,
    cant_ventas: u32,
    cant_anuladas: u32,
}

fn texto_diferencia(diferencia: i64) -> String {
    match diferencia {
        0 => "EXACTO".to_string(),
        d if d < 0 => format!("FALTAN {}", plata(-d)),
        d => format!("SOBRAN {}", plata(d)),
    }
}

// Una sola copia: el detalle además queda en Azure
pub fn armar_cierre(cierre: &Cierre, ancho: usize) -> Vec<u8> {
    let mut datos = Vec::new();
    let separador = format!("{}\n", "-".repeat(ancho));
    let fila = |etiqueta: &str, monto: i64| a_cp850(&a_los_costados(etiqueta, &plata(monto), ancho));

    datos.extend_from_slice(INICIAR);
    datos.extend_from_slice(TABLA_CP850);

    // Encabezado
    datos.extend_from_slice(CENTRADO);
    datos.extend_from_slice(NEGRITA_SI);
    datos.extend_from_slice(TEXTO_ALTO);
    datos.extend(a_cp850("CIERRE DE CAJA\n"));
    // Pendiente = lo cerró el encargado después (corte de luz): que se note en el papel
    if cierre.pendiente {
        datos.extend(a_cp850("CIERRE PENDIENTE\n"));
    }
    datos.extend_from_slice(TEXTO_NORMAL);
    datos.extend_from_slice(NEGRITA_NO);
    datos.extend(a_cp850(&format!("{} · {}\n", cierre.caja, cierre.fecha)));
    datos.extend(a_cp850(&format!("Cerrada {} hs\n", cierre.hora)));

    // Efectivo: de dónde sale el esperado
    datos.extend_from_slice(IZQUIERDA);
    datos.extend(a_cp850(&separador));
    datos.extend(fila("Fondo", cierre.fondo));
    datos.extend(fila("Ventas efectivo", cierre.efectivo));
    datos.extend(fila("Retiros", -cierre.retiros));
    datos.extend_from_slice(NEGRITA_SI);
    datos.extend(fila("Esperado", cierre.esperado));
    datos.extend(fila("Contado", cierre.contado));

    // La diferencia es lo que se controla: alta y en negrita
    datos.extend_from_slice(CENTRADO);
    datos.extend_from_slice(TEXTO_ALTO);
    datos.extend(a_cp850(&format!("{}\n", texto_diferencia(cierre.diferencia))));
    datos.extend_from_slice(TEXTO_NORMAL);
    datos.extend_from_slice(NEGRITA_NO);

    // Medios que no son efectivo y cantidades
    datos.extend_from_slice(IZQUIERDA);
    datos.extend(a_cp850(&separador));
    datos.extend(fila("Tarjeta", cierre.tarjeta));
    datos.extend(fila("Transferencia", cierre.transferencia));
    datos.extend(a_cp850(&a_los_costados(
        "Ventas / Anuladas",
        &format!("{} / {}", cierre.cant_ventas, cierre.cant_anuladas),
        ancho,
    )));
    datos.extend(a_cp850(&separador));

    datos.extend(a_cp850(&format!("Cajero: {}\n", cierre.cajero)));
    datos.extend(a_cp850(&format!("Cerró: {}\n", cierre.cerro)));

    // Firma a mano, igual que el retiro
    datos.extend(a_cp850("\n\n"));
    datos.extend(a_cp850(&format!(
        "Firma: {}\n",
        "_".repeat(ancho.saturating_sub("Firma: ".len()))
    )));

    datos.extend(a_cp850("\n\n"));
    datos.extend_from_slice(AVANZAR_Y_CORTAR);
    datos
}

#[cfg(test)]
mod pruebas {
    use super::*;

    fn cierre_de_prueba() -> Cierre {
        Cierre {
            caja: "Caja 2".into(),
            fecha: "VIE 06/11".into(),
            hora: "05:40".into(),
            cajero: "Juan".into(),
            cerro: "Marta".into(),
            pendiente: false,
            fondo: 20000,
            efectivo: 150000,
            retiros: 50000,
            esperado: 120000,
            contado: 120000,
            diferencia: 0,
            tarjeta: 80000,
            transferencia: 60000,
            cant_ventas: 42,
            cant_anuladas: 1,
        }
    }

    fn texto(cierre: &Cierre) -> String {
        String::from_utf8_lossy(&armar_cierre(cierre, 42)).to_string()
    }

    #[test]
    fn caja_exacta_sin_pendiente() {
        let t = texto(&cierre_de_prueba());
        assert!(t.contains("EXACTO"));
        assert!(!t.contains("CIERRE PENDIENTE"));
        assert!(t.contains(&a_los_costados("Retiros", "-$50.000", 42)));
        assert!(t.contains(&a_los_costados("Ventas / Anuladas", "42 / 1", 42)));
    }

    #[test]
    fn muestra_faltante_y_pendiente() {
        let mut c = cierre_de_prueba();
        c.diferencia = -1500;
        c.pendiente = true;
        let t = texto(&c);
        assert!(t.contains("FALTAN $1.500"));
        assert!(t.contains("CIERRE PENDIENTE"));
    }

    #[test]
    fn muestra_sobrante() {
        let mut c = cierre_de_prueba();
        c.diferencia = 200;
        assert!(texto(&c).contains("SOBRAN $200"));
    }
}
