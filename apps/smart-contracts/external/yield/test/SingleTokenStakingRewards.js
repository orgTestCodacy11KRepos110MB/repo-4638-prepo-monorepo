'use strict';

const { artifacts, contract } = require('hardhat');
const { toBN } = require('web3-utils');

const { assert } = require('./utils/common');

const { fastForward, toUnit, currentTime } = require('./utils')();

const { onlyGivenAddressCanInvoke, encodeCall } = require('./utils/helpers');

contract('SingleTokenStakingRewards', accounts => {
	const [owner, initialCreator, mockRewardsDistributionAddress] = accounts;
	let rewardsToken,
		stakingToken,
		StakingRewardsImplementation,
		StakingRewardsDeployed;

	let initializeData;
	let ProxyStakingRewardsDeployed;

	const WEEK = 604800;
	const DAY = 86400;

	beforeEach(async () => {
		let Thales = artifacts.require('Thales');
		let StakingRewards = artifacts.require('SingleTokenStakingRewards');
		let OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy');

		rewardsToken = await Thales.new({ from: owner });
		stakingToken = rewardsToken

		ProxyStakingRewardsDeployed = await OwnedUpgradeabilityProxy.new({ from: initialCreator });
		StakingRewardsImplementation = await StakingRewards.new({ from: owner });
		console.log('ProxyStakingRewards', ProxyStakingRewardsDeployed.address)
		console.log('StakingRewardsImplementation', StakingRewardsImplementation.address)

		StakingRewardsDeployed = await StakingRewards.at(ProxyStakingRewardsDeployed.address);

		initializeData = encodeCall(
			'initialize',
			['address', 'address', 'uint256'],
			[owner, rewardsToken.address, DAY * 7]
		);
		await ProxyStakingRewardsDeployed.upgradeToAndCall(
			StakingRewardsImplementation.address,
			initializeData,
			{
				from: initialCreator,
			}
		);

		await stakingToken.transfer(mockRewardsDistributionAddress, toUnit(100), { from: owner });
	});

	describe('Constructor & Settings', () => {
		it('sets rewards token on constructor', async () => {
			assert.equal(await StakingRewardsDeployed.rewardsToken(), rewardsToken.address);
		});

		it('sets staking token to rewards token', async () => {
			assert.equal(await StakingRewardsDeployed.rewardsToken(), await StakingRewardsDeployed.stakingToken());
		});

		it('sets owner on constructor', async () => {
			const ownerAddress = await StakingRewardsDeployed.owner();
			assert.equal(ownerAddress, owner);
		});
	});

	describe('Function permissions', () => {
		const rewardValue = toUnit(1.0);

		before(async () => {
			await rewardsToken.transfer(StakingRewardsDeployed.address, rewardValue, { from: owner });
		});

		it('only owner can call notifyRewardAmount', async () => {
			let REVERT = 'Only the contract owner may perform this action';
			await assert.revert(
				StakingRewardsDeployed.notifyRewardAmount(rewardValue, {
					from: mockRewardsDistributionAddress,
				}),
				REVERT
			);
		});

		it('only owner address can call setRewardsDuration', async () => {
			await fastForward(DAY * 7);
			let REVERT = 'Only the contract owner may perform this action';
			await assert.revert(
				StakingRewardsDeployed.setRewardsDuration(70, { from: mockRewardsDistributionAddress }),
				REVERT
			);
		});

		it('only owner address can call setPaused', async () => {
			await onlyGivenAddressCanInvoke({
				fnc: StakingRewardsDeployed.setPaused,
				args: [true],
				address: owner,
				accounts,
			});
		});
	});

	describe('lastTimeRewardApplicable()', () => {
		it('should return 0', async () => {
			assert.equal((await StakingRewardsDeployed.lastTimeRewardApplicable()).toString(), 0);
		});

		describe('when updated', () => {
			it('should equal current timestamp', async () => {
				const rewardValue = toUnit(5000.0);
				await rewardsToken.transfer(StakingRewardsDeployed.address, rewardValue, { from: owner });

				await StakingRewardsDeployed.notifyRewardAmount(toUnit(1.0), {
					from: owner,
				});

				const cur = await currentTime();
				const lastTimeReward = await StakingRewardsDeployed.lastTimeRewardApplicable();

				assert.equal(cur.toString(), lastTimeReward.toString());
			});
		});
	});

	describe('rewardPerToken()', () => {
		it('should return 0', async () => {
			let reward = await StakingRewardsDeployed.rewardPerToken();
			assert.equal(reward, 0);
		});

		it('should return > 0', async () => {
			let totalSupply = await StakingRewardsDeployed.totalSupply();
			assert.equal(totalSupply.toString(), 0);

			await stakingToken.approve(StakingRewardsDeployed.address, toUnit(100), {
				from: mockRewardsDistributionAddress,
			});
			await StakingRewardsDeployed.stake(toUnit(100), { from: mockRewardsDistributionAddress });

			totalSupply = await StakingRewardsDeployed.totalSupply();
			assert.equal(totalSupply.toString(), toUnit(100));

			const rewardValue = toUnit(5000);
			await rewardsToken.transfer(StakingRewardsDeployed.address, rewardValue, { from: owner });
			await StakingRewardsDeployed.notifyRewardAmount(toUnit(5), {
				from: owner,
			});

			await StakingRewardsDeployed.addReward(toUnit(5), { from: owner });

			await fastForward(DAY);

			const reward = await StakingRewardsDeployed.rewardPerToken();

			assert.ok(reward > 0);

			await fastForward(DAY);

			const newReward = await StakingRewardsDeployed.rewardPerToken();

			assert.ok(newReward > reward);
		});
	});

	describe('stake()', () => {
		it('increases staking balance', async () => {
			const initialStakeBal = await StakingRewardsDeployed.balanceOf(
				mockRewardsDistributionAddress
			);
			assert.equal(initialStakeBal, 0);

			await stakingToken.approve(StakingRewardsDeployed.address, toUnit(100), {
				from: mockRewardsDistributionAddress,
			});
			await StakingRewardsDeployed.stake(toUnit(100), { from: mockRewardsDistributionAddress });

			const postStakeBal = await StakingRewardsDeployed.balanceOf(mockRewardsDistributionAddress);

			assert.equal(postStakeBal.toString(), toUnit(100).toString());
		});
	});

	describe('earned()', () => {
		it('should be 0 when not staking', async () => {
			let earned = await StakingRewardsDeployed.earned(mockRewardsDistributionAddress);
			assert.equal(earned, 0);
		});

		it('should be > 0 when staking', async () => {
			await stakingToken.approve(StakingRewardsDeployed.address, toUnit(100), {
				from: mockRewardsDistributionAddress,
			});
			await StakingRewardsDeployed.stake(toUnit(100), { from: mockRewardsDistributionAddress });

			const rewardValue = toUnit(5000);
			await rewardsToken.transfer(StakingRewardsDeployed.address, rewardValue, { from: owner });
			await StakingRewardsDeployed.notifyRewardAmount(toUnit(5), {
				from: owner,
			});

			await StakingRewardsDeployed.addReward(toUnit(5), { from: owner });

			await fastForward(DAY);

			const earned = await StakingRewardsDeployed.earned(mockRewardsDistributionAddress);

			assert.ok(earned > 0);
		});

		it('rewardRate should increase if new rewards come before DURATION ends', async () => {
			const totalToDistribute = toUnit('5000');

			await rewardsToken.transfer(StakingRewardsDeployed.address, totalToDistribute, {
				from: owner,
			});
			await StakingRewardsDeployed.notifyRewardAmount(toUnit(5), {
				from: owner,
			});

			await StakingRewardsDeployed.addReward(toUnit(5), { from: owner });

			const rewardRateInitial = await StakingRewardsDeployed.rewardRate();

			await rewardsToken.transfer(StakingRewardsDeployed.address, totalToDistribute, {
				from: owner,
			});

			await StakingRewardsDeployed.notifyRewardAmount(toUnit(5), {
				from: owner,
			});

			await StakingRewardsDeployed.addReward(toUnit(5), { from: owner });

			const rewardRateLater = await StakingRewardsDeployed.rewardRate();

			assert.ok(rewardRateInitial > 0);
			assert.ok(rewardRateLater > rewardRateInitial);
		});
	});

	describe('getReward()', () => {
		it('should increase rewards token balance', async () => {
			const totalToDistribute = toUnit('5000');

			await stakingToken.approve(StakingRewardsDeployed.address, toUnit(100), {
				from: mockRewardsDistributionAddress,
			});
			await StakingRewardsDeployed.stake(toUnit(100), { from: mockRewardsDistributionAddress });

			await rewardsToken.transfer(StakingRewardsDeployed.address, totalToDistribute, {
				from: owner,
			});
			await StakingRewardsDeployed.notifyRewardAmount(toUnit(5), {
				from: owner,
			});
			await StakingRewardsDeployed.addReward(toUnit(5), { from: owner });

			await fastForward(DAY);

			const initialRewardBal = await rewardsToken.balanceOf(mockRewardsDistributionAddress);
			const initialEarnedBal = await StakingRewardsDeployed.earned(
				mockRewardsDistributionAddress
			);

			await StakingRewardsDeployed.getReward({ from: mockRewardsDistributionAddress });

			const postRewardBal = await rewardsToken.balanceOf(mockRewardsDistributionAddress);
			const postEarnedBal = await StakingRewardsDeployed.earned(mockRewardsDistributionAddress);

			assert.ok(postEarnedBal < initialEarnedBal);
			assert.ok(postRewardBal > initialRewardBal);
		});
	});

	describe('compound()', () => {
		it('should compound', async () => {
			const totalToDistribute = toUnit('5000');

			await stakingToken.approve(StakingRewardsDeployed.address, toUnit(100), {
				from: mockRewardsDistributionAddress,
			});
			await StakingRewardsDeployed.stake(toUnit(100), { from: mockRewardsDistributionAddress });

			await rewardsToken.transfer(StakingRewardsDeployed.address, totalToDistribute, {
				from: owner,
			});
			await StakingRewardsDeployed.notifyRewardAmount(toUnit(5), {
				from: owner,
			});
			await StakingRewardsDeployed.addReward(toUnit(5), { from: owner });

			await fastForward(DAY);

			const initialRewardBal = await rewardsToken.balanceOf(mockRewardsDistributionAddress);
			const initialEarnedBal = await StakingRewardsDeployed.earned(
				mockRewardsDistributionAddress
			);
			const initialStakingBal = await StakingRewardsDeployed.balanceOf(mockRewardsDistributionAddress)
			console.log("Calling Address", mockRewardsDistributionAddress)
			await rewardsToken.approve(StakingRewardsDeployed.address, toUnit(5), {
				from: mockRewardsDistributionAddress,
			});
			await StakingRewardsDeployed.compound({ from: mockRewardsDistributionAddress });

			const postRewardBal = await rewardsToken.balanceOf(mockRewardsDistributionAddress);
			const postEarnedBal = await StakingRewardsDeployed.earned(mockRewardsDistributionAddress);
			const postStakingBal = await StakingRewardsDeployed.balanceOf(mockRewardsDistributionAddress)

			assert.ok(postEarnedBal < initialEarnedBal);
			assert.ok(postStakingBal > initialStakingBal);
			assert.bnEqual(postRewardBal, initialRewardBal);
		})
	})

	describe('setRewardsDuration()', () => {
		const sevenDays = DAY * 7;
		const seventyDays = DAY * 70;

		it('should increase rewards duration before starting distribution', async () => {
			const defaultDuration = await StakingRewardsDeployed.rewardsDuration();
			assert.equal(defaultDuration, sevenDays);

			await StakingRewardsDeployed.setRewardsDuration(seventyDays, { from: owner });
			const newDuration = await StakingRewardsDeployed.rewardsDuration();
			assert.equal(newDuration, seventyDays);
		});

		it('should revert when setting setRewardsDuration before the period has finished', async () => {
			const totalToDistribute = toUnit('5000');

			await stakingToken.approve(StakingRewardsDeployed.address, toUnit(100), {
				from: mockRewardsDistributionAddress,
			});
			await StakingRewardsDeployed.stake(toUnit(100), { from: mockRewardsDistributionAddress });

			await rewardsToken.transfer(StakingRewardsDeployed.address, totalToDistribute, {
				from: owner,
			});
			await StakingRewardsDeployed.notifyRewardAmount(toUnit(5), {
				from: owner,
			});
			await StakingRewardsDeployed.addReward(toUnit(5), { from: owner });

			await fastForward(DAY);

			await assert.revert(
				StakingRewardsDeployed.setRewardsDuration(seventyDays, { from: owner }),
				'Previous rewards period must be complete before changing the duration for the new period'
			);
		});

		it('should update when setting setRewardsDuration after the period has finished', async () => {
			const totalToDistribute = toUnit('5000');
			const totalToDistributeSecond = toUnit('1000');
			await stakingToken.approve(StakingRewardsDeployed.address, toUnit(100), {
				from: mockRewardsDistributionAddress,
			});
			await StakingRewardsDeployed.stake(toUnit(100), { from: mockRewardsDistributionAddress });

			await rewardsToken.transfer(StakingRewardsDeployed.address, totalToDistribute, {
				from: owner,
			});
			await StakingRewardsDeployed.notifyRewardAmount(toUnit(5), {
				from: owner,
			});
			await StakingRewardsDeployed.addReward(toUnit(5), { from: owner });

			await rewardsToken.transfer(StakingRewardsDeployed.address, totalToDistribute, {
				from: owner,
			});
			await StakingRewardsDeployed.notifyRewardAmount(toUnit(5), {
				from: owner,
			});
			await StakingRewardsDeployed.addReward(toUnit(5), { from: owner });

			await fastForward(DAY * 8);

			const transaction = await StakingRewardsDeployed.setRewardsDuration(seventyDays, {
				from: owner,
			});
			assert.eventEqual(transaction, 'RewardsDurationUpdated', {
				newDuration: seventyDays,
			});

			const newDuration = await StakingRewardsDeployed.rewardsDuration();
			assert.equal(newDuration, seventyDays);

			await rewardsToken.transfer(StakingRewardsDeployed.address, totalToDistribute, {
				from: owner,
			});
			await StakingRewardsDeployed.notifyRewardAmount(toUnit(5), {
				from: owner,
			});
			await StakingRewardsDeployed.addReward(toUnit(5), { from: owner });
		});

		it('should update when setting setRewardsDuration after the period has finished', async () => {
			const totalToDistribute = toUnit('5000');
			await stakingToken.approve(StakingRewardsDeployed.address, toUnit(100), {
				from: mockRewardsDistributionAddress,
			});
			await StakingRewardsDeployed.stake(toUnit(100), { from: mockRewardsDistributionAddress });

			await rewardsToken.transfer(StakingRewardsDeployed.address, totalToDistribute, {
				from: owner,
			});
			await StakingRewardsDeployed.notifyRewardAmount(toUnit(5), {
				from: owner,
			});
			await StakingRewardsDeployed.addReward(toUnit(5), { from: owner });

			await fastForward(DAY * 4);
			await StakingRewardsDeployed.getReward({ from: mockRewardsDistributionAddress });
			await fastForward(DAY * 4);

			// New Rewards period much lower
			await rewardsToken.transfer(StakingRewardsDeployed.address, totalToDistribute, {
				from: owner,
			});
			const transaction = await StakingRewardsDeployed.setRewardsDuration(seventyDays, {
				from: owner,
			});
			assert.eventEqual(transaction, 'RewardsDurationUpdated', {
				newDuration: seventyDays,
			});

			const newDuration = await StakingRewardsDeployed.rewardsDuration();
			assert.bnEqual(newDuration, seventyDays);

			await StakingRewardsDeployed.notifyRewardAmount(toUnit(1), {
				from: owner,
			});
			await StakingRewardsDeployed.addReward(toUnit(5), { from: owner });

			await fastForward(DAY * 71);
			await StakingRewardsDeployed.getReward({ from: mockRewardsDistributionAddress });
		});
	});

	describe('getRewardForDuration()', () => {
		it('should increase rewards token balance', async () => {
			const totalToDistribute = toUnit('5000');
			await rewardsToken.transfer(StakingRewardsDeployed.address, totalToDistribute, {
				from: owner,
			});
			await StakingRewardsDeployed.notifyRewardAmount(toUnit(5), {
				from: owner,
			});
			await StakingRewardsDeployed.addReward(toUnit(5), { from: owner });

			const rewardForDuration = await StakingRewardsDeployed.getRewardForDuration();

			const duration = await StakingRewardsDeployed.rewardsDuration();
			const rewardRate = await StakingRewardsDeployed.rewardRate();

			assert.ok(rewardForDuration > 0);
			assert.equal(rewardForDuration.toString(), duration.mul(rewardRate).toString());
		});
	});

	describe('withdraw()', () => {
		it('should increases lp token balance and decreases staking balance', async () => {
			const totalToStake = toUnit(1);

			await stakingToken.approve(StakingRewardsDeployed.address, totalToStake, {
				from: mockRewardsDistributionAddress,
			});
			await StakingRewardsDeployed.stake(totalToStake, { from: mockRewardsDistributionAddress });

			await fastForward(300);

			const initialStakeBal = await StakingRewardsDeployed.balanceOf(
				mockRewardsDistributionAddress
			);

			await StakingRewardsDeployed.withdraw(toUnit(0.5), {
				from: mockRewardsDistributionAddress,
			});

			const postStakeBal = await StakingRewardsDeployed.balanceOf(mockRewardsDistributionAddress);

			assert.bnEqual(postStakeBal.add(toBN(toUnit(0.5))).toString(), initialStakeBal.toString());
		});
	});

	describe('exit()', () => {
		it('should retrieve all earned and increase rewards bal', async () => {
			const totalToDistribute = toUnit('5000');
			await stakingToken.approve(StakingRewardsDeployed.address, toUnit(100), {
				from: mockRewardsDistributionAddress,
			});
			await StakingRewardsDeployed.stake(toUnit(100), { from: mockRewardsDistributionAddress });

			await rewardsToken.transfer(StakingRewardsDeployed.address, totalToDistribute, {
				from: owner,
			});
			await StakingRewardsDeployed.notifyRewardAmount(toUnit(5), {
				from: owner,
			});
			await StakingRewardsDeployed.addReward(toUnit(5), { from: owner });

			await fastForward(DAY);

			const initialRewardBal = await rewardsToken.balanceOf(mockRewardsDistributionAddress);
			const initialEarnedBal = await StakingRewardsDeployed.earned(
				mockRewardsDistributionAddress
			);

			await StakingRewardsDeployed.exit({ from: mockRewardsDistributionAddress });

			const postRewardBal = await rewardsToken.balanceOf(mockRewardsDistributionAddress);
			const postEarnedBal = await StakingRewardsDeployed.earned(mockRewardsDistributionAddress);

			assert.ok(postEarnedBal < initialEarnedBal);
			assert.ok(postRewardBal > initialRewardBal);
			assert.equal(postEarnedBal, 0);
		});
	});

	describe('notifyRewardAmount()', () => {
		it('Reverts if the provided reward is greater than the balance.', async () => {
			const rewardValue = toUnit(1000);
			await rewardsToken.transfer(StakingRewardsDeployed.address, rewardValue, { from: owner });
			await assert.revert(
				StakingRewardsDeployed.notifyRewardAmount(
					rewardValue.add(toUnit(0.1)),
					{
						from: owner,
					}
				),
				'Provided reward too high'
			);
		});

		it('Reverts if the provided reward is greater than the balance, plus rolled-over balance.', async () => {
			const rewardValue = toUnit(1000);
			await rewardsToken.transfer(StakingRewardsDeployed.address, rewardValue, { from: owner });
			await StakingRewardsDeployed.notifyRewardAmount(rewardValue, {
				from: owner,
			});
			await rewardsToken.transfer(StakingRewardsDeployed.address, rewardValue, { from: owner });
			// Now take into account any leftover quantity.
			await assert.revert(
				StakingRewardsDeployed.notifyRewardAmount(
					rewardValue.add(toUnit(0.1)),
					{
						from: owner,
					}
				),
				'Provided reward too high'
			);
		});
	});
});
