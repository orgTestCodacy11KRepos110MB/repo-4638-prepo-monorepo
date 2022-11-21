// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./ICollateralHook.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

interface ICollateral is IERC20Upgradeable {
  event Deposit(
    address indexed depositor,
    uint256 amountAfterFee,
    uint256 fee
  );

  event Withdraw(
    address indexed withdrawer,
    uint256 amountAfterFee,
    uint256 fee
  );

  event ManagerChange(address manager);

  event DepositFeeChange(uint256 fee);

  event WithdrawFeeChange(uint256 fee);

  event DepositHookChange(address hook);

  event WithdrawHookChange(address hook);

  event ManagerWithdrawHookChange(address hook);

  function deposit(uint256 amount) external;

  function withdraw(uint256 amount) external;

  function managerWithdraw(uint256 amount) external;

  function setManager(address newManager) external;

  function setDepositFee(uint256 newDepositFee) external;

  function setWithdrawFee(uint256 newWithdrawFee) external;

  function setDepositHook(ICollateralHook newHook) external;

  function setWithdrawHook(ICollateralHook newHook) external;

  function setManagerWithdrawHook(ICollateralHook newHook) external;

  function getBaseToken() external view returns (IERC20);

  function getManager() external view returns (address);

  function getDepositFee() external view returns (uint256);

  function getWithdrawFee() external view returns (uint256);

  function getDepositHook() external view returns (ICollateralHook);

  function getWithdrawHook() external view returns (ICollateralHook);

  function getManagerWithdrawHook() external view returns (ICollateralHook);

  function getReserve() external view returns (uint256);
}
