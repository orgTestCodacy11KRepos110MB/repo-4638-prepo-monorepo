// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/ISafeAccessControlEnumerable.sol";
import "./interfaces/ISafeAccessControlEnumerableCaller.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";

abstract contract SafeAccessControlEnumerableCaller is
  ISafeAccessControlEnumerableCaller
{
  function setRoleAdminNominee(
    address _safeAccessControlContract,
    bytes32 _role,
    bytes32 _adminRoleNominee
  ) public virtual override {
    ISafeAccessControlEnumerable(_safeAccessControlContract)
      .setRoleAdminNominee(_role, _adminRoleNominee);
  }

  function acceptRoleAdmin(address _safeAccessControlContract, bytes32 _role)
    public
    virtual
    override
  {
    ISafeAccessControlEnumerable(_safeAccessControlContract).acceptRoleAdmin(
      _role
    );
  }

  function grantRole(
    address _safeAccessControlContract,
    bytes32 _role,
    address _account
  ) public virtual override {
    ISafeAccessControlEnumerable(_safeAccessControlContract).grantRole(
      _role,
      _account
    );
  }

  function acceptRole(address _safeAccessControlContract, bytes32 _role)
    public
    virtual
    override
  {
    ISafeAccessControlEnumerable(_safeAccessControlContract).acceptRole(_role);
  }

  function renounceRole(
    address _safeAccessControlContract,
    bytes32 _role,
    address _account
  ) public virtual override {
    IAccessControl(_safeAccessControlContract).renounceRole(_role, _account);
  }

  function revokeRole(
    address _safeAccessControlContract,
    bytes32 _role,
    address _account
  ) public virtual override {
    IAccessControl(_safeAccessControlContract).revokeRole(_role, _account);
  }

  function revokeNomination(
    address _safeAccessControlContract,
    bytes32 _role,
    address _account
  ) public virtual override {
    ISafeAccessControlEnumerable(_safeAccessControlContract).revokeNomination(
      _role,
      _account
    );
  }

  function getRoleAdminNominee(
    address _safeAccessControlContract,
    bytes32 _role
  ) public view virtual override returns (bytes32) {
    return
      ISafeAccessControlEnumerable(_safeAccessControlContract)
        .getRoleAdminNominee(_role);
  }

  function isNominated(
    address _safeAccessControlContract,
    bytes32 _role,
    address _account
  ) public view virtual override returns (bool) {
    return
      ISafeAccessControlEnumerable(_safeAccessControlContract).isNominated(
        _role,
        _account
      );
  }
}
