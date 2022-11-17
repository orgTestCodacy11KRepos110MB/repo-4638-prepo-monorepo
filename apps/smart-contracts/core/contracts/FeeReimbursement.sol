// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IDepositHook.sol";
import "prepo-shared-contracts/contracts/SafeAccessControlEnumerable.sol";

contract FeeReimbursement is SafeAccessControlEnumerable {
    IDepositHook depositHook;
    IERC20 private ppoToken;
    IMiniSales private miniSales;
    mapping(address => uint256) private usdcFeesByAddress;

    bytes32 public constant SET_DEPOSIT_HOOK_ROLE =
        keccak256("FeeReimbursement_setMiniSales(IMiniSales)");
    bytes32 public constant SET_PPO_TOKEN_ROLE =
        keccak256("FeeReimbursement_setPPOToken(IERC20)");
    bytes32 public constant SET_MINISALES_ROLE =
        keccak256("FeeReimbursement_setMiniSales(IMiniSales)");


    modifier onlyDepositHook() {
        require(msg.sender == address(depositHook), "msg.sender != depositHook");
        _;
    }

    event DepositHookChange(IDepositHook newDepositHook);
    event PPOTokenChange(IERC20 indexed newPPOToken);
    event MiniSalesChange(IMiniSales indexed newMiniSales);

    function setDepositHook(IDepositHook _newDepositHook) external override onlyRole(SET_DEPOSIT_HOOK_ROLE){
        depositHook = _newDepositHook;
        emit DepositHookChange(_newDepositHook);
    }

    function setPPOToken(IERC20 _newPPOToken) external onlyRole(SET_COLLATERAL_ROLE) {
        ppoToken = _newPPOToken;
        validateTokenAndMiniSales();
        emit PPOTokenChange(address(ppoToken));
    }

    function setMiniSales(IMiniSales _newMiniSales) external onlyRole(SET_MINISALES_ROLE) {
        miniSales = _newMiniSales;
        validateTokenAndMiniSales();
        emit MiniSalesChange(address(miniSales));
    }

    function registerFee(address addr, uint256 amount) public onlyDepositHook {
        require(msg.sender == address(depositHook));
        usdcFeesByAddress[addr] += amount;
    }

    function claim() public {
        require(usdcFeesByAddress[msg.sender] > 0, "No reimbursement available");

        uint256 amountUSDC = usdcFeesByAddress[msg.sender];
        usdcFeesByAddress[msg.sender] = 0;

        uint256 amountPPO = miniSales.getAmountOut(amountUSDC);
        ppoToken.transfer(msg.sender, amountPPO);
    }

    function getPendingUSDC(address addr) public view returns (uint256) {
        return usdcFeesByAddress[addr];
    }

    function getPendingPPO(address addr) public view returns (uint256) {
        uint256 amountUSDC = usdcFeesByAddress[addr];
        return miniSales.getAmountOut(amountUSDC);
    }

    function validateTokenAndMiniSales() private pure {
        if (address(ppoToken) != address(0) && address(miniSales) != address(0)) {
            require(miniSales.getPaymentToken() == ppoToken);
        }
    }
}
