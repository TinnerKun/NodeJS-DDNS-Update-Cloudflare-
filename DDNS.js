require('events').EventEmitter.defaultMaxListeners = 0;
process.on('uncaughtException', function (err) {});
process.on('unhandledRejection', function (err) {});
const mygetip = ["http://checkip.amazonaws.com", "https://api.ipify.org", "http://icanhazip.com", "https://ifconfig.me/ip", "https://ip.seeip.org", "https://ipapi.co/ip/", "https://ipv4bot.whatismyipaddress.com/", "https://v4.ident.me/", "https://myexternalip.com/raw"]
Array.prototype.random = function () {
    return this[Math.floor((Math.random() * this.length))]
}
const fs = require("fs");
const re = require('request');
const readline = require('readline-sync');
let items = [],
    zones = [],
    dns_list = [],
    dns_id = [];
if (fs.existsSync("./data.json") && fs.existsSync("./key.json")) {
    const data = require("./data.json");
    const Token = require("./key.json");
    let ip = "",
        old_ip = "";
    startdns();
    setInterval(() => {
        startdns()
    }, 1000 * 60);

    function startdns() {
        re(mygetip.random(), (e, r, d) => {
            ip = d.replaceAll(/\s/g, '');
            if (ip !== old_ip) {
                old_ip = ip;
                re({
                    url: 'https://api.cloudflare.com/client/v4/zones/' + data.zone_id + '/dns_records/' + data.id,
                    method: "PUT",
                    body: JSON.stringify({
                        "content": ip
                    }),
                    headers: {
                        'X-Auth-Email': Token.EMAIL,
                        'X-Auth-Key': Token.KEY,
                        'content-type': 'application/json',
                    }
                })
                console.log("DDNS Update [" + old_ip + "] => [" + ip + "]")
            } else {
                console.log("Dns No Update")
            }

        })
    }

} else {
    console.log(`
    +-----------------------------------------------------------+
    |               ∙◆◦[ TinnerX DDNS Update ]◦◆∙               |
    +-----------------------------------------------------------+
    | เครื่องมือการทำ DDNS แบบอัตโนมือ หรือ สักอย่าง ที่เชื่อมกับ cloudflare |
    +-----------------------------------------------------------+
    |          เนื่อจากยังไม่มีการตั้งค้าจะทำการสร้างใหม่เลยละกัน          |
    +-----------------------------------------------------------+
    `)
    let email = readline.question("Email Cloudflare : ");
    console.log("Tip สามารถหา Key ได้ที่ https://dash.cloudflare.com/profile/api-tokens")
    let Key = readline.question("Origin CA Key : ", {
        hideEchoBack: false
    });
    re({
        url: 'https://api.cloudflare.com/client/v4/user',
        headers: {
            'X-Auth-Email': email,
            'X-Auth-Key': Key,
        }
    }, (e, r) => {
        if (r.statusCode == 200) {
            console.log("ยืนยันระบบ User ว่าผ่านเรียบร้อย")
            re({
                url: 'https://api.cloudflare.com/client/v4/zones',
                headers: {
                    'X-Auth-Email': email,
                    'X-Auth-Key': Key,
                }
            }, (e, r) => {
                let list = JSON.parse(r.body)["result"]
                for (let i = 0; i < list.length; i++) {
                    if (list[i]["status"] === "active") {
                        items[i] = list[i]["name"]
                        zones[i] = list[i]["id"]
                    }
                }
                countdomain = readline.keyInSelect(items, 'select domain : ');
                if (countdomain === -1) {
                    console.log("End")
                    process.exit()
                } else {
                    re({
                        url: 'https://api.cloudflare.com/client/v4/zones/' + zones[countdomain] + '/dns_records',
                        headers: {
                            'X-Auth-Email': email,
                            'X-Auth-Key': Key,
                        }
                    }, (e, r) => {
                        let dns_all = JSON.parse(r.body)["result"]
                        for (let i = 0; i < dns_all.length; i++) {
                            if (dns_all[i]["type"] === "A") {
                                dns_list[i] = dns_all[i]["name"]
                                dns_id[i] = dns_all[i]["id"]
                            }
                        }
                        countdns = readline.keyInSelect(dns_list, 'select dns : ');
                        if (countdns === -1) {
                            console.log("end")
                            process.exit()
                        } else {
                            let savedata = JSON.stringify(dns_all[countdns]);
                            fs.writeFileSync('data.json', savedata, function (err) {
                                if (err) throw err;
                            });
                            let savekey = JSON.stringify({
                                EMAIL: email,
                                KEY: Key
                            });
                            fs.writeFileSync('key.json', savekey, function (err) {
                                if (err) throw err;
                            });
                            console.log('Create data.json');
                            console.log('Create key.json');
                            console.log('บันทึกเรียบร้อย เข้ามาใหม่')
                        }
                    })
                }
            })
        } else {
            console.log("ยืนยันไม่ผ่าน Key ผิด หรือ Email ผิด โปรดลองอีกครั้ง")
            process.exit()
        }
    })
}