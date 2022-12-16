/* eslint max-classes-per-file: 0 */
import { ethers, network } from 'hardhat'

class Snapshot {
  public snapshotId: string

  constructor(public name: string, public debug: boolean = false) {}

  public async snapshot(): Promise<void> {
    this.snapshotId = await ethers.provider.send('evm_snapshot', [])
    if (this.debug) console.log(`💾 Snapshot taken - ${this.name} @ ${this.snapshotId}`)
  }

  public async reset(): Promise<void> {
    if (this.debug) console.log(`⚓ Reset snapshot - ${this.name} @ ${this.snapshotId}`)
    await network.provider.send('evm_revert', [this.snapshotId])
    this.snapshotId = await ethers.provider.send('evm_snapshot', [])
  }
}

export class Snapshotter {
  // Snapshot stack and setup code. This allows us to nest snapshotting blocks
  // and have them all work together.
  private outerSetupComplete = false
  private snapshotStack: Snapshot[] = []
  private setActiveSnapshot(snapshot: Snapshot): void {
    this.snapshotStack.push(snapshot)
  }
  private headSnapshot(): Snapshot {
    return this.snapshotStack[this.snapshotStack.length - 1]
  }
  private async popActiveSnapshot(): Promise<void> {
    // Pop the snapshot
    this.snapshotStack.pop()
    if (this.snapshotStack.length > 0) {
      // If we have another in the stack, revert the blockchain to this snapshot
      await this.headSnapshot().reset()
    } else if (this.snapshotStack.length === 0) {
      // Otherwise we've popped the last one off the stack, so we're done, and our
      // outer setup is no longer complete.
      this.outerSetupComplete = false
    }
  }

  // This is the actual function which sets up snapshotting for a given block.
  public usesCustomSnapshot(name: string | undefined = undefined): void {
    // Create our snapshot abstraction
    const snapshot: Snapshot = new Snapshot(name || '')

    before(() => {
      // When this block becomes active, we set this snapshot as active
      this.setActiveSnapshot(snapshot)
    })

    if (!this.outerSetupComplete) {
      // This is the outermost block in our stack, we must do the required setup
      this.outerSetupComplete = true

      beforeEach(async () => {
        // Before each, take a snapshot
        await this.headSnapshot().snapshot()
      })

      afterEach(() => {
        // After each test, we revert the blockchain state to the currently active snapshot
        this.headSnapshot().reset()
      })
    }

    after(async () => {
      // After this block is finished, pop the snapshot
      await this.popActiveSnapshot()
    })
  }

  public async saveSnapshot(): Promise<void> {
    await this.headSnapshot().snapshot()
  }
}
