// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IWithdrawERC20.sol";
import "./SafeOwnable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract WithdrawERC20 is IWithdrawERC20, SafeOwnable, ReentrancyGuard {
  using SafeERC20 for IERC20;

  constructor() {}

  function withdrawERC20(
    address[] calldata _erc20Tokens,
    uint256[] calldata _amounts
  ) external override onlyOwner nonReentrant {
    require(_erc20Tokens.length == _amounts.length, "Array length mismatch");
    for (uint256 i; i < _erc20Tokens.length; ++i) {
      IERC20(_erc20Tokens[i]).safeTransfer(owner(), _amounts[i]);
    }
  }
}
