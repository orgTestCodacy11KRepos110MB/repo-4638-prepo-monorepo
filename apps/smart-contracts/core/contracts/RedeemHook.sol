// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IPrePOMarket.sol";
import "./interfaces/IMarketHook.sol";
import "prepo-shared-contracts/contracts/AllowlistHook.sol";
import "prepo-shared-contracts/contracts/TokenSenderCaller.sol";
import "prepo-shared-contracts/contracts/AllowedCallers.sol";
import "prepo-shared-contracts/contracts/SafeOwnable.sol";

contract RedeemHook is
  IMarketHook,
  AllowlistHook,
  TokenSenderCaller,
  AllowedCallers,
  SafeOwnable
{
  function hook(
    address sender,
    uint256 amountBeforeFee,
    uint256 amountAfterFee
  ) external virtual override onlyAllowedCallers {
    require(_allowlist.isIncluded(sender), "redeemer not allowed");
    uint256 fee = amountBeforeFee - amountAfterFee;
    if (fee > 0) {
      IPrePOMarket(msg.sender).getCollateral().transferFrom(
        msg.sender,
        _treasury,
        fee
      );
      _tokenSender.send(sender, fee);
    }
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

  function setTreasury(address _treasury) public override onlyOwner {
    super.setTreasury(_treasury);
  }

  function setTokenSender(ITokenSender tokenSender) public override onlyOwner {
    super.setTokenSender(tokenSender);
  }
}
