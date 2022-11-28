// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

/**
 * @title IUintValue
 * @dev A generic contract that returns a uint256 value.
 */
interface IUintValue {
    /**
     * @notice Returns the value.
     * 
     * @return the value
     */
    function get() external view returns (uint256);
}
