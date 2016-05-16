(function(Dropzone, fetch){
  'use strict';

  Dropzone.autoDiscover = false;

  var buildForm = function(data){

    var frm = document.createElement('form');
    frm.className = 'dropzone';
    frm.action = data.action;
    frm.method = data.method;
    frm.enctype = data.enctype;

    for (var paramKey in data.params) {   
      var inp = document.createElement('input');
      inp.type = 'hidden';
      inp.name = paramKey;
      inp.value = data.params[paramKey];
      frm.appendChild(inp);
    }

    document.body.appendChild(frm);

    var handleInit  = function(){
      this.on('addedfile', function(file){
        console.log(file);
      });

      this.on("sending", function(file, xhr, formData) {
        // Will send the filesize along with the file as POST data.
        formData.append("Content-Type", file.type);
      });
    };

    var opts = {
      // default: 1000
      filesizeBase: 1024,
      maxFiles: 3,
      acceptedFiles: (data.contentTypeStart || '') + '*',
      maxFilesize: data.contentLengthMaxMB || 5,
      clickable: true,
      autoProcessQueue: true,
      init: handleInit
    };
    
    var myDropzone = new Dropzone(frm, opts);

    console.log('myDropzone', myDropzone);
    
    var conds = document.createElement('ul');
    conds.innerHTML = '<li>maxFiles: ' + opts.maxFiles +
      '<li>acceptedFiles: ' + opts.acceptedFiles +
      '<li>maxFilesize, MB: ' + opts.maxFilesize +
      '<li>' +
      '<li>formAction: ' + frm.action +
      '<li>formMethod: ' + frm.method +
      '<li>formEnctype: ' + frm.enctype;
    document.body.appendChild(conds);    
  };

  fetch('/conv')
    .then(function(response) {
      return response.json();
    }).then(buildForm);
  
})(window.Dropzone, window.fetch);
