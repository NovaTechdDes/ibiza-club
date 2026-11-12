import { Router } from "express";
import { AccesoPanelInputSchema, UsuarioInputSchema, UsuarioPinSchema, UsuarioUpdateSchema } from "@ibiza/shared";
import { asignarAccesoPanel, quitarAccesoPanel, actualizarUsuario, cambiarEstadoUsuario, cambiarPinUsuario, crearUsuario, listarUsuarios, obtenerUsuario } from "./usuario.service.js";
import { validar } from "../../middleware/validar.js";
import { IdParamSchema } from "../comun/id-param.js";

// Todo el router es solo Admin: routes.ts lo monta con autenticar + soloAdmin.
export const usuarioRouter: Router = Router();

usuarioRouter.get('/', async(_req, res) => {
    res.json(await listarUsuarios())
});

usuarioRouter.get('/:id', validar({params: IdParamSchema}), async(req, res) => {
    res.json(await obtenerUsuario(Number(req.params.id)))
});

usuarioRouter.post('/', validar({body: UsuarioInputSchema}), async(req, res) => {
    res.status(201).json(await crearUsuario(req.usuarioId!, req.body))
});

usuarioRouter.patch('/:id', validar({params: IdParamSchema, body: UsuarioUpdateSchema}), async(req, res) => {
    res.json(await actualizarUsuario(req.usuarioId!, Number(req.params.id), req.body))
});

usuarioRouter.put('/:id/pin', validar({params: IdParamSchema, body: UsuarioPinSchema}), async(req, res) => {
    res.json(await cambiarPinUsuario(req.usuarioId!, Number(req.params.id), req.body.pin))
});

usuarioRouter.put('/:id/acceso', validar({params: IdParamSchema, body: AccesoPanelInputSchema}), async(req, res) => {
    res.json(await asignarAccesoPanel(req.usuarioId!, Number(req.params.id), req.body))
});
usuarioRouter.delete('/:id/acceso', validar({params: IdParamSchema}), async(req, res) => {
    res.json(await quitarAccesoPanel(req.usuarioId!, Number(req.params.id)))
});

usuarioRouter.post('/:id/baja', validar({params: IdParamSchema}), async(req, res) => {
    res.json(await cambiarEstadoUsuario(req.usuarioId!, Number(req.params.id), false))
});
usuarioRouter.post('/:id/alta', validar({params: IdParamSchema}), async(req, res) => {
    res.json(await cambiarEstadoUsuario(req.usuarioId!, Number(req.params.id), true))
});
