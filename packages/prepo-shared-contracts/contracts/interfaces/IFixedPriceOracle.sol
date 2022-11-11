// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

interface IFixedPriceOracle {
  event FixedPriceChange(uint256 price);

  function setFixedPrice(uint256 newFixedPrice) external;

  function getFixedPrice() external view returns (uint256);
}
