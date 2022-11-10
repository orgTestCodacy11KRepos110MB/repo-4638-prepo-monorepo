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

  modifier onlyCollateral() {
    require(msg.sender == address(_collateral), "msg.sender != collateral");
    _;
  }

  function hook(
    address _sender,
    uint256 _amountBeforeFee,
    uint256 _amountAfterFee
  ) external override {}

  function setCollateral(ICollateral _newCollateral) external override {}

  function setDepositRecord(ICollateralDepositRecord _newDepositRecord)
    external
    override
  {}

  function setMinReservePercentage(uint256 _newMinReservePercentage)
    external
    override
  {}

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
}
