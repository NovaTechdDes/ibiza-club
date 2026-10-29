import { Router } from "express";
import { cajaRouter } from "./modules/caja/caja.routes.js";
import { categoriaRouter } from "./modules/categoria/categoria.routes.js";
import { envaseRouter } from "./modules/envase/envase.routes.js";
import { productoRouter } from "./modules/producto/producto.routes.js";
import { varianteRouter } from "./modules/variante/variante.routes.js";
import { promocionRouter } from "./modules/promocion/promocion.routes.js";

export const apiRouter: Router = Router();

apiRouter.use('/cajas', cajaRouter);
apiRouter.use('/categorias', categoriaRouter);
apiRouter.use('/envases', envaseRouter);
apiRouter.use('/productos', productoRouter);
apiRouter.use('/variantes', varianteRouter);
apiRouter.use('/promociones', promocionRouter);