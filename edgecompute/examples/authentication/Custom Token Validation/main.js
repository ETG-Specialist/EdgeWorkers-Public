//use the md5 library from

//https://css-tricks.com/snippets/javascript/javascript-md5/
//import {MD5} from "./utils/md5.js";

//https://www.myersdaily.org/joseph/javascript/md5-text.html
import {md5} from "./lib/md5.js";

import URLSearchParams from 'url-search-params';
import { logger } from 'log'; // Import the logger module

function isEmpty(str) {
    return (!str || str.length === 0 );
}

function edgeAuth(queryString,secretKey,reqPath,skipTimeValidate) {
    var authResult = false; // default auth failed
    var fullParamsObject = new URLSearchParams(queryString);
    var reqQS_sigparams = fullParamsObject.get("sigparams");

    var reqQS_expires = fullParamsObject.get("expires");
    var reqQS_intOfExpries = parseInt(reqQS_expires);
    
    var reqQS_len = fullParamsObject.get("len");
    var reqQS_intOfLen = parseInt(reqQS_len);
    
    var reqQS_sign = fullParamsObject.get("sign");
    const currentEpoch = parseInt(new Date()/1000);
    /*
    logger.log('full Params : ' + fullParamsObject);
    logger.log('sigparams: ' + reqQS_sigparams);
    logger.log('expires: ' + reqQS_expires);
    logger.log('len: ' + reqQS_len);
    logger.log('sign: ' + reqQS_sign);
    */
    //handle empty query string len
    if ( isEmpty(reqQS_len) ) {
	reqQS_len = "0";
        reqQS_intOfLen = 0;
    }
    
    // All mandatory query string must present 
    if (isEmpty(reqQS_sigparams) || isEmpty(reqQS_expires) || isEmpty(reqQS_sign)) {
        authResult = false;
    //if skip time validaiton is not ture,
    //we should validate the request query expires with current Epoch time
    } else if ( skipTimeValidate != true && !isNaN(reqQS_intOfExpries) && reqQS_intOfExpries  <  currentEpoch ) {
        authResult = false;
    // len must int and must >=0
    } else if (isNaN(reqQS_intOfLen) || reqQS_intOfLen < 0) {
        authResult = false;
    //if all mandatory query string is valide, then we proceed to calculate 
    // the signature and compare with request query sign
    } else {
        var arrayOfSigparams = reqQS_sigparams.split(",");
        var plainText="";
        let prarmKey;
        for ( prarmKey in arrayOfSigparams){
            let keyName = arrayOfSigparams[prarmKey];
            let keyValue = fullParamsObject.get(keyName)
            if (!isEmpty(keyValue)) {
                plainText += keyName + "=" + keyValue + "&";
            }
        }
        plainText += "sigparams=" + reqQS_sigparams;
        //var expectedSignature = MD5(reqPath+secretKey+plainText);
        var expectedSignature = md5(reqPath+secretKey+plainText);
        logger.log('plainText: ' + plainText);
        logger.log('expected Signature: ' + expectedSignature);
        if (reqQS_sign == expectedSignature) {
            authResult = true;
        }
    }
    return authResult;
}

export function onClientRequest (request) {
    const authSharedKey = "124sk2k3";
    const authFailedHeaders = {"content-type":"text/plain","validated-by":"edgeworkers","server":"AkamaiGHost"};
    var authCheckResult=false;
    authCheckResult=edgeAuth(request.query,authSharedKey,request.path,false);

    if ( !authCheckResult ) {
        request.respondWith(403, authFailedHeaders, "Access Denied", "default-edgeauth-failed")
    } 

  }
