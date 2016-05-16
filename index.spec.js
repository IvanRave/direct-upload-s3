describe('Conv', function(){

  var Conv = require('./index');
  var conv;
  
  beforeEach(function() {
    var AWS_ACCESS_KEY_ID = 'accesskeyid';
    var AWS_SECRET_ACCESS_KEY = 'nosecret';
    conv = new Conv(AWS_ACCESS_KEY_ID,
                    AWS_SECRET_ACCESS_KEY,
                    's3',
                    'eu-west-1');
  });
  
  it('should conv', function(){
    var acl = 'public-read';
    var fileDestination = 'user/user/filename.png';
    var contentTypeStart = 'image/';
    var bucketName = 'my-bucket';

    var base64Policy = conv.getBase64Policy(bucketName,
                                            acl,
                                            120,
                                            contentTypeStart,
                                            0,
                                            5 * 1024 * 1024);

    var signature = conv.getSignature(base64Policy);

    var formParams = conv.getFormParams(acl,
                                      fileDestination,
                                      signature,
                                      base64Policy);


    expect(formParams['key']).toEqual(fileDestination);
    expect(formParams['x-amz-signature'].length).toEqual(64);
  });
});
