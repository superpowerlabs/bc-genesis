// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

contract Constants {
    mapping(uint256 => uint8) public robotAmount;
    constructor() {
        robotAmount[1] = 5;
        robotAmount[100] = 4;
        robotAmount[200] = 4;
    }
}
