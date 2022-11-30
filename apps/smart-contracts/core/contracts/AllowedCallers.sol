// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IAllowedCallers.sol";

contract AllowedCallers is IAllowedCallers {
  mapping(address => bool) private callerToAllowed;

  function setAllowedCallers(address[] memory _callers, bool[] memory _allowed)
    external
    virtual
    override
  {}

  function isCallerAllowed(address _caller)
    external
    view
    virtual
    override
    returns (bool)
  {}
}
