use tauri::{AppHandle, Manager, Monitor, WebviewUrl, WebviewWindowBuilder};

// Tiene que coincidir con capabilities/cliente.json y, en M6b, con VENTANA_CLIENTE de src/lib/pantallaCliente.ts
pub const ETIQUETA: &str = "cliente";

/// Abre la pantalla del cliente en el monitor donde no está la caja.
/// Sin segundo monitor: en desarrollo abre una ventana chica para probar; instalada, no abre nada.
pub fn abrir(app: &AppHandle) -> tauri::Result<()> {
    match segundo_monitor(app)? {
        Some(monitor) => abrir_en(app, &monitor)?,
        None if cfg!(debug_assertions) => abrir_de_prueba(app)?,
        None => return Ok(()),
    }

    // Mostrar la ventana nueva puede sacarle el foco a la caja, y el primer toque en la
    // pantalla táctil se perdería. Se lo devolvemos.
    if let Some(caja) = app.get_webview_window("main") {
        caja.set_focus()?;
    }
    Ok(())
}

// El primer monitor que no es el de la ventana de la caja
fn segundo_monitor(app: &AppHandle) -> tauri::Result<Option<Monitor>> {
    let Some(caja) = app.get_webview_window("main") else {
        return Ok(None);
    };
    let Some(de_la_caja) = caja.current_monitor()? else {
        return Ok(None);
    };
    let otro = caja
        .available_monitors()?
        .into_iter()
        .find(|m| m.position() != de_la_caja.position());
    Ok(otro)
}

fn abrir_en(app: &AppHandle, monitor: &Monitor) -> tauri::Result<()> {
    // Se crea oculta: si no, se vería un instante en el monitor de la caja antes de moverse
    let ventana = WebviewWindowBuilder::new(app, ETIQUETA, WebviewUrl::App("index.html".into()))
        .title("Ibiza Club")
        .visible(false)
        .decorations(false)
        .skip_taskbar(true)
        .focused(false)
        .build()?;

    // Primero se mueve al otro monitor y después va a pantalla completa:
    // la pantalla completa ocupa el monitor donde está la ventana en ese momento
    ventana.set_position(*monitor.position())?;
    ventana.set_fullscreen(true)?;
    ventana.show()?;
    Ok(())
}

fn abrir_de_prueba(app: &AppHandle) -> tauri::Result<()> {
    WebviewWindowBuilder::new(app, ETIQUETA, WebviewUrl::App("index.html".into()))
        .title("Pantalla del cliente (prueba)")
        .inner_size(800.0, 450.0)
        .focused(false)
        .build()?;
    Ok(())
}
