// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IMarketHook.sol";
import "prepo-shared-contracts/contracts/AllowedMsgSenders.sol";
import "prepo-shared-contracts/contracts/AllowlistHook.sol";
import "prepo-shared-contracts/contracts/interfaces/IAccountList.sol";
import "prepo-shared-contracts/contracts/SafeOwnable.sol";

contract MintHook is
  IMarketHook,
  AllowedMsgSenders,
  AllowlistHook,
  SafeOwnable
{
  function hook(
    address sender,
    uint256 amountBeforeFee,
    uint256 amountAfterFee
  ) external virtual override onlyAllowedMsgSenders {
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

  function setAllowedMsgSenders(IAccountList allowedMsgSenders)
    public
    virtual
    override
    onlyOwner
  {
    super.setAllowedMsgSenders(allowedMsgSenders);
  }
}
