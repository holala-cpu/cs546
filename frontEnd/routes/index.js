var express = require('express');
var router = express.Router();

const { FileSystemWallet, Gateway } = require('fabric-network');
const path = require('path');
const ccpPath = path.resolve(__dirname,  '..',  '..',  '..',  '..',  '..',  'first-network', 'connection-org1.json');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('home', { title : 'BLOCKCHAIN CONNECTION PAGE ' });
});

router.post('/connection', function(req, res, next) {
  //console.log("Welldone !")
  const crypto = require('crypto');

  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
  });
    
  var my_public = publicKey.export({type: 'spki', format: 'pem'});
  var my_private = privateKey;
  
  var host = "127.0.0.1";
  var sdn_port = 50007;
  
  ////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////    CLI-UDP PART   /////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////
  var udp = require('dgram');
  // creating a client socket
  var client = udp.createSocket('udp4');
  var port = 8080;
  var data_cnt = 0;
  var data;
  var usr1_pub_pem;
  var token;
  var time = 100;
  
  client.on('message',function(msg, info){
      if(data_cnt == 1){
        console.log('Random number token has been received from SERVER ! ');
        data_cnt++;
        var token_tot = msg.toString().split(",")
        usr1_pub_pem = token_tot[0];
        token = token_tot[1];
        var message = token + "," + host + "," + time + "," + Buffer.from(my_public);
        const sign = crypto.createSign('SHA256');
        sign.write(message);
        sign.end();
        const signature = sign.sign(my_private, 'hex');      
        client.send(signature, sdn_port, host, function(error){
          if(error){
            client.close();
          }
          else{
            console.log('Signature has been sent to SDN  !!!');     
            client.send(my_public, sdn_port, host, function(error){
              if(error){
                client.close();
              }
              else{
                console.log('Public Key has been sent to SDN  !!!');
              }
            });                              
          }
        });                
      }
      else if(data_cnt == 2){
        if("OK"== msg.toString()){
          res.render('blockChain', { title : 'Welcome to the LEDGER ' });
          console.log("OK")
        }else{
          res.render('Nope', { title : 'You shall not PASS !!' });   
        }
      }          
  });
  
  if(data_cnt == 0){
      data = Buffer.from('This is client');
      client.send(data, port, host, function(error){
          data_cnt ++;   
          if(error){
              client.close();
          }
          else{
              console.log('Initial message has been sent to SERVER !!!');
          }
      });    
  }
});


router.get('/cars', async (req, res) => {
  try {
    const walletPath = path.join(process.cwd(), '..','..','wallet');
    const wallet = new FileSystemWallet(walletPath);
    const userExists = await wallet.exists('user1');
    if (!userExists) {
      res.json({status: false, error: {message: 'User not exist in the wallet'}});
      return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccpPath, { wallet, identity: 'user1', discovery: { enabled: true, asLocalhost: true } });
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('fabcar');
    const result = await contract.evaluateTransaction('queryAllCars');
    res.json({status: true, cars: JSON.parse(result.toString())});
  } catch (err) {
    res.json({status: false, error: err});
  }
});




router.get('/cars/key', async (req, res) => {
	try {
	  const walletPath = path.join(process.cwd(), '..', '..','wallet');
	  const wallet = new FileSystemWallet(walletPath);
	  const userExists = await wallet.exists('user1');
	  if (!userExists) {
		res.json({status: false, error: {message: 'User not exist in the wallet'}});
		return;
	  }


	  const gateway = new Gateway();
	  await gateway.connect(ccpPath, { wallet, identity: 'user1', discovery: { enabled: true, asLocalhost: true } });
	  const network = await gateway.getNetwork('mychannel');
	  const contract = network.getContract('fabcar');
	  const result = await contract.evaluateTransaction('queryCar', req.query.key);
	  res.json({status: true, car: JSON.parse(result.toString())});
	} catch (err) {
	  res.json({status: false, error: err});
	}
});


router.post('/cars', async (req, res) => {
  if ((typeof req.body.key === 'undefined' || req.body.key === '') ||
      (typeof req.body.make === 'undefined' || req.body.make === '') ||
      (typeof req.body.model === 'undefined' || req.body.model === '') ||
      (typeof req.body.color === 'undefined' || req.body.color === '') ||
      (typeof req.body.owner === 'undefined' || req.body.owner === '')) {
    res.json({status: false, error: {message: 'Missing body.'}});
    return;
  }

  try {
    const walletPath = path.join(process.cwd(),'..','..', 'wallet');
    const wallet = new FileSystemWallet(walletPath);
    const userExists = await wallet.exists('user1');
    if (!userExists) {
      res.json({status: false, error: {message: 'User not exist in the wallet'}});
      return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccpPath, { wallet, identity: 'user1', discovery: { enabled: true, asLocalhost: true } });
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('fabcar');
    await contract.submitTransaction('createCar', req.body.key, req.body.make, req.body.model, req.body.color, req.body.owner);
    res.json({status: true, message: 'Transaction (create car) has been submitted.'})
  } catch (err) {
    res.json({status: false, error: err});
  }
});


router.post('/cars/changeowner', async (req, res) => {
  if ((typeof req.body.key === 'undefined' || req.body.key === '') ||
      (typeof req.body.owner === 'undefined' || req.body.owner === '')) {
    res.json({status: false, error: {message: 'Missing body.'}});
    return;
  }

  try {
    const walletPath = path.join(process.cwd(),'..','..', 'wallet');
    const wallet = new FileSystemWallet(walletPath);
    const userExists = await wallet.exists('user1');
    if (!userExists) {
      res.json({status: false, error: {message: 'User not exist in the wallet'}});
      return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccpPath, { wallet, identity: 'user1', discovery: { enabled: true, asLocalhost: true } });
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('fabcar');
    await contract.submitTransaction('changeCarOwner', req.body.key, req.body.owner);
    res.json({status: true, message: 'Transaction (change car owner) has been submitted.'})
  } catch (err) {
    res.json({status: false, error: err});
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.post('/cars/changecolor', async (req, res) => {
  if ((typeof req.body.key === 'undefined' || req.body.key === '') ||
      (typeof req.body.color === 'undefined' || req.body.color === '')) {
    res.json({status: false, error: {message: 'Missing body.'}});
    return;
  }

  try {
    const walletPath = path.join(process.cwd(),'..','..', 'wallet');
    const wallet = new FileSystemWallet(walletPath);
    const userExists = await wallet.exists('user1');
    if (!userExists) {
      res.json({status: false, error: {message: 'User not exist in the wallet'}});
      return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccpPath, { wallet, identity: 'user1', discovery: { enabled: true, asLocalhost: true } });
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('fabcar');
    await contract.submitTransaction('changeCarColor', req.body.key, req.body.color);
    res.json({status: true, message: 'Transaction (change car color) has been submitted.'})
  } catch (err) {
    res.json({status: false, error: err});
  }
});

router.post('/cars/changebrand', async (req, res) => {
  if ((typeof req.body.key === 'undefined' || req.body.key === '') ||
      (typeof req.body.make === 'undefined' || req.body.make === '')) {
    res.json({status: false, error: {message: 'Missing body.'}});
    return;
  }

  try {
    const walletPath = path.join(process.cwd(),'..','..', 'wallet');
    const wallet = new FileSystemWallet(walletPath);
    const userExists = await wallet.exists('user1');
    if (!userExists) {
      res.json({status: false, error: {message: 'User not exist in the wallet'}});
      return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccpPath, { wallet, identity: 'user1', discovery: { enabled: true, asLocalhost: true } });
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('fabcar');
    await contract.submitTransaction('changeCarBrand', req.body.key, req.body.make);
    res.json({status: true, message: 'Transaction (change car brand) has been submitted.'})
  } catch (err) {
    res.json({status: false, error: err});
  }
});

router.post('/cars/changemodel', async (req, res) => {
  if ((typeof req.body.key === 'undefined' || req.body.key === '') ||
      (typeof req.body.model === 'undefined' || req.body.model === '')) {
    res.json({status: false, error: {message: 'Missing body.'}});
    return;
  }

  try {
    const walletPath = path.join(process.cwd(),'..','..', 'wallet');
    const wallet = new FileSystemWallet(walletPath);
    const userExists = await wallet.exists('user1');
    if (!userExists) {
      res.json({status: false, error: {message: 'User not exist in the wallet'}});
      return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccpPath, { wallet, identity: 'user1', discovery: { enabled: true, asLocalhost: true } });
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('fabcar');
    await contract.submitTransaction('changeCarModel', req.body.key, req.body.model);
    res.json({status: true, message: 'Transaction (change car model) has been submitted.'})
  } catch (err) {
    res.json({status: false, error: err});
  }
});

module.exports = router;
