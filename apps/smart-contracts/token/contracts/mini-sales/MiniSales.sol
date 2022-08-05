// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity =0.8.7;

import "./interfaces/IMiniSales.sol";
import "prepo-shared-contracts/contracts/SafeOwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

contract MiniSales is IMiniSales, SafeOwnableUpgradeable, ReentrancyGuardUpgradeable {
  IERC20 private immutable _saleToken;
  IERC20 private immutable _paymentToken;
  uint256 private _price;
  IPurchaseHook private _purchaseHook;

  constructor(address _newSaleToken, address _newPaymentToken) {
    _saleToken = IERC20(_newSaleToken);
    _paymentToken = IERC20(_newPaymentToken);
  }

  function initialize(address _nominatedOwner) public initializer {
    __Ownable_init();
    transferOwnership(_nominatedOwner);
  }

  function purchase(
    address _recipient,
    uint256 _amount,
    uint256 _price
  ) external override {}

  function setPrice(uint256 _newPrice) external override onlyOwner {
    //TODO add event
    _price = _newPrice;
  }

  function setPurchaseHook(IPurchaseHook _newPurchaseHook) external override onlyOwner {
    //TODO add event
    _purchaseHook = _newPurchaseHook;
  }

  function getSaleToken() external view override returns (IERC20) {
    return _saleToken;
  }

  function getPaymentToken() external view override returns (IERC20) {
    return _paymentToken;
  }

  function getPrice() external view override returns (uint256) {
    return _price;
  }

  function getPurchaseHook() external view override returns (IPurchaseHook) {
    return _purchaseHook;
  }
}
