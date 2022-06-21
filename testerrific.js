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
		new_group = _.defaults(options, new_group)
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

		test_obj = _.defaults({ fn: fn}, options, qt.test_defaults)

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

		test_obj = _.defaults({label: label, test: 'false', max_time: 999999, message: message, is_manual_test: 1}, options, qt.test_defaults)

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
						else result = eval(_test.test)
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
			Vue.set(qt, 'current_group', qt.current_group + 1)
			Vue.set(qt, 'current_test', 0)
			qt.run_next_test()
			return
		}


		// If group is finished or skipped or run_if returns false, move to next group
		// if(_group.skip || (_group.run_if && eval(_group.run_if) == false)) {
		// 	_group.result = 'skipped'
		// 	// if(!test.only) test.result = 'skipped'

		// 	// Vue.set(qt, 'current_group', qt.current_group + 1)
		// 	// Vue.set(qt, 'current_test', 0)
		// 	// if(_group.skip || (_group.run_if && eval(_group.run_if) == false)) {
		// 	// 	_group.tests.forEach(function(test) {
		// 	// 		if(!test.only) test.result = 'skipped'
		// 	// 	})
		// 	// }
		// 	qt.run_next_test()
		// 	return
		// }


		// Skip steps that are set to 'skip' or 'run_if' returns false
		if(_test.skip || (_test.run_if && eval(_test.run_if) == false)) {
			_test.result = 'skipped'
			Vue.set(qt, 'current_test', qt.current_test + 1)
			qt.run_next_test()
			return
		}


		// Starting next test
		else {

			qt.run_test(qt.current_group, qt.current_test).then(function() {
				Vue.set(qt, 'current_test', qt.current_test + 1)
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

		// // Clear and hide message if there is already a message
		// if($('.tests_message span').html()) {
		// 	$('.tests_message').fadeOut(200).promise().then(() => { $('.tests_message span').html('') })
		// 	setTimeout(function() { qt.alert(message, time_limit)}, 300)
		// 	return
		// }

		// $('.tests_message').fadeOut().promise().then(() => {
		// 	console.log('fadein');
		// 	if(message) $('.tests_message span').html(message).parent().fadeIn(200)
		// })
		
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
		return JSON.parse(JSON.stringify(obj))
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
	
	toggle_skip_group(e) {
		let group_index = $(e.target).closest('.group').attr('group_index')
		let val = $(e.target).prop('checked')
		qt.groups[group_index].skip = !val
		qt.groups[group_index].tests.forEach(function(test) {
			test.skip = !val
		})
	},
	
	toggle_skip_test(e) {
		let group_index = $(e.target).closest('.group').attr('group_index')
		let test_index = $(e.target).closest('.test').attr('test_index')
		let val = $(e.target).prop('checked')
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
	
	// // Get count of all tests in the system
	// tests_count() {
	// 	let total_tests = 0
	// 	qt.groups.forEach(function(group) {
	// 		let group_test = 0
	// 		group.tests.forEach(function(test) {
	// 			if(test.test) total_tests++
	// 			if(test.test) group_test++
	// 		})
	// 	})
	// 	return total_tests
	// },
	
	
	// Convert milliseconds to seconds
	ms_to_s(ms) {
		return (ms / 1000).toFixed(1)
	},


	asdf: {
		a: 1,
		b: 2,
		c: {
			d: 1,
			e: 2,
			f: 3
		}
	},
	
	
	df: [5,3,1,6,35,7]
}







// With help from https://www.atmosera.com/blog/data-binding-pure-javascript/
function binding(obj, property) {
	let _this = this
	_this.has_init = false
	_this.value = obj[property]
		
	if(typeof obj[property] == 'object' && obj[property] !== null && Object.keys(obj[property]).length) {
		let keys = Object.keys(obj[property])
		for(let x = 0; x < keys.length; x++) {
			new binding(obj[property], keys[x])
		}
		// return
	}
	
	_this.getter = function(){
		return _this.value;
	}
	_this.setter = function(val){
		_this.value = val
		if(_this.has_init) {
			updateDOM() // Don't update the DOM when first initializing properties
		}
		_this.has_init = true
	}
	
	
	let props = {
		get: this.getter,
		set: this.setter
	}
	
	Object.defineProperty(obj, property, props);	
	
	// If property is array, watch for common array functions
	if(Array.isArray(obj[property])) {
		const array_methods = ['push', 'pop', 'unshift', 'shift', 'splice', 'sort', 'reverse']
		array_methods.forEach(function(method) {
		// 	props[method] = _this.setter
			Object.defineProperty(obj[property], method, {
				value: function(...args) {
					// obj[property].push()
					// Duplicate array so as not to trigger setter function over and over
					let _array = qt.clone(this)
					// Run array method on array
					eval("_array." + method + "(...args)")
					
					// remove data values from "this" and replace with values from _array
					for(let x = this.length - 1; x >= 0; x--) { delete this[x] }
					this.length = _array.length					
					obj[property] = Object.assign(this, _array)
				}
			});		
		})
	}
	
	obj[property] = this.value;
	
}


function bind_qt() {
	for (let key in qt) {
		if(typeof qt[key] == 'function') continue;	
		new binding(qt, key)
	}	
	
	updateDOM()
}




var latest_qt = {}
function updateDOM(sub = 0) {
	
	
	// // Check if qt has actually changed before updating DOM
	// if(JSON.stringify(qt) == JSON.stringify(latest_qt)) return
	// latest_qt = qt.clone(qt)
	
	
	
	resetForLoops()
	updateForLoops()

	
	$element = $('.tests_ui, .toggle_tests_panel')
	$element = $element.add($element.find('*'))
	
	
	setTimeout(function() {
		
		$element.each(function() {
			$this = $(this)
			
			if($this.closest('[\\:for_model]').length) return
			
			
			// // If element was created in a :for loop, attach data from model
			if($this.closest('[for_copy]')) {
				let $parents = $this.add($this.parents())
				for(var y = 0; y < $parents.length; y++) {
					let $parent = $parents.eq(y)
					if($parent.attr('item_name')) eval("var " + $parent.attr('item_name') + " = " + JSON.stringify($parent.data($parent.attr('item_name'))) + ";")
					if($parent.attr('index_name')) eval("var " + $parent.attr('index_name') + " = " + $parent.attr($parent.attr('index_name')) + ";")
				}
			}


			// if(!$this.is(':visible')) return
			
			const attrs = $this[0].getAttributeNames().reduce(function(obj, key) { obj[key] = $this.attr(key); return obj; }, {});
					
					
			// Show/hide based on :if attribute
			let if_val = 1
			
			
			if(attrs[':else'] !== undefined || attrs[':elseif']) {
				
				
				let $curr_el = $this.prev()
				let x = 0
				
				// Look backwards until reaching a previous sibling that doesn't have if/elseif attr
				// If any of them resolve to true, hide this and stop checking
				while($curr_el.attr(':if') || $curr_el.attr(':elseif')) {
					try {
						if_val = eval($curr_el.attr(':if') || $curr_el.attr(':elseif'))
						if(if_val) {
							$this.hide()
							return
						}
					}
					catch(error) {
						console.log('else parse error:', $this);
					}
					$curr_el = $curr_el.prev()
				}
				
				// Otherwise, make element visible (if else or elseif == true)
				if(attrs[':elseif']) {
					try {
						if_val = eval($this.attr(':elseif'))
					}
					catch(error) {
						console.log('elseif parse error:', $this);
					}
					
					if(!if_val) {
						$this.hide()
						return
					}
				}
				$this.show()
				delete attrs[':elseif']
				delete attrs[':else']
			}
			
			
			else if(attrs[':if']) {
				
				try {
					if_val = eval($this.attr(':if'))
				}
				catch(error) {
					console.log('if parse error:', $this.attr(':if'));
				}
				
				if(if_val) $this.show()
				else {
					$this.hide()
					return
				}
				delete attrs[':if']
			}
			
			
	
			
			
			
			
					
			for(attr in attrs) {
				if(attr.substr(0,1) != ':' || attr == ':for') continue
				
				
				if(attr == ':text') {
					let text_val = eval($this.attr(':text'))
					if(text_val === false) text_val = 'false'
					$this.html(text_val)
				}
				
				
				else if(attr == ':class') {
					let class_obj = {}
					let class_str = $this.attr(attr)
					class_str = class_str.replace(/[{}]/g, '')
					class_str = class_str.split(',')
					
					for(let x = 0; x < class_str.length; x++) {
						let prop_array = class_str[x].split(":")
						try {
							class_obj[prop_array[0].trim()] = eval(prop_array[1])
						}
						catch(error) {
							console.log(attr, 'parse error:', $this, prop_array[0].trim(), prop_array[1]);
						}
						
					}
					
					for(let prop in class_obj) {
						if(class_obj[prop]) $this.addClass(prop)
						if(!class_obj[prop]) $this.removeClass(prop)
					}
					
				}
				
				else if(attr == ':style') {
					
				}
				
				else {
					let attr_val = eval($this.attr(attr))
					if(attr_val === false) attr_val = 'false'
					$this.attr(attr.substr(1), attr_val)				
				}
			}
			
			
			
			
		})
	
	}, 0)	
	
}


// Remove all for elements that 
function resetForLoops() {
	
	$('[for_copy]').remove()
	$('[\\:forr]').each(function() {
		$(this).attr(':for', $(this).attr(':forr'))
		$(this).removeAttr(':forr')
	})
}



function updateForLoops() {
	
	// Handle first one, then move on to next by running funciton again
	// Keep looping until there are not more :for elements
	
	$for_model = $('[\\:for]')
	if($for_model.length < 1) return
	
	$this = $for_model.eq(0)
	let model_id = Math.floor(Math.random() * 999999999);
	$this.attr(':for_model', model_id)
	$this.attr(':forr', $this.attr(':for'))
	$this.removeAttr(':for')
	$this.hide()
	
	// Don't process for loops inside of :for models
	if($this.parent().closest('[\\:for_model]').length) return 


	if($this.closest('[for_copy]')) {
		let $parents = $this.add($this.parents())
		for(var y = 0; y < $parents.length; y++) {
			let $parent = $parents.eq(y)
			if($parent.attr('item_name')) eval("var " + $parent.attr('item_name') + " = " + JSON.stringify($parent.data($parent.attr('item_name'))) + ";")
			if($parent.attr('index_name')) eval("var " + $parent.attr('index_name') + " = " + $parent.attr($parent.attr('index_name')) + ";")
		}
	}

	let for_str = $this.attr(':forr')
	let item_name = for_str.substr(0, for_str.indexOf(' in '))
	let index_name = ''
	item_name = item_name.replace(/[\(\)]/g, '')
	
	if(item_name.includes(',')) {
		item_name = item_name.split(',')
		index_name = item_name[1].trim()
		item_name = item_name[0].trim()
	}
	
	let arr = eval(for_str.substr(for_str.indexOf(' in ') + 4))
	
	for(let x = 0; x < arr.length; x++) {
		$copy = $this.clone().show()
		$copy.attr('for_copy', $this.attr(':for_model'))
		if(item_name) {
			$copy.attr('item_name', item_name)
			$copy.data(item_name, arr[x])
		}
		if(index_name) {
			$copy.attr('index_name', index_name)
			$copy.attr(index_name, x)
		}
		$copy.removeAttr(':for')
		$copy.removeAttr(':for_model')
		if(index_name) $copy.attr(index_name, x)
		if(index_name) $copy.attr(index_name, x)
		$copy.insertBefore($this)
		
	}

	updateForLoops()

}














// obj.a = 456;
// 
// setTimeout(function() {
// obj.a = 123
// }, 3000)




// let obj = { foo: "bar" };
// let objProxy = new Proxy(obj, {
// 	set: function(target, key, value) {
// 		console.log(`${key} set from ${obj.foo} to ${value}`);
// 		target[key] = value; return true; 
// 	}, 
// });



// const obj = {  
// 	fooValue: "bar",  
// 	get foo() {    
// 		return this.fooValue;  
// 	},  
// 	set foo(val) {
// 		this.fooValue = val;
// 		this.fooListener(val);  
// 	},  
// 	fooListener: function (val) {},  
// 	registerNewListener: function (externalListenerFunction) {
// 		this.fooListener = externalListenerFunction;  
// 	},
// };
// 
// obj.registerNewListener((val) => console.log(`New Value: ${val}`));



// Add tests UI to DOM and turn on Vue
jQuery(function($) {
	$('body').append('<div class="tests_app"><div is="tests_ui"></div></div>')

	qt.test_group("Group A")
	qt.test("a == 1")
	qt.test("a == 2")
	qt.test("a == 3")
	
	qt.test_group("Group B")
	qt.test("a == 1")
	qt.test("a == 2")
	qt.test("a == 3")
	
	
	bind_qt()	
	
	
})

