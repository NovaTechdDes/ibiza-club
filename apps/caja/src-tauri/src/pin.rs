use scrypt::{Params, scrypt};
use subtle::ConstantTimeEq;

// Los valores por defecto de scryptSync en Node: N = 2^14, r = 8, p = 1
const LOG_N: u8 = 14;
const R: u32 = 8;
const P: u32 = 1;

fn coincide(pin: &str, pin_hash: &str) -> bool {
    let Some((salt_hex, hash_hex)) = pin_hash.split_once(':') else {
        return false;
    };
    let (Ok(salt), Ok(esperado)) = (hex::decode(salt_hex), hex::decode(hash_hex)) else {
        return false;
    };
    let Ok(parametros) = Params::new(LOG_N, R, P) else {
        return false;
    };
    let mut calculado = vec![0u8; esperado.len()];
    if scrypt(pin.as_bytes(), &salt, &parametros, &mut calculado).is_err() {
        return false;
    }

    // Tarda lo mismo aunque difieran en el primer byte
    calculado.ct_eq(&esperado).into()
}

#[tauri::command(async)]
pub fn verificar_pin(pin: String, pin_hash: String) -> bool {
    coincide(&pin, &pin_hash)
}
