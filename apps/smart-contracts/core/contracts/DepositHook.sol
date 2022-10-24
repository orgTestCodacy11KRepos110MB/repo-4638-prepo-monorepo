// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IHook.sol";
import "./interfaces/ICollateralDepositRecord.sol";
import "prepo-shared-contracts/contracts/SafeAccessControlEnumerable.sol";

contract DepositHook is IHook, SafeAccessControlEnumerable {
  ICollateral private _collateral;
  ICollateralDepositRecord private _depositRecord;

  bytes32 public constant SET_COLLATERAL_ROLE =
    keccak256("DepositHook_setCollateral(address)");
  bytes32 public constant SET_DEPOSIT_RECORD_ROLE =
    keccak256("DepositHook_setDepositRecord(address)");

  constructor(address _newDepositRecord) {
    _depositRecord = ICollateralDepositRecord(_newDepositRecord);
  }

  modifier onlyCollateral() {
    require(msg.sender == address(_collateral), "msg.sender != collateral");
    _;
  }

  function hook(
    address _sender,
    uint256 _initialAmount,
    uint256 _finalAmount
  ) external override onlyCollateral {
    _depositRecord.recordDeposit(_sender, _finalAmount);
  }

  function setCollateral(ICollateral _newCollateral)
    external
    override
    onlyRole(SET_COLLATERAL_ROLE)
  {
    _collateral = _newCollateral;
    emit CollateralChange(address(_newCollateral));
  }

  function setDepositRecord(address _newDepositRecord)
    external
    onlyRole(SET_DEPOSIT_RECORD_ROLE)
  {
    _depositRecord = ICollateralDepositRecord(_newDepositRecord);
  }

  function getCollateral() external view override returns (ICollateral) {
    return _collateral;
  }

  function getDepositRecord()
    external
    view
    returns (ICollateralDepositRecord)
  {
    return _depositRecord;
  }
}
