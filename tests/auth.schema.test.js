
import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema } from "../src/schemas/auth.schema.js";

test("Aceita dados válidos de login", () => {
  const resultado = loginSchema.safeParse({
    email: "cliente@exemplo.com",
    senha: "SenhaTeste123"
  });

  assert.equal(resultado.success, true);
});

test("Rejeita e-mail inválido", () => {
  const resultado = loginSchema.safeParse({
    email: "email-invalido",
    senha: "SenhaTeste123"
  });

  assert.equal(resultado.success, false);
});

test("Rejeita senha vazia", () => {
  const resultado = loginSchema.safeParse({
    email: "cliente@exemplo.com",
    senha: ""
  });

  assert.equal(resultado.success, false);
});
