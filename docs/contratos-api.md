# Contratos da API — MercadoÁgil 2.0

## Objetivo

Definimos aqui os formatos de comunicação entre os clientes e a API do MercadoÁgil.

Padronizamos as requisições e respostas para facilitar o desenvolvimento entre os grupos.

## Convenções

- Utilizamos JSON na comunicação.
- Utilizamos nomes de campos em inglês e `snake_case`.
- Mantemos as rotas em português, conforme a rubrica.
- Utilizamos JWT para autenticação.
- Nunca incluímos CPF, senha ou hash da senha nas respostas da API.

## Métodos HTTP

| Método | Finalidade                        |
| ------ | --------------------------------- |
| GET    | Consultar informações             |
| POST   | Criar registros ou executar ações |
| PUT    | Atualizar registros               |
| DELETE | Excluir registros                 |

## Códigos de resposta HTTP

| Código | Significado                      |
| ------ | -------------------------------- |
| 200    | Operação realizada com sucesso   |
| 201    | Registro criado com sucesso      |
| 400    | Dados inválidos                  |
| 401    | Usuário não autenticado          |
| 403    | Usuário sem permissão            |
| 404    | Registro não encontrado          |
| 409    | Violação de uma regra de negócio |

## Formato padrão de erros

Retornamos os erros de todas as rotas no mesmo formato:

```json
{
  "erros": ["Descrição do erro"]
}
```

## Autenticação

### POST /auth/registro

Criamos uma conta de usuário e seu respectivo perfil.

**Acesso:** Público.

Permitimos o registro público apenas de clientes e vendedores. Criamos contas de administrador exclusivamente pelo seeder.

#### Requisição — Cliente

```json
{
  "email": "cliente@email.com",
  "password": "Senha123!",
  "role": "cliente",
  "name": "Maria",
  "cpf": "52998224725",
  "state": "BA"
}
```

#### Requisição — Vendedor

```json
{
  "email": "loja@email.com",
  "password": "Senha123!",
  "role": "vendedor",
  "store_name": "TechBahia",
  "cnpj": "11222333000181"
}
```

#### Resposta — 201 Created

```json
{
  "id": 1,
  "email": "cliente@email.com",
  "role": "cliente"
}
```

#### Possíveis erros

| Código | Motivo                                 |
| ------ | -------------------------------------- |
| 400    | Dados inválidos ou papel não permitido |
| 409    | E-mail, CPF ou CNPJ já cadastrado      |

### POST /auth/login

Autenticamos o usuário e retornamos um token JWT.

**Acesso:** Público.

#### Requisição

```json
{
  "email": "cliente@email.com",
  "password": "Senha123!"
}
```

#### Resposta — 200 OK

```json
{
  "token": "jwt_token"
}
```

#### Possíveis erros

| Código | Motivo                     |
| ------ | -------------------------- |
| 400    | Dados inválidos            |
| 401    | E-mail ou senha incorretos |

### Utilização do token JWT

Exigimos o envio do token no cabeçalho `Authorization` das requisições às rotas protegidas:

```http
Authorization: Bearer jwt_token
```

## Produtos

### GET /produtos

Listamos os produtos disponíveis no marketplace.

**Acesso:** Público.

#### Resposta — 200 OK

```json
[
  {
    "id": 1,
    "name": "Mouse",
    "price": 120.0,
    "stock": 20,
    "seller_id": 1,
    "category_id": 1
  },
  {
    "id": 2,
    "name": "Livro de JavaScript",
    "price": 80.0,
    "stock": 15,
    "seller_id": 2,
    "category_id": 2
  }
]
```

Na ausência de produtos, retornamos uma lista vazia (`[]`).

### GET /produtos/:id

Consultamos um produto específico pelo ID.

**Acesso:** Público.

#### Exemplo

GET /produtos/1

#### Resposta — 200 OK

```json
{
  "id": 1,
  "name": "Mouse",
  "price": 120.0,
  "stock": 20,
  "seller_id": 1,
  "category_id": 1
}
```

#### Possíveis erros

| Código | Motivo                 |
| ------ | ---------------------- |
| 400    | ID inválido            |
| 404    | Produto não encontrado |

### POST /produtos

Cadastramos um novo produto.

**Acesso:** Vendedor autenticado.

Identificamos o vendedor pelo token JWT.

#### Requisição

```json
{
  "name": "Mouse",
  "price": 120.0,
  "stock": 20,
  "category_id": 1
}
```

#### Resposta — 201 Created

```json
{
  "id": 1,
  "name": "Mouse",
  "price": 120.0,
  "stock": 20,
  "seller_id": 1,
  "category_id": 1
}
```

#### Possíveis erros

| Código | Motivo                   |
| ------ | ------------------------ |
| 400    | Dados inválidos          |
| 401    | Usuário não autenticado  |
| 403    | Usuário não é vendedor   |
| 404    | Categoria não encontrada |

### PUT /produtos/:id

Atualizamos as informações de um produto existente.

**Acesso:** Vendedor proprietário do produto.

#### Requisição

```json
{
  "name": "Mouse sem fio",
  "price": 150.0,
  "stock": 25,
  "category_id": 1
}
```

#### Resposta — 200 OK

```json
{
  "id": 1,
  "name": "Mouse sem fio",
  "price": 150.0,
  "stock": 25,
  "seller_id": 1,
  "category_id": 1
}
```

Ao atualizar o preço de um produto, preservamos o preço histórico dos itens de pedidos já confirmados.

#### Possíveis erros

| Código | Motivo                              |
| ------ | ----------------------------------- |
| 400    | Dados inválidos                     |
| 401    | Usuário não autenticado             |
| 403    | Usuário não possui permissão        |
| 404    | Produto ou categoria não encontrada |

### DELETE /produtos/:id

Excluímos um produto do marketplace.

**Acesso:** Vendedor proprietário do produto.

#### Resposta — 200 OK

```json
{
  "message": "Produto excluído com sucesso."
}
```

#### Possíveis erros

| Código | Motivo                        |
| ------ | ----------------------------- |
| 400    | ID inválido                   |
| 401    | Usuário não autenticado       |
| 403    | Usuário não possui permissão  |
| 404    | Produto não encontrado        |
| 409    | Produto associado a um pedido |

Bloqueamos a exclusão de produtos associados a qualquer pedido, retornando 409. Assim, preservamos o histórico das compras e a integridade dos relacionamentos.

## Cupons

### POST /cupons

Cadastramos um novo cupom de desconto.

**Acesso:** Administrador.

#### Requisição

```json
{
  "code": "BEMVINDO10",
  "type": "percentual",
  "value": 10.0,
  "expires_at": "2027-12-31T23:59:59-03:00",
  "minimum_value": 50.0,
  "cumulative": true
}
```

#### Resposta — 201 Created

```json
{
  "id": 1,
  "code": "BEMVINDO10",
  "type": "percentual",
  "value": 10.0,
  "expires_at": "2027-12-31T23:59:59-03:00",
  "minimum_value": 50.0,
  "cumulative": true
}
```

#### Possíveis erros

| Código | Motivo                        |
| ------ | ----------------------------- |
| 400    | Dados inválidos               |
| 401    | Usuário não autenticado       |
| 403    | Usuário não é administrador   |
| 409    | Código de cupom já cadastrado |

### GET /cupons

Listamos os cupons cadastrados.

**Acesso:** Administrador.

#### Resposta — 200 OK

```json
[
  {
    "id": 1,
    "code": "BEMVINDO10",
    "type": "percentual",
    "value": 10.0,
    "expires_at": "2027-12-31T23:59:59-03:00",
    "minimum_value": 50.0,
    "cumulative": true
  }
]
```

#### Possíveis erros

| Código | Motivo                      |
| ------ | --------------------------- |
| 401    | Usuário não autenticado     |
| 403    | Usuário não é administrador |

### DELETE /cupons/:id

Excluímos um cupom cadastrado.

**Acesso:** Administrador.

#### Resposta — 200 OK

```json
{
  "message": "Cupom excluído com sucesso."
}
```

#### Possíveis erros

| Código | Motivo                      |
| ------ | --------------------------- |
| 400    | ID inválido                 |
| 401    | Usuário não autenticado     |
| 403    | Usuário não é administrador |
| 404    | Cupom não encontrado        |
| 409    | Cupom associado a um pedido |

Bloqueamos a exclusão de cupons associados a qualquer pedido, retornando 409 para preservar o histórico.

## Pedidos

### POST /pedidos

Criamos um novo pedido com status `aberto`.

**Acesso:** Cliente autenticado.

Identificamos o cliente pelo token JWT.

#### Requisição

```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 1
    },
    {
      "product_id": 2,
      "quantity": 1
    }
  ]
}
```

#### Resposta — 201 Created

```json
{
  "id": 1,
  "customer_id": 1,
  "status": "aberto",
  "items": [
    {
      "product_id": 1,
      "quantity": 1,
      "unit_price": 120.0
    },
    {
      "product_id": 2,
      "quantity": 1,
      "unit_price": 80.0
    }
  ],
  "coupons": [],
  "subtotal": 200.0,
  "discount": 0.0,
  "shipping": 28.0,
  "total": 228.0,
  "taxes": 14.4
}
```

Consultamos o preço dos produtos no servidor e não aceitamos preços informados pelo cliente.

Neste exemplo, consideramos um cliente da região Nordeste.

#### Possíveis erros

| Código | Motivo                          |
| ------ | ------------------------------- |
| 400    | Dados inválidos ou pedido vazio |
| 401    | Usuário não autenticado         |
| 403    | Usuário não é cliente           |
| 404    | Produto não encontrado          |

### GET /pedidos

Listamos os pedidos.

**Acesso:** Cliente ou administrador.

Retornamos somente os próprios pedidos para clientes e todos os pedidos para administradores.

#### Resposta — 200 OK

```json
[
  {
    "id": 1,
    "customer_id": 1,
    "status": "aberto",
    "subtotal": 200.0,
    "discount": 0.0,
    "shipping": 28.0,
    "total": 228.0,
    "taxes": 14.4
  }
]
```

#### Possíveis erros

| Código | Motivo                  |
| ------ | ----------------------- |
| 401    | Usuário não autenticado |
| 403    | Usuário sem permissão   |

### GET /pedidos/:id

Consultamos os detalhes de um pedido.

**Acesso:** Cliente proprietário do pedido ou administrador.

#### Resposta — 200 OK

```json
{
  "id": 1,
  "customer_id": 1,
  "status": "aberto",
  "items": [
    {
      "product_id": 1,
      "quantity": 1,
      "unit_price": 120.0
    },
    {
      "product_id": 2,
      "quantity": 1,
      "unit_price": 80.0
    }
  ],
  "coupons": [],
  "subtotal": 200.0,
  "discount": 0.0,
  "shipping": 28.0,
  "total": 228.0,
  "taxes": 14.4
}
```

#### Possíveis erros

| Código | Motivo                  |
| ------ | ----------------------- |
| 400    | ID inválido             |
| 401    | Usuário não autenticado |
| 403    | Usuário sem permissão   |
| 404    | Pedido não encontrado   |

### POST /pedidos/:id/cupons

Aplicamos um cupom de desconto a um pedido aberto.

**Acesso:** Cliente proprietário do pedido.

#### Requisição

```json
{
  "code": "BEMVINDO10"
}
```

#### Resposta — 200 OK

```json
{
  "id": 1,
  "status": "aberto",
  "coupons": ["BEMVINDO10"],
  "subtotal": 200.0,
  "discount": 20.0,
  "shipping": 28.0,
  "total": 208.0,
  "taxes": 14.4
}
```

#### Regras

- Permitimos a aplicação de cupons apenas em pedidos abertos.
- Aceitamos somente cupons dentro da validade.
- Verificamos o valor mínimo exigido em relação ao subtotal.
- Limitamos a quantidade a dois cupons por pedido.
- Impedimos a aplicação repetida do mesmo cupom.
- Aceitamos cupons não cumulativos apenas de forma individual.
- Limitamos os descontos sobre o subtotal a 30%.
- Aplicamos os cupons nesta ordem: percentual, fixo e frete.

#### Possíveis erros

| Código | Motivo                                         |
| ------ | ---------------------------------------------- |
| 400    | Dados inválidos                                |
| 401    | Usuário não autenticado                        |
| 403    | Usuário sem permissão                          |
| 404    | Pedido ou cupom não encontrado                 |
| 409    | Cupom vencido, repetido ou outra regra violada |

### POST /pedidos/:id/confirmar

Confirmamos um pedido aberto.

**Acesso:** Cliente proprietário do pedido.

Não exigimos corpo na requisição.

Antes de confirmar o pedido, verificamos o estoque de todos os produtos e validamos novamente os cupons.

Em caso de estoque insuficiente para qualquer produto, não confirmamos o pedido nem retiramos nenhum item do estoque.

#### Resposta — 200 OK

Neste exemplo, utilizamos o pedido de aceite da rubrica, com os cupons BEMVINDO10 e PDA15 já aplicados:

```json
{
  "id": 1,
  "customer_id": 1,
  "status": "confirmado",
  "items": [
    {
      "product_id": 1,
      "quantity": 1,
      "unit_price": 120.0
    },
    {
      "product_id": 2,
      "quantity": 1,
      "unit_price": 80.0
    }
  ],
  "coupons": ["BEMVINDO10", "PDA15"],
  "subtotal": 200.0,
  "discount": 35.0,
  "shipping": 28.0,
  "total": 193.0,
  "taxes": 14.4
}
```

#### Possíveis erros

| Código | Motivo                                           |
| ------ | ------------------------------------------------ |
| 400    | ID inválido                                      |
| 401    | Usuário não autenticado                          |
| 403    | Usuário sem permissão                            |
| 404    | Pedido não encontrado                            |
| 409    | Estoque insuficiente ou regra de negócio violada |

#### Exemplo de erro — 409 Conflict

```json
{
  "erros": [
    "Estoque insuficiente: Mouse (pedido 3, disponível 1)",
    "Estoque insuficiente: Livro (pedido 2, disponível 0)"
  ]
}
```

Informamos na resposta todos os itens com estoque insuficiente.

### POST /pedidos/:id/cancelar

Cancelamos um pedido.

**Acesso:** Cliente proprietário do pedido.

Não exigimos corpo na requisição.

Ao cancelar um pedido confirmado, devolvemos os produtos ao estoque. Ao cancelar um pedido aberto, mantemos o estoque inalterado.

#### Resposta — 200 OK

```json
{
  "id": 1,
  "status": "cancelado"
}
```

#### Possíveis erros

| Código | Motivo                  |
| ------ | ----------------------- |
| 400    | ID inválido             |
| 401    | Usuário não autenticado |
| 403    | Usuário sem permissão   |
| 404    | Pedido não encontrado   |
| 409    | Pedido já cancelado     |

## Relatórios

Consideramos somente pedidos confirmados em todos os relatórios.

Utilizamos consultas SQL com `JOIN`, funções de agregação como `SUM` e `COUNT`, e agrupamentos com `GROUP BY`.

### GET /relatorios/faturamento

Retornamos o faturamento total, a quantidade de pedidos confirmados e o ticket médio.

**Acesso:** Administrador.

#### Resposta — 200 OK

```json
{
  "revenue": 193.0,
  "order_count": 1,
  "average_ticket": 193.0
}
```

### GET /relatorios/por-categoria

Retornamos o faturamento bruto por categoria, antes dos descontos.

**Acesso:** Administrador.

#### Resposta — 200 OK

```json
[
  {
    "category_id": 1,
    "category_name": "eletronicos",
    "revenue": 120.0
  },
  {
    "category_id": 2,
    "category_name": "livros",
    "revenue": 80.0
  }
]
```

### GET /relatorios/repasse

Retornamos o valor bruto, a comissão e o valor a repassar para cada vendedor.

**Acesso:** Administrador ou vendedor.

Retornamos todos os repasses para administradores e somente o próprio repasse para cada vendedor.

#### Resposta — 200 OK

```json
[
  {
    "seller_id": 1,
    "store_name": "TechBahia",
    "gross_value": 120.0,
    "commission": 9.6,
    "net_value": 110.4
  },
  {
    "seller_id": 2,
    "store_name": "Livraria Sol",
    "gross_value": 80.0,
    "commission": 12.0,
    "net_value": 68.0
  }
]
```

Não descontamos os cupons nem o frete do repasse dos vendedores.

### GET /relatorios/top-produtos

Retornamos os três produtos mais vendidos, considerando a quantidade de unidades vendidas.

**Acesso:** Administrador.

#### Resposta — 200 OK

```json
[
  {
    "product_id": 1,
    "name": "Mouse",
    "quantity_sold": 1
  },
  {
    "product_id": 2,
    "name": "Livro de JavaScript",
    "quantity_sold": 1
  }
]
```

Com menos de três produtos vendidos, retornamos somente os produtos com vendas registradas.

#### Possíveis erros dos relatórios

| Código | Motivo                  |
| ------ | ----------------------- |
| 401    | Usuário não autenticado |
| 403    | Usuário sem permissão   |

## Decisões gerais

- Utilizamos IDs como números inteiros positivos.
- Utilizamos números JSON para valores monetários e calculamos os valores com precisão de centavos.
- Nunca retornamos senhas, hashes de senhas ou CPF.
- Identificamos clientes e vendedores pelo JWT.
- Calculamos os valores financeiros no servidor.
- Preservamos os valores históricos dos pedidos confirmados.
- Retornamos arrays vazios nas listagens sem registros.
- Informamos os tributos sem adicioná-los ao total.

## Preservação do histórico

Preservamos os valores financeiros registrados na confirmação do pedido, incluindo os tributos e as comissões utilizados nos cálculos.

Mantemos as associações com os cupons e produtos utilizados e bloqueamos a exclusão de registros vinculados a pedidos.
