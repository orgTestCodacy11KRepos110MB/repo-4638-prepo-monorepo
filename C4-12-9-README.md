# ✨ So you want to sponsor a contest

This `README.md` contains a set of checklists for our contest collaboration.

Your contest will use two repos:

- **a _contest_ repo** (this one), which is used for scoping your contest and for providing information to contestants (wardens)
- **a _findings_ repo**, where issues are submitted (shared with you after the contest)

Ultimately, when we launch the contest, this contest repo will be made public and will contain the smart contracts to be reviewed and all the information needed for contest participants. The findings repo will be made public after the contest report is published and your team has mitigated the identified issues.

Some of the checklists in this doc are for **C4 (🐺)** and some of them are for **you as the contest sponsor (⭐️)**.

---

# Repo setup

## ⭐️ Sponsor: Add code to this repo

- [ ] Create a PR to this repo with the below changes:
- [ ] Provide a self-contained repository with working commands that will build (at least) all in-scope contracts, and commands that will run tests producing gas reports for the relevant contracts.
- [ ] Make sure your code is thoroughly commented using the [NatSpec format](https://docs.soliditylang.org/en/v0.5.10/natspec-format.html#natspec-format).
- [ ] Please have final versions of contracts and documentation added/updated in this repo **no less than 24 hours prior to contest start time.**
- [ ] Be prepared for a 🚨code freeze🚨 for the duration of the contest — important because it establishes a level playing field. We want to ensure everyone's looking at the same code, no matter when they look during the contest. (Note: this includes your own repo, since a PR can leak alpha to our wardens!)

---

## ⭐️ Sponsor: Edit this README

Under "SPONSORS ADD INFO HERE" heading below, include the following:

- [ ] Modify the bottom of this `README.md` file to describe how your code is supposed to work with links to any relevent documentation and any other criteria/details that the C4 Wardens should keep in mind when reviewing. ([Here's a well-constructed example.](https://github.com/code-423n4/2022-08-foundation#readme))
  - [ ] When linking, please provide all links as full absolute links versus relative links
  - [ ] All information should be provided in markdown format (HTML does not render on Code4rena.com)
- [ ] Under the "Scope" heading, provide the name of each contract and:
  - [ ] source lines of code (excluding blank lines and comments) in each
  - [ ] external contracts called in each
  - [ ] libraries used in each
- [ ] Describe any novel or unique curve logic or mathematical models implemented in the contracts
- [ ] Does the token conform to the ERC-20 standard? In what specific ways does it differ?
- [ ] Describe anything else that adds any special logic that makes your approach unique
- [ ] Identify any areas of specific concern in reviewing the code
- [ ] Optional / nice to have: pre-record a high-level overview of your protocol (not just specific smart contract functions). This saves wardens a lot of time wading through documentation.
- [ ] Delete this checklist and all text above the line below when you're ready.

---

# PrePO contest details

- Total Prize Pool: $36,500 USDC
  - HM awards: $25,500 USDC
  - QA report awards: $3,000 USDC
  - Gas report awards: $1,500 USDC
  - Judge + presort awards: $6,000 USDC
  - Scout awards: $500 USDC
- Join [C4 Discord](https://discord.gg/code4rena) to register
- Submit findings [using the C4 form](https://code4rena.com/contests/2022-12-prepo-contest/submit)
- [Read our guidelines for more details](https://docs.code4rena.com/roles/wardens)
- Starts Dec 09, 2022 20:00 UTC
- Ends Dec 12, 2022 20:00 UTC

## C4udit / Publicly Known Issues

The C4audit output for the contest can be found [here](add link to report) within an hour of contest opening.

_Note for C4 wardens: Anything included in the C4udit output is considered a publicly known issue and is ineligible for awards._

[ ⭐️ SPONSORS ADD INFO HERE ]

# Overview

_Please provide some context about the code being audited, and identify any areas of specific concern in reviewing the code. (This is a good place to link to your docs, if you have them.)_

# Scope

## Contracts

| Contract                                                          | SLOC | Purpose                                                                                                                                                                                      | Libraries used                                                                                                              |
| ----------------------------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| packages/prepo-shared-contracts/contracts/AccountListCaller.sol   | 123  | Inherited module for contracts that use an external `AccountList.sol`                                                                                                                        |
| packages/prepo-shared-contracts/contracts/AllowedMsgSenders.sol   | 123  | Inherited module for contracts that need to restrict msg.sender on certain functions (typically for preventing access to functions on a contract that are only meant to be called by a hook) |
| packages/prepo-shared-contracts/contracts/NFTScoreRequirement.sol | 123  | Inherited module for contracts that want to implement NFT-based account requirements.                                                                                                        | [`@openzeppelin/*`](https://openzeppelin.com/contracts/)                                                                    |
| packages/prepo-shared-contracts/contracts/TokenSenderCaller.sol   | 123  | Inherited module for contracts that use an external `TokenSender.sol`                                                                                                                        |                                                                                                                             |
| apps/smart-contracts/core/Collateral.sol                          | 123  | Collateral for trading on PrePOMarkets                                                                                                                                                       | [`@openzeppelin/*`](https://openzeppelin.com/contracts/)                                                                    |
| apps/smart-contracts/core/DepositHook.sol                         | 123  | Swappable hook for extending `Collateral`'s `deposit` function                                                                                                                               | [`@openzeppelin/*`](https://openzeppelin.com/contracts/)                                                                    |
| apps/smart-contracts/core/DepositRecord.sol                       | 123  | Keeps track of global and user deposits for `Collateral`                                                                                                                                     | [`@openzeppelin/*`](https://openzeppelin.com/contracts/) [`@uniswap/v3-periphery`](https://github.com/Uniswap/v3-periphery) |
| apps/smart-contracts/core/DepositTradeHelper.sol                  | 123  | Helper function for minting `Collateral` and swapping into PrePOMarket Uniswap pools                                                                                                         | [`@openzeppelin/*`](https://openzeppelin.com/contracts/)                                                                    |
| apps/smart-contracts/core/LongShortToken.sol                      | 123  | Token representing PrePOMarket positions.                                                                                                                                                    | [`@openzeppelin/*`](https://openzeppelin.com/contracts/)                                                                    |
| apps/smart-contracts/core/ManagerWithdrawHook.sol                 | 123  | Swappable hook for extending `Collateral`'s `managerWithdraw` function                                                                                                                       | [`@openzeppelin/*`](https://openzeppelin.com/contracts/)                                                                    |
| apps/smart-contracts/core/MintHook.sol                            | 123  | Swappable hook for extending `PrePOMarket`'s `mint` function                                                                                                                                 | [`@openzeppelin/*`](https://openzeppelin.com/contracts/)                                                                    |
| apps/smart-contracts/core/PrePOMarket.sol                         | 123  | Issues new positions for a PrePO Market and allows users to redeem them back for `Collateral`                                                                                                | [`@openzeppelin/*`](https://openzeppelin.com/contracts/)                                                                    |
| apps/smart-contracts/core/PrePOMarketFactory.sol                  | 123  | Contract factory for deploying new `PrePOMarket`'s                                                                                                                                           | [`@openzeppelin/*`](https://openzeppelin.com/contracts/)                                                                    |
| apps/smart-contracts/core/RedeemHook.sol                          | 123  | Swappable hook for extending `PrePOMarket`'s `redeem` function                                                                                                                               | [`@openzeppelin/*`](https://openzeppelin.com/contracts/)                                                                    |
| apps/smart-contracts/core/TokenSender.sol                         | 123  | Sends tokens based on an input amount and price oracle, used for reimbursing platform fees in `PPO` token.                                                                                   | [`@openzeppelin/*`](https://openzeppelin.com/contracts/)                                                                    |
| apps/smart-contracts/core/WithdrawHook.sol                        | 123  | Swappable hook for extending `Collateral`'s `withdraw` function                                                                                                                              | [`@openzeppelin/*`](https://openzeppelin.com/contracts/)                                                                    |

## Interfaces

| Interface                                                         | SLOC | Purpose                          | Libraries used                                           |
| ----------------------------------------------------------------- | ---- | -------------------------------- | -------------------------------------------------------- |
| packages/prepo-shared-contracts/contracts/AccountListCaller.sol   | 123  | Interface for AllowedCallers.sol | [`@openzeppelin/*`](https://openzeppelin.com/contracts/) |
| packages/prepo-shared-contracts/contracts/AllowedCallers.sol      | 123  | Interface for AllowedCallers.sol | [`@openzeppelin/*`](https://openzeppelin.com/contracts/) |
| packages/prepo-shared-contracts/contracts/AllowedMsgSenders.sol   | 123  | Interface for AllowedCallers.sol | [`@openzeppelin/*`](https://openzeppelin.com/contracts/) |
| packages/prepo-shared-contracts/contracts/NFTScoreRequirement.sol | 123  | Interface for AllowedCallers.sol | [`@openzeppelin/*`](https://openzeppelin.com/contracts/) |
| packages/prepo-shared-contracts/contracts/TokenSenderCaller.sol   | 123  | Interface for AllowedCallers.sol | [`@openzeppelin/*`](https://openzeppelin.com/contracts/) |
| apps/smart-contracts/core/interfaces/IAllowedCallers.sol          | 123  | Interface for AllowedCallers.sol | [`@openzeppelin/*`](https://openzeppelin.com/contracts/) |
| apps/smart-contracts/core/interfaces/IAllowedCallers.sol          | 123  | Interface for AllowedCallers.sol | [`@openzeppelin/*`](https://openzeppelin.com/contracts/) |
| apps/smart-contracts/core/interfaces/IAllowedCallers.sol          | 123  | Interface for AllowedCallers.sol | [`@openzeppelin/*`](https://openzeppelin.com/contracts/) |
| apps/smart-contracts/core/interfaces/IAllowedCallers.sol          | 123  | Interface for AllowedCallers.sol | [`@openzeppelin/*`](https://openzeppelin.com/contracts/) |
| apps/smart-contracts/core/interfaces/IAllowedCallers.sol          | 123  | Interface for AllowedCallers.sol | [`@openzeppelin/*`](https://openzeppelin.com/contracts/) |
| apps/smart-contracts/core/interfaces/IAllowedCallers.sol          | 123  | Interface for AllowedCallers.sol | [`@openzeppelin/*`](https://openzeppelin.com/contracts/) |
| apps/smart-contracts/core/interfaces/IAllowedCallers.sol          | 123  | Interface for AllowedCallers.sol | [`@openzeppelin/*`](https://openzeppelin.com/contracts/) |
| apps/smart-contracts/core/interfaces/IAllowedCallers.sol          | 123  | Interface for AllowedCallers.sol | [`@openzeppelin/*`](https://openzeppelin.com/contracts/) |

## Out of scope

_List any files/contracts that are out of scope for this audit._

# Additional Context

_Describe any novel or unique curve logic or mathematical models implemented in the contracts_

_Sponsor, please confirm/edit the information below._

## Scoping Details

```
- If you have a public code repo, please share it here:  https://github.com/prepo-io/prepo-monorepo
- How many contracts are in scope?:   15
- Total SLoC for these contracts?:  680
- How many external imports are there?: 16
- How many separate interfaces and struct definitions are there for the contracts within scope?:  18 interfaces, 2 structs
- Does most of your code generally use composition or inheritance?:   Composition
- How many external calls?:   1
- What is the overall line coverage percentage provided by your tests?:  100
- Is there a need to understand a separate part of the codebase / get context in order to audit this part of the protocol?:   false
- Please describe required context:
- Does it use an oracle?:  false
- Does the token conform to the ERC20 standard?:  Yes
- Are there any novel or unique curve logic or mathematical models?: N/A
- Does it use a timelock function?:  No
- Is it an NFT?: No
- Does it have an AMM?: No
- Is it a fork of a popular project?:   false
- Does it use rollups?:   false
- Is it multi-chain?:  false
- Does it use a side-chain?: false
```

# Tests

Run `yarn install` to install all packages needed for testing

### Commands

- Prettify Contracts: `yarn sl`
- Check Contract Styling: `yarn sh`
- Check Contract Sizes: `yarn size`
- Compile Contracts: `yarn c`
- Run Tests: `yarn t`
- Run Tests w/ Code Coverage: `yarn t:coverage`
- Prettify TypeScript files: `yarn l`

### Configuration

- Edit `hardhat.config.ts` to setup connections to different networks
- To enable gas reporting, add `REPORT_GAS=true` to `.env`

### Run Contract Tests & Get Callstacks

In one terminal run `yarn hardhat node`

Then in another run `yarn t`
