use serde::Deserialize;
use serde_json::Value;
use sqlx::{Sqlite, query::Query, sqlite::SqliteArguments};
use tauri::State;
use tauri_plugin_sql::{DbInstances, DbPool};

use crate::BASE;

#[derive(Deserialize)]
pub struct Sentencia {
    sql: String,
    #[serde(default)]
    valores: Vec<Value>,
}

type Consulta<'q> = Query<'q, Sqlite, SqliteArguments<'q>>;

fn vincular(consulta: Consulta<'_>, valor: Value) -> Consulta<'_> {
    match valor {
        Value::Null => consulta.bind(None::<i64>),
        Value::Bool(b) => consulta.bind(b as i64),
        Value::Number(n) => match n.as_i64() {
            Some(entero) => consulta.bind(entero),
            None => consulta.bind(n.as_f64()),
        },
        Value::String(s) => consulta.bind(s),
        otro => consulta.bind(otro.to_string()),
    }
}

// Todas las sentencias corren en una sola conexión: o se guardan todas o ninguna
#[tauri::command]
pub async fn transaccion(
    instancias: State<'_, DbInstances>,
    sentencias: Vec<Sentencia>,
) -> Result<(), String> {
    let instancias = instancias.0.read().await;
    let Some(DbPool::Sqlite(pool)) = instancias.get(BASE) else {
        return Err(format!("La base {BASE} no está cargada"));
    };

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    for sentencia in &sentencias {
        let consulta = sentencia
            .valores
            .iter()
            .cloned()
            .fold(sqlx::query(&sentencia.sql), vincular);
        consulta
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    // Si algo falló antes, el ? sale de la función y tx hace rollback al destruirse
    tx.commit().await.map_err(|e| e.to_string())
}
