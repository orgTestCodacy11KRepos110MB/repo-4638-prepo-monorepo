// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity =0.8.7;

// TODO: add natspec comments
interface IWithdrawERC1155 {
  function withdrawERC1155(
    address[] calldata erc1155Tokens,
    address[] calldata recipients,
    uint256[] calldata ids,
    uint256[] calldata amounts
  ) external;
}
