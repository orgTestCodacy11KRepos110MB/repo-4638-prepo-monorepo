// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IDepositHook.sol";
import "./interfaces/IDepositRecord.sol";
import "./interfaces/INFTAccessHook.sol";
import "./FeeRebateHook.sol";
import "prepo-shared-contracts/contracts/AllowlistHook.sol";
import "prepo-shared-contracts/contracts/SafeAccessControlEnumerable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";

contract DepositHook is
  IDepositHook,
  INFTAccessHook,
  FeeRebateHook,
  AllowlistHook,
  SafeAccessControlEnumerable
{
  using EnumerableMap for EnumerableMap.AddressToUintMap;

  ICollateral private collateral;
  IDepositRecord private depositRecord;
  IAccountList private allowlist;
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
  bytes32 public constant SET_TREASURY_ROLE =
    keccak256("DepositHook_setTreasury(address)");
  bytes32 public constant SET_TOKEN_SENDER =
    keccak256("DepositHook_setTokenSender(ITokenSender)");

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
  ) external override onlyRole(SET_COLLECTION_SCORES_ROLE) {
    require(
      _collections.length == _scores.length,
      "collections.length != scores.length"
    );
    uint256 _numCollections = _collections.length;
    for (uint256 i = 0; i < _numCollections; ++i) {
      require(_scores[i] > 0, "score == 0");
      collectionToScore.set(address(_collections[i]), _scores[i]);
    }
    emit CollectionScoresChange(_collections, _scores);
  }

  function removeCollections(IERC721[] memory _collections)
    external
    override
    onlyRole(REMOVE_COLLECTIONS_ROLE)
  {
    uint256 _numCollections = _collections.length;
    for (uint256 i = 0; i < _numCollections; ++i) {
      collectionToScore.remove(address(_collections[i]));
    }
    emit CollectionScoresChange(
      _collections,
      new uint256[](_collections.length)
    );
  }

  function getRequiredScore() external view override returns (uint256) {
    return requiredScore;
  }

  function getCollectionScore(IERC721 _collection)
    external
    view
    override
    returns (uint256)
  {
    if (collectionToScore.contains(address(_collection))) {
      return collectionToScore.get(address(_collection));
    }
    return 0;
  }

  function getAccountScore(address _account)
    public
    view
    override
    returns (uint256)
  {
    uint256 score = 0;
    uint256 _numCollections = collectionToScore.length();
    for (uint256 i = 0; i < _numCollections; ++i) {
      (address collection, uint256 collectionScore) = collectionToScore.at(i);
      score += IERC721(collection).balanceOf(_account) > 0
        ? collectionScore
        : 0;
    }
    return score;
  }

  function setTreasury(address _treasury)
    public
    override
    onlyRole(SET_TREASURY_ROLE)
  {
    super.setTreasury(_treasury);
  }

  function setTokenSender(ITokenSender _tokenSender)
    public
    override
    onlyRole(SET_TOKEN_SENDER)
  {
    super.setTokenSender(_tokenSender);
  }
}
