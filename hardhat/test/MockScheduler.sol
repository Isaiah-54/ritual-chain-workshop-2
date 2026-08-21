// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockScheduler {
    uint256 public nextCallId = 1;

    struct Call {
        bytes data;
        uint32 gas;
        uint32 startBlock;
        uint32 numCalls;
        uint32 frequency;
        uint32 ttl;
        uint256 maxFeePerGas;
        uint256 maxPriorityFeePerGas;
        uint256 value;
        address payer;
        bool cancelled;
    }

    mapping(uint256 => Call) public calls;

    function approveScheduler(address) external {}

    function schedule(
        bytes calldata data,
        uint32 gas,
        uint32 startBlock,
        uint32 numCalls,
        uint32 frequency,
        uint32 ttl,
        uint256 maxFeePerGas,
        uint256 maxPriorityFeePerGas,
        uint256 value,
        address payer
    ) external returns (uint256 callId) {
        callId = nextCallId++;

        calls[callId] = Call({
            data: data,
            gas: gas,
            startBlock: startBlock,
            numCalls: numCalls,
            frequency: frequency,
            ttl: ttl,
            maxFeePerGas: maxFeePerGas,
            maxPriorityFeePerGas: maxPriorityFeePerGas,
            value: value,
            payer: payer,
            cancelled: false
        });
    }

    function getCall(uint256 callId)
        external
        view
        returns (
            bytes memory data,
            uint32 gas,
            uint32 startBlock,
            uint32 numCalls,
            uint32 frequency,
            uint32 ttl,
            uint256 maxFeePerGas,
            uint256 maxPriorityFeePerGas,
            uint256 value,
            address payer,
            bool cancelled
        )
    {
        Call storage c = calls[callId];

        return (
            c.data,
            c.gas,
            c.startBlock,
            c.numCalls,
            c.frequency,
            c.ttl,
            c.maxFeePerGas,
            c.maxPriorityFeePerGas,
            c.value,
            c.payer,
            c.cancelled
        );
    }

    function execute(
        uint256 callId,
        uint256 executionIndex
    ) external {
        Call storage c = calls[callId];

        require(!c.cancelled, "cancelled");
        require(
            executionIndex < c.numCalls,
            "execution index out of range"
        );

        bytes memory original = c.data;

        require(
            original.length == 68,
            "bad callback data"
        );

        bytes4 selector;
        uint256 marketId;

        assembly {
            selector := mload(add(original, 32))
            marketId := mload(add(original, 68))
        }

        bytes memory callback = abi.encodeWithSelector(
            selector,
            executionIndex,
            marketId
        );

        (bool ok, bytes memory reason) =
            c.payer.call(callback);

        if (!ok) {
            if (reason.length == 0) {
                revert("callback failed");
            }

            assembly {
                revert(
                    add(reason, 32),
                    mload(reason)
                )
            }
        }
    }

    function cancel(uint256 callId) external {
        calls[callId].cancelled = true;
    }

    function getCallState(uint256 callId)
        external
        view
        returns (uint8)
    {
        if (calls[callId].cancelled) {
            return 2;
        }

        return 0;
    }
}
