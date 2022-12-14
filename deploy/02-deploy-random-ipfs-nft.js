const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const { storeImages, storeTokenUriMetadata } = require("../utils/uploadToPinata")

const imagesLocation = "./images/randomNft/"
const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_types: "Cuteness",
            value: 100,
        },
    ],
}

/* let tokenUris
    // set UPLOAD_TO_PINATA to true in .env */

//or

// let tokenUris = [
//     "ipfs://QmS67YnuLG81FJAKoEQmqZLR9PWVsdZQAnKDM7CoQzAmHx",
//     "ipfs://QmVf3dfBvwbLWy1mjK64D9MJiCtwpTkHbRzB8MDykRzteb",
//     "ipfs://QmWG59GTRut4Z35puMNL3btLGdRqUeVUFMfzUs1tAvQ3gE",
// ]

let tokenUris = [
    "ipfs://QmUjPgLZGqaDgRUhtc7uvM4Gp2BvcviTaBZfBcM2UML1oL",
    "ipfs://QmPGwwAHLMn8MjcQf8A3LSGkfoJdEcWyADLyxL8JdfuATD",
    "ipfs://QmR8SUd3g8BNePSbBgRALy65sJpPc3WRe1vXNvUxyK7Rxv",
]

const FUND_AMOUNT = "1000000000000000000000" // 10 LINK
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    // get IPFS hashes of our images
    if (process.env.UPLOAD_TO_PINATA == "true") {
        // set to true in .env if you want to upload
        tokenUris = await handleTokenUris()
    }

    //1. with our own IPFS Node. https://docs.ipfs.io/ (centralised since we are the only ones running the node)
    //2. pinata https://www.pinata.cloud/ (centralised entity) - using this
    //3. nft.storage https://nft.storage/ (Uses filecoin blockchain - decentralised)

    let vrfCoordinatorV2Address, subscriptionId

    if (developmentChains.includes(network.name)) {
        // create VRFV2 Subscription
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const tx = await vrfCoordinatorV2Mock.createSubscription()
        const txReceipt = await tx.wait(1)
        subscriptionId = txReceipt.events[0].args.subId
        // Fund the subscription
        // Our mock makes it so we don't actually have to worry about sending fund
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2
        subscriptionId = networkConfig[chainId].subscriptionId
    }

    log("-------------------------------------------------------------------")
    //await storeImages(imagesLocation)
    const args = [
        vrfCoordinatorV2Address,
        subscriptionId,
        networkConfig[chainId].gasLane,
        networkConfig[chainId].callbackGasLimit,
        tokenUris,
        networkConfig[chainId].mintFee,
    ]

    const randomIpfsNft = await deploy("RandomIpfsNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log("-------------------------------------------------------------------")
    // Verify the deployment
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(randomIpfsNft.address, args)
    }
}

async function handleTokenUris() {
    tokenUris = []
    // we need to store the Image in IPFS
    // store the metadata in IPFS
    const { responses: imageUploadResponses, files } = await storeImages(imagesLocation)
    for (imageUploadResponseIndex in imageUploadResponses) {
        //create metadata
        // upload metadata
        let tokenUriMetadata = { ...metadataTemplate } // (...)syntax - unpack metadataTemplate
        tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".png", "") // drop the file extensions
        tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} puppy!`
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`
        console.log(`Uploading ${tokenUriMetadata.name}...`)

        //store the JSON to pinata / IPFS
        const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata)
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
    }

    console.log("Token URIs Uploaded! They are: ")
    console.log(tokenUris)

    return tokenUris
}

module.exports.tags = ["all", "randomipfs", "main"]
