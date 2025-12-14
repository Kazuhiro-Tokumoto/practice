let a:bigint = 2n
let b:bigint = 1024n
let c:bigint = a ** b
console.log(c)
modpow(2n, 1024n, 1009n)
console.log(modpow(2n, 1024n, 1009n))

import {modpow} from "./modpow.js"