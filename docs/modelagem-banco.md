# MercadoÁgil 2.0 — Modelagem do Banco de Dados

## Objetivo

Organizamos o banco de dados com base no código herdado do Módulo 1
e nos requisitos da rubrica do Módulo 2.

Documentamos nossas decisões para facilitar o entendimento da
modelagem e a implementação do banco de dados.

## Convenções adotadas

- Utilizamos nomes de tabelas e campos em inglês.
- Utilizamos nomes de tabelas no plural.
- Utilizamos snake_case, como em user_id e unit_price.

## Diagrama Entidade-Relacionamento (DER)

Dividimos o banco de dados em nove tabelas.

![Diagrama Entidade-Relacionamento](./der.png)

## Entendendo as tabelas

### Users

Armazenamos as informações de acesso ao sistema, como e-mail,
hash da senha e papel do usuário.

Utilizamos três papéis: cliente, vendedor e administrador.

### Customers

Armazenamos as informações específicas dos clientes,
como nome, CPF e estado.

Mas por que separar users de customers?

Separamos as informações de acesso ao sistema das informações
específicas de quem realiza compras.

Também armazenamos a UF do cliente para identificar a região
de entrega e calcular o frete, mantendo a lógica do código herdado.

### Sellers

Seguimos a mesma lógica de customers, mas armazenamos
informações específicas dos vendedores, como o nome da loja
e o CNPJ.

Associamos cada vendedor à sua conta na tabela users.

### Categories

Armazenamos as categorias dos produtos e suas respectivas
taxas de tributos e comissões.

Por exemplo, utilizamos uma alíquota de 12% e uma comissão
de 8% para a categoria de eletrônicos.

Evitamos repetir essas informações em cada produto ao criar
uma tabela específica para categorias.

### Products

Armazenamos os produtos disponíveis no marketplace, incluindo
nome, preço atual, quantidade em estoque, vendedor e categoria.

Relacionamos cada produto a um vendedor e a uma categoria.

Optamos por armazenar o estoque diretamente nessa tabela,
pois trabalhamos com uma única quantidade disponível por produto.

### Orders

Armazenamos as informações gerais dos pedidos, como cliente,
status, subtotal, descontos, frete, total e data de criação.

Utilizamos três status:

- aberto
- confirmado
- cancelado

Representamos o relacionamento entre clientes e pedidos
como 1:N, pois associamos cada pedido a apenas um cliente
e permitimos vários pedidos por cliente.

Entre pedidos e produtos, temos um relacionamento N:N.

Para representar essa associação, utilizamos uma tabela
intermediária chamada order_items.

#### Order_items

Utilizamos essa tabela para conectar pedidos e produtos.

Armazenamos os produtos de cada pedido, suas quantidades,
preços unitários, categorias e valores de tributos e comissões.

Por exemplo:

| Pedido | Produto | Quantidade |
| ------ | ------- | ---------- |
| 1      | Mouse   | 1          |
| 1      | Livro   | 1          |
| 2      | Mouse   | 2          |

Uma das principais decisões dessa tabela é a preservação
do preço histórico.

Imagine uma compra de um mouse por R$ 120,00. Mesmo após
uma alteração no preço para R$ 150,00, mantemos o valor
original de R$ 120,00 no pedido.

Também preservamos a categoria e os valores de tributos
e comissões registrados na compra.

Assim, evitamos alterações nos resultados financeiros
de pedidos antigos.

### Coupons

Armazenamos os cupons de desconto do marketplace.

Registramos o código, tipo de desconto, valor, validade,
valor mínimo de compra e cumulatividade.

Utilizamos três tipos de cupons:

- Percentual: desconto em porcentagem.
- Fixo: desconto em reais.
- Frete: frete gratuito.

Aplicamos os cupons ao pedido inteiro, e não aos produtos
individualmente.

#### Order_coupons

Utilizamos essa tabela intermediária para conectar pedidos
e cupons.

Permitimos até dois cupons por pedido e a utilização de um
mesmo cupom em diferentes pedidos.

Por isso, representamos o relacionamento entre orders
e coupons como N:N.

Utilizamos uma chave primária composta pelo identificador
do pedido e pelo identificador do cupom para impedir
associações duplicadas.

## Resumo dos relacionamentos

| Tabelas                  | Relacionamento                |
| ------------------------ | ----------------------------- |
| Users e Customers        | 1:1                           |
| Users e Sellers          | 1:1                           |
| Customers e Orders       | 1:N                           |
| Sellers e Products       | 1:N                           |
| Categories e Products    | 1:N                           |
| Categories e Order_items | 1:N                           |
| Orders e Products        | N:N, através de order_items   |
| Orders e Coupons         | N:N, através de order_coupons |

## Normalização (3FN)

Organizamos os dados para evitar repetições desnecessárias
e dependências entre informações que não pertencem à mesma
entidade.

Separamos as categorias dos produtos porque o nome,
a alíquota e a comissão dependem da categoria.

Também utilizamos tabelas intermediárias para organizar
os relacionamentos de muitos para muitos.

Diferenciamos o preço atual do produto do preço histórico
registrado no item do pedido, pois representam informações
distintas.

## Preservação do histórico

Registramos o preço unitário, a categoria e os valores
de tributos e comissões no momento da criação do item.

Mantemos esses valores durante a confirmação do pedido.

Calculamos os tributos e as comissões sobre o valor bruto
da linha inteira, considerando a quantidade comprada.

Armazenamos os resultados dos cálculos financeiros em orders
para preservar os valores finais dos pedidos confirmados.

Utilizamos essa redundância de forma intencional e mantemos
a consistência dos valores pela camada de serviço.

## Representação dos valores

Utilizamos valores decimais para representar dinheiro.

Para as taxas das categorias, utilizamos valores fracionários:

| Percentual | Valor armazenado |
| ---------- | ---------------- |
| 0%         | 0.00             |
| 5%         | 0.05             |
| 8%         | 0.08             |
| 12%        | 0.12             |
| 15%        | 0.15             |

Mantemos esse formato para preservar a lógica de cálculo
do código herdado.

Para cupons percentuais, utilizamos 10.00 para representar 10%.

## Integridade dos dados

Utilizamos as seguintes restrições:

- PK: identificamos cada registro de maneira única.
- FK: conectamos registros de diferentes tabelas.
- Unique: impedimos valores duplicados.
- Not Null: exigimos o preenchimento de informações.
- Default: estabelecemos valores padrões.
- Restrict: impedimos exclusões que comprometam relacionamentos.

Na implementação, validaremos também:

- Preços maiores que zero.
- Estoque maior ou igual a zero.
- Quantidades de itens maiores que zero.
- Taxas de categorias entre 0 e 1.
- Valores de cupons não negativos.
- Cupons percentuais entre 0 e 100.
- Papéis, status e tipos de cupons válidos.

## Exclusão de registros

Bloqueamos a exclusão de produtos e cupons associados
a pedidos, independentemente do status do pedido.

Preservamos os relacionamentos e o histórico das compras.

## Papéis dos usuários

Utilizamos apenas um papel por usuário.

Associamos clientes ao perfil de customers e vendedores
ao perfil de sellers.

Para administradores, utilizamos somente a tabela users.

Garantiremos a correspondência entre o papel e o perfil
na camada de serviço.
