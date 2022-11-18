// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./IDepositRecordHook.sol";
import "./IFeeReimbursement.sol";

interface IDepositHook is IDepositRecordHook {
  event DepositsAllowedChange(bool allowed);
  event FeeReimbursementChange(IFeeReimbursement feeReimbursement);

  function setDepositsAllowed(bool allowed) external;

  function setFeeReimbursement(IFeeReimbursement feeReimbursement) external;

  function getFeeReimbursement() external view returns (IFeeReimbursement);

  function depositsAllowed() external view returns (bool);
}
