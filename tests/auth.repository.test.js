
import test from "node:test";
import assert from "node:assert/strict";

import {
  criarRepositorioAuth
} from "../src/repositories/auth.repository.js";

function criarAmbiente() {
  const chamadas = [];
  const transacao = { id: "transacao-teste" };

  const sequelize = {
    async transaction(operacao) {
      chamadas.push({ tipo: "transaction" });
      return operacao(transacao);
    }
  };

  const User = {
    async create(dados, opcoes) {
      chamadas.push({
        tipo: "user.create",
        dados,
        opcoes
      });

      return { id: 1, ...dados };
    },

    async findOne(opcoes) {
      chamadas.push({
        tipo: "user.findOne",
        opcoes
      });

      if (opcoes.where.email !== "cliente@exemplo.com") {
        return null;
      }

      return {
        get({ plain }) {
          assert.equal(plain, true);

          return {
            id: 1,
            email: "cliente@exemplo.com",
            password_hash: "hash-simulado",
            role: "cliente"
          };
        }
      };
    }
  };

  const Customer = {
    async create(dados, opcoes) {
      chamadas.push({
        tipo: "customer.create",
        dados,
        opcoes
      });

      return dados;
    }
  };

  const Seller = {
    async create(dados, opcoes) {
      chamadas.push({
        tipo: "seller.create",
        dados,
        opcoes
      });

      return dados;
    }
  };

  return {
    chamadas,
    transacao,
    repositorio: criarRepositorioAuth({
      sequelize,
      User,
      Customer,
      Seller
    })
  };
}

// TESTE 1
test("cria usuário e cliente na mesma transação", async () => {
  const { repositorio, chamadas, transacao } =
    criarAmbiente();

  await repositorio.executarTransacao(async (t) => {
    const usuario = await repositorio.criarUsuario(
      {
        email: "cliente@exemplo.com",
        password_hash: "hash-simulado",
        role: "cliente"
      },
      t
    );

    await repositorio.criarCliente(
      {
        user_id: usuario.id,
        name: "Maria",
        cpf: "52998224725",
        state: "BA"
      },
      t
    );
  });

  const usuario = chamadas.find(
    (item) => item.tipo === "user.create"
  );

  const cliente = chamadas.find(
    (item) => item.tipo === "customer.create"
  );

  assert.equal(usuario.opcoes.transaction, transacao);
  assert.equal(cliente.opcoes.transaction, transacao);
  assert.equal(cliente.dados.user_id, 1);
});

// TESTE 2
test("cria perfil de vendedor na transação", async () => {
  const { repositorio, chamadas, transacao } =
    criarAmbiente();

  await repositorio.executarTransacao(async (t) => {
    await repositorio.criarVendedor(
      {
        user_id: 1,
        store_name: "TechBahia",
        cnpj: "11222333000181"
      },
      t
    );
  });

  const vendedor = chamadas.find(
    (item) => item.tipo === "seller.create"
  );

  assert.equal(vendedor.opcoes.transaction, transacao);
  assert.equal(vendedor.dados.store_name, "TechBahia");
});

// TESTE 3
test("busca usuário por e-mail para login", async () => {
  const { repositorio, chamadas } = criarAmbiente();

  const usuario = await repositorio.buscarPorEmail(
    "cliente@exemplo.com"
  );

  assert.deepEqual(usuario, {
    id: 1,
    email: "cliente@exemplo.com",
    password_hash: "hash-simulado",
    role: "cliente"
  });

  const consulta = chamadas.find(
    (item) => item.tipo === "user.findOne"
  );

  assert.deepEqual(consulta.opcoes.where, {
    email: "cliente@exemplo.com"
  });
});

// TESTE 4
test("retorna null para usuário inexistente", async () => {
  const { repositorio } = criarAmbiente();

  const usuario = await repositorio.buscarPorEmail(
    "inexistente@exemplo.com"
  );

  assert.equal(usuario, null);
});

// TESTE 5
test("rejeita dependências ausentes", () => {
  assert.throws(
    () => criarRepositorioAuth({}),
    /Dependências do repositório/
  );
});

// TESTE 6
test("propaga falhas na operação transacional", async () => {
  const { repositorio } = criarAmbiente();

  await assert.rejects(
    repositorio.executarTransacao(async () => {
      throw new Error("Falha simulada");
    }),
    /Falha simulada/
  );
});
