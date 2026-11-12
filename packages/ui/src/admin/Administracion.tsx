import { ProveedorApiAdmin } from "./api";
import { Marco } from "./Marco";
import { PantallaLogin } from "./PantallaLogin";
import { useSesionAdmin } from "./sesion";
import { useEnLinea } from "./useEnLinea";

type Props = {
    // URL base de la API, sin /api. El escritorio la saca de la vinculación; el panel web, de su configuración.
    apiUrl: string;
    // Solo en el escritorio: vuelve a la pantalla de venta. Siempre cierra la sesión antes.
    onVolver?: () => void;
};

function Contenido({ onVolver }: Pick<Props, "onVolver">) {
    const usuario = useSesionAdmin((estado) => estado.usuario);
    const token = useSesionAdmin((estado) => estado.token);
    const salir = useSesionAdmin((estado) => estado.salir);
    const enLinea = useEnLinea();

    // Volver a la venta nunca deja la administración abierta en la PC de la barra.
    const volver = onVolver
        ? () => {
              salir();
              onVolver();
          }
        : undefined;

    if (!usuario || !token) return <PantallaLogin enLinea={enLinea} onVolver={volver} />;

    return <Marco usuario={usuario} enLinea={enLinea} onVolver={volver} />;
}

// Punto de entrada de la administración. Lo montan las dos apps (escritorio y panel web),
// dentro de un QueryClientProvider.
export function Administracion({ apiUrl, onVolver }: Props) {
    return (
        <ProveedorApiAdmin apiUrl={apiUrl}>
            <Contenido onVolver={onVolver} />
        </ProveedorApiAdmin>
    );
}
