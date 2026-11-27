
import { z } from "zod";
import { ErroLogin } from "../services/login.service.js";

// Formato exigido pelo contrato HTTP.
const loginHttpSchema = z.object({
  email: z.string(),
  password: z.string()
}).strict();

// Converte os campos do contrato para os nomes internos.
// Será utilizado futuramente pelo cadastro.
export function adaptarCadastro(dados) {
  if (
    !dados ||
    typeof dados !== "object" ||
    Array.isArray(dados)
  ) {
    return dados;
  }

  const campos = {
    password: "senha",
    role: "papel",
    name: "nome",
    store_name: "nomeLoja",
    state: "uf"
  };

  return Object.fromEntries(
    Object.entries(dados).map(([campo, valor]) => [
      campos[campo] ?? campo,
      valor
    ])
  );
}

// Controller compatível com o Express.
// O serviço é recebido por parâmetro para facilitar os testes.
export function criarLoginController(realizarLogin) {
  return async function login(req, res, next) {
    const validacao = loginHttpSchema.safeParse(req.body);

    if (!validacao.success) {
      return res.status(400).json({
        erros: ["Dados de login inválidos."]
      });
    }

    const { email, password } = validacao.data;

    try {
      const resultado = await realizarLogin({
        email,
        senha: password
      });

      // O contrato HTTP exige apenas o token.
      return res.status(200).json({
        token: resultado.token
      });
    } catch (erro) {
      if (erro instanceof ErroLogin) {
        return res.status(erro.status).json({
          erros: [erro.message]
        });
      }

      // Erros inesperados serão tratados pelo
      // middleware global de erros do Express.
      return next(erro);
    }
  };
}
