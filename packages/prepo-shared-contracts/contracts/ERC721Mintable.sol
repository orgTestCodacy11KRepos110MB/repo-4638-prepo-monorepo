// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity =0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./SafeOwnable.sol";

//TODO: add tests and interface for this
contract ERC721Mintable is ERC721, SafeOwnable {
  constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

  function mint(address recipient, uint256 tokenId) external onlyOwner {
    _mint(recipient, tokenId);
  }
}
