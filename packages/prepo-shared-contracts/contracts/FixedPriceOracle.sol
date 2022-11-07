// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IFixedPriceOracle.sol";
import "./SafeOwnable.sol";

contract FixedPriceOracle is IFixedPriceOracle, SafeOwnable {
  uint256 private _fixedPrice;

  function setFixedPrice(uint256 _newFixedPrice) external override onlyOwner {
    _fixedPrice = _newFixedPrice;
    emit FixedPriceChange(_newFixedPrice);
  }

  function getFixedPrice() external view override returns (uint256) {
    return _fixedPrice;
  }
}
