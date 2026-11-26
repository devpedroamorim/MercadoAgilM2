
import bcrypt from "bcrypt";

const CUSTO_HASH = 12;

// Gera um hash seguro para armazenar no banco.
export async function gerarHashSenha(senha) {
  return bcrypt.hash(senha, CUSTO_HASH);
}

// Compara a senha informada com o hash armazenado.
export async function verificarSenha(senha, hash) {
  return bcrypt.compare(senha, hash);
}
