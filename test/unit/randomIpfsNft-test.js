const { assert, expect } = require("chai")
const { utils } = require("ethers")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { r } = require("tar")
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

              it("emits event nftRequested and kicks off random word request", async () => {
                  await expect(randomIpfsNft.requestNft({ value: mintFee })).to.emit(
                      randomIpfsNft,
                      "NftRequested"
                  )
              })
          })

          describe("fulfillRandomwords", () => {
              it("initalizes token counter correctly", async () => {
                  const tokenCounter = await randomIpfsNft.getTokenCounter()
                  assert.equal(tokenCounter, "0")
              })

              it("mints NFT after random number is returned", async function () {
                  await new Promise(async (resolve, reject) => {
                      randomIpfsNft.once("NftMinted", async () => {
                          // setting up the event listener for NftMinted
                          console.log("NftMinted event fired!")
                          // assert throws an error if it fails, so we need to wrap
                          // it in a try/catch so that the promise returns event
                          // if it fails.
                          try {
                              const tokenUri = await randomIpfsNft.tokenURI("0")
                              const tokenCounter = await randomIpfsNft.getTokenCounter()
                              assert.equal(tokenUri.toString().includes("ipfs://"), true)
                              assert.equal(tokenCounter.toString(), "1")
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })

                      try {
                          const requestNftResponse = await randomIpfsNft.requestNft({
                              value: mintFee.toString(),
                          })
                          const requestNftReceipt = await requestNftResponse.wait(1)
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestNftReceipt.events[1].args.requestId,
                              randomIpfsNft.address
                          )
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
              })
          })

          describe("withdraw", () => {
              it("only owner can withdraw", async () => {
                  const attacker = accounts[1]
                  const attackerConnectedContract = await randomIpfsNft.connect(attacker)
                  await expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
                      "Ownable: caller is not the owner" // from the Ownable contract we inherited.
                  )
              })
          })

          describe("getBreedFromModdedRng", () => {
              it("returns pug if moddedRng is less than 10", async () => {
                  const valueReturned = await randomIpfsNft.getBreedFromModdedRng(5)
                  assert.equal(valueReturned, 0)
              })

              it("returns shibaInu if moddedRng is 11 - 30", async () => {
                  const valueReturned = await randomIpfsNft.getBreedFromModdedRng(23)
                  assert.equal(valueReturned, 1)
              })

              it("returns St Benard if moddedRng is 31-99", async () => {
                  const valueReturned = await randomIpfsNft.getBreedFromModdedRng(47)
                  assert.equal(valueReturned, 2)
              })

              it("should revert if moddedRng is > 99", async () => {
                  await expect(
                      randomIpfsNft.getBreedFromModdedRng(100)
                  ).to.be.revertedWithCustomError(randomIpfsNft, "RandomIpfsNft__RangeOutOfBounds")
              })
          })
      })
