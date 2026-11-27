
import { loginSchema } from "../schemas/auth.schema.js";
import { verificarSenha } from "./senha.service.js";
import { gerarTokenAcesso } from "./token.service.js";

export class ErroLogin extends Error {
  constructor(mensagem, status = 401) {
    super(mensagem);
    this.name = "ErroLogin";
    this.status = status;
  }
}

// Recebe a função de consulta ao banco por dependência.
// Assim podemos testar antes de integrar o Sequelize.
export function criarServicoLogin({ buscarPorEmail }) {
  if (typeof buscarPorEmail !== "function") {
    throw new Error("A função buscarPorEmail é obrigatória.");
  }

  return async function realizarLogin(credenciais) {
    // 1. Validar e normalizar os dados.
    const validacao = loginSchema.safeParse(credenciais);

    if (!validacao.success) {
      throw new ErroLogin("Dados de login inválidos.", 400);
    }

    const { email, senha } = validacao.data;

    // 2. Procurar usuário no banco.
    const usuario = await buscarPorEmail(email);

    // 3. Conferir a senha sem revelar se o e-mail existe.
    if (
      !usuario ||
      typeof usuario.password_hash !== "string"
    ) {
      throw new ErroLogin("E-mail ou senha inválidos.", 401);
    }

    const senhaCorreta = await verificarSenha(
      senha,
      usuario.password_hash
    );

    if (!senhaCorreta) {
      throw new ErroLogin("E-mail ou senha inválidos.", 401);
    }

    // 4. Gerar JWT somente após autenticação válida.
    const token = gerarTokenAcesso({
      id: usuario.id,
      papel: usuario.role
    });

    // 5. Não devolver senha ou hash na resposta.
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