// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockScheduler {
    uint256 public nextCallId = 1;

    function approveScheduler(address) external {}

    function schedule(
        bytes calldata,
        uint32,
        uint32,
        uint32,
        uint32,
        uint32,
        uint256,
        uint256,
        uint256,
        address
    ) external returns (uint256 callId) {
        callId = nextCallId++;
    }

    function cancel(uint256) external {}

    function getCallState(uint256) external pure returns (uint8) {
        return 0;
    }
}
