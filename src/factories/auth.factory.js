
import {
  criarRepositorioAuth
} from "../repositories/auth.repository.js";

import {
  criarServicoRegistro
} from "../services/registro.service.js";

import {
  criarServicoLogin
} from "../services/login.service.js";

import {
  configurarRotasAuth
} from "../routes/auth.routes.js";

// Monta os componentes da autenticação.
// Não inicia servidor e não abre conexão com o banco.
export function criarModuloAuth({
  sequelize,
  User,
  Customer,
  Seller
} = {}) {
  const repositorio = criarRepositorioAuth({
    sequelize,
    User,
    Customer,
    Seller
  });

  // Os serviços recebem as operações do repositório.
  const registrar = criarServicoRegistro({
    executarTransacao: repositorio.executarTransacao,
    criarUsuario: repositorio.criarUsuario,
    criarCliente: repositorio.criarCliente,
    criarVendedor: repositorio.criarVendedor
  });

  const realizarLogin = criarServicoLogin({
    buscarPorEmail: repositorio.buscarPorEmail
  });

  return {
    registrar,
    realizarLogin,

    // O servidor do grupo poderá chamar esta função
    // quando a estrutura Express estiver disponível.
    configurarRotas(router) {
      return configurarRotasAuth(router, {
        registrar,
        realizarLogin
      });
    }
  };
}
