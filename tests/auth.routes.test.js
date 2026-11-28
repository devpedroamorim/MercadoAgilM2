
import test from "node:test";
import assert from "node:assert/strict";

import {
  configurarRotasAuth
} from "../src/routes/auth.routes.js";

// Simula apenas o registro de rotas do Express.
function criarRouterSimulado() {
  const rotas = new Map();

  return {
    rotas,

    post(caminho, handler) {
      rotas.set(caminho, handler);
      return this;
    }
  };
}

function criarRespostaSimulada() {
  return {
    statusCode: null,
    body: null,

    status(codigo) {
      this.statusCode = codigo;
      return this;
    },

    json(dados) {
      this.body = dados;
      return this;
    }
  };
}

function criarAmbiente() {
  const router = criarRouterSimulado();

  configurarRotasAuth(router, {
    registrar: async (dados) => ({
      id: 1,
      email: dados.email,
      role: dados.papel
    }),

    realizarLogin: async () => ({
      token: "jwt-simulado",
      usuario: {
        id: 1,
        papel: "cliente"
      }
    })
  });

  return router;
}

// TESTE 1
test("registra as rotas de cadastro e login", () => {
  const router = criarAmbiente();

  assert.equal(router.rotas.size, 2);
  assert.equal(
    typeof router.rotas.get("/registro"),
    "function"
  );
  assert.equal(
    typeof router.rotas.get("/login"),
    "function"
  );
});

// TESTE 2
test("rota de cadastro retorna 201", async () => {
  const router = criarAmbiente();
  const res = criarRespostaSimulada();

  const controller = router.rotas.get("/registro");

  await controller({
    body: {
      role: "cliente",
      email: "cliente@exemplo.com",
      password: "SenhaTeste123",
      name: "Cliente Teste",
      cpf: "52998224725",
      state: "SP"
    }
  }, res, (erro) => {
    throw erro;
  });

  assert.equal(res.statusCode, 201);

  assert.deepEqual(res.body, {
    id: 1,
    email: "cliente@exemplo.com",
    role: "cliente"
  });
});

// TESTE 3
test("rota de login retorna somente o token", async () => {
  const router = criarAmbiente();
  const res = criarRespostaSimulada();

  const controller = router.rotas.get("/login");

  await controller({
    body: {
      email: "cliente@exemplo.com",
      password: "SenhaTeste123"
    }
  }, res, (erro) => {
    throw erro;
  });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    token: "jwt-simulado"
  });
});

// TESTE 4
test("rota de cadastro bloqueia admin público", async () => {
  const router = criarAmbiente();
  const res = criarRespostaSimulada();

  const controller = router.rotas.get("/registro");

  await controller({
    body: {
      role: "admin",
      email: "admin@exemplo.com",
      password: "SenhaTeste123"
    }
  }, res, (erro) => {
    throw erro;
  });

  assert.equal(res.statusCode, 400);
  assert.ok(Array.isArray(res.body.erros));
});
