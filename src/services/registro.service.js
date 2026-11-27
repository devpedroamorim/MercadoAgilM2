
import { registroSchema } from "../schemas/auth.schema.js";
import { gerarHashSenha } from "./senha.service.js";

export class ErroRegistro extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.name = "ErroRegistro";
    this.status = status;
  }
}

// As operações de banco serão fornecidas pelo Sequelize.
// Por enquanto, podemos testá-las com funções simuladas.
export function criarServicoRegistro({
  executarTransacao,
  criarUsuario,
  criarCliente,
  criarVendedor
}) {
  const operacoes = [
    executarTransacao,
    criarUsuario,
    criarCliente,
    criarVendedor
  ];

  if (operacoes.some((operacao) => typeof operacao !== "function")) {
    throw new Error("Dependências do registro não configuradas.");
  }

  return async function registrar(dados) {
    const validacao = registroSchema.safeParse(dados);

    if (!validacao.success) {
      throw new ErroRegistro("Dados de cadastro inválidos.", 400);
    }

    const cadastro = validacao.data;

    const {
      email,
      senha,
      papel
    } = cadastro;

    const password_hash = await gerarHashSenha(senha);

    try {
      return await executarTransacao(async (transacao) => {
        const usuario = await criarUsuario(
          {
            email,
            password_hash,
            role: papel
          },
          transacao
        );

        if (papel === "cliente") {
          await criarCliente(
            {
              user_id: usuario.id,
              name: cadastro.nome,
              cpf: cadastro.cpf,
              state: cadastro.uf
            },
            transacao
          );
        } else {
          await criarVendedor(
            {
              user_id: usuario.id,
              store_name: cadastro.nomeLoja,
              cnpj: cadastro.cnpj
            },
            transacao
          );
        }

        return {
          id: usuario.id,
          email: usuario.email,
          role: usuario.role
        };
      });
    } catch (erro) {
      if (erro?.name === "SequelizeUniqueConstraintError") {
        throw new ErroRegistro(
          "E-mail, CPF ou CNPJ já cadastrado.",
          409
        );
      }

      throw erro;
    }
  };
}
