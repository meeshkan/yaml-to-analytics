# yaml-to-analytics

A simple utility that helps us define types for the analytics
information that goes to [segment.io](https://segment.io).  We hope you find it useful as well!

## Why use this?

If you've ever done something like...

```
sendAnalyticsEvent("user signs in", {
    name: "John",
    time: new Date().toString()
});
// ...
sendAnalyticsEvent("usr sings in", {
    name: "John",
    timestamp: new Date().toString()
});
```

...you know exactly why you need this.

## How to use

```
yarn add -D yaml-to-analytics
```

Then, check out the `example/` directory for a minimum viable kitchen sink example.  Basically, create a bunch of YAML files in [JSON Schema](https://json-schema.org/) format and each one will be turned into a function that returns a [segment.io](https://segment.io) analytics event for their [Node SDK](https://github.com/segmentio/analytics-node).

