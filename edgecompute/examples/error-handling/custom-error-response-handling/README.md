# Handling Custom Error Response using EdgeWorkers
In this example, Edgeworkers is used to serve different error responses based on the deny feature which gets triggered in Akamai configuration.You can find the metadata sample and a working EW code that can be used for specific customer scenarios similar to this.

Problem Statement and Use Case
Solution Workflow
Test Results
Edgeworker Code

## Problem Statement and Use Case

In Akamai config , we would have implemented multiple security features like Geo block, Token block, EPD, Path based ACL etc. Customers would need to return a custom JSON response based on the deny feature which got triggered and also add a response header for troubleshooting purposes.

In below example you can see that Akamai edge server gives back default (reference error) response for different types of scenarios

### Blocked by Geo location

curl -ik "https://sbharadwew.edgekey-staging.net" -H "X-forwarded-for:202.51.247.226" --connect-to ::e1.a.akamaiedge-staging.net

HTTP/1.1 403 Forbidden
Server : AkamaiGHost
Mime-Version : 1.0
Content-Type : text/html
Content-Length : 283
Expires : Tue, 17 Aug 2021 02:37:37 GMT
Date : Tue, 17 Aug 2021 02:37:37 GMT
Connection : keep-alive
X-Akamai-Staging : ESSL

You don't have permission to access "http://sbharadwew.edgekey-staging.net/" on this server.
Reference #18.3da93017.1629167857.8f3f36f
Blocked by Token Auth

curl -ik "https://sbharadwew.edgekey-staging.net/?hdnea=exp=1629173184~acl=/*~hmac=195bf61c1ab33aa32a706723b68fec8dfa66b693cca70bbd083daadc1a4933b1" -H "X-forwar:52.66.193.64" --connect-to ::e1.a.akamaiedge-staging.net

HTTP/1.1 403 Forbidden
Server : AkamaiGHost
Mime-Version : 1.0
Content-Type : text/html
Content-Length : 176
Expires : Tue, 17 Aug 2021 02:46:31 GMT
Date : Tue, 17 Aug 2021 02:46:31 GMT
Connection : keep-alive
X-Akamai-Staging : ESSL

An error occurred while processing your request.
Reference #219.3da93017.1629168391.8f478f3
Blocked by EPD

curl -ik "https://sbharadwew.edgekey-staging.net/?hdnea=exp=1629173184~acl=/*~hmac=195bf61c1ab33aa32a706723b68fec8dfa66b693cca70bbd083daadc1a4933b1" -H "X-forwar:52.66.193.64" --connect-to ::e1.a.akamaiedge-staging.net

HTTP/1.1 403 Forbidden
Server : AkamaiGHost
Mime-Version : 1.0
Content-Type : text/html
Content-Length : 176
Expires : Tue, 17 Aug 2021 02:46:31 GMT
Date : Tue, 17 Aug 2021 02:46:31 GMT
Connection : keep-alive
X-Akamai-Staging : ESSL

An error occurred while processing your request.
Reference #219.3da93017.1629168391.8f478f3

## Solution Workflow

Akamai Metadata workflow terminates on 403 deny and it wont allow Edgeworkers to execute. We have used an approach where variables are set for different error scenarios and context is passed to Edgeworkers using variables

Based on values of variables, logic has been handled in the Edgeworkers bundle to handle different JSON responses and also to add response headers.

We also faced issues with scoping of the Edgeworkers execution within a variable match. EdgeWorkers behavior sets the EdgeWorkers ID in content policy stage and since variables execute much later in metadata processing , EW call template was not getting invoked . In below screenshot, EW was scoped to execute if the EPD is triggered


Above rule translates into below metadata .Value of the variable - PMUSER_EPD_EXECUTED is only available in client request stage but EW_IN_ID is set in content policy stage within the match of variable and this was causing the issue of EW pearl not getting invoked


I removed the content policy stage and use advance behavior to allow pearl to execute on variable match


Also in case of EPD, baseline hd.data executes the tag - auth:acl.deny and this ensures ghost terminates further metadata processing and will not allow Edgeworkers to execute. I have added workaround which allows the edgeworkers to execute on EPD deny action

### Check if EPD is executed


### Override the baseline EPD Deny action to allow EW to execute


## Test Results

### EPD Deny response

curl -ik "https://sbharadwew.edgekey-staging.net/?hdnea=exp=1629173184~acl=/*~hmac=195bf61c1ab33aa32a706723b68fec8dfa66b693cca70bbd083daadc1a4933b1" -H "X-forwarded-for:52.66.193.64" --connect-to ::e1.a.akamaiedge-staging.net

HTTP/1.1 403 Forbidden
x-error-type: EPD-DENY
Content-Type: application/json
Date: Tue, 17 Aug 2021 03:43:29 GMT
Connection: close
X-Akamai-Staging: ESSL
EdgeworkerResponse: Response from Edgeworkers

{"resultCode":"error","errorDescription":"AKA_EPD","message":"EPDblocked API","resultObj":{},"systemTime":"1592558179887"}

### TA Deny response

curl -ik "https://sbharadwew.edgekey-staging.net" -H "X-forwarded-for:202.144.79.2" --connect-to ::e1.a.akamaiedge-staging.net

HTTP/1.1 403 Forbidden
x-error-type : TA-DENY
Content-Type: application/json
Date: Tue, 17 Aug 2021 03:44:33 GMT
Connection: close
X-Akamai-Staging: ESSL
EdgeworkerResponse: Response from Edgeworkers

{"resultCode":"error","errorDescription":"AKA_TA","message":"Tokendeny API","resultObj":{},"systemTime":"1592558179887"}

### GEO Deny response

curl -ik "https://sbharadwew.edgekey-staging.net" -H "X-forwarded-for:45.132.227.216" --connect-to ::e1.a.akamaiedge-staging.net

HTTP/1.1 403 Forbidden
x-error-type : GEO-DENY
Content-Type: application/json
Date: Tue, 17 Aug 2021 03:46:30 GMT
Connection: close
X-Akamai-Staging: ESSL
EdgeworkerResponse: Response from Edgeworkers

{"resultCode":"error","errorDescription":"AKA_GEO","message":"Geoblocked API","resultObj":{},"systemTime":"1592558179887"}

## Additional Info

Contact: Suhas Bharadwaj (​​sbharadw@akamai.com)
Property: sbharadw-ewtesting
URL: https://sbharadwew.edgekey-staging.net/
Account: Ion Premier Beta Jam 1
EdgeWorker ID: 6284
