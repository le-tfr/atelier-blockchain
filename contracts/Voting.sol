// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Voting is Ownable {
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }

    struct Proposal {
        string description;
        uint voteCount;
    }

    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    WorkflowStatus public workflowStatus;
    mapping(address => Voter) public voters;
    address[] public voterAddresses; // New array to store voter addresses
    Proposal[] public proposals;
    uint public winningProposalId;

    event VoterRegistered(address voterAddress);
    event WorkflowStatusChange(
        WorkflowStatus previousStatus,
        WorkflowStatus newStatus
    );
    event ProposalRegistered(uint proposalId);
    event Voted(address voter, uint proposalId);
    event VoterRemoved(address voterAddress);

    modifier onlyRegisteredVoter() {
        require(
            voters[msg.sender].isRegistered,
            "Only registered voters can perform this action"
        );
        _;
    }

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
        voterAddresses.push(_voterAddress); // Add voter address to voterAddresses array
        emit VoterRegistered(_voterAddress);
    }

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

    function tallyVotes() public onlyOwner {
        require(
            workflowStatus == WorkflowStatus.VotingSessionEnded,
            "Voting session has not ended"
        );
        workflowStatus = WorkflowStatus.VotesTallied;

        uint winningVoteCount = 0;
        //uint winningProposalId = 0;

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

    function getWinner() public view returns (string memory) {
        require(
            workflowStatus == WorkflowStatus.VotesTallied,
            "Votes have not been tallied"
        );
        return proposals[winningProposalId].description;
    }

    function getProposal(
        uint _proposalId
    ) public view returns (string memory description, uint voteCount) {
        require(_proposalId < proposals.length, "Invalid proposal ID");
        Proposal storage proposal = proposals[_proposalId];
        return (proposal.description, proposal.voteCount);
    }

    function getProposalsCount() public view returns (uint) {
        return proposals.length;
    }

    function resetVoting() public onlyOwner {
    // Allow resetting only if voting hasn't started or has already ended
    require(
        workflowStatus == WorkflowStatus.RegisteringVoters || workflowStatus == WorkflowStatus.VotesTallied || workflowStatus == WorkflowStatus.ProposalsRegistrationEnded,
        "Can only reset during RegisteringVoters or after VotesTallied"
    );

    // Reset the vote count for each proposal
    for (uint i = 0; i < proposals.length; i++) {
        proposals[i].voteCount = 0;
    }

    // Iterate through the voterAddresses array to reset their hasVoted status
    for (uint i = 0; i < voterAddresses.length; i++) {
        address voterAddress = voterAddresses[i];
        voters[voterAddress].hasVoted = false;
        // Remove the voter from the mapping
        delete voters[voterAddress];
    }

    // Delete all the proposals
    delete proposals;

    // Delete all voter addresses
    delete voterAddresses;

    // Change the workflow status back to RegisteringVoters
    workflowStatus = WorkflowStatus.RegisteringVoters;
    emit WorkflowStatusChange(workflowStatus, WorkflowStatus.RegisteringVoters);
}


    function getWorkflowStatus() public view returns (WorkflowStatus) {
        return workflowStatus;
    }

    function getVoterAddress(uint index) public view returns (address) {
        return voterAddresses[index];
    }

    function getVoterCount() public view returns (uint) {
        return voterAddresses.length;
    }

    function removeVoter(address _voterAddress) public onlyOwner {
        require(
            workflowStatus == WorkflowStatus.RegisteringVoters,
            "Voters registration has ended"
        );
        require(voters[_voterAddress].isRegistered, "Voter is not registered");

        // Remove the voter from the mapping
        delete voters[_voterAddress];

        // Find the voter in the voterAddresses array and remove them
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
