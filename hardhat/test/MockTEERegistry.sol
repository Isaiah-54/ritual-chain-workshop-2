// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockTEERegistry {
    function setExecutor(
        address,
        bool
    ) external {}

    function executor() external pure returns (address) {
        return address(1);
    }

    function available() external pure returns (bool) {
        return true;
    }

    function pickServiceByCapability(
        uint8,
        bool,
        uint256,
        uint256
    )
        external
        pure
        returns (address teeAddress, bool found)
    {
        return (address(1), true);
    }
}
