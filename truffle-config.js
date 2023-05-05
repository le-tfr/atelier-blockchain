const HDWalletProvider = require("@truffle/hdwallet-provider");
const mnemonic = "season rib luggage horror delay provide alley affair buddy buffalo host arm"; // Remplacez par votre propre mnémonique

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545, // Port de votre blockchain locale, par exemple Ganache
      network_id: "*", // Correspond à tous les identifiants de réseau
    },
    ropsten: {
      provider: () =>
        new HDWalletProvider(
          mnemonic,
          "https://mainnet.infura.io/v3/4cf512758c39416cb16fa6a8087546c7" // Remplacez par votre propre clé de projet Infura
        ),
      network_id: 3,
      gas: 5500000,
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
};
