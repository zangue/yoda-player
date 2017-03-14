const DEFAULT_GROUP = "global";

class EventBus {
    constructor () {
        this.listeners = {};
        // listeners.group.eventName.list
    }

    _getListenerIdx (eventName, callback, scope, group) {
        let listenerGroup = this.listeners[group] || {};
        let eventListeners = listenerGroup[eventName],
            i,
            idx = -1;

        if (!eventListeners || eventListeners.length === 0) {
            return idx;
        }

        for (i = 0; i < eventListeners.length; i++) {
            if (eventListeners[i].callback === callback &&
                (!scope || scope === eventListeners[i].scope)) {
                idx = i;
                break;
            }
        }

        return idx;
    }

    subscribe (eventName, callback, scope, group = DEFAULT_GROUP) {
        let listener,
            idx;

        if (!eventName) {
            throw new Error("Event name cannot be null or undefined");
        }

        if (!callback || typeof(callback) !== "function") {
            throw new Error("Listener must be of type function.");
        }

        idx = this._getListenerIdx(eventName, callback, scope, group);

        // Already subscribed
        if (idx >= 0) return;

        listener = {
            callback: callback,
            scope: scope
        };

        this.listeners[group] = this.listeners[group] || {};
        this.listeners[group][eventName] = this.listeners[group][eventName] || [];
        this.listeners[group][eventName].push(listener);

    }

    unsubscribe (eventName, callback, scope, group = DEFAULT_GROUP) {
        let idx;

        if (!eventName || !callback || !this.listeners[eventName]) {
            return;
        }

        idx = this._getListenerIdx(eventName, callback, scope, group);

        if (idx === -1) return;

        this.listeners[group][eventName].splice(idx, 1);
    }

    broadcast (eventName, args, group = DEFAULT_GROUP) {
        let eventListeners;

        if (Object.keys(this.listeners).length === 0)
            return;

        if (Object.keys(this.listeners[group]).length === 0)
            return;

        if (!eventName)
            return;

        eventListeners = this.listeners[group][eventName]

        if (eventListeners.length === 0) {
            return;
        }

        args = args || {};

        eventListeners.forEach(function (listener) {
            listener.callback.call(listener.scope, args);
        });
    }

    reset () {
        this.listeners = {};
    }
}

let eventBus = new EventBus();
export default eventBus;
