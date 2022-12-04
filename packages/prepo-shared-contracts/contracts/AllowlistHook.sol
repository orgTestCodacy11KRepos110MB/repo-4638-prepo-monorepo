// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IAccountList.sol";
import "./interfaces/IAllowlistHook.sol";

contract AllowlistHook is IAllowlistHook {
  IAccountList internal _allowlist;

  function setAllowlist(IAccountList allowlist) public virtual override {
    _allowlist = allowlist;
    emit AllowlistChange(allowlist);
  }

  function getAllowlist() external view override returns (IAccountList) {
    return _allowlist;
  }
}
