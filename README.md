# yaml-to-analytics

A simple utility that helps us define types for the analytics
information that goes to segment.io.  We hope you find it useful as well!

# How to use


## Install the package
```
yarn add -D yaml-to-analytics
```

## Create your event definitions

Create a folder `foo/` with the following files...

## Generate the event files

For example...

```
npx yaml-to-analytics foo/ bar/index.ts
```

...or in your `package.json`...

```
{
    "scripts": {
        "build": yaml-to-analytics foo/ bar/index.ts
    }
}
```

