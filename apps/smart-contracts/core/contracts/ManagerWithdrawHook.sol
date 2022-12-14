// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IHook.sol";
import "./interfaces/IManagerWithdrawHook.sol";
import "./interfaces/IAllowedCollateralCaller.sol";
import "./interfaces/IDepositRecord.sol";
import "prepo-shared-contracts/contracts/SafeAccessControlEnumerable.sol";

contract ManagerWithdrawHook is
  IHook,
  IManagerWithdrawHook,
  IAllowedCollateralCaller,
  SafeAccessControlEnumerable
{
  ICollateral private _collateral;
  IDepositRecord private _depositRecord;
  uint256 private _minReservePercentage;

  uint256 public constant PERCENT_DENOMINATOR = 1000000;
  bytes32 public constant SET_COLLATERAL_ROLE =
    keccak256("ManagerWithdrawHook_setCollateral(address)");
  bytes32 public constant SET_DEPOSIT_RECORD_ROLE =
    keccak256("ManagerWithdrawHook_setDepositRecord(address)");
  bytes32 public constant SET_MIN_RESERVE_PERCENTAGE_ROLE =
    keccak256("ManagerWithdrawHook_setMinReservePercentage(uint256)");

  function hook(
    address,
    uint256,
    uint256 amountAfterFee
  ) external view override {
    require(
      _collateral.getReserve() - amountAfterFee >= getMinReserve(),
      "reserve would fall below minimum"
    );
  }

  function setCollateral(ICollateral collateral)
    external
    override
    onlyRole(SET_COLLATERAL_ROLE)
  {
    _collateral = collateral;
    emit CollateralChange(address(collateral));
  }

  function setDepositRecord(IDepositRecord depositRecord)
    external
    override
    onlyRole(SET_DEPOSIT_RECORD_ROLE)
  {
    _depositRecord = depositRecord;
    emit DepositRecordChange(address(depositRecord));
  }

  function setMinReservePercentage(uint256 minReservePercentage)
    external
    override
    onlyRole(SET_MIN_RESERVE_PERCENTAGE_ROLE)
  {
    require(minReservePercentage <= PERCENT_DENOMINATOR, ">100%");
    _minReservePercentage = minReservePercentage;
    emit MinReservePercentageChange(minReservePercentage);
  }

  function getCollateral() external view override returns (ICollateral) {
    return _collateral;
  }

  function getDepositRecord() external view override returns (IDepositRecord) {
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
