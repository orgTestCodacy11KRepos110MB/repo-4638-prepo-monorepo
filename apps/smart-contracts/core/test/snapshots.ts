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

// Snapshot stack and setup code. This is the magic sauce that allows us to
// nest snapshot arrangements, where we need some configuration to be done
// in the outermost block, and then want the option to have nested snapshots
// within inner describe blocks.
// This will be cleaned up prior to proper implementation.
let outerSetupComplete = false
const snapshotStack: Snapshot[] = []
function setActiveSnapshot(snapshot: Snapshot): void {
  console.log('Setting active snapshot', snapshot.name)
  snapshotStack.push(snapshot)
}
function headSnapshot(): Snapshot {
  return snapshotStack[snapshotStack.length - 1]
}
async function popActiveSnapshot(): Promise<void> {
  // Pop the snapshot
  snapshotStack.pop()
  if (snapshotStack.length > 0) {
    // If we have another in the stack, revert the blockchain to this snapshot
    console.log('Reverting to snapshot', headSnapshot().name, headSnapshot().snapshotId)
    await headSnapshot().reset()
  } else if (snapshotStack.length === 0) {
    // Otherwise we've popped the last one off the stack, so we're done, and our
    // outer setup is no longer complete.
    outerSetupComplete = false
  }
}

// This is the actual function which sets up snapshotting for a given block.
export function usesCustomSnapshot(name: string | undefined = undefined): void {
  // Create our snapshot abstraction
  const snapshot: Snapshot = new Snapshot(name || '')

  before(() => {
    // When this block becomes active, we set this snapshot as active
    setActiveSnapshot(snapshot)
  })

  if (!outerSetupComplete) {
    // This is the outermost block in our stack, we must do the required setup
    outerSetupComplete = true

    beforeEach(async () => {
      // Before each, take a snapshot
      await headSnapshot().snapshot()
    })

    afterEach(() => {
      // After each test, we revert the blockchain state to the currently active snapshot
      headSnapshot().reset()
    })
  }

  after(async () => {
    // After this block is finished, pop the snapshot
    await popActiveSnapshot()
  })
}

export async function saveSnapshot(): Promise<void> {
  await headSnapshot().snapshot()
}
