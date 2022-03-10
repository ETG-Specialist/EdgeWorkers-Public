To protect the high-value live streaming content from hot links, my organization defines its own Edge Token Authentication Signature to verify the request is coming from a valid web player or app.

To achieve more flexibility and extensibility, the Edge Token Authentication Signature was build dynamically. The plain text string which is used for signature calculations is made up of a variable number of key/value parameters in a variable order, and the selection of the key in the parameters may change from time to time too.

Considering the Akamai PM configuration file was actually a XML file, which lacks data structures such as array, List, Object, and cannot implement a foreach loop either. So it is too difficult to implement the Authentication Signature with the Akamai PM only. 

I’m very happy to learn that Akamai provides a new serverless computing solution, EdgeWorkers which can support javascripts programming. Thus I will use EdgeWorkers to build my Edge Token Authentication Signature.


### Edge Token Authentication Signature procedure
This is the Edge Token Authentication Signature procedure:

1. Get the value of query string key sigparames, if sigparames is not present, then response 403 Access Denied.
2. The value of sigparames is a comma-separated list of keys.
3. Get each of the value of the keys in step 2 from the full query string, and present them with  the form of ‘key=value', then concat them with &, and then add the key/value of ‘sigparams=value’ in the end. Then we name this string as key_value_pairs. Attention, the key/value pairs’ order matters, must be identical with the origin key order in step2.
4. expires is a mandatory key in the query string, it must present and the value must larger than then current Unix Epoch time. if not, we response 403 access denied.
5. len is a optional key in the query string, if it was presented, the value must no less than 0.  if it was not presnted, the default value of len is 0
6. Build the plain text for the calculation,  plainText= PATH + Secret + key_value_pairs. PATH is the request path, Secret is a shared secret between the CDN and the web player/app, key_value_pairs is defined in step 3.
7. Md5 hash to get the signature, signature=md5(path+secret+key_value_pairs)
Compare the request query string sign’s value and the calculated signature in step 7, if it is equal, then we proceed , if not, we response 403 access denied.

With the javascript programming language and the Akamai Edgeworkers build in object  request object , we can implement the Edge Token Authentication Signature successfully to protect our live streaming content.

### Example

Here is an example.

1. URL to be protected:

  **https://ewcc16.ewcc.in/anything/abcde/protectedinfo**

2. Any request to this URL without the valid token(in query string) will be response with 403 from the Akamai EdgeWorkers

3. a valid Request with valide token in the query string 

   **https://ewcc16.ewcc.in/anything/abcde/protectedinfo?sigparams=a,len,expires,ka,k,ft&a=b&c=123&k=23d&kb=22&ft=879&expires=1827215367&len=0&sign=4537d05151d1a114b07c565ea152571d**

4. This is how the token sign=4537d05151d1a114b07c565ea152571d was build:

	* step 1. get the value of sigparams, the key  is [a,len,expires,ka,k,ft]
	* step 2. verify all the mandatory key and its' value: here len is 0, expires is 1827215367 which is greater than current EPOCH time. (attention, in the javascript code, we id not enforce the expires check for in the first stage)
	* step 3. find each of the value of the key from the query string, and concate them with &, then we get the plainText of the key_value_pairs: a=b&len=0&expires=1827215367&k=23d&ft=879&sigparams=a,len,expires,ka,k,ft
	* step 4. build the expected token value with md5(/anything/abcde/protectedinfo124sk2k3a=b&len=0&expires=1827215367&k=23d&ft=879&sigparams=a,len,expires,ka,k,ft), the value is 4537d05151d1a114b07c565ea152571d
	* step 5. compare the calculated token value with query string sign value, if it is not match, the edge consturce a 403 access deny to the client.

from this example , we can see, we can put any meaningful query string to the query string sigparams, to build the edge auth token more flexiablelly in the client side and the server side will always have the capability to validate it.
