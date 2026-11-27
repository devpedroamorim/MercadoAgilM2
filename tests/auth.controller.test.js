
import test from "node:test";
import assert from "node:assert/strict";

import {
  criarLoginController,
  adaptarCadastro
} from "../src/controllers/auth.controller.js";

import {
  ErroLogin,
  criarServicoLogin
} from "../src/services/login.service.js";

import { registroSchema } from "../src/schemas/auth.schema.js";

// Simula a resposta HTTP do Express.
function criarResposta() {
  return {
    statusCode: 200,
    dados: null,

    status(codigo) {
      this.statusCode = codigo;
      return this;
    },

    json(dados) {
      this.dados = dados;
      return this;
    }
  };
}

test("retorna somente o token com HTTP 200", async () => {
  const controller = criarLoginController(async (dados) => {
    assert.deepEqual(dados, {
      email: "cliente@email.com",
      senha: "Senha123!"
    });

    return {
      token: "jwt-de-teste",
      usuario: {
        id: 1,
        email: "cliente@email.com",
        papel: "cliente"
      }
    };
  });

  const req = {
    body: {
      email: "cliente@email.com",
      password: "Senha123!"
    }
  };

  const res = criarResposta();

  await controller(req, res, (erro) => {
    throw erro;
  });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.dados, {
    token: "jwt-de-teste"
  });
});

test("rejeita o campo senha no lugar de password", async () => {
  const controller = criarLoginController(async () => {
    throw new Error("O serviço não deveria ser chamado.");
  });

  const res = criarResposta();

  await controller({
    body: {
      email: "cliente@email.com",
      senha: "Senha123!"
    }
  }, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.ok(Array.isArray(res.dados.erros));
});

test("retorna HTTP 401 para credenciais incorretas", async () => {
  const controller = criarLoginController(async () => {
    throw new ErroLogin(
      "E-mail ou senha inválidos.",
      401
    );
  });

  const res = criarResposta();

  await controller({
    body: {
      email: "cliente@email.com",
      password: "SenhaErrada123"
    }
  }, res, () => {});

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.dados, {
    erros: ["E-mail ou senha inválidos."]
  });
});

test("retorna HTTP 400 para e-mail inválido", async () => {
  const realizarLogin = criarServicoLogin({
    buscarPorEmail: async () => null
  });

  const controller = criarLoginController(realizarLogin);
  const res = criarResposta();

  await controller({
    body: {
      email: "email-invalido",
      password: "Senha123!"
    }
  }, res, (erro) => {
    throw erro;
  });

  assert.equal(res.statusCode, 400);
  assert.ok(Array.isArray(res.dados.erros));
});

test("encaminha erros inesperados ao Express", async () => {
  const falhaBanco = new Error("Banco indisponível");

  const controller = criarLoginController(async () => {
    throw falhaBanco;
  });

  const res = criarResposta();
  let erroRecebido;

  await controller({
    body: {
      email: "cliente@email.com",
      password: "Senha123!"
    }
  }, res, (erro) => {
    erroRecebido = erro;
  });

  assert.equal(erroRecebido, falhaBanco);
});

test("adapta o cadastro de cliente para o schema interno", () => {
  const dados = adaptarCadastro({
    email: "cliente@email.com",
    password: "Senha123!",
    role: "cliente",
    name: "Maria",
    cpf: "52998224725",
    state: "BA"
  });

  assert.equal(dados.senha, "Senha123!");
  assert.equal(dados.papel, "cliente");
  assert.equal(dados.nome, "Maria");
  assert.equal(dados.uf, "BA");

  assert.equal(registroSchema.safeParse(dados).success, true);
});

test("adapta o cadastro de vendedor para o schema interno", () => {
  const dados = adaptarCadastro({
    email: "loja@email.com",
    password: "Senha123!",
    role: "vendedor",
    store_name: "TechBahia",
    cnpj: "11222333000181"
  });

  assert.equal(dados.papel, "vendedor");
  assert.equal(dados.nomeLoja, "TechBahia");

  assert.equal(registroSchema.safeParse(dados).success, true);
});
