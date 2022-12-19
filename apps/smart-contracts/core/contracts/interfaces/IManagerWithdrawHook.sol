// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./IHook.sol";

interface IManagerWithdrawHook is IHook {
  event MinReservePercentageChange(uint256 percentage);

  function setMinReservePercentage(uint256 minReservePercentage) external;

  function getMinReservePercentage() external view returns (uint256);

  function getMinReserve() external view returns (uint256);
}
