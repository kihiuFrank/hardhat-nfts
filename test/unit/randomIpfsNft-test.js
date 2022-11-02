const { assert } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("RandomIpfsNft Unit Tests", () => {
          let deployer, randomIpfsNft
          beforeEach("runs before every test", async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              //   deployer = await getNamedAccounts()
              await deployments.fixture(["mocks", "randomipfs"])
              randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
          })

          it("randomIpfsNft deploys successfully", async () => {
              assert(randomIpfsNft.address)
          })
      })
