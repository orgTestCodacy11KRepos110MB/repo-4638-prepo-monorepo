// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/ICollateralDepositRecord.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CollateralDepositRecord is ICollateralDepositRecord, Ownable {
  uint256 private _globalNetDepositCap;
  uint256 private _globalNetDepositAmount;
  uint256 private _userDepositCap;
  mapping(address => uint256) private _userToDeposits;
  mapping(address => bool) private _allowedHooks;

  modifier onlyAllowedHooks() {
    require(_allowedHooks[msg.sender], "msg.sender != allowed hook");
    _;
  }

  constructor(uint256 _newGlobalNetDepositCap, uint256 _newUserDepositCap) {
    _globalNetDepositCap = _newGlobalNetDepositCap;
    _userDepositCap = _newUserDepositCap;
  }

  function recordDeposit(address _sender, uint256 _amount)
    external
    override
    onlyAllowedHooks
  {
    require(
      _amount + _globalNetDepositAmount <= _globalNetDepositCap,
      "Global deposit cap exceeded"
    );
    require(
      _amount + _userToDeposits[_sender] <= _userDepositCap,
      "User deposit cap exceeded"
    );
    _globalNetDepositAmount += _amount;
    _userToDeposits[_sender] += _amount;
  }

  function recordWithdrawal(uint256 _amount)
    external
    override
    onlyAllowedHooks
  {
    if (_globalNetDepositAmount > _amount) {
      _globalNetDepositAmount -= _amount;
    } else {
      _globalNetDepositAmount = 0;
    }
  }

  function setGlobalNetDepositCap(uint256 _newGlobalNetDepositCap)
    external
    override
    onlyOwner
  {
    _globalNetDepositCap = _newGlobalNetDepositCap;
    emit GlobalNetDepositCapChange(_globalNetDepositCap);
  }

  function setUserDepositCap(uint256 _newUserDepositCap)
    external
    override
    onlyOwner
  {
    _userDepositCap = _newUserDepositCap;
    emit UserDepositCapChange(_newUserDepositCap);
  }

  function setAllowedHook(address _hook, bool _allowed)
    external
    override
    onlyOwner
  {
    _allowedHooks[_hook] = _allowed;
    emit AllowedHooksChange(_hook, _allowed);
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

  function getUserDepositAmount(address _account)
    external
    view
    override
    returns (uint256)
  {
    return _userToDeposits[_account];
  }

  function isHookAllowed(address _hook) external view override returns (bool) {
    return _allowedHooks[_hook];
  }
}
