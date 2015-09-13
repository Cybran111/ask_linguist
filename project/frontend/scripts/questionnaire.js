require("domready")(function () {
    var React = require("react");
    var $ = require("npm-zepto");
    var _ = require("lodash");


    var Asker = React.createClass({
        displayName: "Asker",

        getSource: function (sourceList) {
            return sourceList.join(", ")
        },

        changeCurrentWord: function () {
            this.setState({currentEl: _.sample(this.state.words)})
        },

        getInitialState: function () {
            var words = this.props.initialWords.slice();
            var currentElement = _.sample(words);
            return {words: words, currentEl: currentElement, status: "", ifFail: false}
        },

        checkWord: function () {
            if (React.findDOMNode(this.refs.guessInput).value === this.state.currentEl.target) {
                _.pull(this.state.words, this.state.currentEl);
                if (this.state.words.length !== 0){
                    this.changeCurrentWord();
                    console.log("success");
                    React.findDOMNode(this.refs.guessInput).value = ""
                } else {
                    this.setState({status: "Finished!"})
                }
            } else {
                if (this.state.ifFail === true) {
                    this.setState({status: "", ifFail: false});
                    this.changeCurrentWord();
                    React.findDOMNode(this.refs.guessInput).value = ""
                } else {
                    this.setState({status: this.state.currentEl.target, ifFail: true});
                }
                console.log("fail")
            }
        },

        inputKeyPress: function (e) {
            if (e.which == '13'){ // enter
                this.checkWord();
            }
        },

        render: function () {
            return React.DOM.div(null,
                React.DOM.p(null, "Remaining: "+this.state.words.length),
                React.DOM.p(null, this.getSource(this.state.currentEl.source)),
                React.DOM.input({type: "text", ref: "guessInput", onKeyPress: this.inputKeyPress}),
                React.DOM.button({onClick: this.checkWord}, "Guess"),
                React.DOM.p(null, this.state.status)
            )
        }
    });


    $.get("/English-French/", function (result) {
            React.render(React.createElement(Asker, {initialWords: result.words}),
                document.getElementById("test"));
        }
    );
});
