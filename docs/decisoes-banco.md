# Decisões sobre o Banco de Dados

## Banco de dados relacional (PostgreSQL)

Escolhemos o PostgreSQL porque trabalhamos com informações
relacionadas entre si, como clientes, vendedores, produtos,
pedidos e cupons.

Utilizamos tabelas e relacionamentos para organizar os dados,
garantir sua integridade e facilitar a geração de relatórios
financeiros através de consultas SQL.

Também contamos com transações para garantir a consistência
de operações como a confirmação de pedidos e a atualização
do estoque.

## NoSQL de documentos

Consideramos bancos NoSQL de documentos, como o MongoDB,
para informações com estruturas mais flexíveis.

Poderíamos utilizar essa tecnologia para armazenar avaliações
e comentários sobre produtos em futuras versões do marketplace.

Entretanto, optamos pelo PostgreSQL para armazenar os pedidos
e os demais dados relacionais do sistema.

## Busca semântica

Consideramos a busca semântica como uma possibilidade para
melhorar a pesquisa de produtos.

Com essa tecnologia, poderíamos encontrar produtos pelo
significado da pesquisa, e não apenas pelas palavras digitadas.

Por exemplo, poderíamos retornar mouses e teclados em uma
pesquisa por acessórios para trabalhar no computador.
