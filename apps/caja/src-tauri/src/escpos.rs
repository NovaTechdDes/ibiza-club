// Comandos ESC/POS: son bytes que la impresora interpreta en vez de imprimir
pub const INICIAR: &[u8] = &[0x1B, 0x40]; // ESC @
pub const TABLA_CP850: &[u8] = &[0x1B, 0x74, 2]; // ESC t 2
pub const CENTRADO: &[u8] = &[0x1B, 0x61, 1]; // ESC a 1
pub const IZQUIERDA: &[u8] = &[0x1B, 0x61, 0]; // ESC a 0
pub const TEXTO_GRANDE: &[u8] = &[0x1D, 0x21, 0x33]; // GS ! : 4 de ancho x 4 de alto
pub const TEXTO_ALTO: &[u8] = &[0x1D, 0x21, 0x01]; // GS ! : ancho normal x 2 de alto
pub const TEXTO_NORMAL: &[u8] = &[0x1D, 0x21, 0x00]; // GS !
pub const NEGRITA_SI: &[u8] = &[0x1B, 0x45, 1]; // ESC E 1
pub const NEGRITA_NO: &[u8] = &[0x1B, 0x45, 0]; // ESC E 0
pub const AVANZAR_Y_CORTAR: &[u8] = &[0x1D, 0x56, 0x42, 3]; // GS V 66 3

// La impresora no entiende UTF-8: cada caracter se traduce a su byte en CP850
pub fn a_cp850(texto: &str) -> Vec<u8> {
    texto
        .chars()
        .map(|letra| match letra {
            'á' => 0xA0,
            'é' => 0x82,
            'í' => 0xA1,
            'ó' => 0xA2,
            'ú' => 0xA3,
            'ü' => 0x81,
            'ñ' => 0xA4,
            'Á' => 0xB5,
            'É' => 0x90,
            'Í' => 0xD6,
            'Ó' => 0xE0,
            'Ú' => 0xE9,
            'Ü' => 0x9A,
            'Ñ' => 0xA5,
            '¿' => 0xA8,
            '¡' => 0xAD,
            '·' => 0xFA,
            _ if letra.is_ascii() => letra as u8,
            _ => b'?',
        })
        .collect()
}
