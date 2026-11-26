
import jwt from "jsonwebtoken";

const PAPEIS_VALIDOS = ["cliente", "vendedor", "admin"];

export function gerarTokenAcesso(usuario) {
  const segredo = process.env.JWT_SECRET;

  if (!segredo) {
    throw new Error("JWT_SECRET não configurado.");
  }

  if (
    !usuario ||
    (typeof usuario.id !== "string" &&
      typeof usuario.id !== "number") ||
    !String(usuario.id).trim() ||
    !PAPEIS_VALIDOS.includes(usuario.papel)
  ) {
    throw new Error("Dados inválidos para gerar token.");
  }

  return jwt.sign(
    { papel: usuario.papel },
    segredo,
    {
      algorithm: "HS256",
      subject: String(usuario.id),
      expiresIn: "1h"
    }
  );
}
