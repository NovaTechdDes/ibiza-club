use serde::Deserialize;

use crate::escpos::{
    AVANZAR_Y_CORTAR, CENTRADO, INICIAR, IZQUIERDA, NEGRITA_NO, NEGRITA_SI, TABLA_CP850,
    TEXTO_ALTO, TEXTO_NORMAL, a_cp850,
};
use crate::ticket::{a_los_costados, plata};

// Lo que manda la pantalla: los textos ya vienen formateados y el monto en pesos enteros
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Retiro {
    numero: u32,
    caja: String,
    fecha: String,
    hora: String,
    monto: i64,
    motivo: String,
    cajero: String,
    autorizo: String,
}

// Una queda en el cajón para el arqueo; la otra se la lleva el encargado con la plata
const COPIAS: [&str; 2] = ["CAJA", "ENCARGADO"];

fn armar_copia(retiro: &Retiro, ancho: usize, copia: &str) -> Vec<u8> {
    let mut datos = Vec::new();
    let separador = format!("{}\n", "-".repeat(ancho));

    // Cada copia arranca de cero: si una sale mal, no arrastra el formato a la otra
    datos.extend_from_slice(INICIAR);
    datos.extend_from_slice(TABLA_CP850);

    datos.extend_from_slice(CENTRADO);
    datos.extend_from_slice(NEGRITA_SI);
    datos.extend_from_slice(TEXTO_ALTO);
    datos.extend(a_cp850("RETIRO DE EFECTIVO\n"));
    datos.extend_from_slice(TEXTO_NORMAL);
    datos.extend_from_slice(NEGRITA_NO);
    datos.extend(a_cp850(&format!(
        "{} · Retiro #{:04}\n",
        retiro.caja, retiro.numero
    )));
    datos.extend(a_cp850(&format!("{} · {} hs\n", retiro.fecha, retiro.hora)));

    datos.extend_from_slice(IZQUIERDA);
    datos.extend(a_cp850(&separador));

    // El monto es lo que se controla: alto y en negrita, pero con el ancho normal
    datos.extend_from_slice(NEGRITA_SI);
    datos.extend_from_slice(TEXTO_ALTO);
    datos.extend(a_cp850(&a_los_costados(
        "MONTO",
        &plata(retiro.monto),
        ancho,
    )));
    datos.extend_from_slice(TEXTO_NORMAL);
    datos.extend_from_slice(NEGRITA_NO);

    datos.extend(a_cp850(&format!("Motivo: {}\n", retiro.motivo)));
    datos.extend(a_cp850(&format!("Cajero: {}\n", retiro.cajero)));
    datos.extend(a_cp850(&format!("Autorizó: {}\n", retiro.autorizo)));
    datos.extend(a_cp850(&separador));

    // Lugar para firmar a mano: el PIN dice quién autorizó, la firma lo confirma en papel
    datos.extend(a_cp850("\n\n"));
    datos.extend(a_cp850(&format!(
        "Firma: {}\n",
        "_".repeat(ancho.saturating_sub("Firma: ".len()))
    )));

    datos.extend_from_slice(CENTRADO);
    datos.extend(a_cp850(&format!("\nCOPIA {copia}\n")));

    datos.extend(a_cp850("\n\n"));
    datos.extend_from_slice(AVANZAR_Y_CORTAR);
    datos
}

// Las dos copias van en un solo envío: o salen las dos o el cajero reintenta
pub fn armar_retiro(retiro: &Retiro, ancho: usize) -> Vec<u8> {
    let mut datos = Vec::new();
    for copia in COPIAS {
        datos.extend(armar_copia(retiro, ancho, copia));
    }
    datos
}

#[cfg(test)]
mod pruebas {
    use super::*;

    fn retiro_de_prueba() -> Retiro {
        Retiro {
            numero: 12,
            caja: "Caja 2".into(),
            fecha: "SAB 07/11".into(),
            hora: "03:12".into(),
            monto: 50000,
            motivo: "Exceso de efectivo".into(),
            cajero: "Juan".into(),
            autorizo: "Marta".into(),
        }
    }

    #[test]
    fn salen_las_dos_copias() {
        let datos = armar_retiro(&retiro_de_prueba(), 42);
        let texto = String::from_utf8_lossy(&datos);
        assert_eq!(texto.matches("RETIRO DE EFECTIVO").count(), 2);
        assert!(texto.contains("COPIA CAJA"));
        assert!(texto.contains("COPIA ENCARGADO"));
    }

    #[test]
    fn lleva_numero_y_monto_a_la_derecha() {
        let datos = armar_retiro(&retiro_de_prueba(), 42);
        let texto = String::from_utf8_lossy(&datos);
        assert!(texto.contains("Retiro #0012"));
        assert!(texto.contains(&a_los_costados("MONTO", "$50.000", 42)));
    }

    #[test]
    fn la_firma_ocupa_todo_el_ancho() {
        let datos = armar_retiro(&retiro_de_prueba(), 42);
        let texto = String::from_utf8_lossy(&datos);
        let firma = format!("Firma: {}\n", "_".repeat(35));
        assert_eq!(firma.chars().count(), 43); // 42 + el salto de línea
        assert!(texto.contains(&firma));
    }
}
