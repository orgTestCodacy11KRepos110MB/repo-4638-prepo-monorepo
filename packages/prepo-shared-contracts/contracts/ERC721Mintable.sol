// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./interfaces/IERC721Mintable.sol";
import "./SafeOwnable.sol";

contract ERC721Mintable is IERC721Mintable, ERC721, SafeOwnable {
  constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

  function mint(address recipient, uint256 tokenId)
    external
    virtual
    override
    onlyOwner
  {
    _mint(recipient, tokenId);
  }
}
