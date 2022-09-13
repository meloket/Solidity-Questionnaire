// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Game is ReentrancyGuard, Ownable {
    using SafeMath for uint256;

    uint value;
    bytes32 target;
    bool public started;
    uint cost;

    constructor(uint guessCost, bytes32 t) {
        target = t;
        started = true;
        cost = guessCost;
        value = 0;
    }

    function setTarget(bytes32 t) external onlyOwner {
        target = t;
        started = true;
    }

    function attempt(uint guess) external payable nonReentrant {
        require(started, "not started yet");
        require(msg.value >= cost, "not enough value");

        value = value.add(guess);
        bytes32 result = sha256(abi.encode(value));
        if(result == target) {
            started = false;
            payable(msg.sender).transfer(address(this).balance);
        }
    }
}
