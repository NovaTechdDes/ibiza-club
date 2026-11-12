import { Router } from "express";
import { cajaRouter } from "./modules/caja/caja.routes.js";
import { usuarioRouter } from "./modules/usuario/usuario.routes.js";
import { categoriaRouter } from "./modules/categoria/categoria.routes.js";
import { envaseRouter } from "./modules/envase/envase.routes.js";
import { productoRouter } from "./modules/producto/producto.routes.js";
import { varianteRouter } from "./modules/variante/variante.routes.js";
import { promocionRouter } from "./modules/promocion/promocion.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { requerirCaja } from "./middleware/requerir-caja.js";
import { syncRouter } from "./modules/sync/sync.routes.js";
import { reporteRouter } from "./modules/reporte/reporte.routes.js";
import { adminOEncargado, autenticar, soloAdmin } from "./middleware/autenticar.js";

export const apiRouter: Router = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/cajas', autenticar, soloAdmin, cajaRouter);
apiRouter.use('/usuarios', autenticar, soloAdmin, usuarioRouter);
apiRouter.use('/categorias', autenticar, categoriaRouter);
apiRouter.use('/envases', autenticar, envaseRouter);
apiRouter.use('/productos', autenticar, productoRouter);
apiRouter.use('/variantes', autenticar, varianteRouter);
apiRouter.use('/promociones', autenticar, adminOEncargado, promocionRouter);
apiRouter.use('/sync', requerirCaja, syncRouter);
apiRouter.use('/reportes', autenticar, soloAdmin, reporteRouter)