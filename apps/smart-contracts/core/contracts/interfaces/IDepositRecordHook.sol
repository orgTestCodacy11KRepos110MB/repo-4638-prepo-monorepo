// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./IHook.sol";
import "./IDepositRecord.sol";

interface IDepositRecordHook is IHook {
  event DepositRecordChange(address depositRecord);

  function setDepositRecord(IDepositRecord newDepositRecord) external;

  function getDepositRecord() external view returns (IDepositRecord);
}
