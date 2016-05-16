Upload directly to s3
===

Amazon S3 supports HTTP POST requests so that users can upload content directly to Amazon S3. By using POST, end users can authenticate requests without having to pass data through a secure intermediary node that protects your credentials. Thus, HTTP POST has the potential to reduce latency.
http://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-UsingHTTPPOST.html


Usage
---

Before usage:

- create an AWS S3 bucket: https://console.aws.amazon.com/s3/home
- create an IAM user: https://console.aws.amazon.com/iam/home
- receive credentials for this user
- add permissions to this user to manage this bucket
- setup CORS rules for this bucket
  - <AllowedOrigin>http://localhost:3000</AllowedOrigin>
  - <AllowedMethod>POST</AllowedMethod>
  - <AllowedHeader>*</AllowedHeader>

Usage


```
var conv = require('direct-upload-s3');

var app = express();
app.get('/conv', function (req, res) {
  var base64Policy = conv.getBase64Policy(...);
  var signature = conv.getSignature(base64Policy);
  var formParams = conv.getFormParams(..., signature, base64Policy);
  res.json(formParams);
});

// see details in example files
```


To run example

```
git clone https://github.com/ivanrave/direct-upload-s3.git

npm install

// change bucketName and other parameters in ./example/conf.json

// run a server
AWS_ACCESS_KEY_ID=somekeyid AWS_SECRET_ACCESS_KEY=somesecret node server.js

// open a browser
http://localhost:3000
```


Test
---

1. npm install -g jasmine
2. jasmine


The process for sending browser-based POST requests
---

1. Create a security policy specifying conditions restricting what you want to allow in the request, such as bucket name where objects can be uploaded, key name prefixes that you want to allow for the object being created.
2. Create signature that is based on the policy. For authenticated requests, the form must include a valid signature and the policy.
3. Create an HTML form that your users can access in order to upload objects to your Amazon S3 bucket.