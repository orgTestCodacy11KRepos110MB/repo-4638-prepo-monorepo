// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IAccountList.sol";
import "./SafeOwnable.sol";

contract AccountList is IAccountList, SafeOwnable {
  uint256 private _resetIndex;
  mapping(uint256 => mapping(address => bool))
    private _resetIndexToAccountToIncluded;

  constructor() {}

  function set(address[] calldata accounts, bool[] calldata included)
    external
    override
    onlyOwner
  {
    require(accounts.length == included.length, "Array length mismatch");
    uint256 _arrayLength = accounts.length;
    for (uint256 i; i < _arrayLength; ) {
      _resetIndexToAccountToIncluded[_resetIndex][accounts[i]] = included[i];
      unchecked {
        ++i;
      }
    }
  }

  function reset(address[] calldata includedAccounts)
    external
    override
    onlyOwner
  {
    _resetIndex++;
    uint256 _arrayLength = includedAccounts.length;
    for (uint256 i; i < _arrayLength; ) {
      _resetIndexToAccountToIncluded[_resetIndex][includedAccounts[i]] = true;
      unchecked {
        ++i;
      }
    }
  }

  function isIncluded(address _account) external view override returns (bool) {
    return _resetIndexToAccountToIncluded[_resetIndex][_account];
  }
}
