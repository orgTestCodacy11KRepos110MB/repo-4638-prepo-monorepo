// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./SafeOwnable.sol";
import "./interfaces/IPausable.sol";

contract Pausable is IPausable, SafeOwnable {
  bool private _paused;

  modifier whenNotPaused() {
    require(!_paused, "Paused");
    _;
  }

  constructor() {}

  function setPaused(bool paused) external override onlyOwner {
    _paused = paused;
    emit PausedChange(paused);
  }

  function isPaused() external view override returns (bool) {
    return _paused;
  }
}
