// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./Owned.sol";
import "./Logger.sol";
import "./IFaucet.sol";

contract Faucet is Owned, Logger, IFaucet {
    uint public numbOfFunders;
    mapping(address => bool) private funders;
    mapping(uint => address) private lutFunders;

    modifier limitWithdraw(uint withdrawAmount) {
        require(withdrawAmount <= 100000000000000000, "Cannot withdraw more than 0.1 ETH");
        _;
    }

    receive() external payable {}

    function emitLog() public pure override returns(bytes32) {}

    function addFunds() external override payable {
        address funder = msg.sender;

        if (!funders[funder]) {
            uint index = numbOfFunders++;
            funders[funder] = true;
            lutFunders[index] = funder;
        }
    }

    function withdraw(uint amount) external override limitWithdraw(amount) {
        payable(msg.sender).transfer(amount);
    }

    function getAllFunders() external view returns(address[] memory) {
        address[] memory _funders = new address[](numbOfFunders);
        
        for (uint i = 0; i < numbOfFunders; i++) {
            _funders[i] = lutFunders[i];
        }

        return _funders;
    }

    function getFunderAtIndex(uint8 index) public view returns(address) {
        return lutFunders[index];
    }
}