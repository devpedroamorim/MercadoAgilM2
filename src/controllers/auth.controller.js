
import { z } from "zod";
import { ErroLogin } from "../services/login.service.js";
import { ErroRegistro } from "../services/registro.service.js";

// =====================================================
// SCHEMAS DO CONTRATO HTTP
// =====================================================

// POST /auth/login
const loginHttpSchema = z.object({
  email: z.string(),
  password: z.string()
}).strict();

// POST /auth/registro
// O cadastro público permite somente cliente e vendedor.
const registroHttpSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("cliente"),
    email: z.string(),
    password: z.string(),
    name: z.string(),
    cpf: z.string(),
    state: z.string()
  }).strict(),

  z.object({
    role: z.literal("vendedor"),
    email: z.string(),
    password: z.string(),
    store_name: z.string(),
    cnpj: z.string()
  }).strict()
]);

// =====================================================
// ADAPTAÇÃO DOS CAMPOS
// =====================================================

// Converte os campos do contrato HTTP para os nomes
// internos utilizados pelos schemas e serviços.
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

// =====================================================
// CONTROLLER DE LOGIN
// =====================================================

// Compatível com Express.
// O serviço é recebido como dependência para facilitar
// os testes sem precisar conectar ao banco de dados.
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

      // O contrato HTTP exige somente o token JWT.
      return res.status(200).json({
        token: resultado.token
      });
    } catch (erro) {
      if (erro instanceof ErroLogin) {
        return res.status(erro.status).json({
          erros: [erro.message]
        });
      }

      // Erros inesperados são encaminhados
      // ao middleware global de erros do Express.
      return next(erro);
    }
  };
}

// =====================================================
// CONTROLLER DE REGISTRO
// =====================================================

// POST /auth/registro
// Permite cadastro público somente de cliente e vendedor.
export function criarRegistroController(registrar) {
  return async function registro(req, res, next) {
    const validacao = registroHttpSchema.safeParse(req.body);

    // Bloqueia requisições inválidas, campos inesperados
    // e tentativas de cadastro público de administrador.
    if (!validacao.success) {
      return res.status(400).json({
        erros: ["Dados de cadastro inválidos."]
      });
    }

    try {
      // Adapta os nomes do contrato HTTP para o
      // formato utilizado pelo serviço de registro.
      const dadosInternos = adaptarCadastro(validacao.data);

      // Executa o serviço responsável pela validação
      // completa, hash da senha e operações de cadastro.
      const resultado = await registrar(dadosInternos);

      // Nunca retorna senha, hash, CPF ou CNPJ.
      return res.status(201).json({
        id: resultado.id,
        email: resultado.email,
        role: resultado.role
      });
    } catch (erro) {
      // Trata erros conhecidos do serviço:
      // 400 - Dados inválidos.
      // 409 - E-mail, CPF ou CNPJ duplicado.
      if (erro instanceof ErroRegistro) {
        return res.status(erro.status).json({
          erros: [erro.message]
        });
      }

      // Encaminha falhas inesperadas ao middleware
      // global de erros do Express.
      return next(erro);
    }
  };
}
