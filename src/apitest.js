"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var alchemy_sdk_1 = require("alchemy-sdk");
var utils_1 = require("ethers/lib/utils");
var sdk = require('api')('@opensea/v2.0#1nqh2zlnvr1o4h');
var caller = function () { return __awaiter(void 0, void 0, void 0, function () {
    var config, alchemy, data, transferTopics, orderFulfilledTopicsSeaport, transferSingleTopics, transferBatchTopics, abi, decodedData;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                config = {
                    apiKey: "thZ6Uov_nnjBegiTs5aXqlqLHHOjEXII",
                    network: alchemy_sdk_1.Network.ETH_MAINNET,
                };
                alchemy = new alchemy_sdk_1.Alchemy(config);
                return [4 /*yield*/, alchemy.core.getTransactionReceipt("0xfd818fa90e25092b6219fa7f7125f4a3bcade7d5bb302573da4bdb36c691ab1e")];
            case 1:
                data = _a.sent();
                transferTopics = data.logs.filter(function (dta) {
                    return dta.topics.includes("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef");
                });
                orderFulfilledTopicsSeaport = data.logs.filter(function (dta) {
                    return dta.topics.includes("0x9d9af8e38d66c62e2c12f0225249fd9d721c54b83f48d9352c97c6cacdcb6f31");
                });
                transferSingleTopics = data.logs.filter(function (dta) {
                    return dta.topics.includes("0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62");
                });
                transferBatchTopics = data.logs.filter(function (dta) {
                    return dta.topics.includes("0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb");
                });
                abi = ["uint256[]", "uint256[]"];
                decodedData = utils_1.defaultAbiCoder.decode(abi, transferBatchTopics[0].data);
                console.log(decodedData);
                return [2 /*return*/];
        }
    });
}); };
caller();
