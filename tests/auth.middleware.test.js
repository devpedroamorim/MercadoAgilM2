
import test, { after } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

import {
  autenticar,
  autorizarPapeis
} from "../src/middlewares/auth.middleware.js";

// Segredo fictício, utilizado somente nos testes.
const segredoTeste = "segredo-exclusivo-para-testes-do-mercadoagil";
const segredoOriginal = process.env.JWT_SECRET;

process.env.JWT_SECRET = segredoTeste;

after(() => {
  if (segredoOriginal === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = segredoOriginal;
  }
});

// Simula req, res e next do Express.
function executar(middleware, req = { headers: {} }) {
  let statusCode = 200;
  let resposta;
  let chamadasNext = 0;

  const res = {
    status(codigo) {
      statusCode = codigo;
      return this;
    },
    json(dados) {
      resposta = dados;
      return this;
    }
  };

  middleware(req, res, () => {
    chamadasNext++;
  });

  return { statusCode, resposta, chamadasNext, req };
}

function criarToken(papel = "cliente", opcoes = {}) {
  return jwt.sign(
    { papel },
    segredoTeste,
    {
      algorithm: "HS256",
      subject: "123",
      expiresIn: "1h",
      ...opcoes
    }
  );
}

test("rejeita requisição sem token", () => {
  const resultado = executar(autenticar);

  assert.equal(resultado.statusCode, 401);
  assert.equal(resultado.chamadasNext, 0);
});

test("aceita token válido de cliente", () => {
  const token = criarToken();

  const resultado = executar(autenticar, {
    headers: { authorization: `Bearer ${token}` }
  });

  assert.equal(resultado.chamadasNext, 1);
  assert.deepEqual(resultado.req.usuario, {
    id: "123",
    papel: "cliente"
  });
});

test("rejeita token com assinatura inválida", () => {
  const token = jwt.sign(
    { papel: "cliente" },
    "outro-segredo",
    { subject: "123" }
  );

  const resultado = executar(autenticar, {
    headers: { authorization: `Bearer ${token}` }
  });

  assert.equal(resultado.statusCode, 401);
});

test("rejeita token expirado", () => {
  const token = criarToken("cliente", { expiresIn: -10 });

  const resultado = executar(autenticar, {
    headers: { authorization: `Bearer ${token}` }
  });

  assert.equal(resultado.statusCode, 401);
});

test("rejeita token malformado", () => {
  const resultado = executar(autenticar, {
    headers: { authorization: "Bearer token-invalido" }
  });

  assert.equal(resultado.statusCode, 401);
});

test("rejeita perfil desconhecido", () => {
  const token = criarToken("superusuario");

  const resultado = executar(autenticar, {
    headers: { authorization: `Bearer ${token}` }
  });

  assert.equal(resultado.statusCode, 401);
});

test("permite acesso ao perfil autorizado", () => {
  const middleware = autorizarPapeis("admin", "vendedor");

  const resultado = executar(middleware, {
    usuario: { id: "123", papel: "vendedor" }
  });

  assert.equal(resultado.chamadasNext, 1);
});

test("bloqueia perfil sem permissão", () => {
  const middleware = autorizarPapeis("admin");

  const resultado = executar(middleware, {
    usuario: { id: "123", papel: "cliente" }
  });

  assert.equal(resultado.statusCode, 403);
  assert.equal(resultado.chamadasNext, 0);
});

test("bloqueia autorização sem usuário autenticado", () => {
  const middleware = autorizarPapeis("admin");

  const resultado = executar(middleware);

  assert.equal(resultado.statusCode, 401);
});

test("identifica ausência de configuração JWT_SECRET", () => {
  delete process.env.JWT_SECRET;

  try {
    const resultado = executar(autenticar, {
      headers: { authorization: `Bearer ${criarToken()}` }
    });

    assert.equal(resultado.statusCode, 500);
  } finally {
    process.env.JWT_SECRET = segredoTeste;
  }
});
