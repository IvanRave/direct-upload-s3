'use strict';

var moment = require('moment');
var crypto = require('crypto');

/**
 * Creates hash-based message authentication codes
 * @param {string|Object} key HMAC key used to generate the cryptographic HMAC hash, usually a secret string of buffer
 * @param {string|Object} data If data - is a Buffer then input_encoding is ignored
 * @param {string} encoding Encoding: 'hex', 'binary' or 'base64'. If encoding is provided a string will be returned; otherwise a Buffer is returned.
 * @returns {string|Object} string (if encoding exists) or buffer
 */
function hmac(key, data, encoding) {
  if (!data){
    throw new Error('hmac: no data');
  }
  
  var tmpHmac = crypto.createHmac('sha256', key);
  
  tmpHmac.update(data, 'utf8');

  return tmpHmac.digest(encoding);
}

function hash(str, encoding) {
  return crypto.createHash('sha256').update(str, 'utf8').digest(encoding);
}

/**
 * Conv
 */
class Conv{

  /**
   * Creates a Conv instance
   * @param {string} AWS_ACCESS_KEY_ID Access key
   * @param {string} AWS_SECRET_ACCESS_KEY Secret
   * @param {string} awsService Like 's3'
   * @param {string} awsRegion Like 'eu-west-1'
   */
  constructor(AWS_ACCESS_KEY_ID,
              AWS_SECRET_ACCESS_KEY,
              awsService,
              awsRegion){
    
    this.AWS_ACCESS_KEY_ID = AWS_ACCESS_KEY_ID;
    this.AWS_SECRET_ACCESS_KEY = AWS_SECRET_ACCESS_KEY;

    this.awsService = awsService;
    this.awsRegion = awsRegion;

    /**
     * Signature date, YYYYMMDD
     * @type {string}
     */
    this.signDate = moment.utc(new Date()).format('YYYYMMDD');

    /**
     * The date in ISO 8601 format, for example, 20130721T201207Z. This value must match the date value used to calculate the signature.
     * @type {string}
     */
    this.amzDate = this.signDate + 'T000000Z';

    /**
     * In addition to your access key ID, this parameter also provides scope (AWS region and service) for which the signature is valid. This value must match the scope you use in signature calculations, discussed in the following section. The general form for this parameter value is as follows:
     * @example
     * <your-access-key-id>/<date>/<AWS-region>/<AWS-service>/aws4_request
     */
    this.amzCredential = [
      this.AWS_ACCESS_KEY_ID,
      this.signDate,
      this.awsRegion,
      this.awsService,
      'aws4_request'
    ].join('/');

    /**
     * Identifies the version of AWS Signature and the algorithm that you used to calculate the signature. This string identifies AWS Signature Version 4 (AWS4) and the HMAC-SHA256 algorithm (HMAC-SHA256).
     * @type {string}
     */
    this.amzAglorithm = 'AWS4-HMAC-SHA256';

    /**
     * Amazon S3 encrypts each object with a unique key. As an additional safeguard, it encrypts the key itself with a master key that it regularly rotates. Amazon S3 server-side encryption uses one of the strongest block ciphers available, 256-bit Advanced Encryption Standard (AES-256), to encrypt your data
     * {@link http://docs.aws.amazon.com/AmazonS3/latest/dev/UsingServerSideEncryption.html}
     * @type {string}
     */
    this.amzServerSideEncryption = "AES256";
  }

  /**   
   * {@link http://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-post-example.html}
   * @param {string} bucketName
   * @param {string} acl
   * @param {number} expiresInterval Expiration of a link, in seconds
   * @param {string} contentTypeStart Allowed types of content, like image/ or video/
   * @param {number} contentLengthMin Min length of content, in bytes
   * @param {number} contentLengthMax Max length of content, in bytes
   * @returns {Object} Params for an html form to send a file directly to a S3 cloud
   */
  getBase64Policy(bucketName,
                  acl,
                  expiresInterval,
                  contentTypeStart,
                  contentLengthMin,
                  contentLengthMax) {
    var expires = new Date(new Date().getTime() + expiresInterval * 1000);
    
    var policy = {
      // ISO8601 GMT
      //"2014-10-17T09:00:00.000Z"
      "expiration": moment.utc(expires).toISOString(),
      "conditions": [{
        // The content can be uploaded only to the
        "bucket": bucketName
      }, {
        "acl": acl
      }, [
        "content-length-range",
        contentLengthMin,
        contentLengthMax
      ], [
        "starts-with",
        "$Content-Type",
        contentTypeStart
      ], [
        // You can provide any key name that starts with myfolder/user1.
        // For example, myfolder/user1/MyPhoto.jpg.
        "starts-with",
        "$key",
        ""
      ], {
        "x-amz-algorithm": this.amzAglorithm
      }, {
        "x-amz-date": this.amzDate
      }, {
        "x-amz-credential": this.amzCredential
      }, {
        "x-amz-server-side-encryption": this.amzServerSideEncryption
      }]
    };

    return new Buffer(JSON.stringify(policy), "utf-8").toString("base64");

    //     "x-amz-meta-uuid": uuid
    //     "starts-with", "$x-amz-meta-tag", ""
  }

  /**
   * Create a signing key and sign the policy (version 4)
   * Before you calculate a signature, you derive a signing key from your AWS secret access key. Because the derived signing key is specific to date, service, and region, it offers a greater degree of protection.
   * {@link http://docs.aws.amazon.com/general/latest/gr/sigv4-calculate-signature.html}
   * @returns {string} Signature base64, the hex-encoded result from the keyed hash function is the signature.
   */
  getSignature(base64Policy) {
    var kDate = hmac('AWS4' + this.AWS_SECRET_ACCESS_KEY, this.signDate);
    var kRegion = hmac(kDate, this.awsRegion);
    var kService = hmac(kRegion, this.awsService);
    var kCredentials = hmac(kService, 'aws4_request');

    //    console.log('Base64', base64Policy);
    return hmac(kCredentials, base64Policy, 'hex');

    // v2
    // return crypto.createHmac("sha256", this.AWS_SECRET_ACCESS_KEY)
    //       .update(new Buffer(base64Policy, "utf-8")).digest("base64");
  }


  /**
   * Get fields for an upload form
   * @param {string} acl An Amazon S3 access control list. If an invalid access control list is specified, Amazon S3 denies the request.
   * @param (string) fileDestination Path and name, like "user/user1/${filename}"
   * @param {string} signature
   * @param {string} base64Policy
   */
  getFormParams(acl,
                fileDestination,
                signature,
                base64Policy) {    
    return {
      'key': fileDestination,
      'acl': acl,
      // set Content-Type for each file separatelly
      //'content-type': contentType,
      // set uuid for each file separatelly, if needed
      //'x-amz-meta-uuid': uuid,
      'x-amz-algorithm': this.amzAglorithm,
      'x-amz-server-side-encryption': this.amzServerSideEncryption,
      'x-amz-credential': this.amzCredential,
      'x-amz-date': this.amzDate,
      //      'x-amz-meta-tag' : '',
      'x-amz-signature': signature,
      'policy': base64Policy
    };
  }
}

module.exports = Conv;
