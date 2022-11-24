// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./IAccountList.sol";

interface IAllowListHook {
  event AllowlistChange(IAccountList allowlist);

  function setAllowlist(IAccountList allowlist) external;

  function getAllowlist() external view returns (IAccountList);
}
