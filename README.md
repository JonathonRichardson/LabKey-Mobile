# LabKey-Mobile
Module for LabKey for a mobile-friendly interface.

#Installation
Note that the following instructions assume that you have downloaded the [LabKey source](https://www.labkey.org/wiki/home/Documentation/page.view?name=sourceCode) from their repository, and that there's an environment variable named `LABKEY_ROOT` that points to the directory that holds the `server` and `build` directories.

First, add an environment variable to tell `ant` where to put the compiled module:
````bash
export MODULES_DIR=${LABKEY_ROOT}/build/deploy/modules/
````

Then, change your working directory to `LabKey-Mobile/module_src/` and run `ant` to build and deploy:
````bash
${LABKEY_ROOT}/external/ant/bin/ant build
${LABKEY_ROOT}/external/ant/bin/ant deploy
````
