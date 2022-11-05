const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const chainId = network.config.chainId
    let ethUsdPriceFeedAddress

    // getting priceFeedAddress as need by our constructor
    if (developmentChains.includes(network.name)) {
        // when in development chains
        const ethUsdAggregator = await ethers.getContract("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        // when in testnet or mainnet
        ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed
    }
}
