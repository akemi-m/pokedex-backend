// importações:
// importação do node - inicializar porta
const express = require("express");
const cors = require("cors");
// banco de dados - mongodb
const fs = require("fs").promises;
// permite chamar a url do pokeapi
const axios = require("axios");
const { json } = require("stream/consumers");
// servidor
const app = express();

// inicializar cors no app
app.use(cors());
// inicializar express
app.use(express.json());

// criar caminho para o banco de dados
const DB_FILE = "./pokemondb.json";

// inicializar banco de dados - asyc e await: garante que vai ler a linha de cima antes da de baixo
async function initDB() {
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify([]));
  }
}

initDB();
// api de get - nome da api
app.get("/pokemon-list", async (req, res) => {
  // receber do front o limite - definir um valor default
  const limit = req.query.limit || 40;
  // começar a fazer a req da api
  try {
    // lista do site
    const response = await axios.get(
      `https://pokeapi.co/api/v2/pokemon?limit=${limit}`
    );

    // salvar a lista
    const pokemonLista = response.data.results;

    // transformar em json para o front
    res.json(pokemonLista);
  } catch (error) {
    // erro
    res.status(500).send("Erro ao buscar a lista de Pokémon.");
  }
});

// api de post
app.post("/pokemon-save", async (req, res) => {
  // nome e url
  // abrir o obj body
  const { name, url } = req.body;

  // criar body de req - mandar para nosso banco de dados
  const pokemon = { name, url };
  try {
    // banco de dados
    const data = await fs.readFile(DB_FILE);
    // transformar data em json
    const pokemons = JSON.parse(data);

    // verificar se já existe no nosso banco o pokémon que a pessos quer adicionar
    // normalmente o errado dps o correto

    // se não for igual, vai salvar no banco
    if (!pokemons.some((p) => p.name === name)) {
      pokemons.push(pokemon);
      // transformar em json e salva no banco de dados
      await fs.writeFile(DB_FILE, JSON.stringify(pokemons, null, 2));
      res.status(200).send("Pokémon salvo!");
    } else {
      res.status(400).send("Pokémon já salvo.");
    }
  } catch (error) {
    // erro do servidor
    res.status(500).send("Erro ao salvar.");
  }
});

// api get - mesmo nome mudando o tipo - sendo que os dois são listas
app.get("/pokemon-save", async (req, res) => {
  try {
    const data = await fs.readFile(DB_FILE);
    const pokemons = JSON.parse(data);
    res.json(pokemons);
  } catch (error) {
    res.status(500).send("Erro ao buscar Pokémon salvos.");
  }
});

app.get("/pokemon-detail/:name", async (req, res) => {
  // pegando o nome do front
  const { name } = req.params;
  try {
    // chamar api nova axios
    const response = await axios.get(
      `https://pokeapi.co/api/v2/pokemon/${name}`
    );
    // definir o que vai ver no front
    const pokemonData = {
      name: response.data.name,
      id: response.data.id,
      imagem: response.data.sprites.front_default,
      type: response.data.types.map((type) => type.type.name),
    };
    res.json(pokemonData);
  } catch (error) {
    res.status(500).send("Erro ao buscar Pokémon detalhe.");
  }
});

app.delete("/pokemon-delete/:name", async (req, res) => {
  const { name } = req.params;
  try {
    const data = await fs.readFile(DB_FILE);
    const pokemons = JSON.parse(data);
    // pegar a lista que não tem o name
    const filterPokemons = pokemons.filter((p) => p.name !== name);
    // verificar se é igual a lista
    if (filterPokemons.length == pokemons.length) {
      return res.status(404).send("Pokémon não encontrado.");
    }
    await fs.writeFile(DB_FILE, JSON.stringify(filterPokemons, null, 2));
    res.status(200).send("Pokémon deletado com sucesso.");
  } catch (error) {
    res.status(500).send("Erro ao deletar o Pokémon.");
  }
});

// definir a porta
app.listen(3000, () => console.log("servidor rodando."));
