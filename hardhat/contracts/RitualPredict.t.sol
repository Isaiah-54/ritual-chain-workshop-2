// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {RitualPredict} from "./RitualPredict.sol";
import {RitualChain} from "./ritual/RitualChain.sol";
import {MockScheduler} from "../test/MockScheduler.sol";
import {MockTEERegistry} from "../test/MockTEERegistry.sol";
import {MockHTTP} from "../test/MockHTTP.sol";
import {MockJQ} from "../test/MockJQ.sol";

/// Solidity unit tests for RitualPredict (Hardhat 3 / forge-std).
contract MockRitualWallet {
    mapping(address => uint256) public balanceOf;
    mapping(address => uint256) public lockUntil;

    function deposit(uint256 lockDuration) external payable {
        balanceOf[msg.sender] += msg.value;
        lockUntil[msg.sender] = block.number + lockDuration;
    }
}

contract RitualPredictTest is Test {
    RitualPredict internal predict;
    MockScheduler internal scheduler;

    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);

    function setUp() public {
        // Deploy mocks and etch to canonical Ritual addresses.
        scheduler = new MockScheduler();
        vm.etch(RitualChain.SCHEDULER, address(scheduler).code);
        // nextCallId = 1 at storage slot 0
        vm.store(
            RitualChain.SCHEDULER,
            bytes32(uint256(0)),
            bytes32(uint256(1))
        );

        MockTEERegistry tee = new MockTEERegistry();
        vm.etch(RitualChain.TEE_SERVICE_REGISTRY, address(tee).code);

        MockHTTP http = new MockHTTP();
        vm.etch(RitualChain.HTTP_PRECOMPILE, address(http).code);

        MockJQ jq = new MockJQ();
        vm.etch(RitualChain.JQ_PRECOMPILE, address(jq).code);

        MockRitualWallet wallet = new MockRitualWallet();
        vm.etch(RitualChain.RITUAL_WALLET, address(wallet).code);

        predict = new RitualPredict(195);

        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(address(this), 100 ether);
    }

    function _defaultMarket()
        internal
        pure
        returns (RitualPredict.NewMarket memory)
    {
        return
            RitualPredict.NewMarket({
                question: "Will ETH be above $3000?",
                oracleUrl: "https://example.com/price.json",
                jsonPath: ".price",
                target: 3000,
                comparator: RitualPredict.Comparator.GT,
                bettingSeconds: 60,
                resolveDelaySeconds: 30
            });
    }

    function _minePastClose(uint256 marketId) internal {
        RitualPredict.Market memory m = predict.getMarket(marketId);
        if (block.number < m.closeBlock) {
            vm.roll(m.closeBlock + 1);
        }
    }

    function _execute(uint256 callId, uint256 executionIndex) internal {
        MockScheduler(RitualChain.SCHEDULER).execute(callId, executionIndex);
    }

    // ─── constructor / constants ─────────────────────────────────────────

    function test_DeployStoresBlockTime() public view {
        assertEq(predict.blockTimeMs(), 195);
    }

    function test_RevertZeroBlockTime() public {
        vm.expectRevert(RitualPredict.BadDuration.selector);
        new RitualPredict(0);
    }

    function test_ProtocolConstants() public view {
        assertEq(predict.MAX_ATTEMPTS(), 3);
        assertEq(predict.RETRY_INTERVAL_BLOCKS(), 200);
        assertEq(predict.RESOLVE_GAS_LIMIT(), 2_000_000);
        assertEq(predict.SCHEDULER_TTL_BLOCKS(), 150);
        assertEq(predict.HTTP_TTL_BLOCKS(), 100);
        assertEq(predict.EXECUTOR_PROBES(), 8);
    }

    // ─── createMarket validation ─────────────────────────────────────────

    function test_RevertEmptyQuestion() public {
        RitualPredict.NewMarket memory p = _defaultMarket();
        p.question = "";
        vm.expectRevert(RitualPredict.EmptyString.selector);
        predict.createMarket(p);
    }

    function test_RevertEmptyOracleUrl() public {
        RitualPredict.NewMarket memory p = _defaultMarket();
        p.oracleUrl = "";
        vm.expectRevert(RitualPredict.EmptyString.selector);
        predict.createMarket(p);
    }

    function test_RevertEmptyJsonPath() public {
        RitualPredict.NewMarket memory p = _defaultMarket();
        p.jsonPath = "";
        vm.expectRevert(RitualPredict.EmptyString.selector);
        predict.createMarket(p);
    }

    function test_RevertBettingBelowMin() public {
        RitualPredict.NewMarket memory p = _defaultMarket();
        p.bettingSeconds = 29;
        vm.expectRevert(RitualPredict.BadDuration.selector);
        predict.createMarket(p);
    }

    function test_RevertResolveDelayBelowMin() public {
        RitualPredict.NewMarket memory p = _defaultMarket();
        p.resolveDelaySeconds = 14;
        vm.expectRevert(RitualPredict.BadDuration.selector);
        predict.createMarket(p);
    }

    function test_CreateMarketRecordsRule() public {
        uint256 id = predict.createMarket(_defaultMarket());
        RitualPredict.Market memory m = predict.getMarket(id);
        assertEq(m.id, 1);
        assertEq(m.target, 3000);
        assertEq(uint8(m.comparator), uint8(RitualPredict.Comparator.GT));
        assertEq(m.totalYes, 0);
        assertEq(m.totalNo, 0);
        assertEq(m.attempts, 0);
        assertEq(uint8(m.outcome), uint8(RitualPredict.Outcome.Unresolved));
        assertEq(m.scheduleId, 1);
    }

    function test_CreateMarketSchedulesResolution() public {
        uint256 id = predict.createMarket(_defaultMarket());
        RitualPredict.Market memory m = predict.getMarket(id);

        (
            bytes memory data,
            uint32 gas,
            uint32 startBlock,
            uint32 numCalls,
            uint32 frequency,
            uint32 ttl,
            ,
            ,
            ,
            address payer,
            bool cancelled
        ) = MockScheduler(RitualChain.SCHEDULER).getCall(m.scheduleId);

        assertEq(gas, 2_000_000);
        assertEq(numCalls, 3);
        assertEq(frequency, 200);
        assertEq(ttl, 150);
        assertEq(uint256(startBlock), m.resolveBlock);
        assertEq(payer, address(predict));
        assertFalse(cancelled);
        assertEq(data.length, 68);
    }

    // ─── betting ─────────────────────────────────────────────────────────

    function test_AcceptsYesAndNoBets() public {
        uint256 id = predict.createMarket(_defaultMarket());

        vm.prank(alice);
        predict.bet{value: 1 ether}(id, true);

        vm.prank(bob);
        predict.bet{value: 2 ether}(id, false);

        RitualPredict.Market memory m = predict.getMarket(id);
        assertEq(m.totalYes, 1 ether);
        assertEq(m.totalNo, 2 ether);

        (uint256 yes, , , ) = predict.stakesOf(id, alice);
        assertEq(yes, 1 ether);
    }

    function test_RevertZeroBet() public {
        uint256 id = predict.createMarket(_defaultMarket());
        vm.expectRevert(RitualPredict.ZeroStake.selector);
        predict.bet{value: 0}(id, true);
    }

    function test_RevertBetAfterClose() public {
        uint256 id = predict.createMarket(_defaultMarket());
        _minePastClose(id);
        vm.prank(alice);
        vm.expectRevert(RitualPredict.BettingClosed.selector);
        predict.bet{value: 1 ether}(id, true);
    }

    // ─── oracle failure path ─────────────────────────────────────────────

    function test_FailedOracleRecordsAttempt() public {
        // Clear HTTP precompile so the oracle read fails.
        vm.etch(RitualChain.HTTP_PRECOMPILE, hex"");

        uint256 id = predict.createMarket(_defaultMarket());
        _minePastClose(id);
        _execute(1, 0);

        RitualPredict.Market memory m = predict.getMarket(id);
        assertEq(m.attempts, 1);
        assertEq(uint8(m.state), uint8(RitualPredict.MarketState.Resolving));
    }

    function test_MultipleFailedAttempts() public {
        vm.etch(RitualChain.HTTP_PRECOMPILE, hex"");

        uint256 id = predict.createMarket(_defaultMarket());
        _minePastClose(id);
        _execute(1, 0);
        _execute(1, 1);

        RitualPredict.Market memory m = predict.getMarket(id);
        assertEq(m.attempts, 2);
        assertEq(uint8(m.state), uint8(RitualPredict.MarketState.Resolving));
    }

    function test_ThirdFailedAttemptInvalidates() public {
        vm.etch(RitualChain.HTTP_PRECOMPILE, hex"");

        uint256 id = predict.createMarket(_defaultMarket());
        _minePastClose(id);
        _execute(1, 0);
        _execute(1, 1);
        _execute(1, 2);

        RitualPredict.Market memory m = predict.getMarket(id);
        assertEq(m.attempts, 3);
        assertEq(uint8(m.state), uint8(RitualPredict.MarketState.Invalid));
    }

    // ─── successful resolution ───────────────────────────────────────────

    function test_ResolvesYesThroughMocks() public {
        uint256 id = predict.createMarket(_defaultMarket());

        vm.prank(alice);
        predict.bet{value: 1 ether}(id, true);
        vm.prank(bob);
        predict.bet{value: 1 ether}(id, false);

        _minePastClose(id);
        _execute(1, 0);

        RitualPredict.Market memory m = predict.getMarket(id);
        assertEq(uint8(m.state), uint8(RitualPredict.MarketState.Resolved));
        assertEq(uint8(m.outcome), uint8(RitualPredict.Outcome.Yes));
        assertEq(m.observedValue, 3500);
    }

    function test_ResolvesNoWithGtAboveObserved() public {
        RitualPredict.NewMarket memory p = _defaultMarket();
        p.target = 4000;
        p.comparator = RitualPredict.Comparator.GT; // 3500 > 4000 => false => NO

        uint256 id = predict.createMarket(p);

        vm.prank(alice);
        predict.bet{value: 1 ether}(id, true);
        vm.prank(bob);
        predict.bet{value: 2 ether}(id, false);

        _minePastClose(id);
        _execute(1, 0);

        RitualPredict.Market memory m = predict.getMarket(id);
        assertEq(uint8(m.state), uint8(RitualPredict.MarketState.Resolved));
        assertEq(uint8(m.outcome), uint8(RitualPredict.Outcome.No));
        assertEq(m.observedValue, 3500);
    }

    function test_YesWinnerClaimsFullPool() public {
        uint256 id = predict.createMarket(_defaultMarket());

        vm.prank(alice);
        predict.bet{value: 1 ether}(id, true);
        vm.prank(bob);
        predict.bet{value: 2 ether}(id, false);

        _minePastClose(id);
        _execute(1, 0);

        (, , , uint256 aliceClaim) = predict.stakesOf(id, alice);
        (, , , uint256 bobClaim) = predict.stakesOf(id, bob);
        assertEq(aliceClaim, 3 ether);
        assertEq(bobClaim, 0);

        uint256 before = alice.balance;
        vm.prank(alice);
        predict.claimWinnings(id);
        assertEq(alice.balance, before + 3 ether);
    }

    function test_NoWinnerClaimsFullPool() public {
        RitualPredict.NewMarket memory p = _defaultMarket();
        p.target = 4000;
        p.comparator = RitualPredict.Comparator.GT;

        uint256 id = predict.createMarket(p);

        vm.prank(alice);
        predict.bet{value: 1 ether}(id, true);
        vm.prank(bob);
        predict.bet{value: 2 ether}(id, false);

        _minePastClose(id);
        _execute(1, 0);

        (, , , uint256 aliceClaim) = predict.stakesOf(id, alice);
        (, , , uint256 bobClaim) = predict.stakesOf(id, bob);
        assertEq(aliceClaim, 0);
        assertEq(bobClaim, 3 ether);

        uint256 before = bob.balance;
        vm.prank(bob);
        predict.claimWinnings(id);
        assertEq(bob.balance, before + 3 ether);
    }

    function test_EmptyWinningSideBecomesInvalid() public {
        // Only NO bets; YES wins => Invalid ("no YES winners")
        uint256 id = predict.createMarket(_defaultMarket());

        vm.prank(alice);
        predict.bet{value: 1 ether}(id, false);

        _minePastClose(id);
        _execute(1, 0);

        RitualPredict.Market memory m = predict.getMarket(id);
        assertEq(uint8(m.state), uint8(RitualPredict.MarketState.Invalid));
        assertEq(uint8(m.outcome), uint8(RitualPredict.Outcome.Yes));

        uint256 before = alice.balance;
        vm.prank(alice);
        predict.claimRefund(id);
        assertEq(alice.balance, before + 1 ether);
    }

    function test_CancelRemainingAfterSuccess() public {
        uint256 id = predict.createMarket(_defaultMarket());

        vm.prank(alice);
        predict.bet{value: 1 ether}(id, true);
        vm.prank(bob);
        predict.bet{value: 1 ether}(id, false);

        _minePastClose(id);
        _execute(1, 0);

        RitualPredict.Market memory m = predict.getMarket(id);
        assertEq(uint8(m.state), uint8(RitualPredict.MarketState.Resolved));

        // Remaining executions are cancelled by the contract.
        vm.expectRevert(bytes("cancelled"));
        _execute(1, 1);

        vm.expectRevert(bytes("cancelled"));
        _execute(1, 2);
    }

    function test_OnlySchedulerCanResolve() public {
        uint256 id = predict.createMarket(_defaultMarket());
        _minePastClose(id);

        vm.expectRevert(RitualPredict.OnlyScheduler.selector);
        predict.onScheduledResolve(0, id);
    }

    function test_UnknownMarketReverts() public {
        vm.expectRevert(RitualPredict.UnknownMarket.selector);
        predict.getMarket(999);
    }

    function test_ClaimWinningsRequiresResolved() public {
        uint256 id = predict.createMarket(_defaultMarket());
        vm.prank(alice);
        predict.bet{value: 1 ether}(id, true);

        vm.prank(alice);
        vm.expectRevert(RitualPredict.NotResolved.selector);
        predict.claimWinnings(id);
    }

    function test_ClaimRefundRequiresInvalid() public {
        uint256 id = predict.createMarket(_defaultMarket());
        vm.prank(alice);
        predict.bet{value: 1 ether}(id, true);

        vm.prank(alice);
        vm.expectRevert(RitualPredict.NotInvalid.selector);
        predict.claimRefund(id);
    }

    function test_DoubleClaimReverts() public {
        uint256 id = predict.createMarket(_defaultMarket());

        vm.prank(alice);
        predict.bet{value: 1 ether}(id, true);
        vm.prank(bob);
        predict.bet{value: 1 ether}(id, false);

        _minePastClose(id);
        _execute(1, 0);

        vm.prank(alice);
        predict.claimWinnings(id);

        vm.prank(alice);
        vm.expectRevert(RitualPredict.AlreadySettled.selector);
        predict.claimWinnings(id);
    }

    function test_GetMarketsNewestFirst() public {
        predict.createMarket(_defaultMarket());
        predict.createMarket(_defaultMarket());

        RitualPredict.Market[] memory all = predict.getMarkets();
        assertEq(all.length, 2);
        assertEq(all[0].id, 2);
        assertEq(all[1].id, 1);
    }

    function test_ViewShowsClosedAfterBettingWindow() public {
        uint256 id = predict.createMarket(_defaultMarket());
        _minePastClose(id);
        RitualPredict.Market memory m = predict.getMarket(id);
        assertEq(uint8(m.state), uint8(RitualPredict.MarketState.Closed));
    }

    function test_GteComparatorYes() public {
        RitualPredict.NewMarket memory p = _defaultMarket();
        p.target = 3500;
        p.comparator = RitualPredict.Comparator.GTE; // 3500 >= 3500

        uint256 id = predict.createMarket(p);
        vm.prank(alice);
        predict.bet{value: 1 ether}(id, true);
        vm.prank(bob);
        predict.bet{value: 1 ether}(id, false);

        _minePastClose(id);
        _execute(1, 0);

        assertEq(
            uint8(predict.getMarket(id).outcome),
            uint8(RitualPredict.Outcome.Yes)
        );
    }

    function test_LtComparatorYesWhenBelow() public {
        RitualPredict.NewMarket memory p = _defaultMarket();
        p.target = 4000;
        p.comparator = RitualPredict.Comparator.LT; // 3500 < 4000 => YES

        uint256 id = predict.createMarket(p);
        vm.prank(alice);
        predict.bet{value: 1 ether}(id, true);
        vm.prank(bob);
        predict.bet{value: 1 ether}(id, false);

        _minePastClose(id);
        _execute(1, 0);

        assertEq(
            uint8(predict.getMarket(id).outcome),
            uint8(RitualPredict.Outcome.Yes)
        );
    }

    function test_LteComparatorNoWhenAbove() public {
        RitualPredict.NewMarket memory p = _defaultMarket();
        p.target = 3000;
        p.comparator = RitualPredict.Comparator.LTE; // 3500 <= 3000 => false => NO

        uint256 id = predict.createMarket(p);
        vm.prank(alice);
        predict.bet{value: 1 ether}(id, true);
        vm.prank(bob);
        predict.bet{value: 1 ether}(id, false);

        _minePastClose(id);
        _execute(1, 0);

        assertEq(
            uint8(predict.getMarket(id).outcome),
            uint8(RitualPredict.Outcome.No)
        );
    }

    function test_RevertResolveBlockOverflowsUint32() public {
        vm.roll(uint256(type(uint32).max) - 10);

        vm.expectRevert(RitualPredict.BadDuration.selector);
        predict.createMarket(_defaultMarket());
    }

    function test_OnScheduledResolveNoopAfterResolved() public {
        uint256 id = predict.createMarket(_defaultMarket());

        vm.prank(alice);
        predict.bet{value: 1 ether}(id, true);

        vm.prank(bob);
        predict.bet{value: 1 ether}(id, false);

        _minePastClose(id);
        _execute(1, 0);

        RitualPredict.Market memory before = predict.getMarket(id);
        assertEq(
            uint8(before.state),
            uint8(RitualPredict.MarketState.Resolved)
        );

        vm.prank(RitualChain.SCHEDULER);
        predict.onScheduledResolve(1, id);

        RitualPredict.Market memory afterCall = predict.getMarket(id);
        assertEq(
            uint8(afterCall.state),
            uint8(RitualPredict.MarketState.Resolved)
        );
        assertEq(afterCall.attempts, before.attempts);
    }

    function test_OnScheduledResolveIgnoresAttemptBeyondMax() public {
        uint256 id = predict.createMarket(_defaultMarket());
        _minePastClose(id);

        vm.prank(RitualChain.SCHEDULER);
        predict.onScheduledResolve(3, id);

        RitualPredict.Market memory m = predict.getMarket(id);
        assertEq(m.attempts, 0);
        assertEq(
            uint8(m.state),
            uint8(RitualPredict.MarketState.Closed)
        );
    }

    function test_OnScheduledResolveIgnoredBeforeClose() public {
        uint256 id = predict.createMarket(_defaultMarket());

        vm.prank(RitualChain.SCHEDULER);
        predict.onScheduledResolve(0, id);

        RitualPredict.Market memory m = predict.getMarket(id);
        assertEq(m.attempts, 0);
        assertEq(
            uint8(m.state),
            uint8(RitualPredict.MarketState.Open)
        );
    }

    function test_NoExecutorAvailableRecordsFailure() public {
        MockTEENotFound notFound = new MockTEENotFound();
        vm.etch(
            RitualChain.TEE_SERVICE_REGISTRY,
            address(notFound).code
        );

        uint256 id = predict.createMarket(_defaultMarket());
        _minePastClose(id);
        _execute(1, 0);

        RitualPredict.Market memory m = predict.getMarket(id);
        assertEq(m.attempts, 1);
        assertEq(
            uint8(m.state),
            uint8(RitualPredict.MarketState.Resolving)
        );
    }

    function test_EmptyNoSideBecomesInvalid() public {
        RitualPredict.NewMarket memory p = _defaultMarket();
        p.target = 4000;
        p.comparator = RitualPredict.Comparator.GT;

        uint256 id = predict.createMarket(p);

        vm.prank(alice);
        predict.bet{value: 1 ether}(id, true);

        _minePastClose(id);
        _execute(1, 0);

        RitualPredict.Market memory m = predict.getMarket(id);
        assertEq(
            uint8(m.state),
            uint8(RitualPredict.MarketState.Invalid)
        );
        assertEq(
            uint8(m.outcome),
            uint8(RitualPredict.Outcome.No)
        );
        assertEq(m.invalidReason, "no NO winners");

        uint256 before = alice.balance;

        vm.prank(alice);
        predict.claimRefund(id);

        assertEq(alice.balance, before + 1 ether);
    }

    function test_LosingBettorCannotClaimWinnings() public {
        uint256 id = predict.createMarket(_defaultMarket());

        vm.prank(alice);
        predict.bet{value: 1 ether}(id, true);

        vm.prank(bob);
        predict.bet{value: 1 ether}(id, false);

        _minePastClose(id);
        _execute(1, 0);

        vm.prank(bob);
        vm.expectRevert(RitualPredict.NothingToClaim.selector);
        predict.claimWinnings(id);
    }

    function test_DoubleRefundReverts() public {
        uint256 id = predict.createMarket(_defaultMarket());

        vm.prank(alice);
        predict.bet{value: 1 ether}(id, false);

        _minePastClose(id);
        _execute(1, 0);

        vm.prank(alice);
        predict.claimRefund(id);

        vm.prank(alice);
        vm.expectRevert(RitualPredict.AlreadySettled.selector);
        predict.claimRefund(id);
    }

    function test_ClaimRefundNothingToClaimReverts() public {
        uint256 id = predict.createMarket(_defaultMarket());

        vm.prank(alice);
        predict.bet{value: 1 ether}(id, false);

        _minePastClose(id);
        _execute(1, 0);

        vm.prank(bob);
        vm.expectRevert(RitualPredict.NothingToClaim.selector);
        predict.claimRefund(id);
    }

    function test_StakesOfReportsClaimableWhenResolved() public {
        uint256 id = predict.createMarket(_defaultMarket());

        vm.prank(alice);
        predict.bet{value: 1 ether}(id, true);

        vm.prank(bob);
        predict.bet{value: 1 ether}(id, false);

        _minePastClose(id);
        _execute(1, 0);

        (
            ,
            ,
            bool aliceSettled,
            uint256 aliceClaimable
        ) = predict.stakesOf(id, alice);

        (
            ,
            ,
            bool bobSettled,
            uint256 bobClaimable
        ) = predict.stakesOf(id, bob);

        assertFalse(aliceSettled);
        assertEq(aliceClaimable, 2 ether);

        assertFalse(bobSettled);
        assertEq(bobClaimable, 0);
    }

    function test_StakesOfReportsClaimableWhenInvalid() public {
        uint256 id = predict.createMarket(_defaultMarket());

        vm.prank(alice);
        predict.bet{value: 1 ether}(id, false);

        _minePastClose(id);
        _execute(1, 0);

        (
            uint256 yes,
            uint256 no,
            bool settled_,
            uint256 claimable
        ) = predict.stakesOf(id, alice);

        assertEq(yes, 0);
        assertEq(no, 1 ether);
        assertFalse(settled_);
        assertEq(claimable, 1 ether);
    }

    function test_FundExecutionRejectsZeroValue() public {
        vm.expectRevert(RitualPredict.ZeroStake.selector);
        predict.fundExecution(100);
    }

    function test_FundExecutionIncreasesBalance() public {
        uint256 before = predict.executionBalance();

        predict.fundExecution{value: 1 ether}(100);

        uint256 afterFunding = predict.executionBalance();

        assertGt(afterFunding, before);
    }

    function test_StakesOfReturnsZeroAfterSettlement() public {
        uint256 id = predict.createMarket(_defaultMarket());

        vm.prank(alice);
        predict.bet{value: 1 ether}(id, true);

        vm.prank(bob);
        predict.bet{value: 1 ether}(id, false);

        _minePastClose(id);
        _execute(1, 0);

        vm.prank(alice);
        predict.claimWinnings(id);

        (
            uint256 yes,
            uint256 no,
            bool alreadySettled,
            uint256 claimable
        ) = predict.stakesOf(id, alice);

        assertEq(yes, 1 ether);
        assertEq(no, 0);
        assertTrue(alreadySettled);
        assertEq(claimable, 0);
    }

    function test_JqFailureRecordsAttempt() public {
        vm.etch(RitualChain.JQ_PRECOMPILE, hex"");

        uint256 id = predict.createMarket(_defaultMarket());

        _minePastClose(id);
        _execute(1, 0);

        RitualPredict.Market memory m = predict.getMarket(id);

        assertEq(m.attempts, 1);
        assertEq(
            uint8(m.state),
            uint8(RitualPredict.MarketState.Resolving)
        );
    }

    function test_HttpPrecompileFailureRecordsAttempt() public {
        vm.etch(RitualChain.HTTP_PRECOMPILE, hex"");

        uint256 id = predict.createMarket(_defaultMarket());
        _minePastClose(id);
        _execute(1, 0);

        RitualPredict.Market memory m = predict.getMarket(id);

        assertEq(m.attempts, 1);
        assertEq(
            uint8(m.state),
            uint8(RitualPredict.MarketState.Resolving)
        );
    }

    function test_HttpMalformedResponseRecordsAttempt() public {
        MockHTTPMalformed malformed = new MockHTTPMalformed();

        vm.etch(
            RitualChain.HTTP_PRECOMPILE,
            address(malformed).code
        );

        uint256 id = predict.createMarket(_defaultMarket());
        _minePastClose(id);
        _execute(1, 0);

        RitualPredict.Market memory m = predict.getMarket(id);

        assertEq(m.attempts, 1);
        assertEq(
            uint8(m.state),
            uint8(RitualPredict.MarketState.Resolving)
        );
    }

    function test_HttpErrorMessageRecordsAttempt() public {
        MockHTTPError errorMock = new MockHTTPError();

        vm.etch(
            RitualChain.HTTP_PRECOMPILE,
            address(errorMock).code
        );

        uint256 id = predict.createMarket(_defaultMarket());
        _minePastClose(id);
        _execute(1, 0);

        RitualPredict.Market memory m = predict.getMarket(id);

        assertEq(m.attempts, 1);
        assertEq(
            uint8(m.state),
            uint8(RitualPredict.MarketState.Resolving)
        );
    }

    function test_HttpNon2xxRecordsAttempt() public {
        MockHTTPNon2xx non2xx = new MockHTTPNon2xx();

        vm.etch(
            RitualChain.HTTP_PRECOMPILE,
            address(non2xx).code
        );

        uint256 id = predict.createMarket(_defaultMarket());
        _minePastClose(id);
        _execute(1, 0);

        RitualPredict.Market memory m = predict.getMarket(id);

        assertEq(m.attempts, 1);
        assertEq(
            uint8(m.state),
            uint8(RitualPredict.MarketState.Resolving)
        );
    }

    function test_HttpEmptyBodyRecordsAttempt() public {
        MockHTTPEmptyBody emptyBody = new MockHTTPEmptyBody();

        vm.etch(
            RitualChain.HTTP_PRECOMPILE,
            address(emptyBody).code
        );

        uint256 id = predict.createMarket(_defaultMarket());
        _minePastClose(id);
        _execute(1, 0);

        RitualPredict.Market memory m = predict.getMarket(id);

        assertEq(m.attempts, 1);
        assertEq(
            uint8(m.state),
            uint8(RitualPredict.MarketState.Resolving)
        );
    }
}

contract MockTEENotFound {
    function pickServiceByCapability(
        uint8,
        bool,
        uint256,
        uint256
    ) external pure returns (address, bool) {
        return (address(0), false);
    }
}

contract MockHTTPEmptyBody {
    fallback() external {
        bytes memory actualOutput = abi.encode(
            uint16(200),
            new string[](0),
            new string[](0),
            bytes(""),
            string("")
        );

        bytes memory response = abi.encode(
            bytes(""),
            actualOutput
        );

        assembly {
            return(add(response, 32), mload(response))
        }
    }
}

contract MockHTTPRevert {
    fallback() external {
        revert("HTTP failure");
    }
}

contract MockHTTPMalformed {
    fallback() external {
        bytes memory response = hex"1234";
        assembly {
            return(add(response, 32), mload(response))
        }
    }
}

contract MockHTTPError {
    fallback() external {
        bytes memory actualOutput = abi.encode(
            uint16(200),
            new string[](0),
            new string[](0),
            bytes('{"price":3500}'),
            string("upstream error")
        );

        bytes memory response = abi.encode(
            bytes(""),
            actualOutput
        );

        assembly {
            return(add(response, 32), mload(response))
        }
    }
}

contract MockHTTPNon2xx {
    fallback() external {
        bytes memory actualOutput = abi.encode(
            uint16(500),
            new string[](0),
            new string[](0),
            bytes('{"price":3500}'),
            string("")
        );

        bytes memory response = abi.encode(
            bytes(""),
            actualOutput
        );

        assembly {
            return(add(response, 32), mload(response))
        }
    }
}

