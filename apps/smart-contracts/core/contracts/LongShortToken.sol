// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/ILongShortToken.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract LongShortToken is ERC20Burnable, Ownable, ILongShortToken {
  constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

  function owner()
    public
    view
    override(Ownable, ILongShortToken)
    returns (address)
  {
    return super.owner();
  }

  function mint(address recipient, uint256 amount)
    external
    override
    onlyOwner
  {
    _mint(recipient, amount);
  }

  function burnFrom(address account, uint256 amount)
    public
    override(ERC20Burnable, ILongShortToken)
  {
    super.burnFrom(account, amount);
  }
}
