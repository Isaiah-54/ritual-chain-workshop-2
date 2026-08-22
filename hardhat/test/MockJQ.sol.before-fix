// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockJQ {
    fallback() external {
        uint256 value = 3500;

        assembly {
            mstore(0x00, value)
            return(0x00, 32)
        }
    }
}
