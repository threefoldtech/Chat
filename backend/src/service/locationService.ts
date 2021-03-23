const { exec } = require('child_process');

export const getMyLocation = (): Promise<string> => {
    return new Promise((resolve, reject) => {
        //@ts-ignore
        exec(
            "yggdrasilctl  -v getSelf | sed -n -e 's/^.*IPv6 address.* //p'",
            (error: any, stdout: any, stderr: any) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                    return reject();
                }
                if (stderr) {
                    console.log(`stderr: ${stderr}`);
                    return reject();
                }
                const address = stdout.replace(/(\r\n|\n|\r)/gm, '').trim();
                resolve(address);
            }
        );
    });
};
