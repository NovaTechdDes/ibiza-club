import { Router } from "express";
import { requerirAdmin } from "./middleware/requerir-admin.js";
import { cajaRouter } from "./modules/caja/caja.routes.js";
import { categoriaRouter } from "./modules/categoria/categoria.routes.js";
import { envaseRouter } from "./modules/envase/envase.routes.js";
import { productoRouter } from "./modules/producto/producto.routes.js";
import { varianteRouter } from "./modules/variante/variante.routes.js";
import { promocionRouter } from "./modules/promocion/promocion.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { requerirCaja } from "./middleware/requerir-caja.js";
import { syncRouter } from "./modules/sync/sync.routes.js";
import { reporteRouter } from "./modules/reporte/reporte.routes.js";

export const apiRouter: Router = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/cajas', requerirAdmin, cajaRouter);
apiRouter.use('/categorias', requerirAdmin, categoriaRouter);
apiRouter.use('/envases', requerirAdmin, envaseRouter);
apiRouter.use('/productos', requerirAdmin, productoRouter);
apiRouter.use('/variantes', requerirAdmin, varianteRouter);
apiRouter.use('/promociones', requerirAdmin, promocionRouter);
apiRouter.use('/sync', requerirCaja, syncRouter);
apiRouter.use('/reportes', requerirAdmin, reporteRouter)