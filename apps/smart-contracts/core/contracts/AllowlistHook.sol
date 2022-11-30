// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IAccountList.sol";
import "./interfaces/IAllowlistHook.sol";
import "prepo-shared-contracts/contracts/SafeAccessControlEnumerable.sol";

contract AllowlistHook is IAllowlistHook, SafeAccessControlEnumerable {
  IAccountList internal _allowlist;

  bytes32 public constant SET_ALLOWLIST_ROLE =
    keccak256("AllowlistHook_setAllowlist(IAccountList)");

  function setAllowlist(IAccountList allowlist)
    external
    override
    onlyRole(SET_ALLOWLIST_ROLE)
  {
    _allowlist = allowlist;
    emit AllowlistChange(allowlist);
  }

  function getAllowlist() external view override returns (IAccountList) {
    return _allowlist;
  }
}
