// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

/**
 * @notice Allows callers to a class to be restricted
 */
interface IAllowedCallers {
  /**
   * @notice Emitted when addresses on the allowed callers list is modified
   */
  event AllowedCallersChange(address[] callers, bool[] allowed);

  /**
   * @notice Sets an array of addresses to be allowed or not.
   * @dev The length of `callers` and `allowed` must match.
   * @param _callers Addresses to change inclusion for
   * @param _allowed Whether to allow corresponding address
   */
  function setAllowedCallers(address[] memory _callers, bool[] memory _allowed)
    external;

  /**
   * @notice Getter for whether an address is allowed to call
   */
  function isCallerAllowed(address _caller) external view returns (bool);
}
