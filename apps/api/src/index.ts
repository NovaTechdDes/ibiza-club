import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

// En Express 5 este callback también se ejecuta si falla el arranque (ej: puerto ocupado)
app.listen(env.PORT, (error?: Error) => {
    if (error) {
        logger.fatal({ err: error }, "No se pudo iniciar la API");
        process.exit(1);
    }

    logger.info({ port: env.PORT }, "API escuchando");
});
