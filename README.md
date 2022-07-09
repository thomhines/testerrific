# Testerrific

**The absolute best, fastest, easiest way test your site**

### [Demo & Docs Site](projects.thomhines.com/testerrific/)






## Features

- **Simple syntax**:
Write tests as simply as `tt.test("a < 4")`

- **Flexible**:
Completely agnostic, it can test anything that resolves truthy or falsey.

- **Powerful**:
Tons of settings give you control over how each test runs, giving you the power to test any situation.

- **Reactive**: 
Change the test data and the UI will keep up automatically, which helps a lot with on-the-fly tweaks and the trial-and-error phase of writing tests.

- **Intuitive UI**:
Disable tests, pause execution, run individual tests/functions on demand, all without having to go back to your code to change settings.

- **Async friendly**: 
Support for promises and auto-retry means your tests won't get ahead of your code.

- **Functions and events**:
Control and respond to your tests with a large assortment of helper functions and event triggers.



## Getting Started

### Installation

To get Testerrific working, just link to the Testerrific JS and CSS files:

```html
<script src="testerrific.min.js"></script>
<link rel="Stylesheet" href="testerrific.min.css" type="text/css" />
```

then write some tests...


### Basic Usage

Tests are saved as an array. Testerrific uses a "reactive" UI (meaning that changes made to the data saved in the tt objects are shown instantly in the interface), so adding or changing a test in the array will also update the list of tests in the UI.


```javascript
// Create a group to organize your tests.
// Tests will be added to this group until another test group is created
tt.group('First Test Group');

// Tests are just strings or functions that evaluate as truthy/falsey,
// but there are a *bunch* of options to control how they work
tt.test('1 + 1 == 2');
tt.test("Is today Thursday?", () => { return (new Date()).getDay() == 4; });
```

#### Check out the [Demo & Docs Site](projects.thomhines.com/testerrific/) to find out more about how to get the most out of Testerrific.



## License

[MIT](https://opensource.org/licenses/MIT)





## Acknowledgements

Special thanks to a few folks whose code and libraries inspired some of the ideas built into Testerrific:

- Testerrific's reactive UI code was built with a lot of help from [this article](https://gomakethings.com/how-to-batch-ui-rendering-in-a-reactive-state-based-ui-component-with-vanilla-js/) by Chris Ferdinandi at his site [Go Make Things](https://gomakethings.com/)
- Evan You's [Vue.js](https://vuejs.org/) was also a huge influence on making reactive DOM changes as smooth and efficient as possible




--------------------------------

Copyright (c) 2021-present, Thom Hines