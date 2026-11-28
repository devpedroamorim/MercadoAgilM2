
import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

import {
  criarModuloAuth
} from "../src/factories/auth.factory.js";

// Ambiente simulado para testar a integração
// sem precisar instalar PostgreSQL.
function criarAmbiente() {
  const banco = {
    usuarios: [],
    clientes: [],
    vendedores: []
  };

  let falharPerfil = false;

  const sequelize = {
    async transaction(operacao) {
      const transacao = {
        usuarios: [],
        clientes: [],
        vendedores: []
      };

      // Se a operação falhar, nada será persistido.
      const resultado = await operacao(transacao);

      banco.usuarios.push(...transacao.usuarios);
      banco.clientes.push(...transacao.clientes);
      banco.vendedores.push(...transacao.vendedores);

      return resultado;
    }
  };

  const User = {
    async create(dados, { transaction }) {
      const duplicado = [
        ...banco.usuarios,
        ...transaction.usuarios
      ].some((u) => u.email === dados.email);

      if (duplicado) {
        const erro = new Error("E-mail duplicado");
        erro.name = "SequelizeUniqueConstraintError";
        throw erro;
      }

      const usuario = {
        id: banco.usuarios.length +
          transaction.usuarios.length + 1,
        ...dados
      };

      transaction.usuarios.push(usuario);
      return usuario;
    },

    async findOne({ where }) {
      return banco.usuarios.find(
        (usuario) => usuario.email === where.email
      ) ?? null;
    }
  };

  const Customer = {
    async create(dados, { transaction }) {
      if (falharPerfil) {
        throw new Error("Falha ao criar perfil");
      }

      transaction.clientes.push(dados);
      return dados;
    }
  };

  const Seller = {
    async create(dados, { transaction }) {
      transaction.vendedores.push(dados);
      return dados;
    }
  };

  const modulo = criarModuloAuth({
    sequelize,
    User,
    Customer,
    Seller
  });

  const rotas = new Map();

  modulo.configurarRotas({
    post(caminho, handler) {
      rotas.set(caminho, handler);
      return this;
    }
  });

  return {
    banco,
    modulo,
    rotas,
    definirFalhaPerfil(valor) {
      falharPerfil = valor;
    }
  };
}

// Simula req, res e next do Express.
async function executarRota(handler, body) {
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

  let erroInesperado;

  await handler(
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

const cliente = {
  role: "cliente",
  email: "maria@exemplo.com",
  password: "SenhaTeste123",
  name: "Maria",
  cpf: "52998224725",
  state: "BA"
};

// TESTE 1
test("factory integra cadastro, login e JWT", async () => {
  const segredoAnterior = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "segredo-local-apenas-para-testes";

  try {
    const { banco, rotas } = criarAmbiente();

    const cadastro = await executarRota(
      rotas.get("/registro"),
      cliente
    );

    assert.equal(cadastro.statusCode, 201);
    assert.equal(cadastro.body.role, "cliente");
    assert.equal(banco.usuarios.length, 1);
    assert.equal(banco.clientes.length, 1);

    assert.notEqual(
      banco.usuarios[0].password_hash,
      cliente.password
    );

    const login = await executarRota(
      rotas.get("/login"),
      {
        email: cliente.email,
        password: cliente.password
      }
    );

    assert.equal(login.statusCode, 200);
    assert.deepEqual(Object.keys(login.body), ["token"]);

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

// TESTE 2
test("factory integra cadastro de vendedor", async () => {
  const { banco, rotas } = criarAmbiente();

  const resposta = await executarRota(
    rotas.get("/registro"),
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

  assert.equal(banco.usuarios.length, 1);
  assert.equal(banco.vendedores.length, 1);
  assert.equal(banco.clientes.length, 0);
});

// TESTE 3
test("factory impede cadastro duplicado", async () => {
  const { banco, rotas } = criarAmbiente();

  const registrar = rotas.get("/registro");

  const primeira = await executarRota(
    registrar,
    cliente
  );

  const segunda = await executarRota(
    registrar,
    cliente
  );

  assert.equal(primeira.statusCode, 201);
  assert.equal(segunda.statusCode, 409);
  assert.equal(banco.usuarios.length, 1);
});

// TESTE 4
test("factory preserva atomicidade na falha", async () => {
  const ambiente = criarAmbiente();

  ambiente.definirFalhaPerfil(true);

  await assert.rejects(
    ambiente.modulo.registrar({
      papel: "cliente",
      email: cliente.email,
      senha: cliente.password,
      nome: cliente.name,
      cpf: cliente.cpf,
      uf: cliente.state
    }),
    /Falha ao criar perfil/
  );

  // A simulação não confirma nenhuma alteração.
  assert.equal(ambiente.banco.usuarios.length, 0);
  assert.equal(ambiente.banco.clientes.length, 0);
});
