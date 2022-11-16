// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/ILongShortToken.sol";
import "./interfaces/IPrePOMarket.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract PrePOMarket is IPrePOMarket, Ownable, ReentrancyGuard {
  address private _treasury;

  IERC20 private immutable _collateral;
  ILongShortToken private immutable _longToken;
  ILongShortToken private immutable _shortToken;

  uint256 private immutable _floorLongPayout;
  uint256 private immutable _ceilingLongPayout;
  uint256 private _finalLongPayout;

  uint256 private immutable _floorValuation;
  uint256 private immutable _ceilingValuation;

  uint256 private _mintingFee;
  uint256 private _redemptionFee;

  uint256 private immutable _expiryTime;

  bool private _publicMinting;

  uint256 private constant MAX_PAYOUT = 1e18;
  uint256 private constant FEE_DENOMINATOR = 1000000;
  uint256 private constant FEE_LIMIT = 50000;

  /**
   * Assumes `_newCollateral`, `_newLongToken`, and `_newShortToken` are
   * valid, since they will be handled by the PrePOMarketFactory. The
   * treasury is initialized to governance due to stack limitations.
   *
   * Assumes that ownership of `_longToken` and `_shortToken` has been
   * transferred to this contract via `createMarket()` in
   * `PrePOMarketFactory.sol`.
   */
  constructor(
    address _governance,
    address _newCollateral,
    ILongShortToken _newLongToken,
    ILongShortToken _newShortToken,
    uint256 _newFloorLongPayout,
    uint256 _newCeilingLongPayout,
    uint256 _newFloorValuation,
    uint256 _newCeilingValuation,
    uint256 _newMintingFee,
    uint256 _newRedemptionFee,
    uint256 _newExpiryTime,
    bool _allowed
  ) {
    require(
      _newCeilingLongPayout > _newFloorLongPayout,
      "Ceiling must exceed floor"
    );
    require(_newExpiryTime > block.timestamp, "Invalid expiry");
    require(_newMintingFee <= FEE_LIMIT, "Exceeds fee limit");
    require(_newRedemptionFee <= FEE_LIMIT, "Exceeds fee limit");
    require(_newCeilingLongPayout <= MAX_PAYOUT, "Ceiling cannot exceed 1");

    transferOwnership(_governance);
    _treasury = _governance;

    _collateral = IERC20(_newCollateral);
    _longToken = _newLongToken;
    _shortToken = _newShortToken;

    _floorLongPayout = _newFloorLongPayout;
    _ceilingLongPayout = _newCeilingLongPayout;
    _finalLongPayout = MAX_PAYOUT + 1;

    _floorValuation = _newFloorValuation;
    _ceilingValuation = _newCeilingValuation;

    _mintingFee = _newMintingFee;
    _redemptionFee = _newRedemptionFee;

    _expiryTime = _newExpiryTime;

    _publicMinting = _allowed;

    emit MarketCreated(
      address(_newLongToken),
      address(_newShortToken),
      _newFloorLongPayout,
      _newCeilingLongPayout,
      _newFloorValuation,
      _newCeilingValuation,
      _newMintingFee,
      _newRedemptionFee,
      _newExpiryTime
    );
  }

  function mintLongShortTokens(uint256 _amount)
    external
    override
    nonReentrant
    returns (uint256)
  {
    if (msg.sender != owner()) {
      require(_publicMinting, "Public minting disabled");
    }
    require(_finalLongPayout > MAX_PAYOUT, "Market ended");
    require(
      _collateral.balanceOf(msg.sender) >= _amount,
      "Insufficient collateral"
    );
    /**
     * Add 1 to avoid rounding to zero, only process if user is minting
     * an amount large enough to pay a fee
     */
    uint256 _fee = (_amount * _mintingFee) / FEE_DENOMINATOR + 1;
    require(_amount > _fee, "Minting amount too small");
    _collateral.transferFrom(msg.sender, _treasury, _fee);
    unchecked {
      _amount -= _fee;
    }
    _collateral.transferFrom(msg.sender, address(this), _amount);
    _longToken.mint(msg.sender, _amount);
    _shortToken.mint(msg.sender, _amount);
    emit Mint(msg.sender, _amount);
    return _amount;
  }

  function redeem(uint256 _longAmount, uint256 _shortAmount)
    external
    override
    nonReentrant
  {
    require(
      _longToken.balanceOf(msg.sender) >= _longAmount,
      "Insufficient long tokens"
    );
    require(
      _shortToken.balanceOf(msg.sender) >= _shortAmount,
      "Insufficient short tokens"
    );

    uint256 _collateralOwed;
    if (_finalLongPayout <= MAX_PAYOUT) {
      uint256 _shortPayout = MAX_PAYOUT - _finalLongPayout;
      _collateralOwed =
        (_finalLongPayout * _longAmount + _shortPayout * _shortAmount) /
        MAX_PAYOUT;
    } else {
      require(_longAmount == _shortAmount, "Long and Short must be equal");
      _collateralOwed = _longAmount;
    }

    _longToken.burnFrom(msg.sender, _longAmount);
    _shortToken.burnFrom(msg.sender, _shortAmount);
    /**
     * Add 1 to avoid rounding to zero, only process if user is redeeming
     * an amount large enough to pay a fee
     */
    uint256 _fee = (_collateralOwed * _redemptionFee) / FEE_DENOMINATOR + 1;
    require(_collateralOwed > _fee, "Redemption amount too small");
    _collateral.transfer(_treasury, _fee);
    unchecked {
      _collateralOwed -= _fee;
    }
    _collateral.transfer(msg.sender, _collateralOwed);

    emit Redemption(msg.sender, _collateralOwed);
  }

  function setTreasury(address _newTreasury) external override onlyOwner {
    _treasury = _newTreasury;
    emit TreasuryChanged(_newTreasury);
  }

  function setFinalLongPayout(uint256 _newFinalLongPayout)
    external
    override
    onlyOwner
  {
    require(
      _newFinalLongPayout >= _floorLongPayout,
      "Payout cannot be below floor"
    );
    require(
      _newFinalLongPayout <= _ceilingLongPayout,
      "Payout cannot exceed ceiling"
    );
    _finalLongPayout = _newFinalLongPayout;
    emit FinalLongPayoutSet(_newFinalLongPayout);
  }

  function setMintingFee(uint256 _newMintingFee) external override onlyOwner {
    require(_newMintingFee <= FEE_LIMIT, "Exceeds fee limit");
    _mintingFee = _newMintingFee;
    emit MintingFeeChanged(_newMintingFee);
  }

  function setRedemptionFee(uint256 _newRedemptionFee)
    external
    override
    onlyOwner
  {
    require(_newRedemptionFee <= FEE_LIMIT, "Exceeds fee limit");
    _redemptionFee = _newRedemptionFee;
    emit RedemptionFeeChanged(_newRedemptionFee);
  }

  function setPublicMinting(bool _allowed) external override onlyOwner {
    _publicMinting = _allowed;
    emit PublicMintingChanged(_allowed);
  }

  function getTreasury() external view override returns (address) {
    return _treasury;
  }

  function getCollateral() external view override returns (IERC20) {
    return _collateral;
  }

  function getLongToken() external view override returns (ILongShortToken) {
    return _longToken;
  }

  function getShortToken() external view override returns (ILongShortToken) {
    return _shortToken;
  }

  function getFloorLongPayout() external view override returns (uint256) {
    return _floorLongPayout;
  }

  function getCeilingLongPayout() external view override returns (uint256) {
    return _ceilingLongPayout;
  }

  function getFinalLongPayout() external view override returns (uint256) {
    return _finalLongPayout;
  }

  function getFloorValuation() external view override returns (uint256) {
    return _floorValuation;
  }

  function getCeilingValuation() external view override returns (uint256) {
    return _ceilingValuation;
  }

  function getMintingFee() external view override returns (uint256) {
    return _mintingFee;
  }

  function getRedemptionFee() external view override returns (uint256) {
    return _redemptionFee;
  }

  function getExpiryTime() external view override returns (uint256) {
    return _expiryTime;
  }

  function isPublicMintingAllowed() external view override returns (bool) {
    return _publicMinting;
  }

  function getMaxPayout() external pure override returns (uint256) {
    return MAX_PAYOUT;
  }

  function getFeeDenominator() external pure override returns (uint256) {
    return FEE_DENOMINATOR;
  }

  function getFeeLimit() external pure override returns (uint256) {
    return FEE_LIMIT;
  }
}
