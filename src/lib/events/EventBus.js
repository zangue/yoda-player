class EventBus {
    constructor() {
        this.listeners = {};
    }

    _getListenerIdx (eventName, listener) {
        let eventListeners = this.listeners[eventName],
            i,
            idx = -1;

        if (!eventListeners || eventListeners.length === 0) {
            return idx;
        }

        for (i = 0; i < eventListeners.length; i++) {
            if (eventListeners[i] === listener) {
                idx = i;
                break;
            }
        }

        return idx;
    }

    subscribe(eventName, listener) {
        if (!eventName) {
            throw new Error("Event name cannot be null or undefined");
        }

        if (!listener || typeof(listener) !== "function") {
            throw new Error("Listener must be of type function.");
        }

        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }

        this.listeners[eventName].push(listener);

    }

    unsubscribe (eventName, listener) {
        let idx;

        if (!eventName || !listener || !this.listeners[eventName]) {
            return;
        }

        idx = this._getListenerIdx(eventName, listener);

        if (idx === -1) {
            return;
        }

        this.listeners[eventName].splice(idx, 1);
    }

    broadcast(eventName, args) {
        let eventListeners = this.listeners[eventName],
            i;

        if (!eventName || !this.listeners[eventName]) {
            return;
        }

        if (!args) {
            args = {};
        }

        for (i = 0; i < eventListeners.length; i++) {
            eventListeners[i].listener.call(args);
        }
    }

    reset () {
        this.listeners = {};
    }
}

export default EventBus;
