## Modelagem do Banco de Dados

![Diagrama Entidade-Relacionamento](./docs/der.png)

Para entender as decisões tomadas durante a construção do banco
de dados, consulte a [documentação de modelagem](./docs/modelagem-banco.md).

### Normalização do Banco de Dados (3FN)

A modelagem foi organizada seguindo os princípios da terceira forma
normal (3FN), buscando evitar a repetição desnecessária de dados
e reduzir inconsistências.

Um exemplo é a separação entre produtos e categorias. Em vez de
armazenar o nome da categoria, suas taxas de tributos e comissões
em cada produto, essas informações ficam em uma tabela própria.

A tabela `order_items` também armazena o preço unitário no momento
da compra. Isso permite preservar o valor original dos pedidos,
mesmo que o preço atual de um produto seja alterado.

Os valores de subtotal, descontos, frete e total são calculados
pelas regras de negócio e armazenados para preservar os valores
financeiros dos pedidos confirmados.

### Documentação complementar

- [Decisões de modelagem](./docs/modelagem-banco.md)
- [Comparação dos tipos de banco de dados](./docs/decisoes-banco.md)
- [Código-fonte do DER (DBML)](./docs/der.dbml)
