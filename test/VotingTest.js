// Importer les artefacts du contrat
const Voting = artifacts.require("Voting");

contract("Voting", (accounts) => {
    const owner = accounts[0];
    const voter1 = accounts[1];
    const voter2 = accounts[2];
    const nonVoter = accounts[3];

    let votingInstance;

    beforeEach(async () => {
        votingInstance = await Voting.new({ from: owner });
    });

    // Test 1: Vérifier que seul le propriétaire peut enregistrer un électeur
    it("should allow only the owner to register a voter", async () => {
        // Enregistrement d'un électeur par le propriétaire
        await votingInstance.registerVoter(voter1, { from: owner });

        // Tentative d'enregistrement d'un électeur par un non-propriétaire
        try {
            await votingInstance.registerVoter(voter2, { from: voter1 });
            assert.fail("Only owner should be able to register a voter");
        } catch (error) {
            assert.include(
                error.message,
                "Ownable: caller is not the owner",
                "Expected an error with 'Ownable: caller is not the owner' message"
            );
        }
    });

    // Test 2: Vérifier que le propriétaire ne peut pas enregistrer un électeur déjà enregistré
    it("should not allow the owner to register an already registered voter", async () => {
        // Enregistrement d'un électeur par le propriétaire
        await votingInstance.registerVoter(voter1, { from: owner });

        // Tentative d'enregistrement du même électeur
        try {
            await votingInstance.registerVoter(voter1, { from: owner });
            assert.fail("Owner should not be able to register an already registered voter");
        } catch (error) {
            assert.include(
                error.message,
                "Voter already registered",
                "Expected an error with 'Voter already registered' message"
            );
        }
    });

    // Test 3: Vérifier que seul un électeur enregistré peut enregistrer une proposition
    it("should allow only a registered voter to register a proposal", async () => {
        // Enregistrement d'un électeur par le propriétaire
        await votingInstance.registerVoter(voter1, { from: owner });

        // Démarrer l'enregistrement des propositions
        await votingInstance.startProposalsRegistration({ from: owner });

        // Enregistrement d'une proposition par un électeur enregistré
        await votingInstance.registerProposal("Test Proposal", { from: voter1 });

        // Tentative d'enregistrement d'une proposition par un non-électeur
        try {
            await votingInstance.registerProposal("Test Proposal 2", { from: nonVoter });
            assert.fail("Only a registered voter should be able to register a proposal");
        } catch (error) {
            assert.include(
                error.message,
                "Only registered voters can perform this action",
                "Expected an error with 'Only registered voters can perform this action' message"
            );
        }
    });

    // Test 4: Vérifier que seul un électeur enregistré peut voter
    it("should allow only a registered voter to vote", async () => {
        // Enregistrement des électeurs par le propriétaire
        await votingInstance.registerVoter(voter1, { from: owner });
        await votingInstance.registerVoter(voter2, { from: owner });
        // Démarrer l'enregistrement des propositions
        await votingInstance.startProposalsRegistration({ from: owner });

        // Enregistrement des propositions par les électeurs enregistrés
        await votingInstance.registerProposal("Test Proposal 1", { from: voter1 });
        await votingInstance.registerProposal("Test Proposal 2", { from: voter2 });

        // Mettre fin à l'enregistrement des propositions et démarrer la session de vote
        await votingInstance.endProposalsRegistration({ from: owner });
        await votingInstance.startVotingSession({ from: owner });

        // Voter pour une proposition par un électeur enregistré
        await votingInstance.vote(0, { from: voter1 });

        // Tentative de vote par un non-électeur
        try {
            await votingInstance.vote(1, { from: nonVoter });
            assert.fail("Only a registered voter should be able to vote");
        } catch (error) {
            assert.include(
                error.message,
                "Only registered voters can perform this action",
                "Expected an error with 'Only registered voters can perform this action' message"
            );
        }
    });
});
