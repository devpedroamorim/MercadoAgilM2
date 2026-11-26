# Contratos da API — MercadoÁgil 2.0

## Objetivo

Definimos os formatos de comunicação entre os clientes
e a API do MercadoÁgil.

Padronizamos as requisições e respostas para facilitar
o desenvolvimento entre os grupos.

## Convenções

- Utilizamos JSON na comunicação.
- Utilizamos campos em inglês e snake_case.
- Mantemos as rotas em português, conforme a rubrica.
- Utilizamos JWT para autenticação.
- Utilizamos bcrypt para gerar o hash das senhas.
- Nunca retornamos CPF, senha ou hash da senha.

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

Retornamos todos os erros no seguinte formato:

```json
{
  "erros": ["Descrição do erro"]
}
```

## Autenticação

### POST /auth/registro

Criamos uma conta de usuário e seu respectivo perfil.

**Acesso:** Público.

Permitimos o registro público de clientes e vendedores.
Criamos administradores exclusivamente pelo seeder.

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

### Utilização do JWT

Exigimos o envio do token no cabeçalho Authorization
das requisições às rotas protegidas.

```http
Authorization: Bearer jwt_token
```

Retornamos 401 para tokens ausentes, inválidos ou vencidos.

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

Retornamos um array vazio na ausência de produtos.

### GET /produtos/:id

Consultamos um produto específico pelo ID.

**Acesso:** Público.

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

Identificamos o vendedor através do token JWT.

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
| 403    | Usuário sem permissão    |
| 404    | Categoria não encontrada |

### PUT /produtos/:id

Atualizamos as informações de um produto.

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

Preservamos as informações históricas dos itens dos pedidos.

Não permitimos a alteração do vendedor proprietário
através desta rota.

#### Possíveis erros

| Código | Motivo                              |
| ------ | ----------------------------------- |
| 400    | Dados inválidos                     |
| 401    | Usuário não autenticado             |
| 403    | Usuário sem permissão               |
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
| 403    | Usuário sem permissão         |
| 404    | Produto não encontrado        |
| 409    | Produto associado a um pedido |

Bloqueamos a exclusão de produtos associados a qualquer
pedido para preservar o histórico das compras.

## Cupons

### POST /cupons

Cadastramos um novo cupom.

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
| 403    | Usuário sem permissão         |
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

| Código | Motivo                  |
| ------ | ----------------------- |
| 401    | Usuário não autenticado |
| 403    | Usuário sem permissão   |

### DELETE /cupons/:id

Excluímos um cupom.

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
| 403    | Usuário sem permissão       |
| 404    | Cupom não encontrado        |
| 409    | Cupom associado a um pedido |

Bloqueamos a exclusão de cupons associados a pedidos
para preservar o histórico.

## Pedidos

### POST /pedidos

Criamos um pedido com status aberto.

**Acesso:** Cliente autenticado.

Identificamos o cliente através do token JWT.

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

Consultamos os preços dos produtos no servidor.

Não aceitamos preços ou valores financeiros informados
pelo cliente.

Registramos o preço unitário, a categoria e os valores
de tributos e comissões durante a criação dos itens.

Não reservamos nem retiramos produtos do estoque
durante a criação de um pedido aberto.

Neste exemplo, consideramos um cliente da região Nordeste.

#### Possíveis erros

| Código | Motivo                          |
| ------ | ------------------------------- |
| 400    | Dados inválidos ou pedido vazio |
| 401    | Usuário não autenticado         |
| 403    | Usuário sem permissão           |
| 404    | Produto não encontrado          |

### GET /pedidos

Listamos os pedidos.

**Acesso:** Cliente ou administrador.

Retornamos apenas os próprios pedidos para clientes
e todos os pedidos para administradores.

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

Aplicamos um cupom a um pedido aberto.

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
  "coupons": ["BEMVINDO10"],
  "subtotal": 200.0,
  "discount": 20.0,
  "shipping": 28.0,
  "total": 208.0,
  "taxes": 14.4
}
```

#### Regras

- Permitimos a aplicação apenas em pedidos abertos.
- Aceitamos apenas cupons válidos.
- Verificamos o subtotal mínimo.
- Permitimos até dois cupons por pedido.
- Impedimos cupons duplicados.
- Utilizamos cupons não cumulativos individualmente.
- Limitamos os descontos sobre o subtotal a 30%.
- Aplicamos primeiro os cupons percentuais, depois os fixos
  e, por último, os cupons de frete.
- Impedimos valores totais negativos.

#### Possíveis erros

| Código | Motivo                                   |
| ------ | ---------------------------------------- |
| 400    | Dados inválidos                          |
| 401    | Usuário não autenticado                  |
| 403    | Usuário sem permissão                    |
| 404    | Pedido ou cupom não encontrado           |
| 409    | Violação das regras de cupons ou pedidos |

### POST /pedidos/:id/confirmar

Confirmamos um pedido aberto.

**Acesso:** Cliente proprietário do pedido.

Não exigimos corpo na requisição.

Verificamos o estoque de todos os produtos e validamos
novamente os cupons antes de confirmar o pedido.

Em caso de estoque insuficiente, não confirmamos o pedido
nem retiramos qualquer produto do estoque.

Mantemos o preço, a categoria e os valores de tributos
e comissões registrados nos itens.

#### Resposta — 200 OK

Utilizamos o pedido de exemplo da rubrica, com os cupons
BEMVINDO10 e PDA15 já aplicados.

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

Informamos todos os itens com estoque insuficiente.

### POST /pedidos/:id/cancelar

Cancelamos um pedido.

**Acesso:** Cliente proprietário do pedido.

Não exigimos corpo na requisição.

Ao cancelar um pedido confirmado, devolvemos os produtos
ao estoque.

Ao cancelar um pedido aberto, mantemos o estoque inalterado.

Preservamos os itens e valores históricos após o cancelamento.

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

Consideramos somente pedidos confirmados nos relatórios.

Utilizamos consultas SQL com JOIN e funções de agregação,
como SUM, COUNT e GROUP BY.

Utilizamos os preços, categorias e valores de comissões
registrados historicamente em order_items.

### GET /relatorios/faturamento

Retornamos o faturamento total, a quantidade de pedidos
confirmados e o ticket médio.

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

Retornamos o faturamento bruto por categoria,
antes dos descontos.

Utilizamos a categoria histórica de cada item.

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

Retornamos o valor bruto, a comissão e o valor
a repassar para cada vendedor.

**Acesso:** Administrador ou vendedor.

Retornamos todos os repasses para administradores
e apenas o próprio repasse para vendedores.

Utilizamos os valores históricos de comissão
registrados em order_items.

Não descontamos cupons nem frete dos repasses.

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

### GET /relatorios/top-produtos

Retornamos os três produtos mais vendidos por quantidade.

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

Retornamos menos de três produtos quando não possuímos
vendas suficientes para preencher o relatório.

#### Possíveis erros dos relatórios

| Código | Motivo                  |
| ------ | ----------------------- |
| 401    | Usuário não autenticado |
| 403    | Usuário sem permissão   |

## Regras financeiras

### Frete

Calculamos o frete utilizando a taxa da região de entrega
mais R$ 1,50 por unidade comprada.

| Região       | Taxa     |
| ------------ | -------- |
| Norte        | R$ 35,00 |
| Nordeste     | R$ 25,00 |
| Centro-Oeste | R$ 30,00 |
| Sudeste      | R$ 20,00 |
| Sul          | R$ 22,00 |

Oferecemos frete gratuito a partir de R$ 300,00,
considerando o subtotal após os descontos.

Também oferecemos frete gratuito com um cupom do tipo frete.

### Tributos e comissões

Calculamos os tributos e as comissões sobre o valor bruto
dos itens, antes dos descontos.

Armazenamos os respectivos valores históricos em order_items.

Informamos os tributos na resposta através do campo taxes,
somando os valores de tax_amount dos itens.

Não adicionamos os tributos ao total da compra.

Calculamos o repasse subtraindo a comissão histórica
do valor bruto dos itens de cada vendedor.

### Total do pedido

Utilizamos a seguinte fórmula:

total = subtotal - discount + shipping

Preservamos os valores finais após a confirmação do pedido.

## Decisões gerais

- Utilizamos IDs inteiros positivos.
- Utilizamos números JSON para valores monetários.
- Calculamos dinheiro com precisão de centavos.
- Utilizamos preços maiores que zero.
- Aceitamos apenas quantidades inteiras positivas nos itens.
- Impedimos estoque negativo.
- Identificamos clientes e vendedores pelo JWT.
- Calculamos os valores financeiros no servidor.
- Retornamos arrays vazios nas listagens sem registros.
- Retornamos zero nos totais e no ticket médio quando
  não possuímos pedidos confirmados.
- Validamos os dados com Zod.
- Utilizamos apenas um papel por usuário.
- Utilizamos os papéis cliente, vendedor e admin.
- Utilizamos os status aberto, confirmado e cancelado.
- Utilizamos os tipos percentual, fixo e frete para cupons.
- Utilizamos a chave erros em português, conforme a rubrica.

## Padronização dos percentuais

Utilizamos valores fracionários para as taxas das categorias,
como 0.12 para representar 12%.

Para cupons percentuais, utilizamos 10.00 para representar 10%.

Para cupons de frete, utilizamos o valor zero.

## Preservação do histórico

Registramos o preço unitário, a categoria e os valores
de tributos e comissões durante a criação dos itens.

Mantemos esses valores até a confirmação e preservamos
o histórico financeiro após a confirmação ou cancelamento.

Bloqueamos a exclusão de produtos e cupons associados
a pedidos, retornando HTTP 409.

Impedimos a alteração do vendedor proprietário do produto.

Utilizamos os dados históricos para calcular os relatórios
sem depender dos preços e taxas atuais.
