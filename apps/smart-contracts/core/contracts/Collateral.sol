// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/ICollateral.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
import "prepo-shared-contracts/contracts/SafeAccessControlEnumerableUpgradeable.sol";

contract Collateral is
  ICollateral,
  ERC20Upgradeable,
  ERC20PermitUpgradeable,
  SafeAccessControlEnumerableUpgradeable
{
  IERC20 private _baseToken;
  uint256 private _depositFee;
  uint256 private _withdrawFee;
  IHook private _depositHook;
  IHook private _withdrawHook;
  IHook private _managerWithdrawHook;

  bytes32 public constant SET_DEPOSIT_FEE_ROLE =
    keccak256("Collateral_setDepositFee(uint256)");
  bytes32 public constant SET_WITHDRAW_FEE_ROLE =
    keccak256("Collateral_setWithdrawFee(uint256)");
  bytes32 public constant SET_DEPOSIT_HOOK_ROLE =
    keccak256("Collateral_setDepositHook(IHook)");
  bytes32 public constant SET_WITHDRAW_HOOK_ROLE =
    keccak256("Collateral_setWithdrawHook(IHook)");
  bytes32 public constant SET_MANAGER_WITHDRAW_HOOK_ROLE =
    keccak256("Collateral_setManagerWithdrawHook(IHook)");

  function initialize(
    string memory _name,
    string memory _symbol,
    IERC20 _newBaseToken
  ) public initializer {
    __SafeAccessControlEnumerable_init();
    __ERC20_init(_name, _symbol);
    __ERC20Permit_init(_name);
    _baseToken = _newBaseToken;
  }

  function deposit(uint256 _amount) external override {}

  function withdraw(uint256 _amount) external override {}

  function managerWithdraw(uint256 _amount) external override {}

  function setDepositFee(uint256 _newDepositFee)
    external
    override
    onlyRole(SET_DEPOSIT_FEE_ROLE)
  {
    _depositFee = _newDepositFee;
    emit DepositFeeChange(_newDepositFee);
  }

  function setWithdrawFee(uint256 _newWithdrawFee)
    external
    override
    onlyRole(SET_WITHDRAW_FEE_ROLE)
  {
    _withdrawFee = _newWithdrawFee;
    emit WithdrawFeeChange(_newWithdrawFee);
  }

  function setDepositHook(IHook _newDepositHook)
    external
    override
    onlyRole(SET_DEPOSIT_HOOK_ROLE)
  {
    _depositHook = _newDepositHook;
    emit DepositHookChange(address(_newDepositHook));
  }

  function setWithdrawHook(IHook _newWithdrawHook)
    external
    override
    onlyRole(SET_WITHDRAW_HOOK_ROLE)
  {
    _withdrawHook = _newWithdrawHook;
    emit WithdrawHookChange(address(_newWithdrawHook));
  }

  function setManagerWithdrawHook(IHook _newManagerWithdrawHook)
    external
    override
    onlyRole(SET_MANAGER_WITHDRAW_HOOK_ROLE)
  {
    _managerWithdrawHook = _newManagerWithdrawHook;
    emit ManagerWithdrawHookChange(address(_newManagerWithdrawHook));
  }

  function getBaseToken() external view override returns (IERC20) {
    return _baseToken;
  }

  function getDepositFee() external view override returns (uint256) {
    return _depositFee;
  }

  function getWithdrawFee() external view override returns (uint256) {
    return _withdrawFee;
  }

  function getDepositHook() external view override returns (IHook) {
    return _depositHook;
  }

  function getWithdrawHook() external view override returns (IHook) {
    return _withdrawHook;
  }

  function getManagerWithdrawHook() external view override returns (IHook) {
    return _managerWithdrawHook;
  }

  function getReserve() external view override returns (uint256) {
    return _baseToken.balanceOf(address(this));
  }
}
