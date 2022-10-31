const { developmentChains } = require("../helper-hardhat-config")

module.exports = async ({ hre }) => {
    const { deployments, getNamedAccounts, network, ethers } = hre
    const BASE_FEE = ethers.utils.parseEther("0.25") // 0.25 is this the premium in LINK?
    const GAS_PRICE_LINK = 1e9 // link per gas, is this the gas lane? // 0.000000001 LINK per gas

    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const args = [BASE_FEE, GAS_PRICE_LINK]
    // If we are on a local development network, we need to deploy mocks!
    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...")
        //deploy a mock vrfcoordinator
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: args,
        })

        log("Mocks Deployed!")
        log("---------------------------------------------------------------------------------")
    }
}
module.exports.tags = ["all", "mocks"]
