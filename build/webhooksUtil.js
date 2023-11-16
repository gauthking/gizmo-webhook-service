"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAlchemySignature = exports.addAlchemyContextToRequest = exports.isValidSignatureForStringBody = exports.isValidSignatureForAlchemyRequest = void 0;
const crypto = __importStar(require("crypto"));
function isValidSignatureForAlchemyRequest(request, signingKey) {
    return isValidSignatureForStringBody(request.alchemy.rawBody, request.alchemy.signature, signingKey);
}
exports.isValidSignatureForAlchemyRequest = isValidSignatureForAlchemyRequest;
function isValidSignatureForStringBody(body, signature, signingKey) {
    const hmac = crypto.createHmac("sha256", signingKey); // Create a HMAC SHA256 hash using the signing key
    hmac.update(body, "utf8"); // Update the token hash with the request body using utf8
    const digest = hmac.digest("hex");
    return signature === digest;
}
exports.isValidSignatureForStringBody = isValidSignatureForStringBody;
function addAlchemyContextToRequest(req, _res, buf, encoding) {
    const signature = req.headers["x-alchemy-signature"];
    // Signature must be validated against the raw string
    var body = buf.toString(encoding || "utf8");
    req.alchemy = {
        rawBody: body,
        signature: signature,
    };
}
exports.addAlchemyContextToRequest = addAlchemyContextToRequest;
function validateAlchemySignature(signingKey) {
    return (req, res, next) => {
        if (!isValidSignatureForAlchemyRequest(req, signingKey)) {
            const errMessage = "Signature validation failed, unauthorized!";
            res.status(403).send(errMessage);
            throw new Error(errMessage);
        }
        else {
            next();
        }
    };
}
exports.validateAlchemySignature = validateAlchemySignature;
