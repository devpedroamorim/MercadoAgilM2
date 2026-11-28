
import test from "node:test";
import assert from "node:assert/strict";

import { registroSchema } from "../src/schemas/auth.schema.js";

test("Permite cadastro de cliente válido", () => {
  const resultado = registroSchema.safeParse({
    papel: "cliente",
    nome: "Cliente Teste",
    email: "cliente@exemplo.com",
    cpf: "52998224725",
    uf: "SP",
    senha: "SenhaTeste123"
  });

  assert.equal(resultado.success, true);
});

test("Permite cadastro de vendedor válido", () => {
  const resultado = registroSchema.safeParse({
    papel: "vendedor",
    nomeLoja: "Loja Teste",
    email: "loja@exemplo.com",
    cnpj: "11222333000181",
    senha: "SenhaTeste123"
  });

  assert.equal(resultado.success, true);
});

test("Impede cadastro público de administrador", () => {
  const resultado = registroSchema.safeParse({
    papel: "admin",
    email: "admin@exemplo.com",
    senha: "SenhaTeste123"
  });

  assert.equal(resultado.success, false);
});

test("Rejeita senha muito curta", () => {
  const resultado = registroSchema.safeParse({
    papel: "cliente",
    nome: "Cliente Teste",
    email: "cliente@exemplo.com",
    cpf: "52998224725",
    uf: "SP",
    senha: "123"
  });

  assert.equal(resultado.success, false);
});

test("Rejeita senha com mais de 72 bytes", () => {
  const resultado = registroSchema.safeParse({
    papel: "cliente",
    nome: "Cliente Teste",
    email: "teste@email.com",
    cpf: "52998224725",
    uf: "SP",
    senha: "é".repeat(40)
  });

  assert.equal(resultado.success, false);

  assert.ok(
    resultado.error.issues.some(
      (erro) =>
        erro.path.includes("senha") &&
        erro.message.includes("72 bytes")
    )
  );
});
