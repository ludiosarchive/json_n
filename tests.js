import {test} from 'zora';
import {parse} from './index.js'

// https://stackoverflow.com/a/12646864
function shuffle_array(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

test(`empty objects`, (A) => {
    A.eq(parse('{}'), {});
    A.eq(parse('[]'), []);
})

test(`not confused by numbers in strings`, (A) => {
    A.eq(parse('{"a": "999", "b": 123}'), {"a": "999", "b": 123n});
    A.eq(parse('{"a": "9\\" 9,\\"9", "b": 123}'), {"a": "9\" 9,\"9", "b": 123n});
})

test(`this JavaScript engine calls the reviver with values in the same order as they are in the source text`, (A) => {
    let total = 1;
    while (total < 5000) {
        //console.log(`total = ${total}`);
        let n = total;
        const segments = [];
        while (n--) {
            segments.push(`"${n}": ${n}.0`);
        }
        shuffle_array(segments);
        const text = `{${segments.join(", ")}}`;
        A.eq(parse(text), JSON.parse(text));

        total += 1;
    }
})

test(`correct numbers are parsed from arrays`, (A) => {
    A.eq(parse(`[
        -1.5e+100,
        -1e+100,
        -1e100,
        -9007199254740993,
        -9007199254740992,
        -9007199254740991,
        -9007199254740990,
        -1.0,
        -1,
        -1.5e-100,
        -1e-100,
        -0,
        0,
        1e-100,
        1.5e-100,
        1,
        1.0,
        9007199254740990,
        9007199254740991,
        9007199254740992,
        9007199254740993,
        1e100,
        1e+100,
        1.5e+100
    ]`), [
        -1.5e+100,
        -1e+100,
        -1e100,
        -9007199254740993n,
        -9007199254740992n,
        -9007199254740991n,
        -9007199254740990n,
        -1.0,
        -1n,
        -1.5e-100,
        -1e-100,
        0n,
        0n,
        1e-100,
        1.5e-100,
        1n,
        1.0,
        9007199254740990n,
        9007199254740991n,
        9007199254740992n,
        9007199254740993n,
        1e100,
        1e+100,
        1.5e+100
    ]);
})
