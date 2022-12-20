// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IWithdrawHook.sol";
import "./AllowedCollateralCaller.sol";
import "./DepositRecordCaller.sol";
import "prepo-shared-contracts/contracts/TokenSenderCaller.sol";
import "prepo-shared-contracts/contracts/SafeAccessControlEnumerable.sol";

contract WithdrawHook is
  IWithdrawHook,
  DepositRecordCaller,
  TokenSenderCaller,
  AllowedCollateralCaller,
  SafeAccessControlEnumerable
{
  bool public _withdrawalsAllowed;
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
  bytes32 public constant SET_TREASURY_ROLE =
    keccak256("WithdrawHook_setTreasury(address)");
  bytes32 public constant SET_TOKEN_SENDER_ROLE =
    keccak256("WithdrawHook_setTokenSender(ITokenSender)");

  /*
   * @dev While we could include the period length in the last reset
   * timestamp, not initially adding it means that a change in period will
   * be reflected immediately.
   *
   * We use `_amountBeforeFee` for updating global net deposits for a more
   * accurate value.
   */
  function hook(
    address user,
    uint256 amountBeforeFee,
    uint256 amountAfterFee
  ) external override onlyCollateral {
    require(_withdrawalsAllowed, "Withdrawals not allowed");
    if (_lastGlobalPeriodReset + _globalPeriodLength < block.timestamp) {
      _lastGlobalPeriodReset = block.timestamp;
      _globalAmountWithdrawnThisPeriod = amountBeforeFee;
    } else {
      require(
        _globalAmountWithdrawnThisPeriod + amountBeforeFee <=
          _globalWithdrawLimitPerPeriod,
        "Global withdraw limit exceeded"
      );
      _globalAmountWithdrawnThisPeriod += amountBeforeFee;
    }
    if (_lastUserPeriodReset + _userPeriodLength < block.timestamp) {
      _lastUserPeriodReset = block.timestamp;
      _userToAmountWithdrawnThisPeriod[user] = amountBeforeFee;
    } else {
      require(
        _userToAmountWithdrawnThisPeriod[user] + amountBeforeFee <=
          _userWithdrawLimitPerPeriod,
        "User withdraw limit exceeded"
      );
      _userToAmountWithdrawnThisPeriod[user] += amountBeforeFee;
    }
    _depositRecord.recordWithdrawal(amountBeforeFee);
    uint256 fee = amountBeforeFee - amountAfterFee;
    if (fee > 0) {
      _collateral.getBaseToken().transferFrom(
        address(_collateral),
        _treasury,
        fee
      );
      _tokenSender.send(user, fee);
    }
  }

  function setCollateral(ICollateral collateral)
    public
    override
    onlyRole(SET_COLLATERAL_ROLE)
  {
    super.setCollateral(collateral);
  }

  function setDepositRecord(IDepositRecord depositRecord)
    public
    override
    onlyRole(SET_DEPOSIT_RECORD_ROLE)
  {
    super.setDepositRecord(depositRecord);
  }

  function setWithdrawalsAllowed(bool withdrawalsAllowed)
    external
    override
    onlyRole(SET_WITHDRAWALS_ALLOWED_ROLE)
  {
    _withdrawalsAllowed = withdrawalsAllowed;
    emit WithdrawalsAllowedChange(withdrawalsAllowed);
  }

  function setGlobalPeriodLength(uint256 globalPeriodLength)
    external
    override
    onlyRole(SET_GLOBAL_PERIOD_LENGTH_ROLE)
  {
    _globalPeriodLength = globalPeriodLength;
    emit GlobalPeriodLengthChange(globalPeriodLength);
  }

  function setUserPeriodLength(uint256 userPeriodLength)
    external
    override
    onlyRole(SET_USER_PERIOD_LENGTH_ROLE)
  {
    _userPeriodLength = userPeriodLength;
    emit UserPeriodLengthChange(userPeriodLength);
  }

  function setGlobalWithdrawLimitPerPeriod(
    uint256 globalWithdrawLimitPerPeriod
  ) external override onlyRole(SET_GLOBAL_WITHDRAW_LIMIT_PER_PERIOD_ROLE) {
    _globalWithdrawLimitPerPeriod = globalWithdrawLimitPerPeriod;
    emit GlobalWithdrawLimitPerPeriodChange(globalWithdrawLimitPerPeriod);
  }

  function setUserWithdrawLimitPerPeriod(uint256 userWithdrawLimitPerPeriod)
    external
    override
    onlyRole(SET_USER_WITHDRAW_LIMIT_PER_PERIOD_ROLE)
  {
    _userWithdrawLimitPerPeriod = userWithdrawLimitPerPeriod;
    emit UserWithdrawLimitPerPeriodChange(userWithdrawLimitPerPeriod);
  }

  function setTreasury(address treasury)
    public
    override
    onlyRole(SET_TREASURY_ROLE)
  {
    super.setTreasury(treasury);
  }

  function setTokenSender(ITokenSender tokenSender)
    public
    override
    onlyRole(SET_TOKEN_SENDER_ROLE)
  {
    super.setTokenSender(tokenSender);
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
