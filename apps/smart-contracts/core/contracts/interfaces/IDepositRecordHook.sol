// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./ICollateralHook.sol";
import "./IDepositRecord.sol";

interface IDepositRecordHook is ICollateralHook {
  event DepositRecordChange(address depositRecord);

  function setDepositRecord(IDepositRecord newDepositRecord) external;

  function getDepositRecord() external view returns (IDepositRecord);
}
