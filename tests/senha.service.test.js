
import test from "node:test";
import assert from "node:assert/strict";

import {
  gerarHashSenha,
  verificarSenha
} from "../src/services/senha.service.js";

test("gera um hash diferente da senha original", async () => {
  const senha = "MinhaSenha@123";

  const hash = await gerarHashSenha(senha);

  assert.notEqual(hash, senha);
  assert.ok(hash.startsWith("$2"));
});

test("aceita a senha correta", async () => {
  const senha = "MinhaSenha@123";
  const hash = await gerarHashSenha(senha);

  const resultado = await verificarSenha(senha, hash);

  assert.equal(resultado, true);
});

test("rejeita uma senha incorreta", async () => {
  const hash = await gerarHashSenha("MinhaSenha@123");

  const resultado = await verificarSenha(
    "SenhaErrada@123",
    hash
  );

  assert.equal(resultado, false);
});
