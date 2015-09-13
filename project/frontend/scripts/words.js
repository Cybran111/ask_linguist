var Backbone = require("backbone");

var app = app || {};

(function () {
	'use strict';

	// Todo Model
	// ----------

	// Our basic **Todo** model has `title`, `order`, and `completed` attributes.
	app.Todo = Backbone.Model.extend({
		// Default attributes for the todo
		// and ensure that each todo created has `title` and `completed` keys.
		defaults: {
			word: "",
			translate: "",
            completed: false
		}

		// Toggle the `completed` state of this todo item.
		//toggle: function () {
		//	this.save({
		//		completed: !this.get('completed')
		//	});
		//}
	});
})();

(function () {
	'use strict';

	// Todo Collection
	// ---------------

	// The collection of todos is backed by *localStorage* instead of a remote
	// server.
	var Todos = Backbone.Collection.extend({
		// Reference to this collection's model.
		model: app.Todo,
        initialize: function(){
            this.url = '/English-French/'
        },

		// Save all of the todo items under the `"todos"` namespace.
		localStorage: new Backbone.LocalStorage('todos-react-backbone'),

		//// Filter down the list of all todo items that are finished.
		//completed: function () {
		//	return this.where({completed: true});
		//},

		// Filter down the list to only todo items that are still not finished.
		remaining: function () {
			return this.where({completed: false});
		},

		// We keep the Todos in sequential order, despite being saved by unordered
		// GUID in the database. This generates the next order number for new items.
		nextOrder: function () {
			return this.length ? this.last().get('order') + 1 : 1;
		},

		// Todos are sorted by their original insertion order.
		comparator: 'order'
	});

	// Create our global collection of **Todos**.
	app.todos = new Todos();
})();

(function () {
	'use strict';

	var ESCAPE_KEY = 27;
	var ENTER_KEY = 13;

	app.TodoItem = React.createClass({displayName: "TodoItem",
		getInitialState: function () {
			return {editText: this.props.todo.get('title')};
		},

		handleSubmit: function () {
			var val = this.state.editText.trim();
			if (val) {
				this.props.onSave(val);
				this.setState({editText: val});
			} else {
				this.props.onDestroy();
			}
			return false;
		},

		handleEdit: function () {
			// react optimizes renders by batching them. This means you can't call
			// parent's `onEdit` (which in this case triggeres a re-render), and
			// immediately manipulate the DOM as if the rendering's over. Put it as a
			// callback. Refer to app.jsx' `edit` method
			this.props.onEdit(function () {
				var node = React.findDOMNode(this.refs.editField);
				node.focus();
				node.setSelectionRange(node.value.length, node.value.length);
			}.bind(this));
			this.setState({editText: this.props.todo.get('title')});
		},

		handleKeyDown: function (event) {
			if (event.which === ESCAPE_KEY) {
				this.setState({editText: this.props.todo.get('title')});
				this.props.onCancel();
			} else if (event.which === ENTER_KEY) {
				this.handleSubmit();
			}
		},

		handleChange: function (event) {
			this.setState({editText: event.target.value});
		},

		render: function () {
			return (
				React.createElement("li", {className: classNames({
					completed: this.props.todo.get('completed'),
					editing: this.props.editing
				})},
					React.createElement("div", {className: "view"},
						React.createElement("input", {
							className: "toggle",
							type: "checkbox",
							checked: this.props.todo.get('completed'),
							onChange: this.props.onToggle}
						),
						React.createElement("label", {onDoubleClick: this.handleEdit},
							this.props.todo.get('title')
						),
						React.createElement("button", {className: "destroy", onClick: this.props.onDestroy})
					),
					React.createElement("input", {
						ref: "editField",
						className: "edit",
						value: this.state.editText,
						onBlur: this.handleSubmit,
						onChange: this.handleChange,
						onKeyDown: this.handleKeyDown}
					)
				)
			);
		}
	});
})();

/*jshint quotmark:false */
/*jshint white:false */
/*jshint trailing:false */
/*jshint newcap:false */
/*global React */

(function () {
	'use strict';

	app.TodoFooter = React.createClass({displayName: "TodoFooter",
		render: function () {
			var activeTodoWord = this.props.count === 1 ? 'item' : 'items';
			var clearButton = null;

			if (this.props.completedCount > 0) {
				clearButton = (
					React.createElement("button", {
						className: "clear-completed",
						onClick: this.props.onClearCompleted},
						"Clear completed"
					)
				);
			}

			var nowShowing = this.props.nowShowing;
			return (
				React.createElement("footer", {className: "footer"},
					React.createElement("span", {className: "todo-count"},
						React.createElement("strong", null, this.props.count), " ", activeTodoWord, " left"
					),
					React.createElement("ul", {className: "filters"},
						React.createElement("li", null,
							React.createElement("a", {
								href: "#/",
								className: classNames({selected: nowShowing === app.ALL_TODOS})},
									"All"
							)
						),
						' ',
						React.createElement("li", null,
							React.createElement("a", {
								href: "#/active",
								className: classNames({selected: nowShowing === app.ACTIVE_TODOS})},
									"Active"
							)
						),
						' ',
						React.createElement("li", null,
							React.createElement("a", {
								href: "#/completed",
								className: classNames({selected: nowShowing === app.COMPLETED_TODOS})},
									"Completed"
							)
						)
					),
					clearButton
				)
			);
		}
	});
})();




/*jshint quotmark:false */
/*jshint white:false */
/*jshint trailing:false */
/*jshint newcap:false */
/*global React, Backbone */

(function () {
	'use strict';

	app.ALL_TODOS = 'all';
	app.ACTIVE_TODOS = 'active';
	app.COMPLETED_TODOS = 'completed';
	var TodoFooter = app.TodoFooter;
	var TodoItem = app.TodoItem;

	var ENTER_KEY = 13;

	// An example generic Mixin that you can add to any component that should
	// react to changes in a Backbone component. The use cases we've identified
	// thus far are for Collections -- since they trigger a change event whenever
	// any of their constituent items are changed there's no need to reconcile for
	// regular models. One caveat: this relies on getBackboneCollections() to
	// always return the same collection instances throughout the lifecycle of the
	// component. If you're using this mixin correctly (it should be near the top
	// of your component hierarchy) this should not be an issue.
	var BackboneMixin = {
		componentDidMount: function () {
			// Whenever there may be a change in the Backbone data, trigger a
			// reconcile.
			this.getBackboneCollections().forEach(function (collection) {
				// explicitly bind `null` to `forceUpdate`, as it demands a callback and
				// React validates that it's a function. `collection` events passes
				// additional arguments that are not functions
				collection.on('add remove change', this.forceUpdate.bind(this, null));
			}, this);
		},

		componentWillUnmount: function () {
			// Ensure that we clean up any dangling references when the component is
			// destroyed.
			this.getBackboneCollections().forEach(function (collection) {
				collection.off(null, null, this);
			}, this);
		}
	};

	var TodoApp = React.createClass({displayName: "TodoApp",
		mixins: [BackboneMixin],
		getBackboneCollections: function () {
			return [this.props.todos];
		},

		getInitialState: function () {
			return {editing: null};
		},

		componentDidMount: function () {
			var Router = Backbone.Router.extend({
				routes: {
					'': 'all',
					'active': 'active',
					'completed': 'completed'
				},
				all: this.setState.bind(this, {nowShowing: app.ALL_TODOS}),
				active: this.setState.bind(this, {nowShowing: app.ACTIVE_TODOS}),
				completed: this.setState.bind(this, {nowShowing: app.COMPLETED_TODOS})
			});

			new Router();
			Backbone.history.start();

			this.props.todos.fetch();
		},

		componentDidUpdate: function () {
			// If saving were expensive we'd listen for mutation events on Backbone and
			// do this manually. however, since saving isn't expensive this is an
			// elegant way to keep it reactively up-to-date.
			this.props.todos.forEach(function (todo) {
				todo.save();
			});
		},

		handleNewTodoKeyDown: function (event) {
			if (event.which !== ENTER_KEY) {
				return;
			}

			var val = React.findDOMNode(this.refs.newField).value.trim();
			if (val) {
				this.props.todos.create({
					title: val,
					completed: false,
					order: this.props.todos.nextOrder()
				});
				React.findDOMNode(this.refs.newField).value = '';
			}

			event.preventDefault();
		},

		toggleAll: function (event) {
			var checked = event.target.checked;
			this.props.todos.forEach(function (todo) {
				todo.set('completed', checked);
			});
		},

		edit: function (todo, callback) {
			// refer to todoItem.jsx `handleEdit` for the reason behind the callback
			this.setState({editing: todo.get('id')}, callback);
		},

		save: function (todo, text) {
			todo.save({title: text});
			this.setState({editing: null});
		},

		cancel: function () {
			this.setState({editing: null});
		},

		clearCompleted: function () {
			this.props.todos.completed().forEach(function (todo) {
				todo.destroy();
			});
		},

		render: function () {
			var footer;
			var main;
			var todos = this.props.todos;

			var shownTodos = todos.filter(function (todo) {
				switch (this.state.nowShowing) {
				case app.ACTIVE_TODOS:
					return !todo.get('completed');
				case app.COMPLETED_TODOS:
					return todo.get('completed');
				default:
					return true;
				}
			}, this);

			var todoItems = shownTodos.map(function (todo) {
				return (
					React.createElement(TodoItem, {
						key: todo.get('id'),
						todo: todo,
						onToggle: todo.toggle.bind(todo),
						onDestroy: todo.destroy.bind(todo),
						onEdit: this.edit.bind(this, todo),
						editing: this.state.editing === todo.get('id'),
						onSave: this.save.bind(this, todo),
						onCancel: this.cancel}
					)
				);
			}, this);

			var activeTodoCount = todos.reduce(function (accum, todo) {
				return todo.get('completed') ? accum : accum + 1;
			}, 0);

			var completedCount = todos.length - activeTodoCount;

			if (activeTodoCount || completedCount) {
				footer =
					React.createElement(TodoFooter, {
						count: activeTodoCount,
						completedCount: completedCount,
						nowShowing: this.state.nowShowing,
						onClearCompleted: this.clearCompleted}
					);
			}

			if (todos.length) {
				main = (
					React.createElement("section", {className: "main"},
						React.createElement("input", {
							className: "toggle-all",
							type: "checkbox",
							onChange: this.toggleAll,
							checked: activeTodoCount === 0}
						),
						React.createElement("ul", {className: "todo-list"},
							todoItems
						)
					)
				);
			}

			return (
				React.createElement("div", null,
					React.createElement("header", {className: "header"},
						React.createElement("h1", null, "todos"),
						React.createElement("input", {
							ref: "newField",
							className: "new-todo",
							placeholder: "What needs to be done?",
							onKeyDown: this.handleNewTodoKeyDown,
							autoFocus: true}
						)
					),
					main,
					footer
				)
			);
		}
	});

	React.render(
		React.createElement(TodoApp, {todos: app.todos}),
		document.getElementsByClassName('todoapp')[0]
	);
})();
