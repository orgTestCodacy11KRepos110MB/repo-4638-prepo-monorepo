// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IAllowedCallers.sol";

contract AllowedCallers is IAllowedCallers {
  mapping(address => bool) private _callerToAllowed;

  modifier onlyAllowedCallers() {
    require(_callerToAllowed[msg.sender], "msg.sender not allowed");
    _;
  }

  function setAllowedCallers(address[] memory callers, bool[] memory allowed)
    public
    virtual
    override
  {
    require(callers.length > 0 && allowed.length > 0, "Empty array");
    require(callers.length == allowed.length, "Array length mismatch");
    for (uint256 i = 0; i < callers.length; i++) {
      _callerToAllowed[callers[i]] = allowed[i];
    }
    emit AllowedCallersChange(callers, allowed);
  }

  function isCallerAllowed(address caller)
    external
    view
    virtual
    override
    returns (bool)
  {
    return _callerToAllowed[caller];
  }
}
