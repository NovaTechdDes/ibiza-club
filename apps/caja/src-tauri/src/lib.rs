use tauri_plugin_sql::{Migration, MigrationKind};

mod escpos;
mod impresora;
mod pin;
mod retiro;
mod ticket;
mod transaccion;

// La misma clave para las migraciones, el load de JS y este comando
const BASE: &str = "sqlite:ibiza.db";

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migraciones = vec![
        Migration {
            version: 1,
            description: "ajustes",
            sql: include_str!("../migrations/001_ajustes.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "catalogo",
            sql: include_str!("../migrations/002_catalogo.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "operaciones",
            sql: include_str!("../migrations/003_operaciones.sql"),
            kind: MigrationKind::Up,
        },
    ];
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations(BASE, migraciones)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            greet,
            transaccion::transaccion,
            pin::verificar_pin,
            impresora::imprimir_prueba,
            impresora::imprimir_ticket,
            impresora::imprimir_retiro,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
