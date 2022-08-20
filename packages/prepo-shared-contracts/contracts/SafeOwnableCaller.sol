// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/ISafeOwnable.sol";
import "./interfaces/ISafeOwnableCaller.sol";

contract SafeOwnableCaller is ISafeOwnableCaller {
  function transferOwnership(address _safeOwnableContract, address _nominee)
    external
    override
  {
    ISafeOwnable(_safeOwnableContract).transferOwnership(_nominee);
  }

  function acceptOwnership(address _safeOwnableContract) external override {
    ISafeOwnable(_safeOwnableContract).acceptOwnership();
  }

  function renounceOwnership(address _safeOwnableContract) external override {
    ISafeOwnable(_safeOwnableContract).renounceOwnership();
  }

  function getNominee(address _safeOwnableContract)
    external
    view
    override
    returns (address)
  {
    return ISafeOwnable(_safeOwnableContract).getNominee();
  }
}
