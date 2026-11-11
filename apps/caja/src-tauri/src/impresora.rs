use std::io::Write;
use std::net::{SocketAddr, TcpStream};
use std::time::Duration;

use crate::escpos::{
    AVANZAR_Y_CORTAR, CENTRADO, INICIAR, IZQUIERDA, TABLA_CP850, TEXTO_GRANDE, TEXTO_NORMAL,
    a_cp850,
};
use crate::cierre::{Cierre, armar_cierre};
use crate::retiro::{Retiro, armar_retiro};
use crate::ticket::{Ticket, armar_ticket};

const ESPERA: Duration = Duration::from_secs(3);

// Solo sabe mandar bytes por la red: no sabe qué es un ticket
fn enviar(ip: &str, puerto: u16, datos: &[u8]) -> Result<(), String> {
    let direccion: SocketAddr = format!("{ip}:{puerto}")
        .parse()
        .map_err(|_| format!("Dirección inválida: {ip}:{puerto}"))?;

    let mut conexion = TcpStream::connect_timeout(&direccion, ESPERA)
        .map_err(|error| format!("No se pudo conectar con la impresora: {error}"))?;

    conexion
        .set_write_timeout(Some(ESPERA))
        .map_err(|error| error.to_string())?;

    conexion
        .write_all(datos)
        .map_err(|error| format!("No se pudo enviar a la impresora: {error}"))
}

// Hoja para probar conexión, acentos y ancho: no sabe nada de la red
fn armar_prueba() -> Vec<u8> {
    let mut datos = Vec::new();

    datos.extend_from_slice(INICIAR);
    datos.extend_from_slice(TABLA_CP850);

    datos.extend_from_slice(CENTRADO);
    datos.extend_from_slice(TEXTO_GRANDE);
    datos.extend(a_cp850("S\n"));
    datos.extend_from_slice(TEXTO_NORMAL);

    datos.extend_from_slice(IZQUIERDA);
    datos.extend(a_cp850("Prueba de impresión · Ibiza Club\n"));
    datos.extend(a_cp850("Acentos: á é í ó ú ü ñ Á É Í Ó Ú Ü Ñ ¿ ¡\n"));
    // Una regla de 48 columnas: si salta de renglón, entran menos
    datos.extend(a_cp850(
        "123456789012345678901234567890123456789012345678\n",
    ));

    datos.extend(a_cp850("\n\n"));
    datos.extend_from_slice(AVANZAR_Y_CORTAR);
    datos
}

// async: la red puede tardar y no tiene que congelar la pantalla
#[tauri::command(async)]
pub fn imprimir_prueba(ip: String, puerto: u16) -> Result<(), String> {
    enviar(&ip, puerto, &armar_prueba())
}

#[tauri::command(async)]
pub fn imprimir_ticket(
    ip: String,
    puerto: u16,
    ancho: usize,
    ticket: Ticket,
) -> Result<(), String> {
    enviar(&ip, puerto, &armar_ticket(&ticket, ancho))
}

#[tauri::command(async)]
pub fn imprimir_retiro(
    ip: String,
    puerto: u16,
    ancho: usize,
    retiro: Retiro,
) -> Result<(), String> {
    enviar(&ip, puerto, &armar_retiro(&retiro, ancho))
}

#[tauri::command(async)]
pub fn imprimir_cierre(
    ip: String,
    puerto: u16,
    ancho: usize,
    cierre: Cierre,
) -> Result<(), String> {
    enviar(&ip, puerto, &armar_cierre(&cierre, ancho))
}
