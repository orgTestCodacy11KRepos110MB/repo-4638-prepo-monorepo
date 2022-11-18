// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./IDepositRecordHook.sol";

interface IDepositHook is IDepositRecordHook {
  event DepositsAllowedChange(bool allowed);

  function setDepositsAllowed(bool allowed) external;

  function depositsAllowed() external view returns (bool);
}
