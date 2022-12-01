// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IFeeRebateHook.sol";
import "./interfaces/ITokenSender.sol";
import "prepo-shared-contracts/contracts/SafeAccessControlEnumerable.sol";

contract FeeRebateHook is IFeeRebateHook, SafeAccessControlEnumerable {
  address internal _treasury;
  ITokenSender internal _feeRebate;

  function setTreasury(address treasury) external virtual override {
    _setTreasury(treasury);
  }

  function _setTreasury(address treasury) internal {
    _treasury = treasury;
    emit TreasuryChange(treasury);
  }

  function getTreasury() external view override returns (address) {
    return _treasury;
  }

  function setTokenSender(ITokenSender tokenSender)
    external
    virtual
    override
  {}
}
