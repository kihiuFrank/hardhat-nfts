const { assert, expect } = require("chai")
const { utils } = require("ethers")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("RandomIpfsNft Unit Tests", () => {
          let deployer, randomIpfsNft, mintFee
          beforeEach("runs before every test", async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              //   deployer = await getNamedAccounts()
              await deployments.fixture(["mocks", "randomipfs"])
              randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
              mintFee = await randomIpfsNft.getMintfee()
          })

          it("randomIpfsNft deploys successfully", async () => {
              assert(randomIpfsNft.address)
          })

          describe("constructor", () => {
              it("sets the Nft name and symbol correctly", async () => {
                  const nftName = await randomIpfsNft.name()
                  assert(nftName, "Randon IPFS NFT")

                  const nftSymbol = await randomIpfsNft.symbol()
                  assert(nftSymbol, "RIN")
              })

              it("sets starting values correctly", async () => {
                  const dogTokenUris = await randomIpfsNft.getDogTokenUris(0)
                  await assert(dogTokenUris.includes("ipfs://"))
              })
          })

          describe("request Nft", () => {
              it("fails if the payment/mintFee is not sent with the request", async () => {
                  await expect(randomIpfsNft.requestNft()).to.be.revertedWithCustomError(
                      randomIpfsNft,
                      "RandomIpfsNft__NeedMoreETHSent"
                  )
              })
              it("fails if the mintFee is not enough", async () => {
                  await expect(
                      randomIpfsNft.requestNft({ value: ethers.utils.parseEther("0.001") })
                  ).to.be.revertedWithCustomError(randomIpfsNft, "RandomIpfsNft__NeedMoreETHSent")
              })

              it("emits event nftRequested", async () => {
                  await expect(randomIpfsNft.requestNft({ value: mintFee })).to.emit(
                      randomIpfsNft,
                      "NftRequested"
                  )
              })
          })
      })
