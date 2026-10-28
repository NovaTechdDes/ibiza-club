import { Router } from "express";
import { cajaRouter } from "./modules/caja/caja.routes.js";

export const apiRouter: Router = Router();

apiRouter.use('/cajas', cajaRouter);