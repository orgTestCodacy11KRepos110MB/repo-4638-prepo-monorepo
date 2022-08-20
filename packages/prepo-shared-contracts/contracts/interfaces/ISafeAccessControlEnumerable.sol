// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "@openzeppelin/contracts/access/IAccessControlEnumerable.sol";

//TODO: add natspecs
interface ISafeAccessControlEnumerable is IAccessControlEnumerable {
  event RoleAdminNomineeUpdate(bytes32 role, bytes32 newRoleAdminNominee);

  event RoleNomineeUpdate(bytes32 role, address account, bool nominated);

  function setRoleAdminNominee(bytes32 role, bytes32 adminRoleNominee)
    external;

  function acceptRoleAdmin(bytes32 role) external;

  function acceptRole(bytes32 role) external;

  function revokeNomination(bytes32 role, address account) external;

  function getRoleAdminNominee(bytes32 role) external view returns (bytes32);

  function isNominated(bytes32 role, address account)
    external
    view
    returns (bool);
}
