/*!
*	Testerrific
*	The absolute best, fastest, easiest way test your site
*	Copyright (c) 2021-Present Thom Hines
*	Licensed under MIT.
*	@author Thom Hines
*	https://github.com/thomhines/testerrific
*	@version 0.2.5
*/

tt = {

	// Global Default settings
	collapse_skipped_groups: true, // When page loads, collapse all groups that are set to 'skip' in the tests panel
	visible: true, // Boolean that indicates if the tests panel should be open or closed when page loads
	current_group: -1, // Used to keep track of which group is currently tracking
	running_group: -1, // Used to keep track of which group is currently running (I can't remember why these are different, but they are)
	current_test: 0, // Used to keep track of which test is currently running
	running: 0, // Boolean to indicate if any tests are running
	paused: 0, // Boolean used to indicate if tests have been paused
	run_start: 0, // Timestamp of when tests first started running
	run_time: 0, // Total amount of time tests have been running
	is_manual_test: 0, // A flag that can indicate if a test requires manual intervention. It can be used to select all tests that might slow down a test run. No longer necessary???
	skip_manual_tests: 0, // If enabled, all tests marked as manual tests are skipped
	message: '', 
	max_time: 1000, // How much time to wait for a test to be true before declaring it false
	wait_for_element_timeout: 2000, // Used with "wait_for_element" test option. The amount of time (ms) to wait for an element to become visible before executing test
	wait_for_element_interval: 100, // Amount of time (ms) to wait before checking for the element again
	display_test_index: 0, // Whether or not to display test number in list of tests

	// Group default settings
	group_defaults: {
		group: true,
		test_count: 0,
		collapse: false,
		tests: [],
		skip: 0,
		only: 0,
		run_if: '',
		beforeEach: function() {},
		afterEach: function() {},
	},
	
	// Test default settings
	test_defaults: {
		running: 0, // Boolean that indicates if this is the test currently running
		time: null, // Stores how long a test took before it came back with a result
		result: null, // Stores the result of the test (pass/fail/skipped)
		skip: 0, // Determines if test is set to 'skip' on page load
		only: 0, // Determines if test is set to be the only test to run. Multiple tests can be set to 'only'
		max_time: null, // How much time to wait for a test to be true before declaring it false, will use tt.max_time if null
		run_if: '', // a boolean check that gets checked to determine if a test should be run. Helpful if you want to run specific tests only in certain scenarios.
		message: '', // A message that can be presented to the user when the test is run.
		fn: null,
		before: function() {}, // A function that will be run before the test is executed. If a promise is returned, the test will wait until the promise is resolved
		after: function() {}, // A function that will be run after the test is executed. If a promise is returned, the test will wait until the promise is resolved
	},
	
	groups: [], // Used to store all test groups and tests
	
	


	// Create new test group. All following tests will be added to this group
	// options:		object that can contain the following values:
	// 		label:		string, label of test
	//		skip: 		boolean, whether to skip this test or not
	//		only: 		boolean, whether to run only this test or not
	// 		collapse:	boolean, whether tests are shown or not
	// 		beforeEach:	function that gets run before each test in group
	// 		afterEach:	function that gets run after each test in group
	group: function(group_name = "Test Group", options = {}) {
		let group_obj = Object.assign(ttb.clone(tt.group_defaults), options)
		group_obj.label = group_name
		tt.groups.push(group_obj)
		return
	},


	// Duplicate existing group
	// Returns integer of new_group's tt.groups array index (to make it easier to modify right away)
	duplicate_group: function(group_name, new_group_name, options = {}) {
		let orig_group = ttb.find(tt.groups, { label: group_name })
		let new_group = ttb.clone(orig_group)
		// new_group = _.defaults(options, new_group)
		new_group = Object.assign(new_group, options)
		new_group.label = new_group_name
		tt.groups.push(new_group)

		return tt.groups.length - 1
	},



	// Test if logic is true on data
	// label:		string that describes test
	// check: 		string that evals to true/false. Eg. "x == 3"
	// 			OR 	a function that returns true/false. Eg. function() { return x == 3 }. Currently only works with non-async functions
	// options:		(object) that can contain the following optional values:
	//		skip: 		(boolean) whether to skip this test or not
	//		only: 		(boolean) whether to run only this test or not
	// 		wait_for_element:	(string) CSS or jQuery selector string of matching element(s). Test will not run until element is 100% visible
	// 		max_time:	(integer) Amount of time to wait (in ms) for a truthy response. If blank, test will only test what value currently is when test is initiated
	//		run_if:		(string that evals to truthy/false) Conditional that determines if test should be run
	//		message: 	(string) Message shown in UI for the duration of the test, usually instructions for tests that need manual intervention
	//		group:		(string or integer) The title or the group index of the group the test should be added to
	//		position:	(integer) Position within a group the test should be inserted (starting from 0)
	// 		before:		(function/promise) gets run before test
	// 		after:		(function/promise) that gets run after test
	//		is_manual_test:	(boolean) Flag to indicate if test will wait on user input. Can be used to skip all user-driven tests.
	test: function(label, check, options = {}) {

		// If no label is given, assume that arguments are (check, options, null)
		if(typeof check == 'object' || !check) {
			options = check
			check = label
			label = ''
		}

		// let test_obj = ttb.clone(tt.test_defaults)
		// test_obj.test = check
		let test_obj = Object.assign(ttb.clone(tt.test_defaults), options, {test: check})
		
		
		// test_obj = _.defaults({test: check}, options, tt.test_defaults)

		if(!test_obj.label && label) test_obj.label = label

		// Use test as label if no label given
		if(!test_obj.label && typeof check == 'string') test_obj.label = check
		
		// If no groups exist yet, add one
		if(tt.groups.length < 1) tt.group()

		let current_group = tt.groups[tt.groups.length - 1]

		// Allow test to be added to specific group
		if(typeof test_obj.group == 'number') {
			current_group = tt.groups[test_obj.group]
		}
		else if(test_obj.group) {
			current_group = ttb.find(tt.groups, { label: test_obj.group })
		}
		
		if(current_group.skip) test_obj.skip = 1
		
		if(test_obj.position) current_group.tests.splice(test_obj.position, 0, test_obj)
		else current_group.tests.push(test_obj)
	},





	// Run function at this point in test timeline
	// fn:		Can return either value or promise. If a promise is given, tests will wait for promise to resolve before continuing.
	// options:	Same as with test() function
	run: function(label, fn, options = {}) {

		// If no label is given, shift function argments over one
		if(typeof fn == 'object' || !fn) {
			options = fn
			fn = label
			label = ''
		}


		let test_obj = Object.assign(ttb.clone(tt.test_defaults), options, {fn: fn})

		if(!test_obj.label && label) test_obj.label = label

		let current_group = tt.groups[tt.groups.length - 1]

		// Allow test to be added to specific group
		if(typeof test_obj.group == 'number') {
			current_group = tt.groups[test_obj.group]
		}
		else if(test_obj.group) {
			current_group = ttb.find(tt.groups, { label: test_obj.group })
		}
		
		if(current_group.skip) test_obj.skip = 1

		if(test_obj.position) current_group.tests.splice(test_obj.position, 0, test_obj)
		else current_group.tests.push(test_obj)
	},




	// Add a delay to the test chain
	// delay: 		integer, number of milliseconds to wait
	wait: function(delay) {
		tt.run('Wait ' + ttb.ms_to_s(delay) + ' sec', function() {
			return new Promise(function(resolve, reject) {
				setTimeout(resolve, delay)
			})
		})
	},


	// Wait until user has clicked "Resume"
	pause: function() {
		tt.run("Pause", function(){	tt.alert("Tests paused."); }, { pause: 1 })
	},


	// No longer necessary???
	// Set smart defaults and add flag to tests that require user intervention
	manual_test: function(label = "", message = "", options = {}) {
		// If no label is given, assume that arguments are (check, options, null)
		if(typeof message == 'object' || !message) {
			options = message
			message = label
		}		
		let test_obj = Object.assign(ttb.clone(tt.test_defaults), options, {label: label, test: 'false', max_time: 999999, message: message, is_manual_test: 1})
		tt.test(label, test_obj)
	},



	// Disable all tests if there are any tests/groups that are marked as 'only'
	disable_skipped_tests: function() {
		let has_only = 0
		// Go through and find if there are any 'only' groups or tests
		tt.groups.forEach(function(group) {
			group.tests.forEach(function(test) {
				if(group.only || test.only) has_only = 1
			})
		})

		// If so, skip all tests that are not set to only or part of an only group. Also mark all tests in a skipped group to skip
		tt.groups.forEach(function(group) {
			let unskip_group = 0
			let group_has_only = 0
			group.tests.forEach(function(test) {

				// Skip all tests in a skipped group
				if(group.skip) {
					test.skip = 1
				}

				if(test.only) group_has_only = 1

				// Skip non-only tests
				if(has_only && !group.only && !test.only) {
					test.skip = 1
				}

				// Skip tests that require user interactino if skip_manual_tests flag is set
				if(tt.skip_manual_tests && (group.is_manual_test || test.is_manual_test)) {
					test.skip = 1
				}

				// If a test is set to only, un-skip its group
				else if(group_has_only) {
					unskip_group = 1
				}
			})

			if(has_only && !group.only) group.skip = 1
			if(tt.skip_manual_tests && group.is_manual_test) group.skip = 1
			if(unskip_group) group.skip = 0
		})
	},



	//
	start_tests: function(group_index = -1) {
		tt.running_group = group_index
		// Run specific group only
		if(tt.running_group >= 0) {
			tt.current_group = tt.running_group
			tt.groups[tt.current_group].tests.forEach(function(test) {
				test.time = null
				test.result = null
			})
		}
		else {
			tt.current_group = 0
			tt.groups.forEach(function(group) {
				group.tests.forEach(function(test) {
					group.result = null
					test.result = null
				})
			})
		}
		tt.current_test = 0
		tt.running = 1
		tt.run_start = new Date()
		tt.run_time = null
		tt.paused = 0


		// TODO: If test is first of group, reset all of the results of the tests in that group
		if(tt.current_test == 0) {

		}

		clearTimeout(tt.wait_for_element_interval_obj)

		tt.run_next_test()

	},



	// Will pause tests after current test is complete/timed-out
	pause_tests: function() {
		tt.paused = 1
	},


	// Will un-pause tests and continue execution
	resume_tests: function() {
		tt.paused = 0
		tt.alert("")
		if(tt.groups[tt.current_group].tests[tt.current_test].pause) tt.current_test++
		tt.run_next_test()
	},



	// Run through entire lifecycle for a given test (before_each(), before(), etc.). Each phase will wait for the previous phase to finish before moving on.
	test_start: null,
	wait_for_element_interval_obj: null,
	run_test: function(group_index, test_index) {

		return new Promise(function(resolve, reject) {

			tt.current_group = group_index
			tt.current_test = test_index

			let _group = tt.groups[tt.current_group]
			// let _test = tt.groups[tt.current_group].tests[tt.current_test]

			let _test = tt.groups[group_index].tests[test_index]
			_test.result = null
			_test.time = null

			if(_test.is_manual_test) tt.is_manual_test = 1
			else tt.is_manual_test = 0

			beforeEach_result = _group.beforeEach()
			Promise.resolve(beforeEach_result).then(function(result) {
				before_result = _test.before()
				Promise.resolve(before_result).then(function(result) {
					if(_test.message) tt.alert(_test.message)
					tt.run_test_loop(tt.current_group, tt.current_test).then(function() {
						if(_test.message) tt.alert('')
						after_result = _test.after()
						Promise.resolve(after_result).then(function(result) {
							afterEach_result = _group.afterEach()
							Promise.resolve(afterEach_result).then(function(result) {
								if(!tt.running) {
									tt.current_group = -1
									tt.current_test = -1
								}
								resolve()
							})
						})
					})
				})
			})
		})
	},


	// Run specific test until it returns a truthy/falsey value or times out
	run_test_loop: function(group_index, test_index, delay = 0) {
		return new Promise(function(resolve, reject) {

			tt.wait_for_element_interval_obj = setTimeout(function() {

				let _group = tt.groups[tt.current_group]
				let _test = tt.groups[tt.current_group].tests[tt.current_test]

				if(tt.run_start) tt.run_time = (new Date()).getTime() - tt.run_start.getTime()

				// Reset clock for each test
				if(delay == 0) {
					tt.test_start = new Date()
				}


				// Check to see if wait_for_element element is visible
				if(_test.wait_for_element) {
					// Fail test if requested element doesn't appear in time
					if((new Date()) - tt.test_start > tt.wait_for_element_timeout) {
						_test.result = 'error'
						_test.error = 'element not found'
						_test.time = (new Date()).getTime() - tt.test_start.getTime()
						resolve()
						return
					}
					
					let $wfe = document.querySelector(_test.wait_for_element)
					if(!$wfe.offsetWidth || window.getComputedStyle($wfe).getPropertyValue("opacity") * 1 < 1) {
						tt.run_test_loop(group_index, test_index, tt.wait_for_element_interval).then(function() {
							if(!tt.running) tt.current_test = 0 // Clear this in cases where an individual test is being run
							resolve()
						})
						return
					}
				}


				// Run 'run' function
				if(_test.fn) {
					result = _test.fn()
					Promise.resolve(result).then(function(result) {
						_test.time = (new Date()).getTime() - tt.test_start.getTime()
						resolve()
					});
				}


				// Run test
				else {
					let result

					// Move to next test if test already has a result from elsewhere
					if(_test.result) {
						_test.time = (new Date()).getTime() - tt.test_start.getTime()
						resolve()
						return
					}


					try {
						if(typeof _test.test == 'function') {

							// Run function and see if it returns a promise or truthy value
							let test_function_result = _test.test()

							// If test returns a promise, wait for promise to resolve, save the result, and run_test_loop() again
							if(test_function_result instanceof Promise) {
								Promise.resolve(test_function_result).then(function(promise_result) {
									if(promise_result) _test.result = 'passed'
									else _test.result = 'failed'
									_test.time = (new Date()).getTime() - tt.test_start.getTime()
									resolve()
								})
								return
							}

								else result = test_function_result

						}
						else result = ttb.seval(_test.test)
					} catch(error) {
						result = false
					}

					if(!result && (_test.max_time !== null || tt.max_time)) {
						let maxtime = _test.max_time
						if(maxtime === null) maxtime = tt.max_time
						if((new Date()).getTime() - tt.test_start.getTime() >= maxtime) {
							_test.result = 'failed'
							_test.error = 'timed out'
							_test.time = (new Date()).getTime() - tt.test_start.getTime()
							resolve()
						}
						else tt.run_test_loop(group_index, test_index, tt.wait_for_element_interval).then(function() {
							if(!tt.running) tt.current_test = 0 // Clear this in cases where an individual test is being run
							resolve()
						})
						return
					}
					if(result) _test.result = 'passed'
					else _test.result = 'failed'
					_test.time = (new Date()).getTime() - tt.test_start.getTime()
					if(!tt.running) tt.current_test = 0 // Clear this in cases where an individual test is being run
					resolve()
				}

			}, delay);
		})
	},



	pass_test: function(group = tt.current_group, test = tt.current_test) {
		tt.is_manual_test = 0
		tt.groups[group].tests[test].result = 'passed'
		if(tt.paused) tt.current_test++
	},


	fail_test: function(group = tt.current_group, test = tt.current_test) {
		tt.is_manual_test = 0
		tt.groups[group].tests[test].result = 'failed'
		if(tt.paused) tt.current_test++
	},


	skip_test: function(group = tt.current_group, test = tt.current_test) {
		tt.is_manual_test = 0
		tt.groups[group].tests[test].result = 'skipped'
		if(tt.paused) tt.current_test++
	},


	run_next_test: function() {
		
		if(tt.paused) return

		let _group = tt.groups[tt.current_group]

		// No more tests, tests complete
		if(tt.current_group >= tt.groups.length || (tt.running_group >= 0 && tt.current_group != tt.running_group)) {
			tt.finish_tests()
			return
		}

		let _test = tt.groups[tt.current_group].tests[tt.current_test]

		// If group is finished
		if(tt.current_test >= _group.tests.length) {
			tt.current_group = tt.current_group + 1
			tt.current_test = 0
			tt.run_next_test()
			return
		}

		// Skip steps that are set to 'skip' or 'run_if' returns false
		if(_test.skip || (_test.run_if && ttb.seval(_test.run_if) == false)) {
			_test.result = 'skipped'
			tt.current_test = tt.current_test + 1
			tt.run_next_test()
			return
		}

		// Starting next test
		else {

			tt.run_test(tt.current_group, tt.current_test).then(function() {
				if(tt.groups[tt.current_group].tests[tt.current_test].pause) {
					tt.paused = 1
					return
				}
				tt.current_test = tt.current_test + 1
				tt.run_next_test()
			})

		}
	},


	// Wrap up tests and clear testing values
	finish_tests: function() {
		tt.current_group = -1
		tt.current_test = 0
		tt.run_start = 0
		tt.running = 0

		tt.alert('Tests Complete', 3000)
	},
	
	
	// Reset results on all tests
	reset_tests: function() {
		tt.groups.forEach(function(group) {
			group.tests.forEach(function(test) {
				test.result = null
				test.time = null
			})
		})
		tt.run_time = 0
	},


	// Display message to user
	// message:		(string) Message to display. Can be set in plaintext or HTML
	// time_limit:	(int) Amount of time (ms) to display message before automatically hiding it.
	alert_timeout: null,
	alert: function(message, time_limit = 999999) {
		tt.message = message

		clearTimeout(tt.alert_timeout)
		tt.alert_timeout = setTimeout(function() {
			let $message = document.querySelector(".tests_message")
			$message.classList.remove('visible')
			setTimeout(function() {
				tt.message = ''
			}, 300)
		}, time_limit)
	},
	

	
	toggle_tests_panel() {
		tt.visible = !tt.visible
	},
	
	// Enable all groups and tests
	enable_all_groups() {
		tt.groups.forEach(function(group) {
			group.tests.forEach(function(test) {
				group.skip = 0
				test.skip = 0
			})
		})
	},
	
	// Disable all groups and tests
	disable_all_groups() {
		tt.groups.forEach(function(group) {
			group.skip = 1
			group.tests.forEach(function(test) {
				test.skip = 1
			})
		})
	},
	
	collapse_all_groups() {
		tt.groups.forEach(function(group) {
			group.collapse = 1
		})
	},
	
	expand_all_groups() {
		tt.groups.forEach(function(group) {
			group.collapse = 0
		})
	},
	
	// Expand or collapse a group when it is clicked
	toggle_view_group(index) {
		tt.groups[index].collapse = !tt.groups[index].collapse
	},
	
	toggle_skip_group(group_index) {
		let skip = !!tt.groups[group_index].skip
		tt.groups[group_index].skip = !skip
		tt.groups[group_index].tests.forEach(function(test) {
			test.skip = !skip
		})
	},
	
	toggle_skip_test(group_index, test_index) {
		let skip = !!tt.groups[group_index].tests[test_index].skip
		tt.groups[group_index].tests[test_index].skip = !skip
		if(skip) {
			tt.groups[group_index].skip = 0
		}
	},
	
	// Calculate the totals for each type of result in the tests
	// type:		(string) The type of result you want the total for ('all', 'run', 'passed', 'failed', 'skipped', 'error')
	// group_index:	(int) The index of the requested group. Use -1 if you want totals for all groups.
	totals(type = 'all', group_index = -1) {
		let results = {all: 0,run: 0}
	
		// Load all groups, unless one group is specified
		let groups = tt.groups
		if(group_index >= 0) groups = [tt.groups[group_index]]
	
		groups.forEach(function(group) {
			group.tests.forEach(function(test) {
				if(!test.test) return
				if(!results[test.result]) results[test.result] = 0
				if(test.result == null) {}
				else results[test.result]++				
				if(test.result != null) results['run']++
				results['all']++
			})
		})
		if(results[type]) return results[type]
		return 0
	},
	

}





// Internal functions for rendering results
var ttb = {

	// Data binding with the help of: https://gomakethings.com/how-to-batch-ui-rendering-in-a-reactive-state-based-ui-component-with-vanilla-js/
	init: function (options) {
	
		// Variables
		var _this = this;
		_this.elem = document.querySelector(options.selector);
		var _data = new Proxy(options.data, ttb.handler(this));
		_this.template = options.template;
		_this.debounce = null;
	  
		// Define setter and getter for data
		Object.defineProperty(this, 'data', {
			get: function () {
				return _data;
			},
			set: function (data) {
				_data = new Proxy(data, ttb.handler(_this));
				debounce(_this);
				return true;
			}
		});
	
	},

	
	
	debounceRender: function (instance) {
	
		// If there's a pending render, cancel it
		if (instance.debounce) {
			window.cancelAnimationFrame(instance.debounce);
		}
	
		// Setup the new render to run at the next animation frame
		instance.debounce = window.requestAnimationFrame(function () {
			instance.render();
		});
	
	},
	
	handler: function (instance) {
		return {
			get: function (obj, prop) {
				if (['[object Object]', '[object Array]'].indexOf(Object.prototype.toString.call(obj[prop])) > -1) {
					return new Proxy(obj[prop], ttb.handler(instance));
				}
				return obj[prop];
			},
			set: function (obj, prop, value) {
				obj[prop] = value;
				ttb.debounceRender(instance);
				return true;
			},
			deleteProperty: function (obj, prop) {
				delete obj[prop];
				ttb.debounceRender(instance);
				return true;
	
			}
		};
	},
	
	
	// Make $el2 match $el1 by only changing the elements and attributes that are different (recursive)
	matchDOMNode: function($el1, $el2) {
		
		let $children1 = $el1.children
		let $children2 = $el2.children
		
		
		// If $el2 is empty, just replace it with all of $el1
		if($children2.length < 1) {
			$el2.outerHTML = $el1.cloneNode(true).outerHTML
			$children2 = $el1.cloneNode(true).children
		}
		
		
		for(let x = 0; x < $children1.length; x++) {
			
			// If elements have different numbers of children, replace $children2[x]
			if($children1[x].children.length != $children2[x].children.length) {
				$children2[x].outerHTML = $children1[x].outerHTML + ""
				continue;
			}
			
			// If elements don't match, replace child from $el2 with child from $el1
			let a = $children1[x].cloneNode(true)
			// Remove all children so that only current element is evaluated (children will be compared individually and recursively)
			a.querySelectorAll('*').forEach(function($this) { $this.remove() })
			// Set checked and disabled properties based on values from template
			if(a.getAttribute(':checked') == 'true') a.checked = true
			if(a.getAttribute(':disabled') == 'true') a.disabled = true
			// Remove attributes, to be checked separately
			for(let y = 0; y < a.attributes.length; y++) { a.removeAttribute(a.attributes[y].name) }
			a.removeAttribute('class') // For some reason, these two don't get removed with the other attributes
			a.removeAttribute('style')
			
			// Repeat everything for the DOM element ($el2)
			let b = $children2[x].cloneNode(true)
			b.querySelectorAll('*').forEach(function($this) { $this.remove() })
			for(let y = 0; y < b.attributes.length; y++) { b.removeAttribute(b.attributes[y].name) }
			b.removeAttribute('class')
			b.removeAttribute('style')

			// Replace elements if they don't match, then move on to next element
			if(a.outerHTML != b.outerHTML) {
				let clone = $children1[x].cloneNode(true)
				$children2[x].outerHTML = clone.outerHTML
				if(a.checked) $children2[x].setAttribute('checked', 'checked')
				if(a.disabled) $children2[x].setAttribute('disabled', 'disabled')
				continue;
			}
			
			// If attributes don't match, just replace those attributes
			for(let z = 0; z < $children1[x].attributes.length; z++) {
				let attribute = $children1[x].attributes[z]
				if($children1[x].getAttribute(attribute.name) != $children2[x].getAttribute(attribute.name)) {
					$children2[x].setAttribute(attribute.name, $children1[x].getAttribute(attribute.name))
				}
			}
			
			// If elements have children, run function recursively on children
			if($children1[x].children.length > 0) {
				ttb.matchDOMNode($children1[x], $children2[x])
			}
		}
		
		
	},

	// Return element in array that matches property/values in criteria
	find(array, criteria) {
		var index = -1
		for(var x = 0; x < array.length; x++) {
			if(index >= 0) break
			let match = 1
			for(prop in criteria) {
				if(array[x][prop] != criteria[prop]) match = 0
			}
			if(match) index = x
		}
		return array[index]
	},
	
	
	// Create deep clone of object
	clone(obj) {
		
		let newobj = JSON.parse(JSON.stringify(obj))
		
		// Copy over functions as well, which don't get cloned with the JSON method
		for(let prop in obj) {
			if(prop in newobj == false) {
				if(typeof obj[prop] == 'function') newobj[prop] = obj[prop].bind({});
			}
		}
		
		return newobj
	},
	
	// print a string if test string evaluates as truthy
	// tests: object of key/value pairs. If value returns truthy, key will be output as a string. print_if() can handle multiple key/value pairs
	// eg. { hidden: "group.collapse == 1" }
	print_if(tests) {
		let str = ''
		for(let key in tests) {
			try {
				if(ttb.seval(tests[key])) str += key + " "
			}
			catch(error) {
				console.log('print_if error', str, check);
			}
		}
	
		return str.trim()
	},
	
	
	// seval() - (safe eval()) For running code through eval without triggering errors on invalid code
	seval(str) {
		try {
			return eval(str)
		}
		catch(error) {
			// console.log('eval error (group '+(tt.current_group + 1)+', test '+(tt.current_test + 1)+'): ', str);
		}
	},

	
	
	// Convert milliseconds to seconds
	ms_to_s(ms) {
		return (ms / 1000).toFixed(1)
	},
	
}








ttb.init.prototype.render = function () {
		
	let temp = document.createElement('div');
	temp.innerHTML = this.template(this.data);
	temp.id = 'testerrific'
	
	let $el = temp.querySelectorAll('[\\:if]')
	for(let x = 0; x < $el.length; x++) {
		if(!ttb.seval($el[x].getAttribute(':if'))) $el[x].remove()
		$el[x].removeAttribute(':if')		
	}
	
	
	
	// // Check for attributes that can be enabled/disabled by a true/false value
	let bool_attrs = ['checked', 'disabled']
	bool_attrs.forEach(function(attr) {
		$el = temp.querySelectorAll('[\\:' + attr + ']')
		for(let x = 0; x < $el.length; x++) {
			let result = ttb.seval($el[x].getAttribute(':' + attr))
			if(result) $el[x].setAttribute(attr, result)
			else $el[x].removeAttribute(attr)
		}
	})
	
	ttb.matchDOMNode(temp, document.querySelector('#testerrific'))
};







var testerrific_ui = new ttb.init({
	selector: '#testerrific',
	data: tt,


	template: function (tt) {
		return `
		
			<div class="tests_container">
			
			<div class="tests_panel ${ttb.print_if({ visible: tt.visible })}">
				
				<div class="tests_message ${ttb.print_if({ visible: tt.message.length })}">
					<span>${ tt.message }</span>
					<div class="pass_fail_buttonss" :if="tt.is_manual_test">
						<button class="pass" onclick="tt.pass_test()">Pass</button>
						<button class="fail" onclick="tt.fail_test()">Fail</button>
					</div>
					<button :if="tt.running && tt.paused" onclick="tt.resume_tests()"><svg width="57" height="64" viewBox="0 0 57 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M53.4192 26.3701C57.4192 28.6795 57.4192 34.453 53.4192 36.7624L9.37388 62.1919C5.37388 64.5013 0.373887 61.6146 0.373887 56.9958L0.37389 6.13663C0.37389 1.51783 5.37389 -1.36892 9.37389 0.940483L53.4192 26.3701Z" fill="white"/></svg> Resume</button>
					<button class="close" onclick="tt.alert(tt.message, 0)">close</button>
				</div>
				
				
				<div class="panel_inner_container">
					
					<div class="run_all_tests_container">
						<div class="title"><h2><span>TESTERRIFIC</span></h2></div>
						
						<div :if="!tt.running">
							<button onclick="tt.start_tests()"><svg width="57" height="64" viewBox="0 0 57 64"><path d="M53.4192 26.3701C57.4192 28.6795 57.4192 34.453 53.4192 36.7624L9.37388 62.1919C5.37388 64.5013 0.373887 61.6146 0.373887 56.9958L0.37389 6.13663C0.37389 1.51783 5.37389 -1.36892 9.37389 0.940483L53.4192 26.3701Z" fill="black"/></svg> Run selected tests</button>
						</div>
						<div :if="tt.running && !tt.paused">
							<button onclick="tt.pause_tests()"><svg width="50" height="57" viewBox="0 0 50 57"><rect y="0.241699" width="20.339" height="55.7721" rx="5" fill="black"/><rect x="29.661" y="0.241699" width="20.339" height="55.7721" rx="5" fill="black"/></svg> Pause</button>
						</div>
						<div :if="tt.running && tt.paused">
							<button onclick="tt.resume_tests()"><svg width="57" height="64" viewBox="0 0 57 64"><path d="M53.4192 26.3701C57.4192 28.6795 57.4192 34.453 53.4192 36.7624L9.37388 62.1919C5.37388 64.5013 0.373887 61.6146 0.373887 56.9958L0.37389 6.13663C0.37389 1.51783 5.37389 -1.36892 9.37389 0.940483L53.4192 26.3701Z" fill="black"/></svg> Resume</button>
						</div>
						<div :if="tt.running">
							<button onclick="tt.skip_test()"><svg width="62" height="53" viewBox="0 0 62 53"><path fill-rule="evenodd" clip-rule="evenodd" d="M26.5319 36.1232L6.005 51.6C3.50226 53.4871 0.37384 51.1283 0.37384 47.3543V5.79715C0.37384 2.02322 3.50226 -0.335662 6.005 1.5513L26.5319 17.0281V5.79715C26.5319 2.02322 29.6603 -0.335662 32.163 1.5513L59.7215 22.3299C62.2242 24.2169 62.2242 28.9345 59.7215 30.8214L32.163 51.6C29.6603 53.4871 26.5319 51.1283 26.5319 47.3543V36.1232Z" fill="black"/></svg> Skip</button>
						</div>
					</div>
				
					<br>
					
					
					
					<div class="tests_summary">
						<button class="clear_results" onclick="tt.reset_tests()">Clear</button>
						<h3>Summary:</h3>
						<div class="tests_summary_table">
							<div><b class="run">${tt.totals('run')}</b></div><div> tests run</div>
							<div :if="tt.totals('passed')"><b class="passed">${tt.totals('passed')}</b></div><div :if="tt.totals('passed')"> passed</div>
							<div :if="tt.totals('failed')"><b class="failed">${tt.totals('failed')}</b></div><div :if="tt.totals('failed')"> failed</div>
							<div :if="tt.totals('skipped')"><b class="skipped">${tt.totals('skipped')}</b></div><div :if="tt.totals('skipped')"> skipped</div>
							<div :if="tt.totals('error')"><b class="error">${tt.totals('error')}</b></div><div :if="tt.totals('error')"> errors</div>
						</div>
				
						<br>
				
						<div :if="tt.run_time">Total time: <b>${ttb.ms_to_s(tt.run_time)}</b> sec</div>
						<div :if="!tt.run_time && tt.paused">Paused...</div>
					</div>
					
					
					<div class="tests_table">
						<div class="table_controls" :if="tt.groups.length">
							<a onclick="tt.enable_all_groups()">enable all</a>
							<a onclick="tt.disable_all_groups()">disable all</a>
							<div></div>
							<a onclick="tt.expand_all_groups()">expand all</a>
							<a onclick="tt.collapse_all_groups()">collapse all</a>
						</div>
						
						${tt.groups.map(function(group, group_index) {
							return `
							
							<div class="group ${ ttb.print_if({ collapse: group.collapse, skipped: group.skip, running: group_index == tt.current_group })}" group_index="${group_index}">
								<div class="group_title">
									<input type="checkbox" :checked="${!group.skip}" onchange="tt.toggle_skip_group(${group_index})" index="${group_index}">
									<p onclick="tt.toggle_view_group(${group_index})">${ group.label }</p>
									<span class="collapse_group" onclick="tt.toggle_view_group(${group_index})"></span>
									<div class="group_test_summary" :if="${group_index} != tt.current_group && tt.totals('run', ${group_index})">
										<b class="passed">${ tt.totals('passed', group_index) }</b>
										<b class="failed">${ tt.totals('failed', group_index) }</b>
										<b class="skipped" :if="tt.totals('skipped', ${group_index})">${ tt.totals('skipped', group_index) }</b>
										<b class="error" :if="tt.totals('error', ${group_index})">${ tt.totals('error', group_index) }</b>
									</div>
									<div class="running_indicator" :if="${group_index} == tt.current_group"></div>
									<button onclick="tt.start_tests(${group_index})" :disabled="${tt.running == 1}">Run</button>
								</div>
								
								${group.tests.map(function(test, test_index) {
									return `
									
									<div if="${!group.collapse}" class="test ${ ttb.print_if({ fn: test.fn, running: group_index == tt.current_group && test_index == tt.current_test, skipped: test.skip, pause: test.pause, hidden: group.collapse })}" test_index="${test_index}" key="${test_index}">
										
										<div :if="${typeof test.label == 'string'}">
											<i :if="${ tt.display_test_index }">${ test_index }</i> 
											<input type="checkbox" :checked="${!test.skip }" onchange="tt.toggle_skip_test(${group_index}, ${test_index})" test_index="${test_index}" :if="${!test.pause}">
											<input type="checkbox" :checked="${!test.skip }" onchange="tt.toggle_skip_test(${group_index}, ${test_index}); tt.toggle_skip_test(${group_index}, ${test_index - 1})" :if="${test.pause}">
											<p><b :if="${test.fn}">Run:</b> ${ test.label }</p>
											<div class="running_indicator" :if="${group_index} == tt.current_group && ${test_index} == tt.current_test"></div>
											<div :if="${test.result != undefined}" class="result_container">
												<div class="result ${test.result}">${test.result}</div>
												<div class="time" :if="${test.time !== null}">${ test.time }ms</div>
											</div>
											<button onclick="tt.run_test(${group_index}, ${test_index}).then(tt.finish_tests)" :if="${!test.pause}" :disabled="${tt.running == 1}">Run</button>
											<button onclick="tt.resume_tests()" :if="${test.pause && tt.paused}">Resume</button>
										</div>
									
									</div>
								`
								}).join(' ')}
								
								
								
							</div>
							`
						}).join(' ')}

					</div>
					
					<b>${tt.totals() + ' Total Tests'}</b>
					
					<footer>
						<p>v0.2.5</p>
						<a href="https://projects.thomhines.com/testerrific/" target="_blank">Docs</a>
					</footer>
				</div>
			</div>
			
			
			<button class="toggle_tests_panel ${ttb.print_if({ visible: tt.visible })}" onclick="tt.toggle_tests_panel()">TESTS</button>
			
			</div>
			
	`;
	}
});





// Add UI to DOM and trigger rendering once the page has loaded
document.addEventListener('DOMContentLoaded', function () {
	let elem = document.createElement('div');
	elem.id = 'testerrific'
	document.body.appendChild(elem);
	testerrific_ui.render();
	tt = testerrific_ui.data
}, false);



