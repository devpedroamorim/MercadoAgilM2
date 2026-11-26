
import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

import { gerarTokenAcesso } from "../src/services/token.service.js";

import {
  autenticar,
  autorizarPapeis
} from "../src/middlewares/auth.middleware.js";

// Configuração de segurança utilizada somente nos testes.
const segredoOriginal = process.env.JWT_SECRET;
const segredoTeste = "segredo-exclusivo-para-testes-do-mercadoagil";

process.env.JWT_SECRET = segredoTeste;

// TESTE 1 — Verifica se o JWT é gerado corretamente.
test("gera um token JWT válido", () => {
  const token = gerarTokenAcesso({
    id: 15,
    papel: "cliente"
  });

  const dados = jwt.verify(token, segredoTeste, {
    algorithms: ["HS256"]
  });

  assert.equal(dados.sub, "15");
  assert.equal(dados.papel, "cliente");
  assert.equal(dados.exp - dados.iat, 3600);
});

// TESTE 2 — Garante que a senha não seja incluída no JWT.
test("não inclui a senha no token", () => {
  const token = gerarTokenAcesso({
    id: 15,
    papel: "cliente",
    senha: "SenhaSuperSecreta123"
  });

  const dados = jwt.verify(token, segredoTeste, {
    algorithms: ["HS256"]
  });

  assert.equal(dados.senha, undefined);
});

// TESTE 3 — Bloqueia perfis desconhecidos.
test("rejeita usuário com perfil inválido", () => {
  assert.throws(() => {
    gerarTokenAcesso({
      id: 15,
      papel: "superusuario"
    });
  }, /Dados inválidos/);
});

// TESTE 4 — Impede geração sem configuração de segurança.
test("rejeita geração sem JWT_SECRET", () => {
  delete process.env.JWT_SECRET;

  try {
    assert.throws(() => {
      gerarTokenAcesso({
        id: 15,
        papel: "cliente"
      });
    }, /JWT_SECRET não configurado/);
  } finally {
    process.env.JWT_SECRET = segredoTeste;
  }
});

// TESTE 5 — Integra geração do JWT e middlewares.
test("token gerado é aceito pelo middleware e respeita permissões", () => {
  // Gera um token de vendedor.
  const token = gerarTokenAcesso({
    id: 15,
    papel: "vendedor"
  });

  // Simula uma requisição HTTP.
  const req = {
    headers: {
      authorization: `Bearer ${token}`
    }
  };

  let codigoResposta = 200;

  // Simula o objeto de resposta do Express.
  const res = {
    status(codigo) {
      codigoResposta = codigo;
      return this;
    },
    json() {
      return this;
    }
  };

  // Etapa 1: verifica o token.
  let autenticado = false;

  autenticar(req, res, () => {
    autenticado = true;
  });

  assert.equal(autenticado, true);

  assert.deepEqual(req.usuario, {
    id: "15",
    papel: "vendedor"
  });

  // Etapa 2: permite acesso ao perfil vendedor.
  let autorizado = false;

  autorizarPapeis("vendedor")(req, res, () => {
    autorizado = true;
  });

  assert.equal(autorizado, true);

  // Etapa 3: bloqueia o acesso ao perfil administrador.
  let acessoAdmin = false;

  autorizarPapeis("admin")(req, res, () => {
    acessoAdmin = true;
  });

  assert.equal(acessoAdmin, false);
  assert.equal(codigoResposta, 403);
});

// Restaura a configuração original após os testes.
test.after(() => {
  if (segredoOriginal === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = segredoOriginal;
  }
});
