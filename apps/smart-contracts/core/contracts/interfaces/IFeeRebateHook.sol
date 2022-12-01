// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./ITokenSender.sol";

interface IFeeRebateHook {
  event TreasuryChange(address treasury);

  event TokenSenderChange(address sender);

  function setTreasury(address treasury) external;

  function getTreasury() external view returns (address);

  function setTokenSender(ITokenSender tokenSender) external;
}
