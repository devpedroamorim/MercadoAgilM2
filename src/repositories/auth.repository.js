
export function criarRepositorioAuth({
  sequelize,
  User,
  Customer,
  Seller
} = {}) {
  // Verifica se todas as dependências foram fornecidas.
  if (
    typeof sequelize?.transaction !== "function" ||
    typeof User?.create !== "function" ||
    typeof User?.findOne !== "function" ||
    typeof Customer?.create !== "function" ||
    typeof Seller?.create !== "function"
  ) {
    throw new Error(
      "Dependências do repositório de autenticação inválidas."
    );
  }

  return {
    // Executa as operações dentro de uma transação.
    // O Sequelize gerencia commit e rollback.
    executarTransacao(operacao) {
      return sequelize.transaction(operacao);
    },

    // Cria um usuário com e-mail, hash e perfil.
    criarUsuario(dados, transacao) {
      return User.create(dados, {
        transaction: transacao
      });
    },

    // Cria o perfil de cliente.
    criarCliente(dados, transacao) {
      return Customer.create(dados, {
        transaction: transacao
      });
    },

    // Cria o perfil de vendedor.
    criarVendedor(dados, transacao) {
      return Seller.create(dados, {
        transaction: transacao
      });
    },

    // Busca o usuário para autenticação.
    async buscarPorEmail(email) {
      const usuario = await User.findOne({
        where: { email },
        attributes: [
          "id",
          "email",
          "password_hash",
          "role"
        ]
      });

      if (!usuario) {
        return null;
      }

      // Aceita instâncias Sequelize e objetos comuns
      // utilizados nos testes automatizados.
      const dados =
        typeof usuario.get === "function"
          ? usuario.get({ plain: true })
          : usuario;

      return {
        id: dados.id,
        email: dados.email,
        password_hash: dados.password_hash,
        role: dados.role
      };
    }
  };
}
