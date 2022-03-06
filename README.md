# Theme Snippets

This is an extension for Vortex.
It provides additional customization options for themes without requiring css skills.

## Installation

Please find this collection in Vortex under Extensions->Find More

## Contributing

You are welcome to contribute additional snippets. Please fork this repo, make changes to snippets.scss and then make a pull request.

Each snippet **has** to have this structure:
```
// id: ...
// name: ...
// description: ...

Your css here

// endsnippet
```

The css can have as many rules as you want but please keep it as simple and generic as possible to avoid conflicts with other rules.

Also, please don't submit snippets for things that could already be achieved through the theme configuration dialog (e.g. color changes, font sizes). Keep in mind that each snippet will add a toggle to the UI, each one needs to be reasonably useful to a significant number of users or it will just become confusing.
