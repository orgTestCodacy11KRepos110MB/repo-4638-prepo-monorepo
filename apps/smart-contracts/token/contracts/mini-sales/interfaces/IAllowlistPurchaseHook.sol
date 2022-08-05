// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity =0.8.7;

import "./IPurchaseHook.sol";
import "../../ppo/interfaces/IAccountList.sol";

//TODO natspec
interface IAllowlistPurchaseHook is IPurchaseHook {
  function setAllowlist(IAccountList newAllowlist) external;

  function getAllowlist() external view returns (IAccountList);
}
