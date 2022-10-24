// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./IDepositRecordHook.sol";

interface IManagerWithdrawHook is IDepositRecordHook {
  event MinReservePercentageChange(uint256 percentage);

  function setMinReservePercentage(uint256 newMinReservePercentage) external;

  function getMinReservePercentage() external view returns (uint256);
}
