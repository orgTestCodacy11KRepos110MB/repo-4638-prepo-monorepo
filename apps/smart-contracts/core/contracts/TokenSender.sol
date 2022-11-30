// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/ITokenSender.sol";
import "prepo-shared-contracts/contracts/SafeAccessControlEnumerable.sol";
import "prepo-shared-contracts/contracts/WithdrawERC20.sol";
import "prepo-shared-contracts/contracts/interfaces/IUintValue.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract TokenSender is
  ITokenSender,
  WithdrawERC20,
  SafeAccessControlEnumerable
{
  IERC20 private immutable _outputToken;
  uint256 private immutable _outputTokenDecimalsFactor;
  IUintValue private _price;
  uint256 private _priceMultiplier;
  uint256 private _scaledPriceLowerBound;

  constructor(IERC20Metadata outputToken) {
    _outputToken = outputToken;
    _outputTokenDecimalsFactor = 10**outputToken.decimals();
  }

  function send(address _recipient, uint256 _unconvertedAmount)
    external
    override
  {}

  function setPrice(IUintValue price) external override {}

  function setPriceMultiplier(uint256 multiplier) external override {}

  function setScaledPriceLowerBound(uint256 lowerBound) external override {}

  function getOutputToken() external view override returns (IERC20) {
    return _outputToken;
  }

  function getPrice() external view override returns (IUintValue) {}

  function getPriceMultiplier() external view override returns (uint256) {}

  function getScaledPriceLowerBound()
    external
    view
    override
    returns (uint256)
  {}
}
