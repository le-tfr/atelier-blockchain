const HDWalletProvider = require("@truffle/hdwallet-provider");
const mnemonic = `${process.env.MNEMONIC}`;
const infuraId = `${process.env.INFURA_ID}`;
const infuraUrl = `https://ropsten.infura.io/v3/${infuraId}`;

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545, // Port de votre blockchain locale, par exemple Ganache
      network_id: "*", // Correspond à tous les identifiants de réseau
      outputPath: "./build"
    },
    ropsten: {
      provider: () =>
        new HDWalletProvider(
          mnemonic,
          infuraUrl
        ),
      network_id: 1337,
      gas: 5500000,
      gasPrice: 20000000000, // 20 Gwei
    },
  },

  compilers: {
    solc: {
      version: "0.8.19", // Spécifiez la version du compilateur Solidity à utiliser
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
  paths: {
    build: "./build"
  },
};
