# Decisões sobre o Banco de Dados

## Banco de dados relacional (PostgreSQL)

Escolhemos o PostgreSQL porque o MercadoÁgil possui diversas
informações que se relacionam entre si, como clientes, vendedores,
produtos, pedidos e cupons.

Um banco relacional permite organizar essas informações em tabelas,
garantir a integridade dos dados e realizar consultas para gerar
relatórios financeiros.

Além disso, permite utilizar transações, que são importantes para
operações como a confirmação de pedidos e a atualização do estoque.

## NoSQL de documentos

Um banco NoSQL de documentos, como o MongoDB, armazena informações
em documentos com estruturas mais flexíveis.

No MercadoÁgil, poderia ser utilizado para armazenar avaliações
de produtos, comentários e outras informações que possuem
estruturas variadas.

Entretanto, para os pedidos e seus relacionamentos, consideramos
o PostgreSQL mais adequado.

## Busca semântica

A busca semântica permite encontrar informações considerando
o significado da pesquisa, e não apenas as palavras digitadas.

No MercadoÁgil, poderia ser utilizada para melhorar a pesquisa
de produtos, permitindo que os clientes encontrem itens a partir
de descrições e intenções de compra.
