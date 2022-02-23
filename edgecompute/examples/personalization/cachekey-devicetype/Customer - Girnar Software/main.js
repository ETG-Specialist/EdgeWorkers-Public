import { logger } from 'log'; 
import { EdgeKV } from './edgekv.js';
import detect from './detect.js';

var version = '1.3.10';

export async function onClientRequest(request) {
  logger.log('on client request - '+version);
  
  let deviceType = isMobile(request)? 'MOBILE':'DESKTOP';
  
  request.setHeader('x-device-type', deviceType);

  let cacheVersionString = await getCacheVersion();

  request.setVariable('PMUSER_DEVICETYPE_CACHE_VERSION', deviceType+'@'+cacheVersionString);
  
  request.cacheKey.includeVariable('PMUSER_DEVICETYPE_CACHE_VERSION');
}

export function onClientResponse(request, response) {
    logger.log('on client response - '+version);
    response.setHeader('x-ew-response','Akamai EdgeWorkers - '+version+' - '+request.getVariable('PMUSER_DEVICETYPE_CACHE_VERSION'));
}

function isMobile(request) {
  return detect.isMobile(request.getHeader('User-Agent')[0]) || detect.isTablet(request.getHeader('User-Agent')[0]);
}

async function getCacheVersion() {
    let defaultCacheVersion = "v1";
    
    try {
      // Set Up EdgeKV
      const edgeKv = new EdgeKV({namespace: "edgekv-b2c-v1", group: "cachekey"});
   
      //Get item from EdgeKV
      return await edgeKv.getText({ item: "version", 
                                          default_value: defaultCacheVersion });
    } catch (error) {
        // Catch the error and store the error message to use in a response
        // header for debugging. Use a default greeting as well in this case.
        //err_msg = error.message;
        logger.log('get cache version error - '+error.status);
        return defaultCacheVersion;
    }
}