
import test from "node:test";
import assert from "node:assert/strict";

import {
  criarServicoRegistro,
  ErroRegistro
} from "../src/services/registro.service.js";

import {
  verificarSenha
} from "../src/services/senha.service.js";

// Dados válidos para os testes.
const clienteValido = {
  papel: "cliente",
  nome: "Cliente Teste",
  email: "cliente@exemplo.com",
  cpf: "52998224725",
  uf: "SP",
  senha: "SenhaTeste123"
};

const vendedorValido = {
  papel: "vendedor",
  nomeLoja: "TechBahia",
  email: "vendedor@exemplo.com",
  cnpj: "11222333000181",
  senha: "SenhaTeste123"
};

// Simula operações do banco e uma transação.
// A gravação só é confirmada quando todas as
// operações terminam sem erros.
function criarBancoSimulado(opcoes = {}) {
  const banco = {
    usuarios: [],
    clientes: [],
    vendedores: []
  };

  const dependencias = {
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
      if (opcoes.emailDuplicado) {
        const erro = new Error("E-mail duplicado");
        erro.name = "SequelizeUniqueConstraintError";
        throw erro;
      }

      const usuario = {
        id: 1,
        ...dados
      };

      transacao.usuarios.push(usuario);

      return usuario;
    },

    criarCliente: async (dados, transacao) => {
      if (opcoes.falharCliente) {
        throw new Error("Falha ao criar cliente");
      }

      transacao.clientes.push(dados);
    },

    criarVendedor: async (dados, transacao) => {
      transacao.vendedores.push(dados);
    }
  };

  return {
    banco,
    registrar: criarServicoRegistro(dependencias)
  };
}

// TESTE 1
test("cadastra cliente com senha protegida", async () => {
  const { banco, registrar } = criarBancoSimulado();

  const resultado = await registrar(clienteValido);

  assert.deepEqual(resultado, {
    id: 1,
    email: "cliente@exemplo.com",
    role: "cliente"
  });

  assert.equal(banco.usuarios.length, 1);
  assert.equal(banco.clientes.length, 1);

  const usuario = banco.usuarios[0];

  assert.notEqual(
    usuario.password_hash,
    clienteValido.senha
  );

  assert.equal(
    await verificarSenha(
      clienteValido.senha,
      usuario.password_hash
    ),
    true
  );

  assert.equal(banco.clientes[0].user_id, 1);
  assert.equal(banco.clientes[0].name, "Cliente Teste");

  // Dados sensíveis não aparecem na resposta.
  assert.equal(resultado.password_hash, undefined);
  assert.equal(resultado.senha, undefined);
  assert.equal(resultado.cpf, undefined);
});

// TESTE 2
test("cadastra vendedor corretamente", async () => {
  const { banco, registrar } = criarBancoSimulado();

  const resultado = await registrar(vendedorValido);

  assert.equal(resultado.role, "vendedor");
  assert.equal(banco.usuarios.length, 1);
  assert.equal(banco.vendedores.length, 1);
  assert.equal(banco.clientes.length, 0);

  assert.equal(banco.vendedores[0].user_id, 1);
  assert.equal(
    banco.vendedores[0].store_name,
    "TechBahia"
  );

  assert.equal(
    await verificarSenha(
      vendedorValido.senha,
      banco.usuarios[0].password_hash
    ),
    true
  );
});

// TESTE 3
test("impede cadastro público de administrador", async () => {
  const { banco, registrar } = criarBancoSimulado();

  await assert.rejects(
    registrar({
      papel: "admin",
      email: "admin@exemplo.com",
      senha: "SenhaTeste123"
    }),
    {
      name: "ErroRegistro",
      status: 400
    }
  );

  assert.equal(banco.usuarios.length, 0);
});

// TESTE 4
test("rejeita dados inválidos de cadastro", async () => {
  const { banco, registrar } = criarBancoSimulado();

  await assert.rejects(
    registrar({
      ...clienteValido,
      email: "email-invalido",
      senha: "123"
    }),
    {
      name: "ErroRegistro",
      status: 400
    }
  );

  assert.equal(banco.usuarios.length, 0);
});

// TESTE 5
test("retorna 409 para e-mail duplicado", async () => {
  const { banco, registrar } = criarBancoSimulado({
    emailDuplicado: true
  });

  await assert.rejects(
    registrar(clienteValido),
    (erro) => {
      assert.ok(erro instanceof ErroRegistro);
      assert.equal(erro.status, 409);
      return true;
    }
  );

  assert.equal(banco.usuarios.length, 0);
});

// TESTE 6
test("desfaz cadastro se a criação do perfil falhar", async () => {
  const { banco, registrar } = criarBancoSimulado({
    falharCliente: true
  });

  await assert.rejects(
    registrar(clienteValido),
    /Falha ao criar cliente/
  );

  // Nenhum registro deve ser confirmado.
  assert.equal(banco.usuarios.length, 0);
  assert.equal(banco.clientes.length, 0);
});
