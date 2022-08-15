// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IBlocklistTransferHook.sol";
import "./interfaces/IAccountList.sol";
import "prepo-shared-contracts/contracts/SafeOwnable.sol";

contract BlocklistTransferHook is IBlocklistTransferHook, SafeOwnable {
  IAccountList private _blocklist;

  constructor(address _nominatedOwner) {
    transferOwnership(_nominatedOwner);
  }

  function hook(
    address _from,
    address _to,
    uint256 _amount
  ) public virtual override {
    require(!_blocklist.isIncluded(_from), "Sender blocked");
    require(!_blocklist.isIncluded(_to), "Recipient blocked");
  }

  function setBlocklist(IAccountList _newBlocklist) external override onlyOwner {
    _blocklist = _newBlocklist;
    emit BlocklistChange(_newBlocklist);
  }

  function getBlocklist() external view override returns (IAccountList) {
    return _blocklist;
  }
}
