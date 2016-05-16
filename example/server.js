var express = require('express');
var path = require('path');
var conf = require('./conf');
var Conv = require('../index');

var AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
var AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY){
  throw new Error('required environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY');
}

var app = express();
app.get('/conv', function (req, res) {

  var awsService = 's3';
  
  var conv = new Conv(AWS_ACCESS_KEY_ID,
                      AWS_SECRET_ACCESS_KEY,
                      awsService,
                      conf.awsRegion);

  var base64Policy = conv.getBase64Policy(conf.bucketName,
                                          conf.acl,
                                          conf.expiresInterval,
                                          conf.contentTypeStart,
                                          0,
                                          conf.contentLengthMaxMB * 1024 * 1024);

  var signature = conv.getSignature(base64Policy);

  var formParams = conv.getFormParams(conf.acl,
                                      conf.fileDestination,
                                      signature,
                                      base64Policy);

  var form = {
    action: 'https://'+ conf.bucketName +'.'+ awsService + '-'+ conf.awsRegion +'.amazonaws.com/',
    method: 'POST',
    enctype: 'multipart/form-data',
    contentLengthMaxMB: conf.contentLengthMaxMB,
    contentTypeStart: conf.contentTypeStart,
    params: formParams
  };

  res.json(form);
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(conf.port, function () {
  console.log('Example app listening on port ' + conf.port);
});
