function clamp(v, min, max) {
    return Math.max(min, Math.min(v, max));
}

const roundNearest = (value, nearest) => Math.round(value / nearest) * nearest;

class UIDial extends HTMLElement {
    #events = {
        onChange: new Event("change"),
        onInput: new Event("input"),
    };

    #pointerMoveBinded = this.#pointerMove.bind(this);
    #pointerStartBinded = this.#pointerStart.bind(this);
    #pointerEndBinded = this.#pointerEnd.bind(this);
    #anchor = NaN;
    #anchorValue = NaN;
    #value = 0;

    constructor() {
        super();
    }

    get valueInPercentage() {
        if (this.bipolar === "true") {
            let v = this.#value / (2 * this.max);
            return clamp(v, -1, 1);
        } else {
            let v = (this.#value - this.min) / (this.max - this.min);
            return clamp(v, 0, 1);
        }
    }

    get value() {
        return this.#value;
    }

    set value(newValue) {
        if (this.bipolar === "true") {
            newValue = clamp(newValue, -this.max, this.max);
            newValue = roundNearest(newValue, this.step);
        } else {
            newValue = clamp(newValue, this.min, this.max);
            newValue = roundNearest(newValue, this.step);
        }

        this.#value = newValue;
        this.style.setProperty("--progress", this.valueInPercentage);
        this.dispatchEvent(this.#events.onInput);
    }

    #updateValue(newValueInPercentage) {
        if (this.bipolar === "true") {
            newValueInPercentage = clamp(newValueInPercentage, -1, 1);
            this.value = newValueInPercentage * this.max * 2;
        } else {
            newValueInPercentage = clamp(newValueInPercentage, 0, 1);
            this.value = newValueInPercentage * (this.max - this.min) + this.min;
        }
    }

    attributeChangedCallback() {
        this.#updateAttributes();
    }

    static get observedAttributes() {
        return ["bipolar", "value", "min", "max", "step", "reverse", "axis"];
    }

    connectedCallback() {
        this.#updateAttributes();
        this.#createComponent();
        this.addEventListener("mousedown", this.#pointerStartBinded);
        this.addEventListener("touchstart", this.#pointerStartBinded);
    }

    disconnectedCallback() {
        this.removeEventListener("mousedown", this.#pointerStartBinded);
        this.removeEventListener("touchstart", this.#pointerStartBinded);
    }

    #updateAttributes() {
        this.dataset.animate = "true";
        this.step = parseFloat(this.getAttribute("step")) || 1;
        this.bipolar = this.getAttribute("bipolar") || "false";
        this.reverse = this.getAttribute("reverse") || "false";
        this.axis = this.getAttribute("axis")?.toLowerCase() || "y";
        this.precision = parseFloat(this.getAttribute("precision")) || 200;
        this.min = parseFloat(this.getAttribute("min")) || 0;
        this.max = Math.max(this.getAttribute("max") || 100, this.min);
        this.value = parseFloat(this.getAttribute("value")) || 0;
        setTimeout(() => {
            this.dataset.animate = "false";
        }, 200);
    }

    #createComponent() {
        this.setAttribute("type", "range");
        this.innerHTML = `
            <svg class="container" viewbox="0 0 100 100">
            <circle class="track" pathlength="100" cx="50" cy="50"></circle>
            <circle class="value" pathlength="100" cx="50" cy="50"></circle>
            </svg>
        `;
    }

    #pointerStart(e) {
        if (e.cancelable) {
            e.preventDefault();
        }
        let x = e.pageX || e.touches[0]?.pageX;
        let y = e.pageY || e.touches[0]?.pageY;
        this.#anchor = this.axis === "x" ? -x : y;
        this.#anchorValue = this.valueInPercentage;

        window.addEventListener("mousemove", this.#pointerMoveBinded);
        window.addEventListener("touchmove", this.#pointerMoveBinded);
        window.addEventListener("mouseup", this.#pointerEndBinded);
        window.addEventListener("touchend", this.#pointerEndBinded);
    }

    #pointerMove(e) {
        let x = e.pageX || (e.touches && e.touches[0]?.pageX) || this.#anchor;
        let y = e.pageY || (e.touches && e.touches[0]?.pageY) || this.#anchor;
        let delta = ((this.axis === "x" ? -x : y) - this.#anchor) / this.precision;
        delta *= this.reverse === "true" ? -1 : 1;
        this.#updateValue(this.#anchorValue - delta);
    }

    #pointerEnd() {
        this.dispatchEvent(this.#events.onChange);
        window.removeEventListener("mousemove", this.#pointerMoveBinded);
        window.removeEventListener("touchmove", this.#pointerMoveBinded);
        window.removeEventListener("mouseup", this.#pointerEndBinded);
        window.removeEventListener("touchend", this.#pointerEndBinded);
    }
}

customElements.define("ui-dial", UIDial);
