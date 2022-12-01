// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IDepositHook.sol";
import "./interfaces/IDepositRecord.sol";
import "./interfaces/INFTAccessHook.sol";
import "prepo-shared-contracts/contracts/AllowlistHook.sol";
import "prepo-shared-contracts/contracts/SafeAccessControlEnumerable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";

contract DepositHook is
  IDepositHook,
  INFTAccessHook,
  AllowlistHook,
  SafeAccessControlEnumerable
{
  using EnumerableMap for EnumerableMap.AddressToUintMap;

  ICollateral private collateral;
  IDepositRecord private depositRecord;
  bool public override depositsAllowed;
  uint256 private requiredScore;
  EnumerableMap.AddressToUintMap private collectionToScore;

  bytes32 public constant SET_ALLOWLIST_ROLE =
    keccak256("DepositHook_setAllowlist(IAccountList)");
  bytes32 public constant SET_COLLATERAL_ROLE =
    keccak256("DepositHook_setCollateral(address)");
  bytes32 public constant SET_DEPOSIT_RECORD_ROLE =
    keccak256("DepositHook_setDepositRecord(address)");
  bytes32 public constant SET_DEPOSITS_ALLOWED_ROLE =
    keccak256("DepositHook_setDepositsAllowed(bool)");
  bytes32 public constant SET_REQUIRED_SCORE_ROLE =
    keccak256("DepositHook_setRequiredScore(uint256)");
  bytes32 public constant SET_COLLECTION_SCORES_ROLE =
    keccak256("DepositHook_setCollectionScores(IERC721[],uint256[])");
  bytes32 public constant REMOVE_COLLECTIONS_ROLE =
    keccak256("DepositHook_removeCollections(IERC721[])");

  modifier onlyCollateral() {
    require(msg.sender == address(collateral), "msg.sender != collateral");
    _;
  }

  function hook(
    address _sender,
    uint256,
    uint256 _amountAfterFee
  ) external override onlyCollateral {
    require(depositsAllowed, "deposits not allowed");
    depositRecord.recordDeposit(_sender, _amountAfterFee);
  }

  function setAllowlist(IAccountList allowlist)
    external
    override
    onlyRole(SET_ALLOWLIST_ROLE)
  {
    _setAllowlist(allowlist);
  }

  function setCollateral(ICollateral _newCollateral)
    external
    override
    onlyRole(SET_COLLATERAL_ROLE)
  {
    collateral = _newCollateral;
    emit CollateralChange(address(_newCollateral));
  }

  function setDepositRecord(IDepositRecord _newDepositRecord)
    external
    override
    onlyRole(SET_DEPOSIT_RECORD_ROLE)
  {
    depositRecord = _newDepositRecord;
    emit DepositRecordChange(address(_newDepositRecord));
  }

  function setDepositsAllowed(bool _newDepositsAllowed)
    external
    override
    onlyRole(SET_DEPOSITS_ALLOWED_ROLE)
  {
    depositsAllowed = _newDepositsAllowed;
    emit DepositsAllowedChange(_newDepositsAllowed);
  }

  function getCollateral() external view override returns (ICollateral) {
    return collateral;
  }

  function getDepositRecord() external view override returns (IDepositRecord) {
    return depositRecord;
  }

  function setRequiredScore(uint256 _newRequiredScore)
    external
    override
    onlyRole(SET_REQUIRED_SCORE_ROLE)
  {
    requiredScore = _newRequiredScore;
    emit RequiredScoreChange(_newRequiredScore);
  }

  function setCollectionScores(
    IERC721[] memory _collections,
    uint256[] memory _scores
  ) external override onlyRole(SET_COLLECTION_SCORES_ROLE) {}

  function removeCollections(IERC721[] memory _collections)
    external
    override
    onlyRole(REMOVE_COLLECTIONS_ROLE)
  {}

  function getRequiredScore() external view override returns (uint256) {
    return requiredScore;
  }

  function getCollectionScore(IERC721 _collection)
    external
    view
    override
    returns (uint256)
  {}

  function getAccountScore(address _account)
    external
    view
    override
    returns (uint256)
  {}
}
