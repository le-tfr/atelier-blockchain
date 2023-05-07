// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

// Contrat de vote
contract Voting is Ownable {
    // Structure représentant un électeur
    struct Voter {
        bool isRegistered; // Est-ce que l'électeur est enregistré
        bool hasVoted; // Est-ce que l'électeur a voté
        uint votedProposalId; // Identifiant de la proposition pour laquelle l'électeur a voté
    }

    // Structure représentant une proposition
    struct Proposal {
        string description; // Description de la proposition
        uint voteCount; // Nombre de votes pour la proposition
    }

    // Énumération décrivant les étapes du processus de vote
    enum WorkflowStatus {
        RegisteringVoters, // Enregistrement des électeurs
        ProposalsRegistrationStarted, // Début de l'enregistrement des propositions
        ProposalsRegistrationEnded, // Fin de l'enregistrement des propositions
        VotingSessionStarted, // Début de la session de vote
        VotingSessionEnded, // Fin de la session de vote
        VotesTallied // Votes comptabilisés
    }

    // Variable pour suivre l'état actuel du processus de vote
    WorkflowStatus public workflowStatus;
    // Mapping des électeurs avec leur adresse
    mapping(address => Voter) public voters;
    // Tableau pour stocker les adresses des électeurs
    address[] public voterAddresses;
    // Tableau pour stocker les propositions
    Proposal[] public proposals;
    // Identifiant de la proposition gagnante
    uint public winningProposalId;

    // Événements
    event VoterRegistered(address voterAddress);
    event WorkflowStatusChange(
        WorkflowStatus previousStatus,
        WorkflowStatus newStatus
    );
    event ProposalRegistered(uint proposalId);
    event Voted(address voter, uint proposalId);
    event VoterRemoved(address voterAddress);

    // Modificateur pour vérifier si l'émetteur est un électeur enregistré
    modifier onlyRegisteredVoter() {
        require(
            voters[msg.sender].isRegistered,
            "Only registered voters can perform this action"
        );
        _;
    }

    // Fonction pour enregistrer un électeur
    function registerVoter(address _voterAddress) public onlyOwner {
        require(
            workflowStatus == WorkflowStatus.RegisteringVoters,
            "Voters registration has ended"
        );
        require(
            !voters[_voterAddress].isRegistered,
            "Voter already registered"
        );
        voters[_voterAddress] = Voter(true, false, 0);
        voterAddresses.push(_voterAddress); // Ajoute l'adresse de l'électeur au tableau voterAddresses
        emit VoterRegistered(_voterAddress);
    }

    // Fonction pour démarrer l'enregistrement des propositions
    function startProposalsRegistration() public onlyOwner {
        require(
            workflowStatus == WorkflowStatus.RegisteringVoters,
            "Voters registration is not complete"
        );
        workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(
            WorkflowStatus.RegisteringVoters,
            workflowStatus
        );
    }

    // Fonction pour enregistrer une proposition
    function registerProposal(
        string memory _description
    ) public onlyRegisteredVoter {
        require(
            workflowStatus == WorkflowStatus.ProposalsRegistrationStarted,
            "Proposals registration is not active"
        );
        proposals.push(Proposal(_description, 0));
        uint proposalId = proposals.length - 1;
        emit ProposalRegistered(proposalId);
    }

    // Fonction pour mettre fin à l'enregistrement des propositions
    function endProposalsRegistration() public onlyOwner {
        require(
            workflowStatus == WorkflowStatus.ProposalsRegistrationStarted,
            "Proposals registration is not active"
        );
        workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(
            WorkflowStatus.ProposalsRegistrationStarted,
            workflowStatus
        );
    }

    // Fonction pour démarrer la session de vote
    function startVotingSession() public onlyOwner {
        require(
            workflowStatus == WorkflowStatus.ProposalsRegistrationEnded,
            "Proposals registration is not complete"
        );
        workflowStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(
            WorkflowStatus.ProposalsRegistrationEnded,
            workflowStatus
        );
    }

    // Fonction pour voter pour une proposition
    function vote(uint _proposalId) public onlyRegisteredVoter {
        require(
            workflowStatus == WorkflowStatus.VotingSessionStarted,
            "Voting session is not active"
        );
        require(!voters[msg.sender].hasVoted, "Voter has already voted");

        voters[msg.sender].hasVoted = true;
        voters[msg.sender].votedProposalId = _proposalId;

        proposals[_proposalId].voteCount++;

        emit Voted(msg.sender, _proposalId);
    }

    // Fonction pour mettre fin à la session de vote
    function endVotingSession() public onlyOwner {
        require(
            workflowStatus == WorkflowStatus.VotingSessionStarted,
            "Voting session is not active"
        );
        workflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(
            WorkflowStatus.VotingSessionStarted,
            workflowStatus
        );
    }

    // Fonction pour comptabiliser les votes
    function tallyVotes() public onlyOwner {
        require(
            workflowStatus == WorkflowStatus.VotingSessionEnded,
            "Voting session has not ended"
        );
        workflowStatus = WorkflowStatus.VotesTallied;

        uint winningVoteCount = 0;

        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].voteCount > winningVoteCount) {
                winningVoteCount = proposals[i].voteCount;
                winningProposalId = i;
            }
        }

        emit WorkflowStatusChange(
            WorkflowStatus.VotingSessionEnded,
            workflowStatus
        );
    }

    // Fonction pour obtenir la description de la proposition gagnante
    function getWinner() public view returns (string memory) {
        require(
            workflowStatus == WorkflowStatus.VotesTallied,
            "Votes have not been tallied"
        );
        return proposals[winningProposalId].description;
    }

    // Fonction pour obtenir les détails d'une proposition
    function getProposal(
        uint _proposalId
    ) public view returns (string memory description, uint voteCount) {
        require(_proposalId < proposals.length, "Invalid proposal ID");
        Proposal storage proposal = proposals[_proposalId];
        return (proposal.description, proposal.voteCount);
    }

    // Fonction pour obtenir le nombre total de propositions
    function getProposalsCount() public view returns (uint) {
        return proposals.length;
    }

    // Fonction pour réinitialiser le vote
    function resetVoting() public onlyOwner {
        require(
            workflowStatus == WorkflowStatus.RegisteringVoters ||
                workflowStatus == WorkflowStatus.VotesTallied ||
                workflowStatus == WorkflowStatus.ProposalsRegistrationEnded,
            "Can only reset during RegisteringVoters or after VotesTallied"
        );

        // Réinitialiser le nombre de votes pour chaque proposition
        for (uint i = 0; i < proposals.length; i++) {
            proposals[i].voteCount = 0;
        }

        // Parcourir le tableau voterAddresses pour réinitialiser leur statut hasVoted
        for (uint i = 0; i < voterAddresses.length; i++) {
            address voterAddress = voterAddresses[i];
            voters[voterAddress].hasVoted = false;
            // Supprimer l'électeur de la correspondance
            delete voters[voterAddress];
        }

        // Supprimer toutes les propositions
        delete proposals;

        // Supprimer toutes les adresses des électeurs
        delete voterAddresses;

        // Changer le statut du workflow en RegisteringVoters
        workflowStatus = WorkflowStatus.RegisteringVoters;
        emit WorkflowStatusChange(
            workflowStatus,
            WorkflowStatus.RegisteringVoters
        );
    }

    // Fonction pour obtenir le statut du workflow
    function getWorkflowStatus() public view returns (WorkflowStatus) {
        return workflowStatus;
    }

    // Fonction pour obtenir l'adresse d'un électeur
    function getVoterAddress(uint index) public view returns (address) {
        return voterAddresses[index];
    }

    // Fonction pour obtenir le nombre d'électeurs
    function getVoterCount() public view returns (uint) {
        return voterAddresses.length;
    }

    // Fonction pour supprimer un électeur
    function removeVoter(address _voterAddress) public onlyOwner {
        require(
            workflowStatus == WorkflowStatus.RegisteringVoters,
            "Voters registration has ended"
        );
        require(voters[_voterAddress].isRegistered, "Voter is not registered");

        // Supprimer l'électeur de la correspondance
        delete voters[_voterAddress];

        // Trouver l'électeur dans le tableau voterAddresses et le supprimer
        for (uint i = 0; i < voterAddresses.length; i++) {
            if (voterAddresses[i] == _voterAddress) {
                voterAddresses[i] = voterAddresses[voterAddresses.length - 1];
                voterAddresses.pop();
                break;
            }
        }

        emit VoterRemoved(_voterAddress);
    }

}
