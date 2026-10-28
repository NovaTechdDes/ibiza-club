import z from "zod"
import { LARGO_NOMBRE_CORTO } from "../constantes.js";
import { TIPOS_PROMOCION } from "../tipo-promocion.js";
import { DIAS_PROMOCION } from "../dias-promocion.js";

export const PromocionBaseSchema = z.object({
    nombre: z.string().trim().min(1).max(LARGO_NOMBRE_CORTO),
    tipo: z.enum(TIPOS_PROMOCION),
    llevar: z.number().int().positive().optional(),
    pagar: z.number().int().positive().optional(),
    porcentaje: z.number().int().min(1).max(100).optional(),
    monto: z.number().int().positive().optional(),
    dias: z.enum(DIAS_PROMOCION),
    horaDesde: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
    horaHasta: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
    pausada: z.boolean().default(false),

    productoIds: z.array(z.number().int().positive()).default([]),
    categoriaIds: z.array(z.number().int().positive()).default([]),
    envaseIds: z.array(z.number().int().positive()).default([])
})

export const PromocionInputSchema = PromocionBaseSchema.superRefine((d, ctx) => {
   if(d.tipo === "NXM"){
    if(d.llevar === undefined){
        ctx.addIssue({code: "custom", path: ["llevar"], message: "Falta llevar"})
    }
    if(d.pagar === undefined){
        ctx.addIssue({ code: 'custom', path: ["pagar"], message: "Falta pagar"})
    }
    if(d.llevar !== undefined && d.pagar !== undefined && d.pagar >= d.llevar){
        ctx.addIssue({ code: "custom", path: ["pagar"], message: "Pagar debe ser menor que llevar"})
    }
   }else if(d.tipo === 'PORCENTAJE'){
    if(d.porcentaje === undefined){
        ctx.addIssue({ code: 'custom', path: ["porcentaje"], message: "Falta el porcentaje"})
    }
   }else if(d.tipo === 'MONTO_FIJO'){
    if(d.monto === undefined){
        ctx.addIssue({ code: 'custom', path: ["monto"], message: "Falta el monto"})
    }
   }
   // Campos que no corresponden al tipo elegido
   const sobrantes = {
    NXM: ["porcentaje", "monto"],
    PORCENTAJE: ["llevar", "pagar", "monto"],
    MONTO_FIJO: ["llevar", "pagar", "porcentaje"],
   } as const;
   for(const campo of sobrantes[d.tipo]){
    if(d[campo] !== undefined){
        ctx.addIssue({ code: 'custom', path: [campo], message: `${campo} no corresponde al tipo ${d.tipo}`})
    }
   }

   if(!!d.horaDesde !== !!d.horaHasta){
    ctx.addIssue({ code: 'custom', path: ["horaHasta"], message: "Falta la hora Hasta"})
   }

   if(d.productoIds.length === 0 && d.categoriaIds.length === 0){
    ctx.addIssue({code: "custom", path: ["productoIds"],message: "Elegi al menos un producto o categoria"})
   }

   if(d.envaseIds.length === 0 ){
    ctx.addIssue({code: "custom", path: ["envaseIds"],message: "Elegi al menos un envase"})
   }
});

export const PromocionSchema = PromocionBaseSchema
.omit({ productoIds: true, categoriaIds: true, envaseIds: true})
.extend({
    id: z.number().int().positive(),
    activo: z.boolean(),
    version: z.number().int().min(0)
});

export type PromocionInput = z.infer<typeof PromocionInputSchema>
export type Promocion = z.infer<typeof PromocionSchema>