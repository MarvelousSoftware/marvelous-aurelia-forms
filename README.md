# Getting started
The `marvelous-aurelia-forms` is an open source component based on [aurelia framework](http://aurelia.io/).

It creates forms using provided schemas and allows to get rid of extremely repetitive code like HTML form templates
and validation. Out of the box it provides simple controls, but more is about to come. It allows to create custom controls
and validators. It is also great to dynamically create a form while application is already running (for instance based on user's input).
    
Project documentation: [http://marvelous.software/docs.html#/forms](http://marvelous.software/docs.html#/forms)

Please bear in mind that this library is still in the beta and some features (like translations support) might be missing.

## Installation
Install the forms library using jspm:
```
jspm install marvelous-aurelia-forms
```
Then load the css file and let know aurelia about the forms plugin:
```javascript
import 'marvelous-aurelia-forms/styles/default.css!';
// ...

export function configure(aurelia) {  
  let config = aurelia.use;
  
  config
    // ...
    .plugin('marvelous-aurelia-forms');
  
  aurelia.start().then(a => {
    a.setRoot();
  });
}
```

## Browser support
Currently only modern browsers are supported, but IE >= 9 support is on the TODO list.

## License
MIT

## Dependencies
* aurelia-binding
* aurelia-dependency-injection
* aurelia-metadata
* aurelia-templating
* marvelous-aurelia-core
* bootstrap (only for default templates)

## Building The Code
This repository depends on other marvelous software repositories. In order to provide seamless development flow these libraries are watched automatically. The only prerequisite is following directories structure:

-- MarvelousSoftware

--- marvelous-aurelia-forms

--- marvelous-aurelia-core

Once the structure is correct `gulp watch` command will listen to dependend libraries changes.
