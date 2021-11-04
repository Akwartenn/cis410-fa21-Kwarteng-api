const bcrypt = require("bcryptjs");

let hashPassword = bcrypt.hashSync('csu123');

console.log(hashPassword);

let hashTest = bcrypt.compareSync('csu123',hashPassword);

console.log(hashTest)
