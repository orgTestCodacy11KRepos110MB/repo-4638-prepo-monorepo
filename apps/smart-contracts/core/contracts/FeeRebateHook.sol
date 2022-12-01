// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IFeeRebateHook.sol";
import "./interfaces/ITokenSender.sol";
import "prepo-shared-contracts/contracts/SafeAccessControlEnumerable.sol";

contract FeeRebateHook is IFeeRebateHook, SafeAccessControlEnumerable {
  address private _treasury;
  ITokenSender private _feeRebate;
  
  bytes32 public constant SET_TREASURY_ROLE =
    keccak256("FeeRebateHook_setTreasury(address)");
  bytes32 public constant SET_TOKEN_SENDER_ROLE =
    keccak256("FeeRebateHook_setTokenSender(ITokenSender)");

  function setTreasury(
    address treasury
  ) external override onlyRole(SET_TREASURY_ROLE) {}

  function setTokenSender(
    ITokenSender tokenSender
  ) external override onlyRole(SET_TOKEN_SENDER_ROLE) {}
}
