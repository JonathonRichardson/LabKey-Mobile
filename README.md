# LabKey-Mobile
Module for LabKey for a mobile-friendly interface.

# First Things First
`labkey-mobile` is an npm package, so you need to have nodejs installed.

You should also have `gulp` installed globally for your machine.  On Macs, you can do this with the following command `sudo npm install -g gulp`.  On most other systems, you shouldn't need `sudo`.

If you would like `labkey-mobile` to automatically deploy your module when it builsds, make sure that you have downloaded the [LabKey source](https://www.labkey.org/wiki/home/Documentation/page.view?name=sourceCode) from their repository, and that there's an environment variable named `LABKEY_ROOT` that points to the directory that holds the `server` and `build` directories.

# Getting Started
Make a directory for your project.  I reccomend that you create a blank `git` repository and clone that to start.  From the root of that directory, execute the following command:
```Bash
$ npm init
```
Answer the prompts, making sure to specically answer the "version", "author", and "license" prompts.  This will create a package.json file for you.  I reccomend not editing this file manually, as LabKey-Mobile and other nodejs code may require certain fields to have specific formats.

Now, install the LabKey-Mobile module and gulp:
```Bash
$ npm install --save labkey-mobile gulp
```

Finally, create a `gulpfile.js` in the root directory and add the `labkey-mobile` build step to it:
```javascript
var gulp = require('gulp'); // What is a gulpfile.js without gulp?

//This is the part that actually adds the mobile build tasks to your gulp.
require('labkey-mobile').addTasks(gulp);

//Configure gulp so that running without arguments builds the module.
gulp.task('default', ['build_mobile']);
```

# Add a module.properties.json file
You need to create a `module.properties.json` configuration file at the root.  This should contain json with the following fields:

|Field                |Required|Description                                            |
|---------------------|--------|-------------------------------------------------------|
|Description          |Yes     |Several sentence description of the module's purpose.  |
|URL                  |Yes     |URL for the SVN (or git) source for the module.        |
|InfoURL              |No      |URL with more info for the module.                     |
|Maintainer           |No      |Maintainer for the module (if not the author).         |
|Organization         |No      |Name of the maintainer's organization.                 |
|OrganizationURL      |No      |URL for a website for the maintainer's organization.   |
|RequiredServerVersion|Yes     |Minimum required version of LabKey for the module.     |
|ModuleDependencies   |No      |Any modules that are required for this module to work. |

# Write Your Content
All of your content should go into a directory in the root of the package called `content`.  In the root of the content directory, there should be a file called "LandingPage.html".  This is the first page that is displayed.

Each page consists of an HTML template in [pageName].html and a KnockoutJS style view model in [pageName].js.  The mobile interface includes breadcrumbs that demonstrate the path to the page, converting camel case "pageName"'s to title cased "Page Name"s.  Pages can navigate to each other by placing the custom binding "NavigateTo" on a button or link and supplying a quoted string representing the page's name (including any subdirectories underneath content).

I eventually plan to document how to generate the content more heavily, but I'm still in the early stages of this library.  If you have any questions, please contact me about this.

# Build the Module
From the root of the package, execute the following command:
```bash
$ gulp
```

This will create a new directory called `deploy`.  It contains a directory that constitutes your module.  You can copy that directory to `optionalModules` and call `ant build_optional_module`.  If the `LABKEY_ROOT` module is installed, labkey-mobile will perform this copy and build automagically for you.

# View Your Content
Navigate to /mobile/mobilehome.html on your labkey server.  You should see your starting page.
