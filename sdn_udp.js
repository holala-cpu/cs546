	
	/////////////////////////////////////////////////////////////
	////////////////////    SDN-SERVER PART   ///////////////////
	/////////////////////////////////////////////////////////////
	var host = "0.0.0.0";
	const crypto = require('crypto');
	var net = require('net'); 
	var udp = require('dgram');
	var sdn = udp.createSocket('udp4');
	var port = 8081;
	var data_cnt = 0;
	var data;
	var usr1_pub_pem;
	var time = 100;
	var token;

	sdn.on('message',function(msg, info){  
		if(data_cnt == 1){
			console.log('Random number token has been received from SERVER ! ');
			var token_tot = msg.toString().split(",");
			usr1_pub_pem = token_tot[0];
			token = token_tot[1];
			data_cnt++;
		}
	});

	if(data_cnt == 0){
		//buffer msg
		data = Buffer.from('This is SDN');
		sdn.send(data, port, host, function(error){
			data_cnt ++;   
			if(error){
				sdn.close();
			}
			else{
				console.log('Initial message has been sent to SERVER !!!');
			}
		});    
	}

	////////////////////////////////////////////////////////////////////
	////////////////////// SDN - CLIENT PART ///////////////////////////
	////////////////////////////////////////////////////////////////////
	var dgram = require('dgram');
	var udp_sdn_port = 50007;
	var address_sdn;
	var sdn_port;
	var sdn_family;
	var sdn_ipaddr;
	var count_sdn = 0;
	var udpsocket_sdn = dgram.createSocket('udp4');
	var sig_pub;
	udpsocket_sdn.bind(udp_sdn_port,host);

	udpsocket_sdn.on('listening', function() {
		address_sdn = udpsocket_sdn.address();
		sdn_port= address_sdn.port;
		sdn_family = address_sdn.family;
		sdn_ipaddr = address_sdn.address;
		console.log("listening "+sdn_ipaddr+" port::"+sdn_port);    
	});

	udpsocket_sdn.on('message', function(msg, rinfo) {
		count_sdn = count_sdn + 1;
		if(count_sdn == 1){
			console.log('Signature data received from CLIENT !!');
			sig_pub = msg.toString();
		} 
		else if (count_sdn == 2){
			console.log('Public key data received from CLIENT !! ');
			var pub = msg;
			var message = token + "," + rinfo.address + "," + time + "," + pub;
			const verify = crypto.createVerify('SHA256');
			verify.write(message);
			verify.end();
			var isGood = verify.verify(pub, sig_pub, 'hex');
			if(isGood){  
				var dataCli = "OK"
				udpsocket_sdn.send(dataCli, rinfo.port, rinfo.address, function(error){ 
					if(error){
						sdn.close();
					}
					else{
						console.log('Authorization Data has been sent to client !');
					}
				}); 
				console.log('All Good');  
				///////////////////////////////////////////////////////////////////////////////
				/////////////////////////////// SDN - POX PART START //////////////////////////
				///////////////////////////////////////////////////////////////////////////////

				var sv_pox_cli_sdn = new net.Socket();
				var pox_port = 50007; 
				var pox_host = "192.168.43.25";  
				
				sv_pox_cli_sdn.connect(pox_port, pox_host, () => { 
					sv_pox_cli_sdn.write("This is SDN !"); 
				}); 
				
				sv_pox_cli_sdn.on('data', (msg) => {     
					console.log('Data has been received from POX ! ');
				
				}); 
				
				sv_pox_cli_sdn.on('close', () => { 
					console.log('SDN Closed !'); 
				}); 
				
				sv_pox_cli_sdn.on('error', (err) => { 
					console.error(err); 
				});  
				
				///////////////////////////////////////////////////////////////////////////////
				/////////////////////////////// SDN - POX PART END ////////////////////////////
				///////////////////////////////////////////////////////////////////////////////             
			}
			else {
				var dataCli = "Nope"
				udpsocket_sdn.send(dataCli, rinfo.port, rinfo.address, function(error){ 
					if(error){
						sdn.close();
					}
					else{
						console.log('No OK !!!');
					}
				});             
				console.log('Nope !');
			}          
		}
	});

	// emits when any error occurs
	udpsocket_sdn.on('error',function(error){
		console.log('Error: ' + error);
		udpsocket_sdn.close();
	});

	//emits after the udpsocket_sdn is closed using udpsocket_sdn.close();
	udpsocket_sdn.on('close',function(){
		console.log('udpsocket_sdn is closed !');
	});


