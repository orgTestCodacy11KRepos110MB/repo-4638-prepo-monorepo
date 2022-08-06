// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.7;

import "./interfaces/IPurchaseHook.sol";

contract PurchaseHook is IPurchaseHook {
  function hook(
    address _purchaser,
    address _recipient,
    uint256 _amount,
    uint256 _price
  ) external override {}
}
