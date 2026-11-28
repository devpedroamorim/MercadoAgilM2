
import { loginSchema } from "../schemas/auth.schema.js";
import { verificarSenha } from "./senha.service.js";
import { gerarTokenAcesso } from "./token.service.js";

// Hash bcrypt fictício, com custo 12.
// Não é uma credencial real e não pertence a nenhum usuário.
// Usado para executar o bcrypt mesmo quando o e-mail
// não existe, reduzindo diferenças de tempo na resposta.
const HASH_FICTICIO =
  "$2b$12$jRk0yfEC0gs9JWduLxTwu.NipHwJ1Sod5Aw9tY7YE8BWX.vrKCKbO";

export class ErroLogin extends Error {
  constructor(mensagem, status = 401) {
    super(mensagem);
    this.name = "ErroLogin";
    this.status = status;
  }
}

// Recebe a função de consulta ao banco por dependência.
export function criarServicoLogin({ buscarPorEmail }) {
  if (typeof buscarPorEmail !== "function") {
    throw new Error(
      "A função buscarPorEmail é obrigatória."
    );
  }

  return async function realizarLogin(credenciais) {
    // 1. Validar e normalizar os dados.
    const validacao = loginSchema.safeParse(credenciais);

    if (!validacao.success) {
      throw new ErroLogin(
        "Dados de login inválidos.",
        400
      );
    }

    const { email, senha } = validacao.data;

    // 2. Consultar o usuário.
    const usuario = await buscarPorEmail(email);

    // 3. Utilizar hash real ou fictício.
    // Dessa forma, a comparação bcrypt ocorre mesmo
    // quando o usuário não existe ou não possui hash.
    const hashParaComparar =
      typeof usuario?.password_hash === "string"
        ? usuario.password_hash
        : HASH_FICTICIO;

    const senhaCorreta = await verificarSenha(
      senha,
      hashParaComparar
    );

    // 4. Utilizar sempre a mesma mensagem para
    // usuário inexistente ou senha incorreta.
    if (!usuario || !senhaCorreta) {
      throw new ErroLogin(
        "E-mail ou senha inválidos.",
        401
      );
    }

    // 5. Gerar JWT apenas após autenticação válida.
    const token = gerarTokenAcesso({
      id: usuario.id,
      papel: usuario.role
    });

    // 6. Não devolver senha ou hash na resposta.
    return {
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        papel: usuario.role
      }
    };
  };
}
