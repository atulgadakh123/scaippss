// generate-vapid.js (temp file run with node)
import webpush from "web-push";
const keys = webpush.generateVAPIDKeys();
console.log(keys);
// save the output: publicKey and privateKey
