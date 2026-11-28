
import {
  criarLoginController,
  criarRegistroController
} from "../controllers/auth.controller.js";

// Configura as rotas de autenticação.
// Recebe o Router do Express e os serviços prontos.
export function configurarRotasAuth(
  router,
  { realizarLogin, registrar }
) {
  if (typeof router?.post !== "function") {
    throw new TypeError("Router inválido.");
  }

  if (
    typeof realizarLogin !== "function" ||
    typeof registrar !== "function"
  ) {
    throw new TypeError(
      "Serviços de autenticação não configurados."
    );
  }

  // Quando o router for montado em /auth:
  // POST /auth/registro
  router.post(
    "/registro",
    criarRegistroController(registrar)
  );

  // POST /auth/login
  router.post(
    "/login",
    criarLoginController(realizarLogin)
  );

  return router;
}
