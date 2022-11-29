// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/ITokenSender.sol";
import "prepo-shared-contracts/contracts/SafeAccessControlEnumerable.sol";
import "prepo-shared-contracts/contracts/WithdrawERC20.sol";
import "prepo-shared-contracts/contracts/interfaces/IUintValue.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenSender is
  ITokenSender,
  WithdrawERC20,
  SafeAccessControlEnumerable
{
  constructor() {}

  function send(address _recipient, uint256 _unconvertedAmount)
    external
    override
  {}

  function setPrice(IUintValue _price) external override {}

  function setPriceMultiplier(uint256 _priceMultiplier) external override {}

  function setScaledPriceLowerBound(uint256 _scaledPriceLowerBound)
    external
    override
  {}

  function getOutputToken() external view override returns (IERC20) {}

  function getPrice() external view override returns (IUintValue) {}

  function getPriceMultiplier() external view override returns (uint256) {}

  function getScaledPriceLowerBound()
    external
    view
    override
    returns (uint256)
  {}
}
