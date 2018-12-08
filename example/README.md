# minimum viable kitchen sink

```
yarn
yarn build
```

Then you can uncomment `index.ts` to see how analytics events are created.
The result of the various functions that are created can be passed right to
the segment.io node SDK.

## Other musings

Everything in `spec/` is the spec for the analytics events. They are just JSON schemas written in YAML. Every file is a different event. To consolidate events with similar fields, you can create inheritence via the `$ref` mechanism (see `CreateUser.yml` and `CreatePost.yml` for examples).