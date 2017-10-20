import * as React from "react"
import * as ReactDOM from "react-dom"

import { Provider } from "react-redux"
import { applyMiddleware, bindActionCreators, compose, createStore } from "redux"
import thunk from "redux-thunk"

import { RootComponent } from "./RootComponent"

// import * as Actions from "./Actions"
import * as ActionCreators from "./ActionCreators"
import * as Events from "./Events"
import { reducer } from "./Reducer"
import * as UnboundSelectors from "./Selectors"
import { getActiveDefinition } from "./selectors/DefinitionSelectors"
import * as State from "./State"

import { editorManager } from "./../Services/EditorManager"
import { focusManager } from "./../Services/FocusManager"
import { listenForDiagnostics } from "./../Services/Language"
import { windowManager } from "./../Services/WindowManager"

import { PluginManager } from "./../Plugins/PluginManager"

import { NeovimEditor } from "./../Editor/NeovimEditor"

export const events = Events.events

const defaultState = State.createDefaultState()

require("./components/common.less") // tslint:disable-line no-var-requires

const composeEnhancers = window["__REDUX_DEVTOOLS_EXTENSION__COMPOSE__"] || compose // tslint:disable-line no-string-literal
const enhancer = composeEnhancers(
    applyMiddleware(thunk),
)

export const store = createStore(reducer, defaultState, enhancer)

export const Actions: typeof ActionCreators = bindActionCreators(ActionCreators as any, store.dispatch)

// TODO: Is there a helper utility like `bindActionCreators`, but for selectors?
export const Selectors = {
    areCompletionsVisible: () => UnboundSelectors.areCompletionsVisible(store.getState() as any),
    getSelectedCompletion: () => UnboundSelectors.getSelectedCompletion(store.getState() as any),
    getActiveDefinition: () => getActiveDefinition(store.getState() as any)
}

export function init(pluginManager: PluginManager, args: any): void {
    render(defaultState, pluginManager, args)
}

const updateViewport = () => {
    const width = document.body.offsetWidth
    const height = document.body.offsetHeight

    Actions.setViewport(width, height)
}

listenForDiagnostics()

window.addEventListener("resize", updateViewport)
updateViewport()

function render(_state: State.IState, pluginManager: PluginManager, args: any): void {
    const hostElement = document.getElementById("host")

    const editor = new NeovimEditor(pluginManager)
    editor.init(args)

    editorManager.setActiveEditor(editor)

    windowManager.split(0, editor)

    ReactDOM.render(
        <Provider store={store}>
            <RootComponent windowManager={windowManager}/>
        </Provider>, hostElement)
}

document.body.addEventListener("click", () => focusManager.enforceFocus())
