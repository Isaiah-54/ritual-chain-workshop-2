// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockTEERegistry {
    address internal constant MOCK_EXECUTOR =
        0x0000000000000000000000000000000000000001;

    function pickServiceByCapability(
        uint8,
        bool,
        uint256,
        uint256
    ) external pure returns (address teeAddress, bool found) {
        return (MOCK_EXECUTOR, true);
    }
}
