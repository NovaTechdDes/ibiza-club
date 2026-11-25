import { type FormEvent, useState } from "react";
import {
  type Categoria,
  DIAS_SEMANA,
  type Envase,
  NOMBRE_DIA,
  type Producto,
  type PromocionInput,
  type TipoPromocion,
} from "@ibiza/shared";
import { Boton } from "../../componentes/Boton";
import { CampoSelect } from "../../componentes/CampoSelect";
import { CampoTexto } from "../../componentes/CampoTexto";
import { Interruptores } from "../../componentes/Interruptores";
import { Pestanas } from "../../componentes/Pestanas";
import catalogo from "../catalogo/Catalogo.module.css";
import estilos from "./FormularioPromocion.module.css";
import { type FormularioPromo, validarPromo } from "./formularioPromo";

const TIPOS: { id: TipoPromocion; titulo: string }[] = [
  { id: "NXM", titulo: "2x1 / NxM" },
  { id: "PORCENTAJE", titulo: "Porcentaje" },
  { id: "MONTO_FIJO", titulo: "Monto fijo" },
];

const OPCIONES_DIAS = DIAS_SEMANA.map((d) => ({ id: d, texto: NOMBRE_DIA[d] }));

// Pestanas solo acepta ids de texto: el booleano todaLaNoche se pasa a "toda" / "horario".
const HORARIO = [
  { id: "toda", titulo: "Toda la noche" },
  { id: "horario", titulo: "Con horario" },
] as const;

// Cada 30 min, en el orden de la noche: 18:00 … 23:30, 00:00 … 10:00.
const HORAS = Array.from({ length: 33 }, (_, i) => {
  const minutos = (18 * 60 + i * 30) % (24 * 60);
  const hora = `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
  return { valor: hora, texto: hora };
});

type ConOrden = { id: number; nombre: string; orden: number; activo: boolean };

// Activos, más los dados de baja que la promo ya tiene (si no, no se podrían quitar).
const visibles = <T extends ConOrden>(lista: T[], elegidos: number[]) =>
  lista
    .filter((e) => e.activo || elegidos.includes(e.id))
    .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre));

const aOpciones = (lista: ConOrden[]) =>
  lista.map((e) => ({ id: e.id, texto: e.activo ? e.nombre : `${e.nombre} (baja)` }));

type Props = {
  inicial: FormularioPromo;
  categorias: Categoria[];
  productos: Producto[];
  envases: Envase[];
  titulo: string;
  guardando: boolean;
  onGuardar: (input: PromocionInput) => void;
  onCancelar: () => void;
};

export function FormularioPromocion({
  inicial,
  categorias,
  productos,
  envases,
  titulo,
  guardando,
  onGuardar,
  onCancelar,
}: Props) {
  const [form, setForm] = useState(inicial);
  const [original] = useState(inicial);
  const datos = validarPromo(form);

  const cambiar = <K extends keyof FormularioPromo>(campo: K, valor: FormularioPromo[K]) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  const cats = visibles(categorias.filter((c) => c.seccion !== "ENTRADA"), form.categoriaIds);
  const prods = visibles(productos, form.productoIds);
  const envs = visibles(envases, form.envaseIds);
  const categoriaDe = new Map(productos.map((p) => [p.id, p.categoriaId]));

  // Al prender una categoría se quitan sus productos sueltos: ya entran todos.
  const cambiarCategorias = (ids: number[]) =>
    setForm((f) => ({
      ...f,
      categoriaIds: ids,
      productoIds: f.productoIds.filter((id) => !ids.includes(categoriaDe.get(id) ?? 0)),
    }));

  // Cambia solo los productos de una categoría y deja los demás como estaban.
  const cambiarProductos = (categoriaId: number, ids: number[]) =>
    setForm((f) => ({
      ...f,
      productoIds: [...f.productoIds.filter((id) => categoriaDe.get(id) !== categoriaId), ...ids],
    }));

  // El schema no sabe que se eligió "Con horario": se controla acá antes de mirar sus errores.
  const faltaHorario = !form.todaLaNoche && (form.horaDesde === "" || form.horaHasta === "");
  const valido = datos.success && !faltaHorario;

  // setForm siempre crea un objeto nuevo: si sigue siendo el del montaje, todavía no se tocó nada.
  // Se compara con el estado inicial y no con la prop: al editar, `inicial` sale de desdePromo()
  // y es un objeto nuevo en cada render del padre.
  const tocado = form !== original;
  const problema = faltaHorario
    ? "Elegí la hora desde y hasta"
    : datos.success
      ? null
      : datos.error.issues[0]?.message;

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (valido) onGuardar(datos.data);
  }

  return (
    <form className={estilos.formulario} onSubmit={enviar}>
      <h2 className={catalogo.tituloGrupo}>{titulo}</h2>

      <CampoTexto
        etiqueta="Nombre"
        value={form.nombre}
        onChange={(e) => cambiar("nombre", e.target.value)}
      />

      <div className={catalogo.grupo}>
        <span className={catalogo.ayuda}>Tipo</span>
        <Pestanas pestanas={TIPOS} elegida={form.tipo} onElegir={(t) => cambiar("tipo", t)} />
      </div>

      <div className={estilos.fila}>
        {form.tipo === "NXM" && (
          <>
            <CampoTexto etiqueta="Llevar" type="number" inputMode="numeric" min={2}
              className={catalogo.campoCorto}
              value={form.llevar} onChange={(e) => cambiar("llevar", e.target.value)} />
            <CampoTexto etiqueta="Pagar" type="number" inputMode="numeric" min={1}
              className={catalogo.campoCorto}
              value={form.pagar} onChange={(e) => cambiar("pagar", e.target.value)} />
          </>
        )}
        {form.tipo === "PORCENTAJE" && (
          <CampoTexto etiqueta="Porcentaje (%)" type="number" inputMode="numeric" min={1} max={100}
            className={catalogo.campoCorto}
            value={form.porcentaje} onChange={(e) => cambiar("porcentaje", e.target.value)} />
        )}
        {form.tipo === "MONTO_FIJO" && (
          <CampoTexto etiqueta="Monto ($)" type="number" inputMode="numeric" min={1}
            className={catalogo.campoCorto}
            value={form.monto} onChange={(e) => cambiar("monto", e.target.value)} />
        )}
      </div>

      <div className={catalogo.grupo}>
        <span className={catalogo.ayuda}>Días</span>
        <Interruptores<number>
          etiqueta="Días"
          opciones={OPCIONES_DIAS}
          elegidos={form.dias}
          onCambiar={(dias) => cambiar("dias", dias)}
        />
      </div>

      <div className={catalogo.grupo}>
        <span className={catalogo.ayuda}>Horario</span>
        <Pestanas
          pestanas={HORARIO}
          elegida={form.todaLaNoche ? "toda" : "horario"}
          onElegir={(id) => cambiar("todaLaNoche", id === "toda")}
        />
        {!form.todaLaNoche && (
          <div className={estilos.fila}>
            <CampoSelect etiqueta="Desde" opciones={HORAS} placeholder="Elegí"
              value={form.horaDesde} onChange={(e) => cambiar("horaDesde", e.target.value)} />
            <CampoSelect etiqueta="Hasta" opciones={HORAS} placeholder="Elegí"
              value={form.horaHasta} onChange={(e) => cambiar("horaHasta", e.target.value)} />
          </div>
        )}
      </div>

      <div className={catalogo.grupo}>
        <span className={catalogo.ayuda}>Categorías enteras</span>
        <Interruptores<number>
          etiqueta="Categorías"
          opciones={aOpciones(cats)}
          elegidos={form.categoriaIds}
          onCambiar={cambiarCategorias}
        />
      </div>

      <div className={catalogo.grupo}>
        <span className={catalogo.ayuda}>Productos sueltos</span>
        {cats.map((cat) => {
          const deCat = prods.filter((p) => p.categoriaId === cat.id);
          if (deCat.length === 0) return null;
          return (
            <div key={cat.id} className={catalogo.grupo}>
              <span className={estilos.subtitulo}>{cat.nombre}</span>
              {form.categoriaIds.includes(cat.id) ? (
                <span className={catalogo.ayuda}>Entra toda la categoría</span>
              ) : (
                <Interruptores<number>
                  etiqueta={`Productos de ${cat.nombre}`}
                  opciones={aOpciones(deCat)}
                  elegidos={form.productoIds.filter((id) => categoriaDe.get(id) === cat.id)}
                  onCambiar={(ids) => cambiarProductos(cat.id, ids)}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className={catalogo.grupo}>
        <span className={catalogo.ayuda}>Envases</span>
        <Interruptores<number>
          etiqueta="Envases"
          opciones={aOpciones(envs)}
          elegidos={form.envaseIds}
          onCambiar={(ids) => cambiar("envaseIds", ids)}
        />
      </div>

      <p className={catalogo.error} role="alert">
        {tocado && problema}
      </p>

      <div className={estilos.fila}>
        <Boton type="submit" disabled={!valido || guardando}>
          {guardando ? "Guardando…" : "Guardar"}
        </Boton>
        <Boton variante="secundario" onClick={onCancelar}>
          Cancelar
        </Boton>
      </div>
    </form>
  );
}
