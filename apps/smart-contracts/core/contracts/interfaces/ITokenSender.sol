// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./IAccountList.sol";
import "prepo-shared-contracts/contracts/interfaces/IUintValue.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ITokenSender {
    event PriceChange(IUintValue price);
    event PriceMultiplierChange(uint256 priceMultiplier);
    event ScaledPriceLowerBoundChange(uint256 scaledPriceLowerBound);

    function send(address _recipient, uint256 _unconvertedAmount) external;
    function setPrice(IUintValue _price) external;
    function setPriceMultiplier(uint256 _priceMultiplier) external;
    function setScaledPriceLowerBound(uint256 _scaledPriceLowerBound) external;
    function getOutputToken() external view returns (IERC20);
    function getPrice() external view returns (IUintValue);
    function getPriceMultiplier() external view returns (uint256);
    function getScaledPriceLowerBound() external view returns (uint256);
}
