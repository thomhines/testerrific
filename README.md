# Testerrific
The best, fastest, easiest way test your site

### [Demo & Docs Site](projects.thomhines.com/testerrific/)

By far the easiest syntax of any testing suite.






## Features

- **Simple syntax**:
Write tests as simply as `tt.test("a < 4")`

- **Powerful**:
Tons of settings give you control over how each test runs, giving you the power to test any situation.

- **Reactive**: 
Change the test data and the UI will keep up automatically.

- **Intuitive UI**:
Disable tests, pause execution, run individual tests/functions on demand, all without having to go back to your code to change settings.

- **Async friendly**: 
Support for promises and auto-retry means your tests won't get ahead of your code.

- **Functions and events**:
Control and respond to your tests with a large assortment of helper functions and event triggers.



## Getting Started

### Installation

To get Testerrific working, just link to jQuery (any version, incl. "slim", will work) and the Testerrific JS and CSS files:

```html
<script src="jquery.js"></script>
<script src="testerrific.js"></script>
<link rel="Stylesheet" href="testerrific.css" type="text/css" />
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

Use this section to mention useful resources and libraries that you have used in your projects.

 - [Shields.io](https://shields.io/)
 - [Awesome README](https://github.com/matiassingers/awesome-readme)
 - [Emoji Cheat Sheet](https://github.com/ikatyang/emoji-cheat-sheet/blob/master/README.md#travel--places)
 - [Readme Template](https://github.com/othneildrew/Best-README-Template)



Copyright (c) 2021-present, Thom Hines