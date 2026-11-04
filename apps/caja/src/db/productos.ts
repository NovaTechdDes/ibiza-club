import { obtenerDb } from "./conexion";

export type VarianteVenta = {
    id: number;
    envaseId: number;
    envaseNombre: string;
    precio: number;
};

export type ProductoVenta = {
    id: number;
    categoriaId: number;
    nombre: string;
    variantes: VarianteVenta[]
};

export type CategoriaVenta = {
    id: number;
    nombre: string;
    productos: ProductoVenta[]
};

type Fila = {
    categoriaId: number;
    categoriaNombre: string;
    productoId: number;
    productoNombre: string;
    varianteId: number;
    envaseId: number;
    envaseNombre: string;
    precio:number;
};

export const leerCategoriasVenta = async (): Promise<CategoriaVenta[]> => {
    const db = await obtenerDb();
    const filas = await db.select<Fila[]>(
        `SELECT c.id AS categoriaId, c.nombre AS categoriaNombre,
                p.id AS productoId, p.nombre AS productoNombre,
                v.id AS varianteId, v.precio,
                e.id AS envaseId, e.nombre AS envaseNombre
         FROM Variante v
         JOIN Producto p ON p.id = v.productoId AND p.activo = 1
         JOIN Categoria c ON c.id = p.categoriaId AND c.activo = 1
         JOIN Envase e ON e.id = v.envaseId AND e.activo = 1
         WHERE v.activo = 1
         ORDER BY c.orden, c.id, p.orden, p.id, e.orden, e.id
        `
    );

    const categorias = new Map<number, CategoriaVenta>();
    const productos = new Map<number, ProductoVenta>();

    for(const fila of filas){
        let categoria = categorias.get(fila.categoriaId);
        if(!categoria){
            categoria = {id: fila.categoriaId, nombre: fila.categoriaNombre, productos: []};
            categorias.set(categoria.id, categoria)
        }

        let producto = productos.get(fila.productoId);
        if(!producto){
            producto = {
                id: fila.productoId,
                categoriaId: fila.categoriaId,
                nombre: fila.productoNombre,
                variantes: []
            };
            productos.set(producto.id, producto);
            categoria.productos.push(producto);
        }

        producto.variantes.push({
            id: fila.varianteId,
            envaseId: fila.envaseId,
            envaseNombre: fila.envaseNombre,
            precio: fila.precio
        });
    }
    return [...categorias.values()]


}