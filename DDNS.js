let mygetip = ["http://checkip.amazonaws.com", "https://api.ipify.org", "http://icanhazip.com", "https://ifconfig.me/ip", "https://ip.seeip.org", "https://ipapi.co/ip/", "https://ipv4bot.whatismyipaddress.com/", "https://v4.ident.me/", "https://myexternalip.com/raw"]
let v4 = "https://api.cloudflare.com/client/v4/";
const fs = require("fs");
const re = require('request');
const readline = require('readline-sync');
let items = [],zones = [],dns_list = [],dns_id = [];
if (fs.existsSync("./data.json")) {
    const data = require("./data.json");
    let ip = "",old_ip = "";
    startdns();
    setInterval(startdns,60000);
    function startdns() {
		try {
		re(mygetip[Math.floor((Math.random() * mygetip.length))] , (e, r, d) => {
            if(d === undefined) return console.log("Error : undefined -> Restart Function"), startdns()
			ip = d.replaceAll(/[a-z,\s]/g, '')
			if (ip === '') return console.log("Error : Replace -> Restart Function"), startdns()
            if (ip.length > 15) return console.log("Error : IP Limit Lenght -> Restart Function"), startdns() 
            if (ip != old_ip) {
                console.log("DDNS Update [" + old_ip + "] => [" + ip + "]")
                re({
                    url: v4 + 'zones/' + data.Memory.zone_id + '/dns_records/' + data.Memory.id,
                    method: "PUT",
                    body: JSON.stringify({
                        "type": data.Memory.type,
                        "name": data.Memory.name,
                        "content": ip
                    }),
                    headers: {
                        'X-Auth-Email': data.EMAIL,
                        'X-Auth-Key': data.KEY,
                        'content-type': 'application/json',
                    }
                })
                old_ip = ip;
            } else {
                console.log("DNS No Update")
            }

        })
		} catch (error) {
			console.log("Error Catch")
		} 
        
    }

} else {
    console.log('\n+--------------------------------------------------------------+\n|                 ∙◆◦[ TinnerX DDNS Update ]◦◆∙                |\n+--------------------------------------------------------------+\n| An automated DDNS tool or something connected to cloudflare. |\n+--------------------------------------------------------------+\n|    Since there is no setting up, we will create a new one.   |\n+--------------------------------------------------------------+\n')
    let email = readline.question("Email Cloudflare : ");
    console.log("Tip You can find the key at https://dash.cloudflare.com/profile/api-tokens")
    let Key = readline.question("Global API Key : ", {
        hideEchoBack: false
    });
    re({
        url: v4 + 'user',
        headers: {
            'X-Auth-Email': email,
            'X-Auth-Key': Key,
        }
    }, (e, r) => {
        if (r.statusCode == 200) {
            console.log("Verify that the user system has passed successfully.")
            re({
                url: v4 + 'zones',
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
                    console.log("The domain is not selected? Choose other than")
                    process.exit()
                } else {
                    re({
                        url: v4 + 'zones/' + zones[countdomain] + '/dns_records',
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
                        countdns = readline.keyInSelect(dns_list, 'select DNS or Record : ');
                        if (countdns === -1) {
                            console.log("The Record is not selected? Choose other than")
                            process.exit()
                        } else {

                            let savedata = JSON.stringify({Memory: dns_all[countdns],EMAIL: email,KEY: Key});
                            fs.writeFileSync('data.json', savedata, function (err) {
                                if (err) throw err;
                            });
                            console.log('Create data.json');
                            console.log('Saved successfully open a new program')
                        }
                    })
                }
            })
        } else {
            console.log("Failed to confirm via wrong key or wrong email, please try again.")
            process.exit()
        }
    })
}
