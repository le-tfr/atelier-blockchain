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
    votingStatus: null,
    voterAddresses: [],
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

      if (instance) {
        this.setState({ web3, accounts, contract: instance });
      }


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

      this.getVotingStatus();
      this.getProposals();

      await this.getVoterAddresses();
      await this.handleAccountChange(accounts);
    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }

    window.ethereum.on("accountsChanged", (accounts) => {
      this.handleAccountChange(accounts);
    });
  };

  getContractInstance = async (web3) => {
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = Voting.networks[networkId];
    const instance = new web3.eth.Contract(
      Voting.abi,
      deployedNetwork && deployedNetwork.address
    );
    return instance;
  };

  handleAccountChange = async (accounts) => {
    const { contract } = this.state;
    const account = accounts[0];

    this.setState({
      userAddress: account.slice(0, 6) + "..." + account.slice(38, 42),
    });

    const owner = await contract.methods.owner().call();
    if (account === owner) {
      this.setState({
        isOwner: true,
      });
    } else {
      this.setState({
        isOwner: false,
      });
    }
  };

  registerVoter = async () => {
    const { accounts, contract } = this.state;
    const voterAddress = document.getElementById("voterAddress").value;

    try {
      await contract.methods.registerVoter(voterAddress).send({ from: accounts[0] });
      alert("Électeur enregistré avec succès !");
      this.getVotingStatus();
      this.getVoterAddresses();
    } catch (error) {
      alert("Une erreur est survenue lors de l'enregistrement de l'électeur.");
      console.error(error);
    }
  };

  removeVoter = async () => {
    const { accounts, contract } = this.state;
    const voterAddress = document.getElementById("removeVoterAddress").value;

    try {
      await contract.methods.removeVoter(voterAddress).send({ from: accounts[0] });
      alert("Électeur supprimé avec succès !");
      this.getVotingStatus();
      this.getVoterAddresses();
    } catch (error) {
      alert("Une erreur est survenue lors de la suppression de l'électeur.");
      console.error(error);
    }
  };


  registerProposal = async () => {
    const { accounts, contract } = this.state;
    const proposalName = document.getElementById("proposalName").value;

    try {
      await contract.methods.registerProposal(proposalName).send({ from: accounts[0] });
      alert("Proposition enregistrée avec succès !");
      this.getVotingStatus();
      this.getProposals();
    } catch (error) {
      alert("Une erreur est survenue lors de l'enregistrement de la proposition.");
      console.error(error);
    }
  };

  vote = async () => {
    const { accounts, contract } = this.state;
    const proposalId = this.state.selectedProposalId;

    try {
      await contract.methods.vote(proposalId).send({ from: accounts[0] });
      alert("Vote effectué avec succès !");
      this.getVotingStatus();
      this.getProposals();
    } catch (error) {
      alert("Une erreur est survenue lors du vote.");
      console.error(error);
    }
  };

  startProposalsRegistration = async () => {
    const { accounts, contract } = this.state;
    try {
      await contract.methods.startProposalsRegistration().send({ from: accounts[0] });
      alert("Enregistrement des propositions lancé avec succès !");
      this.getVotingStatus();
    } catch (error) {
      alert("Une erreur est survenue lors du lancement de l'enregistrement des propositions.");
      console.error(error);
    }
  };

  endProposalsRegistration = async () => {
    const { accounts, contract } = this.state;
    try {
      await contract.methods.endProposalsRegistration().send({ from: accounts[0] });
      alert("Enregistrement des propositions terminé avec succès !");
      this.getVotingStatus();
    } catch (error) {
      alert("Une erreurest survenue lors de la fin de l'enregistrement des propositions.");
      console.error(error);
    }
  };

  startVotingSession = async () => {
    const { accounts, contract } = this.state;
    try {
      await contract.methods.startVotingSession().send({ from: accounts[0] });
      alert("Session de vote lancée avec succès !");
      this.getVotingStatus();
    } catch (error) {
      alert("Une erreur est survenue lors du lancement de la session de vote.");
      console.error(error);
    }
  };

  endVotingSession = async () => {
    const { accounts, contract } = this.state;
    try {
      await contract.methods.endVotingSession().send({ from: accounts[0] });
      alert("Session de vote terminée avec succès !");
      this.getVotingStatus();
    } catch (error) {
      alert("Une erreur est survenue lors de la fin de la session de vote.");
      console.error(error);
    }
  };

  tallyVotes = async () => {
    const { accounts, contract } = this.state;
    try {
      await contract.methods.tallyVotes().send({ from: accounts[0] });
      alert("Dépouillement des votes effectué avec succès !");
      this.getVotingStatus();
      this.getProposals();
    } catch (error) {
      alert("Une erreur est survenue lors du dépouillement des votes.");
      console.error(error);
    }
  };
  getWinner = async () => {
    const { contract } = this.state;
    try {
      const winner = await contract.methods.getWinner().call();
      this.setState({ winner });
    } catch (error) {
      alert("Une erreur est survenue lors de la récupération du gagnant.");
      console.error(error);
    }
  };

  getProposals = async () => {
    const { contract } = this.state;
    try {
      const proposalCount = await contract.methods.getProposalsCount().call();
      let proposals = [];
      for (let i = 0; i < proposalCount; i++) {
        const proposal = await contract.methods.getProposal(i).call();
        proposals.push({ id: i, description: proposal.description, voteCount: proposal.voteCount });
      }
      this.setState({ proposals });
    } catch (error) {
      alert("Une erreur est survenue lors de la récupération des propositions.");
      console.error(error);
    }
  };

  resetVoting = async () => {
    const { accounts, contract } = this.state;
    try {
      await contract.methods.resetVoting().send({ from: accounts[0] });
      this.setState({ votingStatus: "registeringVoters" });
      alert("Le vote a été réinitialisé avec succès !");
      this.getVotingStatus();
      this.getVoterAddresses();
      this.getProposals();
    } catch (error) {
      alert("Une erreur est survenue lors de la réinitialisation du vote.");
      console.error(error);
    }
  };

  getVotingStatus = async () => {
    const { contract } = this.state;
    try {
      const votingStatus = await contract.methods.getWorkflowStatus().call();
      this.setState({ votingStatus });
    } catch (error) {
      console.error("Error fetching voting status:", error);
      alert("Une erreur est survenue lors de la récupération du statut du vote.");
    }
  };


  convertStatusToText(status) {
    switch (status) {
      case "0":
        return "Inscription des électeurs";
      case "1":
        return "Enregistrement des propositions commencé";
      case "2":
        return "Enregistrement des propositions terminé";
      case "3":
        return "Session de vote commencée";
      case "4":
        return "Session de vote terminée";
      case "5":
        return "Votes comptabilisés";
      default:
        return "Statut inconnu";
    }
  }

  handleProposalSelect = (event) => {
    this.setState({ selectedProposalId: event.target.value });
  };

  getVoterAddresses = async () => {
    const { contract } = this.state;
    try {
      const voterCount = await contract.methods.getVoterCount().call();
      let voterAddresses = [];
      for (let i = 0; i < voterCount; i++) {
        const voterAddress = await contract.methods.getVoterAddress(i).call();
        voterAddresses.push(voterAddress);
      }
      this.setState({ voterAddresses });
    } catch (error) {
      alert("Une erreur est survenue lors de la récupération des adresses des électeurs.");
      console.error(error);
    }
  };

  render() {
    const { isOwner, userAddress, proposals, winner, votingStatus } = this.state;

    const canRegisterVoter = votingStatus === "0";
    const canRegisterProposal = votingStatus === "1";
    const canRegisterProposalEnd = votingStatus === "2";
    const canVote = votingStatus === "3";
    const canVoteEnd = votingStatus === "4";
    const canTallyVote = votingStatus === "5"


    return (
      <div className="App">
        <h1>Système de vote décentralisé</h1>
        <div className="info-container">
          <p>Adresse de l'utilisateur : {userAddress}</p>
          <p className={`status-${votingStatus}`}>Statut du vote : {this.convertStatusToText(votingStatus)}</p>
        </div>

        {isOwner && (
          <div className="frame">
            <h2>Actions du propriétaire</h2>
            <div className="admin-section">
              <div className="frame">
                <h3>Ajout des électeurs</h3>
                <div>
                  <label htmlFor="voterAddress" className="espace">Ajout de l'adresse de l'électeur :</label>
                  <input type="text" id="voterAddress" disabled={!canRegisterVoter} />
                  <button onClick={this.registerVoter} disabled={!canRegisterVoter}>
                    Enregistrer un électeur
                  </button>
                </div>
                <div>
                  <label htmlFor="removeVoterAddress">Supprimer l'adresse de l'électeur :</label>
                  <input type="text" id="removeVoterAddress" disabled={!canRegisterVoter} />
                  <button onClick={this.removeVoter} disabled={!canRegisterVoter}>
                    Supprimer un électeur
                  </button>
                </div>
                <div>
                  <h3>Électeurs inscrits :</h3>
                  <ul>
                    {this.state.voterAddresses.map((address, index) => (
                      <li key={index}>{address}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="frame">
                <h3>Gestion du vote</h3>
                <div className="buttonOwner">
                  <h4>Gestion Propositions</h4>
                  <button onClick={this.startProposalsRegistration} disabled={!canRegisterVoter}>
                    Lancer l'enregistrement des propositions
                  </button>
                  <button onClick={this.endProposalsRegistration} disabled={!canRegisterProposal}>
                    Terminer l'enregistrement des propositions
                  </button>
                </div>
                <div>
                  <h4>Gestion Votes</h4>
                  <button onClick={this.startVotingSession} disabled={!canRegisterProposalEnd}>
                    Lancer la session de vote
                  </button>
                  <button onClick={this.endVotingSession} disabled={!canVote}>
                    Terminer la session de vote
                  </button>
                </div>
                <div>
                  <h4>Gestion dépouillement</h4>
                  <button onClick={this.tallyVotes} disabled={!canVoteEnd}>
                    Dépouiller les votes
                  </button>
                </div>
                <div>
                  <h4>Gestion Réinitialisation</h4>
                  <button onClick={this.resetVoting}>Réinitialiser le vote</button>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="frame">
          <h2>Espace utilisateur</h2>
          <div className="user-section">
            <div className="frame">
              <h3>Propositions</h3>
              <div>
                <label htmlFor="proposalName">Nom de la proposition :</label>
                <input type="text" id="proposalName" disabled={!canRegisterProposal} />
                <button onClick={this.registerProposal} disabled={!canRegisterProposal}>
                  Enregistrer une proposition
                </button>
              </div>

              <h4>Liste propositions :</h4>
              <ul>
                {proposals.length > 0 ? (
                  proposals.map((proposal) => (
                    <li key={proposal.id}>
                      Proposition {proposal.id} : {proposal.description}
                    </li>
                  ))
                ) : (
                  <li>Aucune proposition disponible</li>
                )}
              </ul>
            </div>
            <div className="frame">
              <h3>Votes</h3>
              <label htmlFor="proposalSelect">Choix de la proposition :</label>
              <select id="proposalSelect" onChange={this.handleProposalSelect} disabled={!canVote}>
                <option value="">Sélectionnez une proposition</option>
                {proposals.map((proposal) => (
                  <option key={proposal.id} value={proposal.id}>
                    Proposition {proposal.id} : {proposal.description}
                  </option>
                ))}
              </select>
              <button onClick={this.vote} disabled={!canVote}>
                Voter
              </button>
            </div>
            <div className="frame">
                <h3>Affichage des votes</h3>
                <ul>
                  {proposals.length > 0 ? (
                    proposals.map((proposal) => (
                      <li key={proposal.id}>
                        Proposition {proposal.id} : {proposal.description} - Nombre de votes : {proposal.voteCount}
                      </li>
                    ))
                  ) : (
                    <li>Aucune proposition disponible</li>
                  )}
                </ul>
            </div>          
            <div className="frame">
              <h3>Résultats du vote</h3>
              <button onClick={this.getWinner} disabled={!canTallyVote}>
                Afficher le gagnant
              </button>
              {winner && <p className="winner">Le gagnant est : {winner}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;

