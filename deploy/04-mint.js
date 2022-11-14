const { network, ethers, deployments } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

module.exports = async function ({ getNamedAccounts }) {
    const { deployer } = await getNamedAccounts()
    const { log } = await deployments

    log("----------------------------------------------------------------------------------")
    // Basic Nft
    const basicNft = await ethers.getContract("BasicNft", deployer)
    const basicMintTx = await basicNft.mintNft()
    await basicMintTx.wait(1)
    console.log(`Basic NFT index 0 has tokenURI: ${await basicNft.tokenURI(0)}`)

    log("----------------------------------------------------------------------------------")
    // Random IPFS NFT
    const randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
    const mintFee = await randomIpfsNft.getMintFee()
    //set up a listener
    await new Promise(async (resolve, reject) => {
        setTimeout(resolve, 300000) // 5 minutes
        // listener
        randomIpfsNft.once("NftMinted", async function () {
            resolve()
        })
        // request Nft below the listener
        const randomMintTx = await randomIpfsNft.requestNft({ value: mintFee })
        const randomMintTxReceipt = await randomMintTx.wait(1)
        if (developmentChains.includes(network.name)) {
            const requestId = randomMintTxReceipt.events[1].args.requestId.toString()
            const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
            await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfsNft.address)
        }
    })
    console.log(`Random IPFS NFT index 0 tokenURI: ${await randomIpfsNft.tokenURI(0)}`)

    log("----------------------------------------------------------------------------------")
    // Dynamic SVG NFT
    const highValue = await ethers.utils.parseEther("4000")
    const dynamicSvgNft = await ethers.getContract("DynamicSvgNft", deployer)
    const dynamicMintTx = await dynamicSvgNft.mintNft(highValue)
    await dynamicMintTx.wait(1)
    console.log(`Dynamic SVG NFT index 0 tokenURI: ${await dynamicSvgNft.tokenURI(0)}`)
}
