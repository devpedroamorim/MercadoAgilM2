
import test from "node:test";
import assert from "node:assert/strict";

import {
  criarRegistroController
} from "../src/controllers/auth.controller.js";

import {
  ErroRegistro
} from "../src/services/registro.service.js";

const clienteHttp = {
  role: "cliente",
  email: "cliente@exemplo.com",
  password: "SenhaTeste123",
  name: "Cliente Teste",
  cpf: "52998224725",
  state: "SP"
};

const vendedorHttp = {
  role: "vendedor",
  email: "vendedor@exemplo.com",
  password: "SenhaTeste123",
  store_name: "TechBahia",
  cnpj: "11222333000181"
};

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

// TESTE 1 - Cadastro de cliente
test("retorna HTTP 201 ao cadastrar cliente", async () => {
  let dadosRecebidos;

  const controller = criarRegistroController(async (dados) => {
    dadosRecebidos = dados;

    return {
      id: 1,
      email: dados.email,
      role: dados.papel,
      password_hash: "nao_deve_aparecer"
    };
  });

  const res = criarRespostaSimulada();

  await controller({ body: clienteHttp }, res, () => {});

  assert.equal(res.statusCode, 201);

  assert.deepEqual(res.body, {
    id: 1,
    email: "cliente@exemplo.com",
    role: "cliente"
  });

  assert.equal(dadosRecebidos.papel, "cliente");
  assert.equal(dadosRecebidos.nome, "Cliente Teste");
  assert.equal(dadosRecebidos.uf, "SP");
  assert.equal(dadosRecebidos.senha, "SenhaTeste123");

  assert.equal(res.body.password_hash, undefined);
  assert.equal(res.body.cpf, undefined);
});

// TESTE 2 - Cadastro de vendedor
test("retorna HTTP 201 ao cadastrar vendedor", async () => {
  let dadosRecebidos;

  const controller = criarRegistroController(async (dados) => {
    dadosRecebidos = dados;

    return {
      id: 2,
      email: dados.email,
      role: dados.papel
    };
  });

  const res = criarRespostaSimulada();

  await controller({ body: vendedorHttp }, res, () => {});

  assert.equal(res.statusCode, 201);

  assert.deepEqual(res.body, {
    id: 2,
    email: "vendedor@exemplo.com",
    role: "vendedor"
  });

  assert.equal(dadosRecebidos.nomeLoja, "TechBahia");
  assert.equal(dadosRecebidos.papel, "vendedor");
  assert.equal(dadosRecebidos.cnpj, "11222333000181");
});

// TESTE 3 - Bloqueio de administrador
test("bloqueia cadastro público de administrador", async () => {
  let chamado = false;

  const controller = criarRegistroController(async () => {
    chamado = true;
  });

  const res = criarRespostaSimulada();

  await controller({
    body: {
      role: "admin",
      email: "admin@exemplo.com",
      password: "SenhaTeste123"
    }
  }, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(chamado, false);
  assert.ok(Array.isArray(res.body.erros));
});

// TESTE 4 - Campos inesperados
test("rejeita campos inesperados no cadastro", async () => {
  let chamado = false;

  const controller = criarRegistroController(async () => {
    chamado = true;
  });

  const res = criarRespostaSimulada();

  await controller({
    body: {
      ...clienteHttp,
      papel: "admin"
    }
  }, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(chamado, false);
});

// TESTE 5 - Campos obrigatórios ausentes
test("rejeita cadastro sem campos obrigatórios", async () => {
  const controller = criarRegistroController(async () => {
    throw new Error("Serviço não deveria ser chamado");
  });

  const res = criarRespostaSimulada();

  await controller({
    body: {
      role: "cliente",
      email: "cliente@exemplo.com"
    }
  }, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.ok(Array.isArray(res.body.erros));
});

// TESTE 6 - Requisição sem corpo
test("rejeita corpo da requisição ausente", async () => {
  const controller = criarRegistroController(async () => {
    throw new Error("Serviço não deveria ser chamado");
  });

  const res = criarRespostaSimulada();

  await controller({}, res, () => {});

  assert.equal(res.statusCode, 400);
});

// TESTE 7 - Cadastro duplicado
test("retorna HTTP 409 para cadastro duplicado", async () => {
  const controller = criarRegistroController(async () => {
    throw new ErroRegistro(
      "E-mail, CPF ou CNPJ já cadastrado.",
      409
    );
  });

  const res = criarRespostaSimulada();

  await controller({ body: clienteHttp }, res, () => {});

  assert.equal(res.statusCode, 409);

  assert.deepEqual(res.body, {
    erros: ["E-mail, CPF ou CNPJ já cadastrado."]
  });
});

// TESTE 8 - Erro de validação do serviço
test("retorna HTTP 400 para erro de validação do serviço", async () => {
  const controller = criarRegistroController(async () => {
    throw new ErroRegistro(
      "Dados de cadastro inválidos.",
      400
    );
  });

  const res = criarRespostaSimulada();

  await controller({ body: clienteHttp }, res, () => {});

  assert.equal(res.statusCode, 400);

  assert.deepEqual(res.body, {
    erros: ["Dados de cadastro inválidos."]
  });
});

// TESTE 9 - Erro inesperado
test("encaminha erros inesperados ao Express", async () => {
  const erroOriginal = new Error("Falha inesperada");
  let erroEncaminhado;

  const controller = criarRegistroController(async () => {
    throw erroOriginal;
  });

  const res = criarRespostaSimulada();

  await controller(
    { body: clienteHttp },
    res,
    (erro) => {
      erroEncaminhado = erro;
    }
  );

  assert.equal(erroEncaminhado, erroOriginal);
  assert.equal(res.statusCode, null);
});
