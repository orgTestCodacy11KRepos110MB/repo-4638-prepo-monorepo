// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IMarketHook.sol";
import "prepo-shared-contracts/contracts/AllowlistHook.sol";
import "prepo-shared-contracts/contracts/AllowedCallers.sol";
import "prepo-shared-contracts/contracts/SafeOwnable.sol";

contract MintHook is IMarketHook, AllowlistHook, AllowedCallers, SafeOwnable {
  function hook(
    address sender,
    uint256 amountBeforeFee,
    uint256 amountAfterFee
  ) external virtual override onlyAllowedCallers {
    require(_allowlist.isIncluded(sender), "minter not allowed");
  }

  function setAllowlist(IAccountList allowlist)
    public
    virtual
    override
    onlyOwner
  {
    super.setAllowlist(allowlist);
  }

  function setAllowedCallers(address[] memory callers, bool[] memory allowed)
    public
    virtual
    override
    onlyOwner
  {
    super.setAllowedCallers(callers, allowed);
  }
}
