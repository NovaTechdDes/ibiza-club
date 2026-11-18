use std::collections::HashSet;
use std::fs;
use std::path::Path;
use std::time::Duration;

use tauri::{AppHandle, Manager};

const CARPETA: &str = "imagenes";
const ESPERA: Duration = Duration::from_secs(15);

// El último tramo de la URL es el nombre del blob (producto-7-<uuid>.webp).
// Se valida carácter por carácter: si llegara algo como "..\\..\\x", no se usa como ruta.
fn nombre_archivo(url: &str) -> Option<&str> {
    let sin_query = url.split(['?', '#']).next()?;
    let nombre = sin_query.rsplit('/').next()?;
    let valido = !nombre.is_empty()
        && !nombre.starts_with('.')
        && nombre
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.'));
    valido.then_some(nombre)
}

async fn descargar(cliente: &reqwest::Client, url: &str, destino: &Path) -> Result<(), String> {
    let respuesta = cliente
        .get(url)
        .send()
        .await
        .and_then(|r| r.error_for_status())
        .map_err(|error| format!("No se pudo descargar {url}: {error}"))?;

    let bytes = respuesta
        .bytes()
        .await
        .map_err(|error| format!("Descarga incompleta de {url}: {error}"))?;

    // Primero a un temporal y después se renombra: si se corta la luz a mitad,
    // no queda un archivo roto con el nombre bueno (que contaría como "ya cacheado")
    let temporal = destino.with_extension("parcial");
    fs::write(&temporal, &bytes).map_err(|error| error.to_string())?;
    fs::rename(&temporal, destino).map_err(|error| error.to_string())
}

// Recibe las URLs que usa hoy el catálogo: baja las que faltan y borra las que sobran.
// Devuelve cuántas no se pudieron bajar (se reintentan en la próxima bajada).
#[tauri::command]
pub async fn cachear_imagenes(app: AppHandle, urls: Vec<String>) -> Result<u32, String> {
    let carpeta = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?
        .join(CARPETA);
    fs::create_dir_all(&carpeta).map_err(|error| error.to_string())?;

    let cliente = reqwest::Client::builder()
        .timeout(ESPERA)
        .build()
        .map_err(|error| error.to_string())?;

    let mut vigentes = HashSet::new();
    let mut fallidas = 0;

    for url in &urls {
        let Some(nombre) = nombre_archivo(url) else {
            fallidas += 1;
            continue;
        };
        vigentes.insert(nombre.to_string());

        let destino = carpeta.join(nombre);
        if destino.exists() {
            continue; // mismo nombre = misma imagen: no se vuelve a bajar
        }
        if descargar(&cliente, url, &destino).await.is_err() {
            fallidas += 1;
        }
    }

    // Lo que ya no usa ningún producto se borra (también los .parcial de un corte)
    for entrada in fs::read_dir(&carpeta)
        .map_err(|error| error.to_string())?
        .flatten()
    {
        let nombre = entrada.file_name().to_string_lossy().into_owned();
        if !vigentes.contains(&nombre) {
            let _ = fs::remove_file(entrada.path());
        }
    }

    Ok(fallidas)
}
