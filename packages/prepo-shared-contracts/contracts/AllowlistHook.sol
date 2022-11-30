// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IAccountList.sol";
import "./interfaces/IAllowlistHook.sol";

contract AllowlistHook is IAllowlistHook {
  IAccountList private _allowlist;

  function setAllowlist(IAccountList allowlist) external virtual override {
    _setAllowlist(allowlist);
  }

  function getAllowlist() external view override returns (IAccountList) {
    return _allowlist;
  }

  function _setAllowlist(IAccountList allowlist) internal {
    _allowlist = allowlist;
    emit AllowlistChange(allowlist);
  }
}
