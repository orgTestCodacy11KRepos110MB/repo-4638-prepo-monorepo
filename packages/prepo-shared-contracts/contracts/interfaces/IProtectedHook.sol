// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity =0.8.7;

// TODO: add natspec comments
interface IProtectedHook {
  event AllowedContractChange(address newAllowedContract);

  function setAllowedContract(address newAllowedContract) external;

  function getAllowedContract() external view returns (address);
}
