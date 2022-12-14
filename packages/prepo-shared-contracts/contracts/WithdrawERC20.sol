// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IWithdrawERC20.sol";
import "./SafeOwnable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract WithdrawERC20 is IWithdrawERC20, SafeOwnable, ReentrancyGuard {
  using SafeERC20 for IERC20;

  function withdrawERC20(
    address[] calldata erc20Tokens,
    uint256[] calldata amounts
  ) external override onlyOwner nonReentrant {
    require(erc20Tokens.length == amounts.length, "Array length mismatch");
    address owner = owner();
    uint256 arrayLength = erc20Tokens.length;
    for (uint256 i; i < arrayLength; ) {
      IERC20(erc20Tokens[i]).safeTransfer(owner, amounts[i]);
      unchecked {
        ++i;
      }
    }
  }

  function withdrawERC20(address[] calldata erc20Tokens)
    external
    override
    onlyOwner
    nonReentrant
  {
    address owner = owner();
    uint256 arrayLength = erc20Tokens.length;
    for (uint256 i; i < arrayLength; ) {
      IERC20(erc20Tokens[i]).safeTransfer(
        owner,
        IERC20(erc20Tokens[i]).balanceOf(address(this))
      );
      unchecked {
        ++i;
      }
    }
  }
}
