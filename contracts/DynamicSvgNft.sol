// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "base64-sol/base64.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract DynamicSvgNft is ERC721 {
    // mint
    // store SVG info somewhere
    // some logic to say "show X image" or "show Y image"
    // this will just be changing the tokenUri

    uint256 private s_tokenCounter;
    string private i_lowImageURI;
    string private i_highImageURI;
    AggregatorV3Interface internal immutable i_priceFeed;
    string private constant base64EncodedSvgPrefix =
        "data:image/svg+xml;base64,";
    mapping(uint256 => int256) public s_tokenIdToHighValue;

    //events
    event CreatedNFT(uint256 indexed tokenId, int256 highValue);

    constructor(
        address priceFeedAddress,
        string memory lowSvg,
        string memory highSvg
    ) ERC721("Dybamic Svg Nft", "DSN") {
        s_tokenCounter = 0;
        // we will store the image URI on chain not the svg
        i_lowImageURI = svgToImageURI(lowSvg);
        i_highImageURI = svgToImageURI(highSvg);
        i_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function mintNft(int256 highValue) public {
        s_tokenIdToHighValue[s_tokenCounter] = highValue;
        s_tokenCounter++;
        _safeMint(msg.sender, s_tokenCounter);
        emit CreatedNFT(s_tokenCounter, highValue);
    }

    function svgToImageURI(string memory svg)
        public
        pure
        returns (string memory)
    {
        string memory svgBase64Encoded = Base64.encode(
            bytes(string(abi.encodePacked(svg)))
        );
        return
            string(abi.encodePacked(base64EncodedSvgPrefix, svgBase64Encoded));
    }

    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_exists(tokenId), "URI Query for non-existent token");
        //string memory imageURI = "hi";

        (, int256 price, , , ) = i_priceFeed.latestRoundData();
        string memory imageURI = i_lowImageURI;
        if (price >= s_tokenIdToHighValue[tokenId]) {
            imageURI = i_highImageURI;
        }

        // data:image/svg+xml;base64 - prefix for images
        // data:application/json;base64 - prefix for base64 JSON

        return
            // we then return the string value/tokenURI
            string( // cast it to string
                abi.encodePacked( // encode the concatinated value
                    _baseURI(), // we then append the JSON prefix
                    Base64.encode( // after encoding in bytes, now we can encode it in base64
                        bytes( // encoding the string in bytes
                            abi.encodePacked( // creating a JSON string
                                '{"name":"',
                                name(), // You can add whatever name here
                                '", "description":"An NFT that changes based on the Chainlink Feed", ',
                                '"attributes": [{"trait_type": "coolness", "value": 100}], "image":"',
                                imageURI,
                                '"}'
                            )
                        )
                    )
                )
            );
    }
}
