const { assert } = require("chai")
const { network, ethers, deployments } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("DynamicSvgNft Unit Tests", () => {
          let deployer, dynamicSvgNft, accounts
          beforeEach("runs before each test", async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              //deploying
              await deployments.fixture(["dynamicsvg", "mocks"])
              dynamicSvgNft = await ethers.getContract("DynamicSvgNft", deployer)
          })

          it("DynamicSvgNft contract deploys succesfully", async () => {
              assert(dynamicSvgNft.address)
          })

          describe("constructor", () => {
              it("intializes with the correct name and symbol", async () => {
                  const nftName = await dynamicSvgNft.name()
                  const nftSymbol = await dynamicSvgNft.symbol()

                  assert.equal(nftName, "Dybamic Svg Nft")
                  assert.equal(nftSymbol, "DSN")
              })

              it("the svgs have the right prefix", async () => {
                  const svgImageUris = await dynamicSvgNft.svgToImageURI("lowSvg")
                  await assert(svgImageUris.includes("data:image/svg+xml;base64,"))
              })
          })

          describe("mint function", () => {
              it("tokenCounter starts at 0", async () => {
                  const tokenCounter = (await dynamicSvgNft.getTokenCounter()).toString()
                  assert.equal(tokenCounter, "0")
              })

              it("succesfully mints nft", async () => {
                  const txResponse = await dynamicSvgNft.mintNft(1)
                  await txResponse.wait(1)

                  const tokenCounter = (await dynamicSvgNft.getTokenCounter()).toString()
                  assert.equal(tokenCounter, "1")
              })
          })
      })
