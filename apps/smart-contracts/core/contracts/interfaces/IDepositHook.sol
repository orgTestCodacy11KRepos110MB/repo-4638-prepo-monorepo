// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./IHook.sol";
import "./IDepositRecordHook.sol";

interface IDepositHook is IHook, IDepositRecordHook {
  event DepositsAllowedChange(bool allowed);

  function setDepositsAllowed(bool allowed) external;

  function depositsAllowed() external view returns (bool);
}
