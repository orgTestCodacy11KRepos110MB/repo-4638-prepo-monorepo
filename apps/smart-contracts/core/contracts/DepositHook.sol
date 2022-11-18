// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IDepositHook.sol";
import "./interfaces/IDepositRecord.sol";
import "prepo-shared-contracts/contracts/SafeAccessControlEnumerable.sol";

contract DepositHook is IDepositHook, SafeAccessControlEnumerable {
  ICollateral private collateral;
  IDepositRecord private depositRecord;
  bool public override depositsAllowed;

  bytes32 public constant SET_COLLATERAL_ROLE =
    keccak256("DepositHook_setCollateral(address)");
  bytes32 public constant SET_DEPOSIT_RECORD_ROLE =
    keccak256("DepositHook_setDepositRecord(address)");
  bytes32 public constant SET_DEPOSITS_ALLOWED_ROLE =
    keccak256("DepositHook_setDepositsAllowed(bool)");

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
    depositRecord.recordDeposit(_sender, _amountAfterFee);
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

  function getCollateral() external view override returns (ICollateral) {
    return collateral;
  }

  function getDepositRecord() external view override returns (IDepositRecord) {
    return depositRecord;
  }
}
