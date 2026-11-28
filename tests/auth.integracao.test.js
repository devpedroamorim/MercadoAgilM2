
import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

import {
  criarRegistroController,
  criarLoginController
} from "../src/controllers/auth.controller.js";

import {
  criarServicoRegistro
} from "../src/services/registro.service.js";

import {
  criarServicoLogin
} from "../src/services/login.service.js";

// Simula somente as operações de persistência.
// Controllers, serviços, bcrypt e JWT são reais.
function criarAmbienteTeste() {
  const banco = {
    usuarios: [],
    clientes: [],
    vendedores: []
  };

  const registrar = criarServicoRegistro({
    executarTransacao: async (operacao) => {
      const pendentes = {
        usuarios: [],
        clientes: [],
        vendedores: []
      };

      const resultado = await operacao(pendentes);

      banco.usuarios.push(...pendentes.usuarios);
      banco.clientes.push(...pendentes.clientes);
      banco.vendedores.push(...pendentes.vendedores);

      return resultado;
    },

    criarUsuario: async (dados, transacao) => {
      const duplicado = banco.usuarios.some(
        (usuario) => usuario.email === dados.email
      );

      if (duplicado) {
        const erro = new Error("E-mail duplicado");
        erro.name = "SequelizeUniqueConstraintError";
        throw erro;
      }

      const usuario = {
        id: banco.usuarios.length + 1,
        ...dados
      };

      transacao.usuarios.push(usuario);
      return usuario;
    },

    criarCliente: async (dados, transacao) => {
      transacao.clientes.push(dados);
    },

    criarVendedor: async (dados, transacao) => {
      transacao.vendedores.push(dados);
    }
  });

  const realizarLogin = criarServicoLogin({
    buscarPorEmail: async (email) =>
      banco.usuarios.find(
        (usuario) => usuario.email === email
      ) ?? null
  });

  return {
    banco,
    controllerRegistro: criarRegistroController(registrar),
    controllerLogin: criarLoginController(realizarLogin)
  };
}

function criarResposta() {
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

async function executar(controller, body) {
  const res = criarResposta();
  let erroInesperado;

  await controller(
    { body },
    res,
    (erro) => {
      erroInesperado = erro;
    }
  );

  if (erroInesperado) {
    throw erroInesperado;
  }

  return res;
}

test("fluxo integrado: cadastro e login de cliente", async () => {
  const segredoAnterior = process.env.JWT_SECRET;
  process.env.JWT_SECRET =
    "segredo-de-teste-local-nao-utilizar-em-producao";

  try {
    const ambiente = criarAmbienteTeste();

    const cadastro = await executar(
      ambiente.controllerRegistro,
      {
        role: "cliente",
        email: "maria@exemplo.com",
        password: "SenhaTeste123",
        name: "Maria",
        cpf: "52998224725",
        state: "BA"
      }
    );

    assert.equal(cadastro.statusCode, 201);
    assert.deepEqual(cadastro.body, {
      id: 1,
      email: "maria@exemplo.com",
      role: "cliente"
    });

    assert.notEqual(
      ambiente.banco.usuarios[0].password_hash,
      "SenhaTeste123"
    );

    const login = await executar(
      ambiente.controllerLogin,
      {
        email: "maria@exemplo.com",
        password: "SenhaTeste123"
      }
    );

    assert.equal(login.statusCode, 200);
    assert.deepEqual(
      Object.keys(login.body),
      ["token"]
    );

    const payload = jwt.verify(
      login.body.token,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    assert.equal(payload.sub, "1");
    assert.equal(payload.papel, "cliente");
  } finally {
    if (segredoAnterior === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = segredoAnterior;
    }
  }
});

test("fluxo integrado: cadastro de vendedor", async () => {
  const ambiente = criarAmbienteTeste();

  const resposta = await executar(
    ambiente.controllerRegistro,
    {
      role: "vendedor",
      email: "loja@exemplo.com",
      password: "SenhaTeste123",
      store_name: "TechBahia",
      cnpj: "11222333000181"
    }
  );

  assert.equal(resposta.statusCode, 201);
  assert.equal(resposta.body.role, "vendedor");
  assert.equal(ambiente.banco.vendedores.length, 1);
  assert.equal(ambiente.banco.clientes.length, 0);
});

test("fluxo integrado: cadastro duplicado retorna 409", async () => {
  const ambiente = criarAmbienteTeste();

  const dados = {
    role: "cliente",
    email: "duplicado@exemplo.com",
    password: "SenhaTeste123",
    name: "Cliente Teste",
    cpf: "52998224725",
    state: "SP"
  };

  const primeira = await executar(
    ambiente.controllerRegistro,
    dados
  );

  const segunda = await executar(
    ambiente.controllerRegistro,
    dados
  );

  assert.equal(primeira.statusCode, 201);
  assert.equal(segunda.statusCode, 409);
  assert.equal(ambiente.banco.usuarios.length, 1);
});
