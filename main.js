const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

function getToken() {
    return new Promise(resolve => {    
        readline.question("Enter Access Token: ", (token) => {
            resolve(token);
            readline.close();
        });
    });   
}

let deviceHasAq = (device) => {
    let aqComponents = device.components.filter((comp) => comp.functions?.includes("iaq"))
    return aqComponents.length > 0
}

let getAqForDevicesInSite = async (sites, token) => {
    return Promise.all(sites.map( async site => {
        return {
            ...site, devices: await Promise.all(site.devices.map(async device => {
                return fetch(`https://api.swidget.com/api/v1/sites/${site.siteId}/devices/${device.deviceId}/aq/iaq`,{
                    headers: {
                        Authorization: token
                    }
                }).then(res => {
                    return res.json()
                })
                .then(res => {
                   return  {
                        "deviceId": device.deviceId,
                        "iaq": res.iaq
                    }
                })
            }))
        }
    }));
}

let main = async () => {
    let token = testToken;
    let getSitesResp = await fetch("https://api.swidget.com/api/v1/sites", {
        method: "GET",
        headers: {
            Authorization: token
        }
    });

    if (!getSitesResp.ok) return;
    let sites = await getSitesResp.json();
    for (let site of sites) {
        site.devices = site.devices.filter(d => deviceHasAq(d))
    }
    while (true) {
        let iaqData = await getAqForDevicesInSite(sites, token)
        for (let site of iaqData) {
            let sortedDevices = site.devices.sort((a, b) => ('' + a.deviceId).localeCompare(b.deviceId))
            console.clear()
            for (let device of sortedDevices) {
                console.log(`Device: ${device.deviceId}, IAQ: ${device.iaq}`)
            }
        }
        await delay(10000)
    }
}

main();