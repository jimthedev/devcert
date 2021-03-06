import commandExists = require('command-exists');
import installAuthority from './install-authority';
import { generateOpensslConf, generateRootCertificate, generateSignedCertificate, tmpClear } from './openssl';
import fs = require('fs');

export default async function generateDevCert (commonName: string) {
  if (!commandExists.sync('openssl'))
    throw new Error('Unable to find openssl - make sure it is installed and available in your PATH');
  if (!commonName.match(/^(.|\.){1,64}$/))
    throw new Error(`Invalid Common Name ${commonName}.`);
  try {
    const opensslConfPath = generateOpensslConf(commonName);
    const { rootKeyPath, rootCertPath } = await generateRootCertificate(commonName, opensslConfPath);
    await installAuthority(commonName, rootCertPath);
    const { keyPath, certPath, caPath } = generateSignedCertificate(commonName, opensslConfPath, rootKeyPath, rootCertPath);
    const key = fs.readFileSync(keyPath).toString();
    const cert = fs.readFileSync(certPath).toString();
    const ca = fs.readFileSync(caPath).toString();
    return { key, cert, ca };
  }
  finally {
    // clear all tmp files (including root cert!)
    tmpClear();
  }
}