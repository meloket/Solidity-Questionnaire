import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { defaultAbiCoder, formatEther, parseEther, sha256 } from "ethers/lib/utils";

describe("Game", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployGameFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, user1, user2] = await ethers.getSigners();
    const initHash = sha256(defaultAbiCoder.encode(["uint"], [10]));
    const Game = await ethers.getContractFactory("Game");
    const game = await Game.deploy(parseEther("0.1"), initHash);

    return { game, owner, user1, user2 };
  }

  it("Should allow to claim refund when matched target", async function () {
    const { game, user1, user2 } = await loadFixture(deployGameFixture);
    await game.connect(user1).attempt(1, { value: parseEther("0.1") });
    let balance = await ethers.provider.getBalance(game.address);
    expect(formatEther(balance)).to.eq("0.1");
    await game.connect(user2).attempt(9, {value: parseEther("0.1")});
    balance = await ethers.provider.getBalance(game.address);
    expect(formatEther(balance)).to.eq("0.0");
  });

  it("Should not allow attempt before started", async () => {
    const { game, user1, user2 } = await loadFixture(deployGameFixture);
    await game.connect(user1).attempt(1, { value: parseEther("0.1") });
    let balance = await ethers.provider.getBalance(game.address);
    expect(formatEther(balance)).to.eq("0.1");
    await game.connect(user2).attempt(9, {value: parseEther("0.1")});
    await expect(game.connect(user1).attempt(0, {value: parseEther("0.1")})).to.revertedWith("not started yet");
  });

  it("Should allow restart by owner", async () => {
    const { game, user1, user2 } = await loadFixture(deployGameFixture);
    await game.connect(user1).attempt(1, { value: parseEther("0.1") });
    let balance = await ethers.provider.getBalance(game.address);
    expect(formatEther(balance)).to.eq("0.1");
    await game.connect(user2).attempt(9, {value: parseEther("0.1")});
    balance = await ethers.provider.getBalance(game.address);
    expect(formatEther(balance)).to.eq("0.0");
    const initHash = sha256(defaultAbiCoder.encode(["uint"], [11]));
    await game.setTarget(initHash);
    const started = await game.started();
    expect(started).to.be.true;
  });

  it('Should not allow reset target by another one', async () => {
    const { game, user1, user2 } = await loadFixture(deployGameFixture);
    await game.connect(user1).attempt(1, { value: parseEther("0.1") });
    let balance = await ethers.provider.getBalance(game.address);
    expect(formatEther(balance)).to.eq("0.1");
    await game.connect(user2).attempt(9, {value: parseEther("0.1")});
    balance = await ethers.provider.getBalance(game.address);
    expect(formatEther(balance)).to.eq("0.0");
    const initHash = sha256(defaultAbiCoder.encode(["uint"], [11]));
    await expect(game.connect(user1).setTarget(initHash)).to.revertedWith("Ownable: caller is not the owner");
  });
});
