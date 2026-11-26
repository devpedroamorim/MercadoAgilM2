## Modelagem do Banco de Dados

Organizamos o banco de dados em nove tabelas, utilizando
relacionamentos 1:1, 1:N e N:N, de acordo com os requisitos
do Módulo 2.

### Diagrama Entidade-Relacionamento (DER)

![Diagrama Entidade-Relacionamento](./docs/der.png)

### Normalização do Banco de Dados (3FN)

Organizamos as tabelas seguindo os princípios da terceira
forma normal (3FN), evitando redundâncias desnecessárias
e dependências entre atributos que não pertencem à mesma
entidade.

Separamos as categorias dos produtos porque o nome da
categoria, a alíquota de tributos e a comissão dependem
da categoria, e não diretamente do produto.

Utilizamos as tabelas intermediárias order_items e
order_coupons para representar os relacionamentos N:N.

Armazenamos o preço unitário, a categoria e os valores
de tributos e comissões em order_items para preservar
o histórico das compras, independentemente de futuras
alterações nos produtos ou nas taxas das categorias.

Armazenamos os resultados dos cálculos financeiros em
orders como uma redundância intencional para preservar
os valores históricos dos pedidos confirmados.

### Escolha do Banco de Dados

Escolhemos o PostgreSQL devido à necessidade de manter
relacionamentos entre as entidades, garantir a integridade
dos dados e realizar consultas SQL para gerar relatórios
financeiros.

## Documentação

- [Código-fonte do DER](./docs/der.dbml)
- [Modelagem do banco de dados](./docs/modelagem-banco.md)
- [Comparação entre PostgreSQL, NoSQL e busca semântica](./docs/decisoes-banco.md)
- [Contratos da API REST](./docs/contratos-api.md)
