import React, { Component } from "react";
import Voting from "../../build/contracts/Voting.json";
import getWeb3 from "./getWeb3";
import "./App.css";

class App extends Component {
  state = {
    web3: null,
    accounts: null,
    contract: null,
    userAddress: null,
    isOwner: false,
    proposals: [],
  };

  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Voting.networks[networkId];
      const instance = new web3.eth.Contract(
        Voting.abi,
        deployedNetwork && deployedNetwork.address
      );

      this.setState({ web3, accounts, contract: instance });

      let account = accounts[0];

      this.setState({
        userAddress: account.slice(0, 6) + "..." + account.slice(38, 42),
      });

      const owner = await instance.methods.owner().call();
      if (account === owner) {
        this.setState({
          isOwner: true,
        });
      }
    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }
  };

  registerVoter = async () => {
    const { accounts, contract } = this.state;
    const voterAddress = document.getElementById("voterAddress").value;

    try {
      await contract.methods.registerVoter(voterAddress).send({ from: accounts[0] });
      alert("Électeur enregistré avec succès !");
    } catch (error) {
      alert("Une erreur est survenue lors de l'enregistrement de l'électeur.");
      console.error(error);
    }
  };

  registerProposal = async () => {
    const { accounts, contract } = this.state;
    const proposalName = document.getElementById("proposalName").value;

    try {
      await contract.methods.registerProposal(proposalName).send({ from: accounts[0] });
      alert("Proposition enregistrée avec succès !");
    } catch (error) {
      alert("Une erreur est survenue lors de l'enregistrement de la proposition.");
      console.error(error);
    }
  };

  vote = async () => {
    const { accounts, contract } = this.state;
    const proposalId = parseInt(document.getElementById("proposalId").value);

    try {
      await contract.methods.vote(proposalId).send({ from: accounts[0] });
      alert("Vote effectué avec succès !");
    } catch (error) {
      alert("Une erreur est survenue lors du vote.");
      console.error(error);
    }
  };

  getResults = async () => {
    const { contract } = this.state;
    const proposals = await contract.methods.getProposals().call();
    this.setState({ proposals });
  };

  render() {
    return (
      <div className="App">
        <div className="flex flex-col justify-between min-h-screen">
          <div className="flex-1">
            <header className="header">Voting DApp</header>
            <div className="register-container">
              <h2>Register Voter</h2>
              <div className="flex space-x-4">
                <input
                  type="text"
                  id="voterAddress"
                  placeholder="Voter Address"
                />
                <button id="registerVoterBtn" onClick={this.registerVoter}>
                  Register Voter
                </button>
              </div>
            </div>
            <div className="register-container">
              <h2>Register Proposal</h2>
              <div className="flex space-x-4">
                <input
                  type="text"
                  id="proposalName"
                  placeholder="Proposal Name"
                />
                <button id="registerProposalBtn" onClick={this.registerProposal}>
                  Register Proposal
                </button>
              </div>
            </div>
            <div className="register-container">
              <h2>Vote for Proposal</h2>
              <div className="flex space-x-4">
                <input
                  type="number"
                  id="proposalId"
                  placeholder="Proposal ID"
                />
                <button id="voteBtn" onClick={this.vote}>
                  Vote
                </button>
              </div>
            </div>
            <div className="results-container">
              <h2>Results</h2>
              <button id="getResultsBtn" onClick={this.getResults}>
                Get Results
              </button>
              <ul className="results-list">
                {this.state.proposals.map((proposal, index) => (
                  <li key={index}>
                    {proposal.name}: {proposal.voteCount} votes
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
  }
  export default App;         
