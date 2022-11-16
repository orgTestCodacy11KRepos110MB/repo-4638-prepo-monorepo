// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IWithdrawHook.sol";
import "./interfaces/IDepositRecord.sol";
import "prepo-shared-contracts/contracts/SafeAccessControlEnumerable.sol";

contract WithdrawHook is IWithdrawHook, SafeAccessControlEnumerable {
  ICollateral private _collateral;
  IDepositRecord private _depositRecord;
  bool private _withdrawalsAllowed;
  uint256 private _globalPeriodLength;
  uint256 private _userPeriodLength;
  uint256 private _globalWithdrawLimitPerPeriod;
  uint256 private _userWithdrawLimitPerPeriod;
  uint256 private _lastGlobalPeriodReset;
  uint256 private _lastUserPeriodReset;
  uint256 private _globalAmountWithdrawnThisPeriod;
  mapping(address => uint256) private _userToAmountWithdrawnThisPeriod;

  bytes32 public constant SET_COLLATERAL_ROLE =
    keccak256("WithdrawHook_setCollateral(address)");
  bytes32 public constant SET_DEPOSIT_RECORD_ROLE =
    keccak256("WithdrawHook_setDepositRecord(address)");
  bytes32 public constant SET_WITHDRAWALS_ALLOWED_ROLE =
    keccak256("WithdrawHook_setWithdrawalsAllowed(bool)");
  bytes32 public constant SET_GLOBAL_PERIOD_LENGTH_ROLE =
    keccak256("WithdrawHook_setGlobalPeriodLength(uint256)");
  bytes32 public constant SET_USER_PERIOD_LENGTH_ROLE =
    keccak256("WithdrawHook_setUserPeriodLength(uint256)");
  bytes32 public constant SET_GLOBAL_WITHDRAW_LIMIT_PER_PERIOD_ROLE =
    keccak256("WithdrawHook_setGlobalWithdrawLimitPerPeriod(uint256)");
  bytes32 public constant SET_USER_WITHDRAW_LIMIT_PER_PERIOD_ROLE =
    keccak256("WithdrawHook_setUserWithdrawLimitPerPeriod(uint256)");

  constructor(address _newDepositRecord) {
    _depositRecord = IDepositRecord(_newDepositRecord);
  }

  modifier onlyCollateral() {
    require(msg.sender == address(_collateral), "msg.sender != collateral");
    _;
  }

  /*
   * @dev While we could include the period length in the last reset
   * timestamp, not initially adding it means that a change in period will
   * be reflected immediately.
   *
   * We use `_amountBeforeFee` for updating global net deposits for a more
   * accurate value.
   */
  function hook(
    address _sender,
    uint256 _amountBeforeFee,
    uint256 _amountAfterFee
  ) external override onlyCollateral {
    require(_withdrawalsAllowed, "withdrawals not allowed");
    if (_lastGlobalPeriodReset + _globalPeriodLength < block.timestamp) {
      _lastGlobalPeriodReset = block.timestamp;
      _globalAmountWithdrawnThisPeriod = _amountBeforeFee;
    } else {
      require(
        _globalAmountWithdrawnThisPeriod + _amountBeforeFee <=
          _globalWithdrawLimitPerPeriod,
        "global withdraw limit exceeded"
      );
      _globalAmountWithdrawnThisPeriod += _amountBeforeFee;
    }
    if (_lastUserPeriodReset + _userPeriodLength < block.timestamp) {
      _lastUserPeriodReset = block.timestamp;
      _userToAmountWithdrawnThisPeriod[_sender] = _amountBeforeFee;
    } else {
      require(
        _userToAmountWithdrawnThisPeriod[_sender] + _amountBeforeFee <=
          _userWithdrawLimitPerPeriod,
        "user withdraw limit exceeded"
      );
      _userToAmountWithdrawnThisPeriod[_sender] += _amountBeforeFee;
    }
    _depositRecord.recordWithdrawal(_amountBeforeFee);
  }

  function setCollateral(ICollateral _newCollateral)
    external
    override
    onlyRole(SET_COLLATERAL_ROLE)
  {
    _collateral = _newCollateral;
    emit CollateralChange(address(_newCollateral));
  }

  function setDepositRecord(IDepositRecord _newDepositRecord)
    external
    override
    onlyRole(SET_DEPOSIT_RECORD_ROLE)
  {
    _depositRecord = _newDepositRecord;
    emit DepositRecordChange(address(_newDepositRecord));
  }

  function setWithdrawalsAllowed(bool _newWithdrawalsAllowed)
    external
    override
    onlyRole(SET_WITHDRAWALS_ALLOWED_ROLE)
  {
    _withdrawalsAllowed = _newWithdrawalsAllowed;
    emit WithdrawalsAllowedChange(_newWithdrawalsAllowed);
  }

  function setGlobalPeriodLength(uint256 _newGlobalPeriodLength)
    external
    override
    onlyRole(SET_GLOBAL_PERIOD_LENGTH_ROLE)
  {
    _globalPeriodLength = _newGlobalPeriodLength;
    emit GlobalPeriodLengthChange(_newGlobalPeriodLength);
  }

  function setUserPeriodLength(uint256 _newUserPeriodLength)
    external
    override
    onlyRole(SET_USER_PERIOD_LENGTH_ROLE)
  {
    _userPeriodLength = _newUserPeriodLength;
    emit UserPeriodLengthChange(_newUserPeriodLength);
  }

  function setGlobalWithdrawLimitPerPeriod(
    uint256 _newGlobalWithdrawLimitPerPeriod
  ) external override onlyRole(SET_GLOBAL_WITHDRAW_LIMIT_PER_PERIOD_ROLE) {
    _globalWithdrawLimitPerPeriod = _newGlobalWithdrawLimitPerPeriod;
    emit GlobalWithdrawLimitPerPeriodChange(_newGlobalWithdrawLimitPerPeriod);
  }

  function setUserWithdrawLimitPerPeriod(
    uint256 _newUserWithdrawLimitPerPeriod
  ) external override onlyRole(SET_USER_WITHDRAW_LIMIT_PER_PERIOD_ROLE) {
    _userWithdrawLimitPerPeriod = _newUserWithdrawLimitPerPeriod;
    emit UserWithdrawLimitPerPeriodChange(_newUserWithdrawLimitPerPeriod);
  }

  function getCollateral() external view override returns (ICollateral) {
    return _collateral;
  }

  function getDepositRecord() external view override returns (IDepositRecord) {
    return _depositRecord;
  }

  function withdrawalsAllowed() external view override returns (bool) {
    return _withdrawalsAllowed;
  }

  function getGlobalPeriodLength() external view override returns (uint256) {
    return _globalPeriodLength;
  }

  function getUserPeriodLength() external view override returns (uint256) {
    return _userPeriodLength;
  }

  function getGlobalWithdrawLimitPerPeriod()
    external
    view
    override
    returns (uint256)
  {
    return _globalWithdrawLimitPerPeriod;
  }

  function getUserWithdrawLimitPerPeriod()
    external
    view
    override
    returns (uint256)
  {
    return _userWithdrawLimitPerPeriod;
  }

  function getLastGlobalPeriodReset()
    external
    view
    override
    returns (uint256)
  {
    return _lastGlobalPeriodReset;
  }

  function getLastUserPeriodReset() external view override returns (uint256) {
    return _lastUserPeriodReset;
  }

  function getGlobalAmountWithdrawnThisPeriod()
    external
    view
    override
    returns (uint256)
  {
    return _globalAmountWithdrawnThisPeriod;
  }

  function getAmountWithdrawnThisPeriod(address _user)
    external
    view
    override
    returns (uint256)
  {
    return _userToAmountWithdrawnThisPeriod[_user];
  }
}
