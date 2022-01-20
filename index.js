function remove_strings(json_text) {
    // Remove all escaped ", then remove all "..."
    return json_text.replace(/\\"/g, "").replace(/"[^"]+"/g, "");
}

// Converted from the JSON railroad diagram by slackwing at https://stackoverflow.com/a/13340826
const JSON_NUMBER_RE = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

// Extract just the JSON numbers from some JSON text
function get_numbers(json_text) {
    const text_without_strings = remove_strings(json_text);
    const strings = [];
    for (const match of text_without_strings.matchAll(JSON_NUMBER_RE)) {
        strings.push(match[0]);
    }
    return strings;
}

function number_reviver(numbers, idx, value) {
    // We always consult the number texts to see whether the text has a [\.eE],
    // indicate that it should be a `number` instead of `bigint`.
    const text = numbers[idx];
    if (/[\.eE]/.test(text)) {
        // Some runtime validation catch JavaScript runtimes that might call
        // the reviver in an order different from the order in which the keys appear
        // in the JSON text. This is expected to never fail and can be removed if
        // performance is paramount.
        if (value != Number(text)) {
            throw Error(`number mismatch while parsing: value=${value}, text=${text}`);
        }
        return value;
    }
    const bigint = BigInt(text);
    // Some partial runtime validation catch JavaScript runtimes that might call
    // the reviver in an order different from the order in which the keys appear
    // in the JSON text. This is expected to never fail and can be removed if
    // performance is paramount.
    if (value >= Number.MIN_SAFE_INTEGER && value <= Number.MAX_SAFE_INTEGER) {
        if (bigint != BigInt(value)) {
            throw Error(`bigint mismatch while parsing: value=${bigint}, text=${text}`);
        }
    }
    return bigint;
}

// Like JSON.parse, but parse all numbers that lack `[\.eE]` to `bigint` instead of `number`.
//
// If you have JSON with values that flap between decimal and non-decimal, you must
// either call `Number(...)` to convert them to a `number`, or fix the JSON on the
// other end to emit `.0` on numbers intended to be decimal.
export function parse(text, reviver) {
    const numbers = get_numbers(text);

    let idx = 0;
    return JSON.parse(text, (key, value) => {
        if (typeof value == "number") {
            value = number_reviver(numbers, idx, value);
            idx += 1;
        }
        if (typeof reviver == "function") {
            return reviver(key, value);
        }
        return value;
    });
}
