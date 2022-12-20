// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./LongShortToken.sol";
import "./PrePOMarket.sol";
import "./interfaces/ILongShortToken.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "prepo-shared-contracts/contracts/SafeAccessControlEnumerableUpgradeable.sol";
import "./interfaces/IPrePOMarketFactory.sol";

contract PrePOMarketFactory is
  IPrePOMarketFactory,
  ReentrancyGuardUpgradeable,
  SafeAccessControlEnumerableUpgradeable
{
  mapping(address => bool) private validCollateral;
  mapping(bytes32 => address) private deployedMarkets;

  bytes32 public constant CREATE_MARKET_ROLE = keccak256("createMarket");
  bytes32 public constant SET_COLLATERAL_VALIDITY_ROLE =
    keccak256("setCollateralValidity");

  function initialize() public initializer {
    __SafeAccessControlEnumerable_init();
  }

  function isValidCollateral(address _collateral)
    external
    view
    override
    returns (bool)
  {
    return validCollateral[_collateral];
  }

  function getMarket(bytes32 _longShortHash)
    external
    view
    override
    returns (IPrePOMarket)
  {
    return IPrePOMarket(deployedMarkets[_longShortHash]);
  }

  function createMarket(
    string memory _tokenNameSuffix,
    string memory _tokenSymbolSuffix,
    bytes32 longTokenSalt,
    bytes32 shortTokenSalt,
    address owner,
    address _collateral,
    uint256 _floorLongPrice,
    uint256 _ceilingLongPrice,
    uint256 _floorValuation,
    uint256 _ceilingValuation,
    uint256 _expiryTime
  ) external override onlyRole(CREATE_MARKET_ROLE) nonReentrant {
    require(validCollateral[_collateral], "Invalid collateral");

    (
      LongShortToken _longToken,
      LongShortToken _shortToken
    ) = _createPairTokens(
        _tokenNameSuffix,
        _tokenSymbolSuffix,
        longTokenSalt,
        shortTokenSalt
      );
    bytes32 _salt = keccak256(abi.encodePacked(_longToken, _shortToken));

    PrePOMarket _newMarket = new PrePOMarket{salt: _salt}(
      owner,
      _collateral,
      ILongShortToken(address(_longToken)),
      ILongShortToken(address(_shortToken)),
      _floorLongPrice,
      _ceilingLongPrice,
      _floorValuation,
      _ceilingValuation,
      _expiryTime
    );
    deployedMarkets[_salt] = address(_newMarket);

    _longToken.transferOwnership(address(_newMarket));
    _shortToken.transferOwnership(address(_newMarket));
    emit MarketAdded(address(_newMarket), _salt);
  }

  function setCollateralValidity(address _collateral, bool _validity)
    external
    override
    onlyRole(SET_COLLATERAL_VALIDITY_ROLE)
  {
    validCollateral[_collateral] = _validity;
    emit CollateralValidityChanged(_collateral, _validity);
  }

  function _createPairTokens(
    string memory _tokenNameSuffix,
    string memory _tokenSymbolSuffix,
    bytes32 _longTokenSalt,
    bytes32 _shortTokenSalt
  )
    internal
    returns (LongShortToken _newLongToken, LongShortToken _newShortToken)
  {
    string memory _longTokenName = string(
      abi.encodePacked("LONG", " ", _tokenNameSuffix)
    );
    string memory _shortTokenName = string(
      abi.encodePacked("SHORT", " ", _tokenNameSuffix)
    );
    string memory _longTokenSymbol = string(
      abi.encodePacked("L", "_", _tokenSymbolSuffix)
    );
    string memory _shortTokenSymbol = string(
      abi.encodePacked("S", "_", _tokenSymbolSuffix)
    );
    _newLongToken = new LongShortToken{salt: _longTokenSalt}(
      _longTokenName,
      _longTokenSymbol
    );
    _newShortToken = new LongShortToken{salt: _shortTokenSalt}(
      _shortTokenName,
      _shortTokenSymbol
    );
    return (_newLongToken, _newShortToken);
  }
}
