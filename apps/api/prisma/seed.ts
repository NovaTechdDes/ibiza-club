// Seed 8: datos base de desarrollo (versión global, cajas y usuarios, catalgo, promos).
// Es IDEMPOTENTE: se puede correr varias veces sin duplicar filas.
// Uso: pnpm --filter @ibiza/api db:seed

import { Rol, PromocionInputSchema } from "@ibiza/shared";
import { prisma } from "../src/db/prisma.js";
import { hashearPin } from "../src/utils/pin.js";

// Toda la configuración sembrada nace en la versión 1.
// Cuando la API cambie configuración (paso 9) subirá este número.
const VERSION_INICIAL = 1;

// ---------------------------------------------------------------
// Datos de prueba
// ---------------------------------------------------------------


type PromoSeed = {
    nombre: string;
    tipo: 'NXM' | "PORCENTAJE" | "MONTO_FIJO";
    llevar?: number;
    pagar?: number;
    porcentaje?: number;
    monto?: number;
    dias: "VIERNES" | "SABADO" | "AMBOS"
    horaDesde?: string;
    horaHasta?: string;
    pausada?: boolean;
    productos: string[];
    categorias: string[];
    envases: string[];
};

const PROMOS: PromoSeed[] = [
    {
        nombre: "2x1 Vodka", tipo: "NXM", llevar: 2, pagar: 1, dias: "VIERNES", horaDesde: "00:00", horaHasta: "02:00",
        productos: ["Vodka con speed"], categorias: [], envases:["Vaso", "Tanque"]
    },
    {
        nombre: "Cervezas 20%", tipo: "PORCENTAJE", porcentaje: 20,
        dias: "AMBOS", productos: [], categorias: ["Cervezas"], envases: ["Tanque"]
    },
    {
        nombre: "Fernet $1000 off", tipo: "MONTO_FIJO", monto: 1000, 
        dias: "SABADO", pausada: true,
        productos: ["Fernet"], categorias: [], envases: ["Vaso"]
    }
];

const CAJAS = [
    { nombre: "Caja 1", barra: "Afuera" },
    { nombre: "Caja VIP", barra: "VIP" },
    { nombre: "Caja 2", barra: "Barra interior" },
];

// Los PINs son SOLO de desarrollo. En la base se guardan hasheados.
const USUARIOS: { nombre: string; rol: Rol; pin: string }[] = [
    { nombre: "Admin", rol: "ADMIN", pin: "1234" },
    { nombre: "Encargado", rol: "ENCARGADO", pin: "2345" },
    { nombre: "Cajero", rol: "CAJERO", pin: "3456" },
];

const ENVASES = [
    {nombre: "Vaso", orden: 1},
    { nombre: "Tanque", orden: 2}
];

const CATEGORIAS = [
    { nombre: "Tragos", orden: 1},
    { nombre: "Cervezas", orden: 2},
    { nombre: "Sin alcohol", orden: 3},
    { nombre: "Shots", orden: 4},
    { nombre: "Botellas", orden: 5}
]

const PRODUCTOS: { categoria: string; nombre: string; orden: number; precios: Record<string, number>}[] = [

    {categoria: 'Tragos', nombre: "Vodka con speed", orden: 1, 
        precios: {
            Vaso: 8000, Tanque: 14000
        }
    },
    { categoria: "Tragos", nombre: "Fernet", orden: 2, 
        precios: {
            Vaso: 6000, Tanque: 11000
        }
    },
    { categoria: 'Cervezas', nombre: "Cerveza rubia", orden: 1, 
        precios: {
            Tanque: 7000
        }
    },
    { categoria: 'Sin alcohol', nombre: "Gaseosa", orden: 1, 
        precios: {
            Vaso: 3000
        }
    },
    { categoria: 'Shots', nombre: "Shot tequila", orden: 1, 
        precios: {
            Vaso: 4000
        }
    },
    { categoria: "Botellas", nombre: 'Botella vodka', orden: 1,
        precios: {
            Vaso: 60000
        }
    }


]

// ---------------------------------------------------------------
// Bloques del seed
// ---------------------------------------------------------------

const obtenerId = (mapa: Map<string, number>, nombre: string): number => {
    const id = mapa.get(nombre);
    if(id === undefined) throw new Error(`No existe "${nombre}" en el seed`);
    return id
};

// La tabla VersionConfig tiene una única fila (id = 1) con la versión global,
// que la crea la migración en 0. Las filas del seed nacen con VERSION_INICIAL,
// así que la global tiene que quedar al menos en ese valor (si no, nunca bajan
// a las cajas). Solo sube: si ya hubo ediciones desde el panel, no la toca.
const sembrarVersion = async () => {
    await prisma.versionConfig.updateMany({
        where: { id: 1, actual: { lt: VERSION_INICIAL } },
        data: { actual: VERSION_INICIAL },
    });
    const { actual } = await prisma.versionConfig.findUniqueOrThrow({ where: { id: 1 } });
    console.log(`Versión global: ${actual}`);
};

// Caja.nombre es único, así que podemos usar upsert:
// si existe se actualiza, si no se crea.
const sembrarCajas = async () => {
    for (const caja of CAJAS) {
        await prisma.caja.upsert({
            where: { nombre: caja.nombre },
            create: { ...caja, version: VERSION_INICIAL },
            update: { barra: caja.barra },
        });
    }
    console.log(`Cajas: ${CAJAS.length}`);
};

// Usuario.nombre NO es único, así que no sirve upsert:
// buscamos por nombre y solo creamos si no existe.
// Si ya existe no tocamos el PIN (cada hash lleva un salt distinto
// y reescribirlo en cada corrida no aporta nada).
const sembrarUsuarios = async () => {
    for (const { nombre, rol, pin } of USUARIOS) {
        const existente = await prisma.usuario.findFirst({ where: { nombre } });
        if (existente) continue;

        await prisma.usuario.create({
            data: { nombre, rol, pinHash: hashearPin(pin), version: VERSION_INICIAL },
        });
    }
    console.log(`Usuarios: ${USUARIOS.length}`);
};

const sembrarEnvases = async () => {
    const ids = new Map<string, number>();
    for (const e of ENVASES){
        const envase = await prisma.envase.upsert({
            where: { nombre: e.nombre},
            create: {...e, version: VERSION_INICIAL},
            update: {}
        });

        ids.set(envase.nombre, envase.id)
    }
    console.log(`Envases: ${ENVASES.length}`);
    return ids;
};

const sembrarCategorias = async () => {
    const ids = new Map<string, number>();
    for (const c of CATEGORIAS){
        const categoria = await prisma.categoria.upsert({
            where: { nombre: c.nombre},
            create: {...c, version: VERSION_INICIAL},
            update: {}
        });

        ids.set(categoria.nombre, categoria.id);
    }

    console.log(`Categorias: ${CATEGORIAS.length}`);
    return ids
};

const sembrarPromos = async (productosIds: Map<string, number>, categoriaIds: Map<string, number>, envaseIds: Map<string, number>) => {
    for (const p of PROMOS){
        const existente = await prisma.promocion.findFirst({ where: {nombre: p.nombre}});
        if(existente) continue;

        const input = PromocionInputSchema.parse({
            ...p,
            productoIds: p.productos.map((n) => obtenerId(productosIds, n)),
            categoriaIds: p.categorias.map((n) => obtenerId(categoriaIds, n)),
            envaseIds: p.envases.map((n) => obtenerId(envaseIds, n))
        });

        await prisma.promocion.create({
            data: {
                nombre: input.nombre,
                tipo: input.tipo,
                llevar: input.llevar,
                pagar: input.pagar,
                porcentaje: input.porcentaje,
                monto: input.monto,
                dias: input.dias,
                horaDesde: input.horaDesde,
                horaHasta: input.horaHasta,
                pausada: input.pausada,
                version: VERSION_INICIAL,
                promocionAlcances: {
                    create: [
                        ...input.productoIds.map((productoId) => ({
                            productoId, version: VERSION_INICIAL
                        })),
                        ...input.categoriaIds.map((categoriaId) => ({
                            categoriaId, version: VERSION_INICIAL
                        })),
                    ],
                },
                promocionEnvases: {
                    create: input.envaseIds.map((envaseId) => ({envaseId, version: VERSION_INICIAL}))
                }   
            }
        });
    }
    console.log(`Promos: ${PROMOS.length}`)
}

const sembrarProductos = async(categoriaIds: Map<string, number>, envaseIds: Map<string, number>) => {
    const ids = new Map<string, number>();
    for(const p of PRODUCTOS){
        const categoriaId = obtenerId(categoriaIds, p.categoria);
        const producto = await prisma.producto.upsert({
            where: { categoriaId_nombre: {categoriaId, nombre: p.nombre}},
            create: { categoriaId, nombre: p.nombre, orden: p.orden, version: VERSION_INICIAL},
            update: {}
        });

        for (const [envase, precio] of Object.entries(p.precios)){
            const envaseId = obtenerId(envaseIds,  envase);
            await prisma.variante.upsert({
                where: {productoId_envaseId: {productoId: producto.id, envaseId}},
                create: { productoId: producto.id, envaseId, precio, version: VERSION_INICIAL},
                update: {}
            })
        }
        ids.set(producto.nombre, producto.id);
    }
    console.log(`Productos: ${PRODUCTOS.length}`)
    return ids;
};

// ---------------------------------------------------------------
// Ejecución
// ---------------------------------------------------------------

const main = async () => {
    await sembrarVersion();
    await sembrarCajas();
    await sembrarUsuarios();
    const envaseIds = await sembrarEnvases();
    const categoriaIds = await sembrarCategorias();
    const productosIds = await sembrarProductos(categoriaIds, envaseIds);
    await sembrarPromos(productosIds, categoriaIds, envaseIds)

    
};

main()
    .catch((error) => {
        console.error("Falló el seed:", error);
        process.exitCode = 1;
    })
    // Siempre cerramos la conexión; si no, el proceso queda colgado.
    .finally(() => prisma.$disconnect());
