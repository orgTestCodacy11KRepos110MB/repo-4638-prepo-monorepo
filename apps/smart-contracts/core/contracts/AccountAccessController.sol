// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.7;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IAccountAccessController.sol";

contract AccountAccessController is Ownable, IAccountAccessController {
  bytes32 private root;
  uint16 internal allowedAccountsIndex;
  uint16 internal blockedAccountsIndex;
  mapping(uint16 => mapping(address => bool)) private allowedAccounts;
  mapping(uint16 => mapping(address => bool)) private blockedAccounts;

  constructor() {}

  function setRoot(bytes32 _newRoot) external override onlyOwner {
    _setRoot(_newRoot);
  }

  function clearAllowedAccounts() external override onlyOwner {
    _clearAllowedAccounts();
  }

  function setRootAndClearAllowedAccounts(bytes32 _newRoot)
    external
    override
    onlyOwner
  {
    _setRoot(_newRoot);
    _clearAllowedAccounts();
  }

  function clearBlockedAccounts() external override onlyOwner {
    blockedAccountsIndex++;
    emit BlockedAccountsCleared(blockedAccountsIndex);
  }

  function allowAccounts(address[] calldata _accounts)
    external
    override
    onlyOwner
  {
    for (uint256 _i = 0; _i < _accounts.length; _i++) {
      allowedAccounts[allowedAccountsIndex][_accounts[_i]] = true;
      emit AccountAllowed(_accounts[_i]);
    }
  }

  function blockAccounts(address[] calldata _accounts)
    external
    override
    onlyOwner
  {
    for (uint256 _i = 0; _i < _accounts.length; _i++) {
      blockedAccounts[blockedAccountsIndex][_accounts[_i]] = true;
      emit AccountBlocked(_accounts[_i]);
    }
  }

  function allowSelf(bytes32[] calldata _proof) external override {
    require(
      allowedAccounts[allowedAccountsIndex][msg.sender] == false,
      "Account already registered"
    );
    bytes32 _leaf = keccak256(abi.encodePacked(msg.sender));

    require(MerkleProof.verify(_proof, root, _leaf), "Invalid proof");
    allowedAccounts[allowedAccountsIndex][msg.sender] = true;
    emit AccountAllowed(msg.sender);
  }

  function getRoot() external view override returns (bytes32) {
    return root;
  }

  function isAccountAllowed(address _account)
    external
    view
    override
    returns (bool)
  {
    return allowedAccounts[allowedAccountsIndex][_account];
  }

  function isAccountBlocked(address _account)
    external
    view
    override
    returns (bool)
  {
    return blockedAccounts[blockedAccountsIndex][_account];
  }

  function _setRoot(bytes32 _newRoot) internal {
    root = _newRoot;
    emit RootChanged(root);
  }

  function _clearAllowedAccounts() internal {
    allowedAccountsIndex++;
    emit AllowedAccountsCleared(allowedAccountsIndex);
  }
}
