// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./IHook.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

interface ICollateral is IERC20Upgradeable {
  event DepositFeeChange(uint256 fee);

  event WithdrawFeeChange(uint256 fee);

  event DepositHookChange(address hook);

  event WithdrawHookChange(address hook);

  event ManagerWithdrawHookChange(address hook);

  function deposit(uint256 amount) external;

  function withdraw(uint256 amount) external;

  function managerWithdraw(uint256 amount) external;

  function setDepositFee(uint256 newDepositFee) external;

  function setWithdrawFee(uint256 newWithdrawFee) external;

  function setDepositHook(IHook newHook) external;

  function setWithdrawHook(IHook newHook) external;

  function setManagerWithdrawHook(IHook newHook) external;

  function getBaseToken() external view returns (IERC20);

  function getDepositFee() external view returns (uint256);

  function getWithdrawFee() external view returns (uint256);

  function getDepositHook() external view returns (IHook);

  function getWithdrawHook() external view returns (IHook);

  function getManagerWithdrawHook() external view returns (IHook);
}
