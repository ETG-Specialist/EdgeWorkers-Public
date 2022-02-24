/*
(c) Copyright 2019 Akamai Technologies, Inc. Licensed under Apache 2 license.
Version: 0.1
Purpose:  Respond with JSON formatted geographical location information.
Repo: https://github.com/akamai/edgeworkers-examples/tree/master/microservice-geolocation
*/

import { logger } from 'log'; // Import the logger module export function
import { createResponse } from "create-response";




export function onClientResponse(request, response) {
// Outputs a message to the X-Akamai-EdgeWorker-onClientResponse-Log header.
var result=request.getVariable("PMUSER_EPD_EXECUTED")
logger.log("Adding a header in onClientResponse");
response.setHeader("EdgeworkerResponse", "Response from Edgeworkers");
response.setHeader("EPD",result);
}

export async function responseProvider(request) {

const variables_to_be_checked=["PMUSER_EPD_EXECUTED","PMUSER_GEO_DENY","PMUSER_TA_DENY"];
const deny_details={"PMUSER_EPD_EXECUTED":[]};
for (let i = 0; i < variables_to_be_checked.length; i++)

  {

    var user_variable=variables_to_be_checked[i]
    var result=request.getVariable(variables_to_be_checked[i])

    if(user_variable=="PMUSER_EPD_EXECUTED" && result=="True")
    {
         return Promise.resolve(
    createResponse(
      403,
      { "Content-Type": ["application/json"],'x-error-type':'EPD-DENY' },
       JSON.stringify({"resultCode": "error","errorDescription": "AKA_EPD","message": "EPDblocked API","resultObj": {},"systemTime": "1592558179887"})
      
    )
  );

    }

if(user_variable=="PMUSER_GEO_DENY" && result=="True")

    {

         return Promise.resolve(
    createResponse(
      403,
      { "Content-Type": ["application/json"],'x-error-type':'GEO-DENY' },
       JSON.stringify({"resultCode": "error","errorDescription": "AKA_GEO","message": "Geoblocked API","resultObj": {},"systemTime": "1592558179887"})
      
    )
  );
     

         

          

      }

  if(user_variable=="PMUSER_TA_DENY" && result=="True")
  {

      return Promise.resolve(
    createResponse(
      403,
      { "Content-Type": ["application/json"],'x-error-type':'TA-DENY' },
       JSON.stringify({"resultCode": "error","errorDescription": "AKA_TA","message": "Tokendeny API","resultObj": {},"systemTime": "1592558179887"})
      
    )
  );

  }

 


}

  
}
