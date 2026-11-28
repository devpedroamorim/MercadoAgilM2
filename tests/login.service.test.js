
import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

import { gerarHashSenha } from "../src/services/senha.service.js";
import { criarServicoLogin } from "../src/services/login.service.js";

const segredoOriginal = process.env.JWT_SECRET;
const segredoTeste = "segredo-local-exclusivo-para-testes";

process.env.JWT_SECRET = segredoTeste;

function criarLoginComUsuario(usuario) {
  return criarServicoLogin({
    buscarPorEmail: async (email) =>
      usuario?.email === email ? usuario : null
  });
}

test("realiza login de cliente com credenciais válidas", async () => {
  const usuario = {
    id: 10,
    email: "cliente@exemplo.com",
    password_hash: await gerarHashSenha("SenhaTeste123"),
    role: "cliente"
  };

  const realizarLogin = criarLoginComUsuario(usuario);

  const resultado = await realizarLogin({
    email: " CLIENTE@EXEMPLO.COM ",
    senha: "SenhaTeste123"
  });

  const dados = jwt.verify(resultado.token, segredoTeste);

  assert.equal(dados.sub, "10");
  assert.equal(dados.papel, "cliente");
  assert.equal(resultado.usuario.email, usuario.email);
  assert.equal(resultado.usuario.password_hash, undefined);
});

test("realiza login de vendedor", async () => {
  const usuario = {
    id: 20,
    email: "vendedor@exemplo.com",
    password_hash: await gerarHashSenha("SenhaTeste123"),
    role: "vendedor"
  };

  const realizarLogin = criarLoginComUsuario(usuario);

  const resultado = await realizarLogin({
    email: usuario.email,
    senha: "SenhaTeste123"
  });

  assert.equal(resultado.usuario.papel, "vendedor");
  assert.equal(typeof resultado.token, "string");
});

test("rejeita senha incorreta com status 401", async () => {
  const usuario = {
    id: 10,
    email: "cliente@exemplo.com",
    password_hash: await gerarHashSenha("SenhaCorreta123"),
    role: "cliente"
  };

  const realizarLogin = criarLoginComUsuario(usuario);

  await assert.rejects(
    realizarLogin({
      email: usuario.email,
      senha: "SenhaErrada123"
    }),
    { status: 401, message: "E-mail ou senha inválidos." }
  );
});

test("rejeita usuário inexistente sem revelar o motivo", async () => {
  const realizarLogin = criarLoginComUsuario(null);

  await assert.rejects(
    realizarLogin({
      email: "naoexiste@exemplo.com",
      senha: "SenhaTeste123"
    }),
    { status: 401, message: "E-mail ou senha inválidos." }
  );
});

test("rejeita e-mail inválido com status 400", async () => {
  const realizarLogin = criarLoginComUsuario(null);

  await assert.rejects(
    realizarLogin({
      email: "email-invalido",
      senha: "SenhaTeste123"
    }),
    { status: 400, message: "Dados de login inválidos." }
  );
});

test.after(() => {
  if (segredoOriginal === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = segredoOriginal;
  }
});