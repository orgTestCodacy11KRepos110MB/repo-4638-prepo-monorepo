// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IManagerWithdrawHook.sol";
import "prepo-shared-contracts/contracts/SafeAccessControlEnumerable.sol";

contract ManagerWithdrawHook is
  IManagerWithdrawHook,
  SafeAccessControlEnumerable
{
  ICollateral private _collateral;
  ICollateralDepositRecord private _depositRecord;
  uint256 private _minReservePercentage;

  uint256 public constant PERCENT_DENOMINATOR = 1000000;
  bytes32 public constant SET_COLLATERAL_ROLE =
    keccak256("ManagerWithdrawHook_setCollateral(address)");
  bytes32 public constant SET_DEPOSIT_RECORD_ROLE =
    keccak256("ManagerWithdrawHook_setDepositRecord(address)");
  bytes32 public constant SET_MIN_RESERVE_PERCENTAGE_ROLE =
    keccak256("ManagerWithdrawHook_setMinReservePercentage(uint256)");

  constructor(address _newDepositRecord) {
    _depositRecord = ICollateralDepositRecord(_newDepositRecord);
  }

  function hook(
    address _sender,
    uint256 _amountBeforeFee,
    uint256 _amountAfterFee
  ) external override {
    require(
      _collateral.getReserve() - _amountAfterFee >= getMinReserve(),
      "reserve would fall below minimum"
    );
  }

  function setCollateral(ICollateral _newCollateral)
    external
    override
    onlyRole(SET_COLLATERAL_ROLE)
  {
    _collateral = _newCollateral;
    emit CollateralChange(address(_newCollateral));
  }

  function setDepositRecord(ICollateralDepositRecord _newDepositRecord)
    external
    override
    onlyRole(SET_DEPOSIT_RECORD_ROLE)
  {
    _depositRecord = _newDepositRecord;
    emit DepositRecordChange(address(_newDepositRecord));
  }

  function setMinReservePercentage(uint256 _newMinReservePercentage)
    external
    override
    onlyRole(SET_MIN_RESERVE_PERCENTAGE_ROLE)
  {
    require(_newMinReservePercentage <= PERCENT_DENOMINATOR, ">100%");
    _minReservePercentage = _newMinReservePercentage;
    emit MinReservePercentageChange(_newMinReservePercentage);
  }

  function getCollateral() external view override returns (ICollateral) {
    return _collateral;
  }

  function getDepositRecord()
    external
    view
    override
    returns (ICollateralDepositRecord)
  {
    return _depositRecord;
  }

  function getMinReservePercentage() external view override returns (uint256) {
    return _minReservePercentage;
  }

  function getMinReserve() public view override returns (uint256) {
    return
      (_depositRecord.getGlobalNetDepositAmount() * _minReservePercentage) /
      PERCENT_DENOMINATOR;
  }
}
