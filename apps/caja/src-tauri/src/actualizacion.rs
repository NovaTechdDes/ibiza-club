use std::sync::Mutex;
use std::time::Duration;

use tauri::{AppHandle, State, Url};
use tauri_plugin_updater::{Update, UpdaterExt};

// La consulta es un JSON chico; la descarga es el instalador entero
const ESPERA_CONSULTA: Duration = Duration::from_secs(30);
const ESPERA_DESCARGA: Duration = Duration::from_secs(10 * 60);

// La actualización ya descargada y con la firma verificada, esperando a que se cierre la caja.
// Vive en memoria: si se reinicia la app, se vuelve a descargar.
#[derive(Default)]
pub struct Pendiente(Mutex<Option<(Update, Vec<u8>)>>);

fn texto(error: impl std::fmt::Display) -> String {
    error.to_string()
}

// Devuelve la versión nueva ya descargada, o None si no hay nada nuevo
#[tauri::command]
pub async fn buscar_actualizacion(
    app: AppHandle,
    pendiente: State<'_, Pendiente>,
    api_url: String,
    token: String,
) -> Result<Option<String>, String> {
    // Si ya se bajó una, no se vuelve a pedir. El lock se suelta en esta misma línea:
    // un Mutex de std no se puede tener tomado durante un .await
    let ya_bajada = pendiente
        .0
        .lock()
        .map_err(texto)?
        .as_ref()
        .map(|(update, _)| update.version.clone());
    if ya_bajada.is_some() {
        return Ok(ya_bajada);
    }

    let actual = app.package_info().version.to_string();
    let endpoint = Url::parse(&format!(
        "{}/api/actualizaciones?version={actual}",
        api_url.trim_end_matches('/')
    ))
    .map_err(texto)?;

    let updater = app
        .updater_builder()
        .endpoints(vec![endpoint])
        .map_err(texto)?
        .header("Authorization", format!("Bearer {token}"))
        .map_err(texto)?
        .timeout(ESPERA_CONSULTA)
        .build()
        .map_err(texto)?;

    // None = la API respondió 204, o lo que ofrece no es más nuevo que lo instalado
    let Some(mut update) = updater.check().await.map_err(texto)? else {
        return Ok(None);
    };

    // La espera se copió del builder; para el instalador hace falta más
    update.timeout = Some(ESPERA_DESCARGA);

    // download verifica la firma con la pubkey de tauri.conf.json: si no coincide, es Err
    let bytes = update.download(|_, _| {}, || {}).await.map_err(texto)?;

    let version = update.version.clone();
    *pendiente.0.lock().map_err(texto)? = Some((update, bytes));
    Ok(Some(version))
}

// En Windows lanza el instalador (modo passive) y cierra la app; el instalador la vuelve a abrir
#[tauri::command]
pub fn instalar_actualizacion(pendiente: State<'_, Pendiente>) -> Result<(), String> {
    let guardada = pendiente.0.lock().map_err(texto)?;
    let Some((update, bytes)) = guardada.as_ref() else {
        return Err("No hay ninguna actualización descargada".into());
    };
    // Si falla, los bytes quedan guardados y se puede reintentar
    update.install(bytes).map_err(texto)
}
