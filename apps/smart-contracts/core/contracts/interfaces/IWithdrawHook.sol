// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./IDepositRecordHook.sol";

interface IWithdrawHook is IDepositRecordHook {
  event WithdrawalsAllowedChange(bool allowed);

  event GlobalPeriodLengthChange(uint256 period);

  event UserPeriodLengthChange(uint256 period);

  event GlobalWithdrawLimitPerPeriodChange(uint256 limit);

  event UserWithdrawLimitPerPeriodChange(uint256 limit);

  function setWithdrawalsAllowed(bool withdrawalsAllowed) external;

  function setGlobalPeriodLength(uint256 globalPeriodLength) external;

  function setUserPeriodLength(uint256 userPeriodLength) external;

  function setGlobalWithdrawLimitPerPeriod(
    uint256 globalWithdrawLimitPerPeriod
  ) external;

  function setUserWithdrawLimitPerPeriod(uint256 userWithdrawLimitPerPeriod)
    external;

  function withdrawalsAllowed() external view returns (bool);

  function getGlobalPeriodLength() external view returns (uint256);

  function getUserPeriodLength() external view returns (uint256);

  function getGlobalWithdrawLimitPerPeriod() external view returns (uint256);

  function getUserWithdrawLimitPerPeriod() external view returns (uint256);

  function getLastGlobalPeriodReset() external view returns (uint256);

  function getLastUserPeriodReset() external view returns (uint256);

  function getGlobalAmountWithdrawnThisPeriod()
    external
    view
    returns (uint256);

  function getAmountWithdrawnThisPeriod(address user)
    external
    view
    returns (uint256);
}
