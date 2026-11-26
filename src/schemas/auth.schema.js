
import { z } from "zod";
import { clienteSchema } from "./clienteSchema.js";
import { vendedorSchema } from "./vendedorSchema.js";

// Validação do login
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Informe um e-mail válido"),

  senha: z
    .string()
    .min(1, "A senha é obrigatória")
}).strict();

// Validação de senha para novos cadastros
const senhaCadastroSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres")
  .max(72, "A senha deve ter no máximo 72 caracteres");

// Cadastro de cliente
const registroClienteSchema = z.object({
  ...clienteSchema.shape,

  email: loginSchema.shape.email,
  papel: z.literal("cliente"),
  senha: senhaCadastroSchema
}).strict();

// Cadastro de vendedor
const registroVendedorSchema = z.object({
  ...vendedorSchema.shape,

  email: loginSchema.shape.email,
  papel: z.literal("vendedor"),
  senha: senhaCadastroSchema
}).strict();

// Registro público: somente cliente ou vendedor
export const registroSchema = z.discriminatedUnion(
  "papel",
  [
    registroClienteSchema,
    registroVendedorSchema
  ]
);
