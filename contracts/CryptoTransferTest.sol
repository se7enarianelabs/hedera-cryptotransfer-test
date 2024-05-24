// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;
pragma experimental ABIEncoderV2;
import "./hts-precompile/HederaTokenService.sol";
import "./hts-precompile/IHederaTokenService.sol";

contract CryptoTransferTest is HederaTokenService {
    event ResponseCode(int responseCode);

    function cryptoTransferPublic(
        address sender,
        address receiver,
        address erc721,
        int64 tokenId
    ) public payable returns (int responseCode) {
        IHederaTokenService.AccountAmount[]
            memory transferListAccountAmount = new IHederaTokenService.AccountAmount[](
                2
            );
        transferListAccountAmount[0] = IHederaTokenService.AccountAmount(
            sender,
            -int64(int256(msg.value)),
            false
        );
        transferListAccountAmount[1] = IHederaTokenService.AccountAmount(
            receiver,
            int64(int256(msg.value)),
            false
        );
        IHederaTokenService.TransferList
            memory transferList = IHederaTokenService.TransferList(
                transferListAccountAmount
            );

        IHederaTokenService.TokenTransferList[]
            memory tokenTransferList = new IHederaTokenService.TokenTransferList[](
                1
            );
        IHederaTokenService.NftTransfer[]
            memory nftTransfer = new IHederaTokenService.NftTransfer[](1);
        nftTransfer[0] = IHederaTokenService.NftTransfer(
            receiver,
            sender,
            tokenId,
            true
        );
        tokenTransferList[0] = IHederaTokenService.TokenTransferList(
            erc721,
            new IHederaTokenService.AccountAmount[](0),
            nftTransfer
        );

        responseCode = HederaTokenService.cryptoTransfer(
            transferList,
            tokenTransferList
        );
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
    }
}
