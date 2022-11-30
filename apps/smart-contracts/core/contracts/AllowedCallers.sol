// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IAllowedCallers.sol";

contract AllowedCallers is IAllowedCallers {
  mapping(address => bool) private callerToAllowed;

  function setAllowedCallers(address[] memory _callers, bool[] memory _allowed)
    public
    virtual
    override
  {}

  function isCallerAllowed(address _caller)
    public
    view
    virtual
    override
    returns (bool)
  {}
}
