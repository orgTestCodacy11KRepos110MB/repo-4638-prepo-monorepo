// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IHook.sol";
import "prepo-shared-contracts/contracts/AllowedMsgSenders.sol";
import "prepo-shared-contracts/contracts/AccountListCaller.sol";
import "prepo-shared-contracts/contracts/interfaces/IAccountList.sol";
import "prepo-shared-contracts/contracts/SafeOwnable.sol";

contract MintHook is IHook, AllowedMsgSenders, AccountListCaller, SafeOwnable {
  function hook(
    address user,
    uint256,
    uint256
  ) external virtual override onlyAllowedMsgSenders {
    require(_accountList.isIncluded(user), "Minter not allowed");
  }

  function setAllowedMsgSenders(IAccountList allowedMsgSenders)
    public
    virtual
    override
    onlyOwner
  {
    super.setAllowedMsgSenders(allowedMsgSenders);
  }

  function setAccountList(IAccountList accountList)
    public
    virtual
    override
    onlyOwner
  {
    super.setAccountList(accountList);
  }
}
