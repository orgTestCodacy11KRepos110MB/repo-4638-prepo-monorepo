// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IDepositHook.sol";
import "./interfaces/IDepositRecord.sol";
import "prepo-shared-contracts/contracts/SafeAccessControlEnumerable.sol";
import "./interfaces/IFeeReimbursement.sol";

contract DepositHook is IDepositHook, SafeAccessControlEnumerable {
  ICollateral private collateral;
  IDepositRecord private depositRecord;
  IFeeReimbursement private feeReimbursement;
  bool public override depositsAllowed;

  bytes32 public constant SET_COLLATERAL_ROLE =
    keccak256("DepositHook_setCollateral(address)");
  bytes32 public constant SET_DEPOSIT_RECORD_ROLE =
    keccak256("DepositHook_setDepositRecord(address)");
  bytes32 public constant SET_DEPOSITS_ALLOWED_ROLE =
    keccak256("DepositHook_setDepositsAllowed(bool)");
  bytes32 public constant SET_FEE_REIMBURSEMENT_ROLE =
    keccak256("DepositHook_setFeeReimbursement(address)");

  modifier onlyCollateral() {
    require(msg.sender == address(collateral), "msg.sender != collateral");
    _;
  }

  function hook(
    address _sender,
    uint256 _amountBeforeFee,
    uint256 _amountAfterFee
  ) external override onlyCollateral {
    require(depositsAllowed, "deposits not allowed");
    if (address(depositRecord) != address(0)) {
      depositRecord.recordDeposit(_sender, _amountAfterFee);
    }
    uint256 fee = _amountBeforeFee - _amountAfterFee;
    if (fee > 0 && address(feeReimbursement) != address(0)) {
      feeReimbursement.registerFee(_sender, fee);
    }
  }

  function setCollateral(ICollateral _newCollateral)
    external
    override
    onlyRole(SET_COLLATERAL_ROLE)
  {
    collateral = _newCollateral;
    emit CollateralChange(address(_newCollateral));
  }

  function setDepositRecord(IDepositRecord _newDepositRecord)
    external
    override
    onlyRole(SET_DEPOSIT_RECORD_ROLE)
  {
    depositRecord = _newDepositRecord;
    emit DepositRecordChange(address(_newDepositRecord));
  }

  function setDepositsAllowed(bool _newDepositsAllowed)
    external
    override
    onlyRole(SET_DEPOSITS_ALLOWED_ROLE)
  {
    depositsAllowed = _newDepositsAllowed;
    emit DepositsAllowedChange(_newDepositsAllowed);
  }

  function setFeeReimbursement(IFeeReimbursement _newFeeReimbursement)
    external
    override
    onlyRole(SET_FEE_REIMBURSEMENT_ROLE)
  {
    feeReimbursement = _newFeeReimbursement;
    emit FeeReimbursementChange(_newFeeReimbursement);
  }

  function getCollateral() external view override returns (ICollateral) {
    return collateral;
  }

  function getDepositRecord() external view override returns (IDepositRecord) {
    return depositRecord;
  }
}
