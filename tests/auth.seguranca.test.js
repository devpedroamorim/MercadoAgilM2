
import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

import {
  autenticar
} from "../src/middlewares/auth.middleware.js";

const SEGREDO_TESTE =
  "segredo-exclusivo-para-testes-de-seguranca";

function testarToken(payload) {
  const segredoAnterior = process.env.JWT_SECRET;
  process.env.JWT_SECRET = SEGREDO_TESTE;

  try {
    const token = jwt.sign(payload, SEGREDO_TESTE, {
      algorithm: "HS256"
    });

    let proximoChamado = false;

    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };

    const res = {
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

    autenticar(req, res, () => {
      proximoChamado = true;
    });

    return {
      res,
      proximoChamado
    };
  } finally {
    if (segredoAnterior === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = segredoAnterior;
    }
  }
}

test("rejeita JWT sem expiração", () => {
  const resultado = testarToken({
    sub: "1",
    papel: "cliente"
  });

  assert.equal(resultado.res.statusCode, 401);
  assert.equal(resultado.proximoChamado, false);
});

test("rejeita JWT com identificador vazio", () => {
  const resultado = testarToken({
    sub: " ",
    papel: "cliente",
    exp: Math.floor(Date.now() / 1000) + 3600
  });

  assert.equal(resultado.res.statusCode, 401);
  assert.equal(resultado.proximoChamado, false);
});
