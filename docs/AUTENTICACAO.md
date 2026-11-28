Autenticação e Segurança — MercadoÁgil M2
Objetivo
Implementar cadastro de clientes e vendedores, login seguro, proteção de senhas, autenticação JWT e controle de acesso por perfil.
Branch: feat/autenticacao
Funcionalidades implementadas

Validação de cadastro e login com Zod.
Cadastro público permitido apenas para clientes e vendedores.
Hash de senhas com bcrypt, custo 12.
Login com verificação de credenciais e geração de JWT.
JWT com algoritmo HS256 e validade de uma hora.
Middleware para verificar tokens e permissões dos perfis cliente, vendedor e admin.
Controllers e rotas de autenticação preparados para Express.
Repositório e factory preparados para integração com Sequelize.
Respostas sem exposição de senhas, hashes, CPF ou CNPJ.

Endpoints previstos
POST /auth/registro
Cadastro de cliente:
{
  "email": "cliente@email.com",
  "password": "Senha123!",
  "role": "cliente",
  "name": "Maria",
  "cpf": "52998224725",
  "state": "BA"
}

Resposta esperada: HTTP 201.
{
  "id": 1,
  "email": "cliente@email.com",
  "role": "cliente"
}

POST /auth/login
{
  "email": "cliente@email.com",
  "password": "Senha123!"
}

Resposta esperada: HTTP 200, contendo somente o token JWT.
Como executar os testes
Na raiz do projeto:
npm ci
npm test
npm audit

Última validação: 74 testes aprovados, nenhuma falha e nenhuma vulnerabilidade detectada pelo npm audit.
Integração com Express e Sequelize
O módulo é criado pela função criarModuloAuth, localizada em src/factories/auth.factory.js.
Ela recebe as dependências sequelize, User, Customer e Seller.
O servidor principal deverá criar o Router do Express, registrar as rotas do módulo e montá-las em /auth.
Essas dependências deverão ser fornecidas pela infraestrutura compartilhada do projeto. Não há persistência real implementada nesta branch.
Pendências de integração

Conectar as rotas ao servidor Express principal.
Utilizar os models e migrations reais do PostgreSQL/Sequelize.
Testar persistência e rollback em banco real.
Validar os fluxos por requisições HTTP reais.
Configurar um JWT_SECRET forte e protegido fora do repositório.
Implementar limitação de tentativas de login na API.
Validar autorização por propriedade de recursos nas rotas de negócio.

Demonstração
Existe uma demonstração local do login com interface HTML, utilizando os serviços reais de autenticação e um usuário em memória.
A demonstração não utiliza PostgreSQL e não substitui os testes de integração da API.
Estado da entrega
Módulo de autenticação implementado e testado com dependências simuladas, aguardando integração com a infraestrutura compartilhada e revisão do PR.
