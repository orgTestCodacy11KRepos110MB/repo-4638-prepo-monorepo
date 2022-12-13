// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

interface IHook {
  function hook(
    address user,
    uint256 amountBeforeFee,
    uint256 amountAfterFee
  ) external;
}
