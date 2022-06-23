qt = {

	collapse_skipped_groups: true, // When page loads, collapse all groups that are set to 'skip' in the tests panel

	groups: [], // Used to store all test groups and tests

	visible: true, // Boolean that indicates if the tests panel should be open or closed when page loads
	current_group: -1, // Used to keep track of which group is currently tracking
	running_group: -1, // Used to keep track of which group is currently running (I can't remember why these are different, but they are)
	current_test: 0, // Used to keep track of which test is currently running
	running: 0, // Boolean to indicate if any tests are running
	paused: 0, // Boolean used to indicate if tests have been paused
	run_start: 0, // Timestamp of when tests first started running
	run_time: 0, // Total amount of time tests have been running
	is_manual_test: 1, // A flag that can indicate if a test requires manual intervention. It can be used to select all tests that might slow down a test run. No longer necessary???
	skip_manual_tests: 0, // If enabled, all tests marked as manual tests are skipped

	dom_check_timeout: 2000, // Used with "wait_for_element" test option. The amount of time (ms) to wait for an element to become visible before executing test
	dom_check_interval: 100, // Amount of time (ms) to wait before checking for the element again

	test_defaults: {
		running: 0, // Boolean that indicates if this is the test currently running
		time: null, // Stores how long a test took before it came back with a result
		result: null, // Stores the result of the test (pass/fail/skipped)
		skip: 0, // Determines if test is set to 'skip' on page load
		only: 0, // Determines if test is set to be the only test to run. Multiple tests can be set to 'only'
		max_time: 1000, // How much time to wait for a test to be true before declaring it false
		run_if: '', // a boolean check that gets checked to determine if a test should be run. Helpful if you want to run specific tests only in certain scenarios.
		message: '', // A message that can be presented to the user when the test is run.
		fn: null,
		before: () => {}, // A function that will be run before the test is executed. If a promise is returned, the test will wait until the promise is resolved
		after: () => {}, // A function that will be run after the test is executed. If a promise is returned, the test will wait until the promise is resolved
	},





	// Create new test group. All following tests will be added to this group
	// options:		object that can contain the following values:
	// 		label:		string, label of test
	//		skip: 		boolean, whether to skip this test or not
	//		only: 		boolean, whether to run only this test or not
	// 		collapse:	boolean, whether tests are shown or not
	// 		beforeEach:	function that gets run before each test in group
	// 		afterEach:	function that gets run after each test in group
	test_group: function(group_name, options = {}) {
		qt.groups.push(Object.assign({
			group: true,
			label: group_name,
			test_count: 0,
			collapse: false,
			tests: [],
			skip: 0,
			only: 0,
			run_if: '',
			beforeEach: () => {},
			afterEach: () => {},
		}, options))
		
		return
			
		// qt.groups.push(_.defaults(options, {
		// 	group: true,
		// 	label: group_name,
		// 	test_count: 0,
		// 	collapse: false,
		// 	tests: [],
		// 	skip: 0,
		// 	only: 0,
		// 	run_if: '',
		// 	beforeEach: () => {},
		// 	afterEach: () => {},
		// }))
	},


	// Duplicate existing group
	// Returns integer of new_group's qt.groups array index (to make it easier to modify right away)
	duplicate_group: function(group_name, new_group_name, options = {}) {
		let orig_group = qt.find(qt.groups, { label: group_name })
		let new_group = qt.clone(orig_group)
		// new_group = _.defaults(options, new_group)
		new_group = Object.assign(new_group, options)
		new_group.label = new_group_name
		qt.groups.push(new_group)

		return qt.groups.length - 1
	},



	// Test if logic is true on data
	// label:		string that describes test
	// check: 		string that evals to true/false. Eg. "x == 3"
	// 			OR 	a function that returns true/false. Eg. () => { return x == 3 }. Currently only works with non-async functions
	// options:		(object) that can contain the following optional values:
	//		skip: 		(boolean) whether to skip this test or not
	//		only: 		(boolean) whether to run only this test or not
	// 		wait_for_element:	(string) CSS or jQuery selector string of matching element(s). Test will not run until element is 100% visible
	// 		max_time:	Amount of time to wait for a truthy response. If blank, test will only test what value currently is
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
			label = null
		}

		// let test_obj = qt.clone(qt.test_defaults)
		// test_obj.test = check
		let test_obj = Object.assign(qt.clone(qt.test_defaults), options, {test: check})
		
		
		// test_obj = _.defaults({test: check}, options, qt.test_defaults)

		if(!test_obj.label && label) test_obj.label = label

		// Use test as label if no label given
		if(!test_obj.label && typeof check == 'string') test_obj.label = check

		let current_group = qt.groups[qt.groups.length - 1]

		// Allow test to be added to specific group
		if(typeof test_obj.group == 'number') {
			current_group = qt.groups[test_obj.group]
		}
		else if(test_obj.group) {
			// let group_index = _.findIndex(qt.groups, { label: test_obj.group })
			// current_group = qt.groups[group_index]
			current_group = qt.find(qt.groups, { label: test_obj.group })
		}
		
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
			label = null
		}


		let test_obj = Object.assign(qt.clone(qt.test_defaults), options, {fn: fn})

		// test_obj = _.defaults({ fn: fn}, options, qt.test_defaults)

		if(!test_obj.label && label) test_obj.label = label

		let current_group = qt.groups[qt.groups.length - 1]

		// Allow test to be added to specific group
		if(typeof test_obj.group == 'number') {
			current_group = qt.groups[test_obj.group]
		}
		else if(test_obj.group) {
			// let group_index = _.findIndex(qt.groups, { label: test_obj.group })
			// current_group = qt.groups[group_index]
			current_group = qt.find(qt.groups, { label: test_obj.group })
		}

		if(test_obj.position) current_group.tests.splice(test_obj.position, 0, test_obj)
		else current_group.tests.push(test_obj)
	},




	// Add a delay to the test chain
	// delay: 		integer, number of milliseconds to wait
	wait: function(delay) {
		qt.run(() => {
			return new Promise(function(resolve, reject) {
				setTimeout(resolve, delay)
			})
		})
	},


	// Wait until user has clicked "Resume"
	pause: function() {
		qt.run(function() {
			qt.alert("Tests paused.")
			qt.pause_tests()
		})
	},


	// No longer necessary???
	// Set smart defaults and add flag to tests that require user intervention
	manual_test: function(label = "", message = "", options = {}) {

		// If no label is given, assume that arguments are (check, options, null)
		if(typeof message == 'object' || !message) {
			options = message
			message = label
		}

		// test_obj = _.defaults({label: label, test: 'false', max_time: 999999, message: message, is_manual_test: 1}, options, qt.test_defaults)
		
		let test_obj = Object.assign(qt.clone(qt.test_defaults), options, {label: label, test: 'false', max_time: 999999, message: message, is_manual_test: 1})

		qt.test(label, test_obj)
	},



	// Disable all tests if there are any tests/groups that are marked as 'only'
	disable_skipped_tests: function() {
		let has_only = 0
		// Go through and find if there are any 'only' groups or tests
		qt.groups.forEach(function(group) {
			group.tests.forEach(function(test) {
				if(group.only || test.only) has_only = 1
			})
		})

		// If so, skip all tests that are not set to only or part of an only group. Also mark all tests in a skipped group to skip
		qt.groups.forEach(function(group) {
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
				if(qt.skip_manual_tests && (group.is_manual_test || test.is_manual_test)) {
					test.skip = 1
				}

				// If a test is set to only, un-skip its group
				else if(group_has_only) {
					unskip_group = 1
				}
			})

			if(has_only && !group.only) group.skip = 1
			if(qt.skip_manual_tests && group.is_manual_test) group.skip = 1
			if(unskip_group) group.skip = 0
		})
	},



	//
	start_tests: function(group_index = -1) {
		qt.groups.forEach(function(group) {
			group.result = null
			group.time = null
			group.tests.forEach(function(test) {
				// test.result = null
				test.time = null
			})
		})
		qt.running_group = group_index
		// Run specific group only
		if(qt.running_group >= 0) {
			qt.current_group = qt.running_group
			qt.groups[qt.current_group].tests.forEach((test) => {
				test.result = null
			})
		}
		else {
			qt.current_group = 0
			qt.groups.forEach((group) => {
				group.tests.forEach((test) => {
					group.result = null
					test.result = null
				})
			})
		}
		qt.current_test = 0
		qt.running = 1
		qt.run_start = new Date()
		qt.run_time = null
		qt.paused = 0


		// TODO: If test is first of group, reset all of the results of the tests in that group
		if(qt.current_test == 0) {

		}

		clearTimeout(qt.dom_check_interval_obj)

		qt.run_next_test()

	},



	// Will pause tests after current test is complete/timed-out
	pause_tests: function() {
		qt.paused = 1
	},


	// Will un-pause tests and continue execution
	resume_tests: function() {
		qt.paused = 0
		qt.alert("")
		qt.run_next_test()
	},



	// Run through entire lifecycle for a given test (before_each(), before(), etc.). Each phase will wait for the previous phase to finish before moving on.
	test_start: null,
	dom_check_interval_obj: null,
	run_test: function(group_index, test_index) {

		return new Promise(function(resolve, reject) {

			qt.current_group = group_index
			qt.current_test = test_index

			let _group = qt.groups[qt.current_group]
			// let _test = qt.groups[qt.current_group].tests[qt.current_test]

			let _test = qt.groups[group_index].tests[test_index]
			_test.result = null
			_test.time = null

			if(_test.is_manual_test) qt.is_manual_test = 1
			else qt.is_manual_test = 0

			beforeEach_result = _group.beforeEach()
			Promise.resolve(beforeEach_result).then(function(result) {
				before_result = _test.before()
				Promise.resolve(before_result).then(function(result) {
					if(_test.message) qt.alert(_test.message)
					qt.run_test_loop(qt.current_group, qt.current_test).then(function() {
						if(_test.message) qt.alert('')
						after_result = _test.after()
						Promise.resolve(after_result).then(function(result) {
							afterEach_result = _group.afterEach()
							Promise.resolve(afterEach_result).then(function(result) {
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

			qt.dom_check_interval_obj = setTimeout(function() {

				let _group = qt.groups[qt.current_group]
				let _test = qt.groups[qt.current_group].tests[qt.current_test]

				if(qt.run_start) qt.run_time = (new Date()).getTime() - qt.run_start.getTime()

				// Reset clock for each test
				if(delay == 0) {
					qt.test_start = new Date()
				}

				if(_test.wait_for_element) {
					// Fail test if requested element doesn't appear in time
					if((new Date()) - qt.test_start > qt.dom_check_timeout) {
						_test.result = 'error'
						_test.error = 'element not found'
						_test.time = (new Date()).getTime() - qt.test_start.getTime()
						resolve()
						return
					}
				}

				// Check to see if element is in DOM
				if(_test.wait_for_element && (!$(_test.wait_for_element).is(':visible') || $(_test.wait_for_element).css('opacity') < 1)) {
					qt.run_test_loop(group_index, test_index, qt.dom_check_interval).then(function() {
						if(!qt.running) qt.current_test = 0 // Clear this in cases where an individual test is being run
						resolve()
					})
				}

				// Run 'run' function
				else if(_test.fn) {
					result = _test.fn()
					Promise.resolve(result).then(function(result) {
						_test.time = (new Date()).getTime() - qt.test_start.getTime()
						resolve()
					});
				}


				// Run test
				else {
					let result

					// Move to next test if test already has a result from elsewhere
					if(_test.result) {
						_test.time = (new Date()).getTime() - qt.test_start.getTime()
						resolve()
						return
					}


					try {
						if(typeof _test.test == 'function') {

							// Run function and see if it returns a promise or truthy value
							let test_function_result = _test.test()

							// If test returns a promise, wait for promise to resolve, save the result, and run_test_loop() again
							if(test_function_result instanceof Promise) {
								console.log('has promise')
								Promise.resolve(test_function_result).then(function(promise_result) {
									console.log('run_test_loop resolved')
									if(promise_result) _test.result = 'passed'
									else _test.result = 'failed'
									_test.time = (new Date()).getTime() - qt.test_start.getTime()
									resolve()
								})
								return
							}

								else result = test_function_result

						}
						else result = qtb.seval(_test.test)
					} catch(error) {
						result = false
					}

					if(!result && _test.max_time) {
						if((new Date()).getTime() - qt.test_start.getTime() >= _test.max_time) {
							_test.result = 'failed'
							_test.error = 'timed out'
							_test.time = (new Date()).getTime() - qt.test_start.getTime()
							resolve()
						}
						else qt.run_test_loop(group_index, test_index, qt.dom_check_interval).then(function() {
							if(!qt.running) qt.current_test = 0 // Clear this in cases where an individual test is being run
							resolve()
						})
						return
					}
					if(result) _test.result = 'passed'
					else _test.result = 'failed'
					_test.time = (new Date()).getTime() - qt.test_start.getTime()
					if(!qt.running) qt.current_test = 0 // Clear this in cases where an individual test is being run
					resolve()
				}

			}, delay);
		})
	},



	pass_test: function(group = qt.current_group, test = qt.current_test) {
		qt.is_manual_test = 0
		qt.groups[group].tests[test].result = 'passed'
	},


	fail_test: function(group = qt.current_group, test = qt.current_test) {
		qt.is_manual_test = 0
		qt.groups[group].tests[test].result = 'failed'
	},


	skip_test: function(group = qt.current_group, test = qt.current_test) {
		qt.is_manual_test = 0
		qt.groups[group].tests[test].result = 'skipped'
	},




	run_next_test: function() {


		if(qt.paused) return

		let _group = qt.groups[qt.current_group]


		// No more tests, tests complete
		if(qt.current_group >= qt.groups.length || (qt.running_group >= 0 && qt.current_group != qt.running_group)) {
			qt.finish_tests()
			return
		}


		let _test = qt.groups[qt.current_group].tests[qt.current_test]

		// If group is finished
		if(qt.current_test >= _group.tests.length) {
			qt.current_group = qt.current_group + 1
			qt.current_test = 0
			qt.run_next_test()
			return
		}


		// If group is finished or skipped or run_if returns false, move to next group
		// if(_group.skip || (_group.run_if && qtb.seval(_group.run_if) == false)) {
		// 	_group.result = 'skipped'
		// 	// if(!test.only) test.result = 'skipped'

		// 	// Vue.set(qt, 'current_group', qt.current_group + 1)
		// 	// Vue.set(qt, 'current_test', 0)
		// 	// if(_group.skip || (_group.run_if && qtb.seval(_group.run_if) == false)) {
		// 	// 	_group.tests.forEach(function(test) {
		// 	// 		if(!test.only) test.result = 'skipped'
		// 	// 	})
		// 	// }
		// 	qt.run_next_test()
		// 	return
		// }


		// Skip steps that are set to 'skip' or 'run_if' returns false
		if(_test.skip || (_test.run_if && qtb.seval(_test.run_if) == false)) {
			_test.result = 'skipped'
			// Vue.set(qt, 'current_test', qt.current_test + 1)
			qt.current_test = qt.current_test + 1
			qt.run_next_test()
			return
		}


		// Starting next test
		else {

			qt.run_test(qt.current_group, qt.current_test).then(function() {
				qt.current_test = qt.current_test + 1
				qt.run_next_test()
			})

		}
	},


	// Wrap up tests and clear testing values
	finish_tests: function() {
		qt.current_group = -1
		qt.current_test = 0
		qt.run_start = 0
		qt.running = 0

		qt.alert('Tests Complete', 3000)
	},


	// Display message to user
	// message:		(string) Message to display. Can be set in plaintext or HTML
	// time_limit:	(int) Amount of time (ms) to display message before automatically hiding it.
	alert_timeout: null,
	alert: function(message, time_limit = 999999) {

		if($('.tests_message span').html() == message) return

		clearTimeout(qt.alert_timeout)

		if(message) $('.tests_message span').html(message).parent().addClass('visible')
		else $('.tests_message span').html('').parent().removeClass('visible')

		qt.alert_timeout = setTimeout(function() {
			qt.alert('')
		}, time_limit)

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
	
	toggle_tests_panel() {
		qt.visible = !qt.visible
	},
	
	// Enable all groups and tests
	enable_groups() {
		qt.groups.forEach((group) => {
			group.tests.forEach((test) => {
				group.skip = 0
				test.skip = 0
			})
		})
	},
	
	// Disable all groups and tests
	disable_groups() {
		qt.groups.forEach((group) => {
			group.tests.forEach((test) => {
				group.skip = 1
				test.skip = 1
			})
		})
	},
	
	collapse_groups() {
		qt.groups.forEach((group) => {
			group.collapse = 1
		})
	},
	
	expand_groups() {
		qt.groups.forEach((group) => {
			group.collapse = 0
		})
	},
	
	// Expand or collapse a group when it is clicked
	toggle_view_group(index) {
		qt.groups[index].collapse = !qt.groups[index].collapse
	},
	
	toggle_skip_group(group_index) {
		// let group_index = $(e.target).closest('.group').attr('group_index')
		let val = $('.group[group_index="' + group_index + '"]').find('.group_title input[type="checkbox"]').prop('checked')
		qt.groups[group_index].skip = !val
		qt.groups[group_index].tests.forEach(function(test) {
			test.skip = !val
		})
	},
	
	toggle_skip_test(group_index, test_index) {
		// let group_index = $(e.target).closest('.group').attr('group_index')
		// let test_index = $(e.target).closest('.test').attr('test_index')
		let val = $('.group[group_index="' + group_index + '"] .test[test_index="' + test_index + '"]').find('input[type="checkbox"]').prop('checked')
		console.log('val', val);
		if(val) qt.groups[group_index].skip = 0
		qt.groups[group_index].tests[test_index].skip = !val
	},
	
	// Calculate the totals for each type of result in the tests
	// type:		(string) The type of result you want the total for ('all', 'run', 'passed', 'failed', 'skipped', 'error')
	// group_index:	(int) The index of the requested group. Use -1 if you want totals for all groups.
	totals(type = 'all', group_index = -1) {
		let results = {all: 0,run: 0}
	
		// Load all groups, unless one group is specified
		let groups = qt.groups
		if(group_index >= 0) groups = [qt.groups[group_index]]
	
		groups.forEach(function(group) {
			group.tests.forEach(function(test) {
				if(!test.test) return
				if(!results[test.result]) results[test.result] = 0
				if(test.group) {}
				else if(test.result == null) {}
				else results[test.result]++
				if(test.result != null) results['run']++
				results['all']++
			})
		})
		if(results[type]) return results[type]
		return 0
	},
	
	
	// Convert milliseconds to seconds
	ms_to_s(ms) {
		return (ms / 1000).toFixed(1)
	},

}





// Internal functions for rendering results
var qtb = {

	// Data binding with the help of: https://gomakethings.com/how-to-batch-ui-rendering-in-a-reactive-state-based-ui-component-with-vanilla-js/
	init: function (options) {
	
		// Variables
		var _this = this;
		_this.elem = document.querySelector(options.selector);
		var _data = new Proxy(options.data, qtb.handler(this));
		_this.template = options.template;
		_this.debounce = null;
	  
		// Define setter and getter for data
		Object.defineProperty(this, 'data', {
			get: function () {
				return _data;
			},
			set: function (data) {
				_data = new Proxy(data, qtb.handler(_this));
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
					return new Proxy(obj[prop], qtb.handler(instance));
				}
				return obj[prop];
			},
			set: function (obj, prop, value) {
				obj[prop] = value;
				qtb.debounceRender(instance);
				return true;
			},
			deleteProperty: function (obj, prop) {
				delete obj[prop];
				qtb.debounceRender(instance);
				return true;
	
			}
		};
	},
	
	
	
	matchDOMNode: function($el1, $el2) {
		// let dom_map = []
			
		let $children1 = $el1.children()
		let $children2 = $el2.children()
		
		
		// If $el2 is empty, just replace it with all of $el1
		if($children2.length < 1) {
			$el2.replaceWith($el1.clone())
			return
		}
		
		for(let x = 0; x < $children1.length; x++) {
			
			// If elements have different numbers of children, replace $h2
			if($children1.eq(x).children().length != $children2.eq(x).children().length) {
				$children2.eq(x).replaceWith($children1.eq(x).clone())
				continue;
			}
			
			// If elements don't match, replace child from $el2 
			let a = $children1.eq(x).clone()
			a.find('*').remove()
			// Remove attributes to be checked separately
			for(let aa = 0; aa < a[0].attributes.length; aa++) { a.removeAttr(a[0].attributes[aa].name) }
			a.removeAttr('class style')
			a = a.prop('outerHTML')
			a = a.replace(/[\s]+/g, ' ')
			
			let b = $children2.eq(x).clone()
			b.find('*').remove()
			for(let ba = 0; ba < b[0].attributes.length; ba++) { b.removeAttr(b[0].attributes[ba].name) }
			b = b.prop('outerHTML')
			if(b) b = b.replace(/[\s]+/g, ' ')
	
			
			if(a != b) {
				$children2.eq(x).replaceWith($children1.eq(x).clone())
				continue;
			}		
			
			// If dynamic attributes don't match, just replace those attributes
			// $.each($children1.eq(x).attributes, function(index, attribute) {
			for(let ela = 0; ela < $children1.eq(x)[0].attributes.length; ela++) {
				let attribute = $children1.eq(x)[0].attributes[ela]
				if($children1.eq(x).attr(attribute.name) != $children2.eq(x).attr(attribute.name)) {
					$children2.eq(x).attr(attribute.name, $children1.eq(x).attr(attribute.name))
				}
			}
			
			// If elements have children, run function recursively on children
			if($children1.eq(x).children().length > 0) {
				qtb.matchDOMNode($children1.eq(x), $children2.eq(x))
			}
			
		}
		
	},

	
	print_if(tests) {
		let str = ''
		for(let key in tests) {
			try {
				if(qtb.seval(tests[key])) str += key + " "
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
			console.log('eval error', str);
		}
	},

	
	
}








qtb.init.prototype.render = function () {
		
	let temp = document.createElement('div');
	temp.innerHTML = this.template(this.data);
	$(temp).attr('id', 'testerrific')
	
	// Remove elements if their ":if" qualifier returns false
	$(temp).find('[\\:if]').each(function() {
		if(!qtb.seval($(this).attr(':if'))) $(this).remove()
		$(this).removeAttr(':if')
	})
	
	// Check for true/false attributes that can be enabled/disabled by a dynamic value
	let bool_attrs = ['checked', 'disabled']
	bool_attrs.forEach(function(attr) {
		$(temp).find('[\\:' + attr + ']').each(function() {
			if(qtb.seval($(this).attr(':' + attr))) $(this).attr(attr, 1)
			$(this).removeAttr(':' + attr)
		})
	})
	
	qtb.matchDOMNode($(temp), $('#testerrific'))
};







var testerrific_ui = new qtb.init({
	selector: '#testerrific',
	data: qt,


	template: function (qt) {
		return `
		
			<div class="tests_container">
			
			<div class="tests_ui ${qtb.print_if({ visible: qt.visible })}">
				
				<div class="tests_message">
					<span></span>
					<div class="pass_fail_buttonss" :if="qt.is_manual_test">
						<button class="pass" onclick="qt.pass_test()">Pass</button>
						<button class="fail" onclick="qt.fail_test()">Fail</button>
					</div>
					<button :if="qt.running && qt.paused" onclick="qt.resume_tests()">▶ &nbsp;Resume</button>
					<button class="close" onclick="qt.alert('')"><i class="icon-close"><span>cancel</span></i></button>
				</div>
				
				
				<div class="panel_inner_container">
					
					<h2>Tests</h2>
					
					<div class="run_all_tests_container">
						<div :if="!qt.running">
							<button onclick="qt.start_tests()"> ▶ &nbsp;Run selected tests</button>
						</div>
						<div :if="qt.running && !qt.paused">
							<button onclick="qt.pause_tests()"><span style="font-size: .7em; border-left: 4px solid #000; border-right: 4px solid #000; line-height: 1.3em;">&nbsp;</span> &nbsp;Pause</button>
						</div>
						<div :if="qt.running && qt.paused">
							<button onclick="qt.resume_tests()">▶ &nbsp;Resume</button>
						</div>
						<div :if="qt.running">
							<button onclick="qt.skip_test()"><span style="font-size: 1.5em; line-height: .3em;">»</span> &nbsp;Skip</button>
						</div>
					</div>
				
					<br>
					
					
					
					<div class="tests_summary" :if="qt.running || (qt.totals('run') && qt.totals('run') != qt.totals('skipped'))">
						<h3>Summary:</h3>
						<div class="tests_summary_table">
							<div :if="qt.totals('run')"><b class="run" :text="qt.totals('run')">${qt.totals('run')}</b></div><div :if="qt.totals('run')"> tests run</div>
							<div :if="qt.totals('passed')"><b class="passed" :text="qt.totals('passed')">${qt.totals('passed')}</b></div><div :if="qt.totals('passed')"> passed</div>
							<div :if="qt.totals('failed')"><b class="failed" :text="qt.totals('failed')">${qt.totals('failed')}</b></div><div :if="qt.totals('failed')"> failed</div>
							<div :if="qt.totals('skipped')"><b class="skipped" :text="qt.totals('skipped')">${qt.totals('skipped')}</b></div><div :if="qt.totals('skipped')"> skipped</div>
							<div :if="qt.totals('error')"><b class="error" :text="qt.totals('error')">${qt.totals('error')}</b></div><div :if="qt.totals('error')"> errors</div>
						</div>
				
						<br>
				
						<div :if="qt.run_time">Total time: <b>${qt.ms_to_s(qt.run_time)}</b> sec</div>
						<div :if="!qt.run_time && qt.paused">Paused...</div>
						<div :if="!qt.run_time && !qt.paused">Running...</div>
					</div>
					
					
					<div class="tests_table">
						<div class="table_controls">
							<a onclick="qt.enable_groups()">enable all</a>
							<a onclick="qt.disable_groups()">disable all</a>
							<div>|</div>
							<a onclick="qt.expand_groups()">expand all</a>
							<a onclick="qt.collapse_groups()">collapse all</a>
						</div>
						
						${qt.groups.map(function(group, group_index) {
							return `
							
							<div class="group ${ qtb.print_if({ collapse: group.collapse, skipped: group.skip, running: group_index == qt.current_group })}" group_index="${group_index}">
								<div class="group_title">
									<input type="checkbox" :checked="${!group.skip}" onchange="qt.toggle_skip_group(${group_index})">
									<p onclick="qt.toggle_view_group(${group_index})">${ group.label }</p>
									<span class="collapse_group" onclick="qt.toggle_view_group(${group_index})"></span>
									<div class="group_test_summary" :if="${group_index} != qt.current_group && qt.totals('run', ${group_index})">
										<b class="passed">${ qt.totals('passed', group_index) }</b>
										<b class="failed">${ qt.totals('failed', group_index) }</b>
										<b class="skipped" :if="qt.totals('skipped', ${group_index})">${ qt.totals('skipped', group_index) }</b>
										<b class="error" :if="qt.totals('error', ${group_index})">${ qt.totals('error', group_index) }</b>
									</div>
									<div class="running_indicator" :if="${group_index} == qt.current_group"></div>
									<button onclick="qt.start_tests(${group_index})" :disabled="${qt.running == 1}">Run</button>
								</div>
								
								
								${group.tests.map(function(test, test_index) {
									return `
									
									<div :if="${!group.collapse}" class="test ${ qtb.print_if({ fn: test.fn, running: group_index == qt.current_group && test_index == qt.current_test, skipped: test.skip })}" test_index="${test_index}" key="${test_index}">
									
										<div v-if="test.label">
											<input type="checkbox" :checked="${!test.skip }" onchange="qt.toggle_skip_test(${group_index}, ${test_index})" test_index="${test_index}">
											<p><b :if="${test.fn}">Run:</b> ${ test.label }</p>
											<div class="running_indicator" :if="${group_index} == qt.current_group && ${test_index} == qt.current_test"></div>
											<div :if="${test.result != undefined}" class="result_container">
												<div class="result ${test.result}">${test.result}</div>
												<div class="time" :if="${test.time !== null}">${ test.time }ms</div>
											</div>
											<button onclick="qt.run_test(${group_index}, ${test_index}).then(qt.finish_tests)" :disabled="${qt.running == 1}">Run</button>
										</div>
									
									</div>
								`
								}).join(' ')}
								
								
								
							</div>
							`
						}).join(' ')}

					</div>
					
					<b>${qt.totals() + ' Total Tests'}</b>
				</div>
			</div>
			
			
			<button class="toggle_tests_panel ${qtb.print_if({ visible: qt.visible })}" onclick="qt.toggle_tests_panel()">Tests</button>
			
			</div>
			
	`;
	}
});





// Add UI to DOM and trigger rendering once the page has loaded
document.addEventListener('DOMContentLoaded', function () {
	$('body').append('<div id="testerrific"></div>')
	testerrific_ui.render();
	qt = testerrific_ui.data
}, false);



