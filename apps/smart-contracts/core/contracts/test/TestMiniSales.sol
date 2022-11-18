// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.7;

import "token/contracts/mini-sales/MiniSales.sol";

contract TestMiniSales is MiniSales {
  constructor(
    address _newSaleToken,
    address _newPaymentToken,
    uint256 _newSaleTokenDecimals
  ) MiniSales(_newSaleToken, _newPaymentToken, _newSaleTokenDecimals) {}
}
