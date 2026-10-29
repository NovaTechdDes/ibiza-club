import { prisma } from "../../db/prisma.js"
import { Prisma} from "../../generated/prisma/client.js"

type Tx = Prisma.TransactionClient;

export const escribirCatalogo = async <T>(usuarioId: number, accion: string, detalle: object, operacion: (tx: Tx, version: number)  => Promise<T>): Promise<T> => {
    return prisma.$transaction(async (tx) => {
        const nuevaVersion = await tx.versionConfig.update({ 
            where: { id: 1}, data: { actual: { increment: 1}}
        })
        const resultado = await operacion(tx, nuevaVersion.actual);

        await tx.auditoriaPanel.create({ data: { usuarioId, accion, detalle: JSON.stringify(detalle)}})


        return resultado
    })
    
}
