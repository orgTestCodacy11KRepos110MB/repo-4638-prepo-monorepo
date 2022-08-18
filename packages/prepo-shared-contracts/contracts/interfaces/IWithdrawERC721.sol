// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity =0.8.7;

// TODO: add natspec comments
interface IWithdrawERC721 {
  function withdrawERC721(
    address[] calldata erc721Tokens,
    address[] calldata recipients,
    uint256[] calldata ids
  ) external;
}
