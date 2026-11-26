
import jwt from "jsonwebtoken";

export function autenticar(req, res, next) {
  const autorizacao = req.headers?.authorization;

  const resultado =
    typeof autorizacao === "string"
      ? autorizacao.match(/^Bearer ([^\s]+)$/i)
      : null;

  if (!resultado) {
    return res.status(401).json({
      erros: ["Token de autenticação ausente ou inválido."]
    });
  }

  const segredo = process.env.JWT_SECRET;

  if (!segredo) {
    return res.status(500).json({
      erros: ["Configuração de autenticação indisponível."]
    });
  }

  try {
    const dados = jwt.verify(resultado[1], segredo, {
      algorithms: ["HS256"]
    });

    if (
      !dados ||
      typeof dados !== "object" ||
      typeof dados.sub !== "string" ||
      !["cliente", "vendedor", "admin"].includes(dados.papel)
    ) {
      return res.status(401).json({
        erros: ["Token inválido."]
      });
    }

    req.usuario = {
      id: dados.sub,
      papel: dados.papel
    };

    return next();
  } catch {
    return res.status(401).json({
      erros: ["Token inválido ou expirado."]
    });
  }
}

export function autorizarPapeis(...papeisPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        erros: ["Usuário não autenticado."]
      });
    }

    if (!papeisPermitidos.includes(req.usuario.papel)) {
      return res.status(403).json({
        erros: ["Você não tem permissão para acessar este recurso."]
      });
    }

    return next();
  };
}
