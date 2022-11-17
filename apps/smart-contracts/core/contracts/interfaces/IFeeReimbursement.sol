// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

interface IFeeReimbursement {
    function registerFee(address addr, uint256 amount) external;
}
