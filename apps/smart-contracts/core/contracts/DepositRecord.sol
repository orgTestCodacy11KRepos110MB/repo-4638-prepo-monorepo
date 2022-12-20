// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IDepositRecord.sol";
import "prepo-shared-contracts/contracts/SafeAccessControlEnumerable.sol";

contract DepositRecord is IDepositRecord, SafeAccessControlEnumerable {
  uint256 private _globalNetDepositCap;
  uint256 private _globalNetDepositAmount;
  uint256 private _userDepositCap;
  mapping(address => uint256) private _userToDeposits;
  mapping(address => bool) private _allowedHooks;

  bytes32 public constant SET_GLOBAL_NET_DEPOSIT_CAP_ROLE =
    keccak256("DepositRecord_setGlobalNetDepositCap(uint256)");
  bytes32 public constant SET_USER_DEPOSIT_CAP_ROLE =
    keccak256("DepositRecord_setUserDepositCap(uint256)");
  bytes32 public constant SET_ALLOWED_HOOK_ROLE =
    keccak256("DepositRecord_setAllowedHook(address)");

  modifier onlyAllowedHooks() {
    require(_allowedHooks[msg.sender], "msg.sender != allowed hook");
    _;
  }

  constructor(uint256 globalNetDepositCap, uint256 userDepositCap) {
    _globalNetDepositCap = globalNetDepositCap;
    _userDepositCap = userDepositCap;
  }

  function recordDeposit(address user, uint256 amount)
    external
    override
    onlyAllowedHooks
  {
    require(
      amount + _globalNetDepositAmount <= _globalNetDepositCap,
      "Global deposit cap exceeded"
    );
    require(
      amount + _userToDeposits[user] <= _userDepositCap,
      "User deposit cap exceeded"
    );
    _globalNetDepositAmount += amount;
    _userToDeposits[user] += amount;
  }

  function recordWithdrawal(uint256 amount)
    external
    override
    onlyAllowedHooks
  {
    if (_globalNetDepositAmount > amount) {
      _globalNetDepositAmount -= amount;
    } else {
      _globalNetDepositAmount = 0;
    }
  }

  function setGlobalNetDepositCap(uint256 globalNetDepositCap)
    external
    override
    onlyRole(SET_GLOBAL_NET_DEPOSIT_CAP_ROLE)
  {
    _globalNetDepositCap = globalNetDepositCap;
    emit GlobalNetDepositCapChange(_globalNetDepositCap);
  }

  function setUserDepositCap(uint256 userDepositCap)
    external
    override
    onlyRole(SET_USER_DEPOSIT_CAP_ROLE)
  {
    _userDepositCap = userDepositCap;
    emit UserDepositCapChange(userDepositCap);
  }

  function setAllowedHook(address hook, bool allowed)
    external
    override
    onlyRole(SET_ALLOWED_HOOK_ROLE)
  {
    _allowedHooks[hook] = allowed;
    emit AllowedHooksChange(hook, allowed);
  }

  function getGlobalNetDepositCap() external view override returns (uint256) {
    return _globalNetDepositCap;
  }

  function getGlobalNetDepositAmount()
    external
    view
    override
    returns (uint256)
  {
    return _globalNetDepositAmount;
  }

  function getUserDepositCap() external view override returns (uint256) {
    return _userDepositCap;
  }

  function getUserDepositAmount(address account)
    external
    view
    override
    returns (uint256)
  {
    return _userToDeposits[account];
  }

  function isHookAllowed(address hook) external view override returns (bool) {
    return _allowedHooks[hook];
  }
}
