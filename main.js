import Yoda from "./src/Yoda.js";

var context = window || global;

var yoda = context.yoda = {};
if (!yoda) {
    yoda = context.yoda = {}
}

yoda.Player = Yoda;

export default yoda;
export {Yoda};
