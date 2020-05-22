//////////////////////////////////////////////////////////////////////////
//////////////////////////     START        //////////////////////////////
//////////////////////////////////////////////////////////////////////////
const fs = require("fs");

// Get the filenames of user1 directory
dir_name = "../wallet/user1/";
const user1_info_dir = fs.readdirSync(dir_name);             

// Assign specific file names on them
const user1_pub_file = dir_name + user1_info_dir[1];

// Read .pem by using "pem-file" package
const user1_pub_pem = fs.readFileSync(user1_pub_file)

var dgram = require('dgram');
var host = "0.0.0.0";

var udp_cli_port = 8080;
var address_cli;
var cli_port;
var cli_family;
var cli_ipaddr;

var udp_sdn_port = 8081;
var address_sdn;
var sdn_port;
var sdn_family;
var sdn_ipaddr;

const crypto = require('crypto');
var rand_buf = crypto.randomBytes(256);
var rand_str = user1_pub_pem.toString() + "," + rand_buf.toString();

var count_cli = 0;
var count_sdn = 0;
var sdn_msg_port;
////////////////////////////////////////////////////////////////////////////
////////////////////////      CLI PART        //////////////////////////////
////////////////////////////////////////////////////////////////////////////

var udpsocket_cli = dgram.createSocket('udp4');
udpsocket_cli.bind(udp_cli_port,host);

udpsocket_cli.on('listening', function() {
    address_cli = udpsocket_cli.address();
    cli_port= address_cli.port;
    cli_family = address_cli.family;
    cli_ipaddr = address_cli.address;
    console.log("listening "+cli_ipaddr+" port::"+cli_port);
});

udpsocket_cli.on('message', function(msg, rinfo) {
    if(count_cli == 0){
        udpsocket_cli.send(rand_str, rinfo.port, host, function(error){
            count_cli ++;
            if(error) {
                udpsocket_cli.close();
            }
            else {
                console.log('Random number has been sent to CLIENT !!!');
            }
        });  
        udpsocket_sdn.send(rand_str, sdn_msg_port, host, function(error){
            count_sdn ++;
            if(error) { 
                udpsocket_sdn.close();
            }
            else {
                console.log('Random number has been sent to SDN!!!');
            }
        });        
                       
    }
});

// emits when any error occurs
udpsocket_cli.on('error',function(error){
    console.log('Error: ' + error);
    udpsocket_cli.close();
});

//emits after the udpsocket_cli is closed using udpsocket_cli.close();
udpsocket_cli.on('close',function(){
    console.log('udpsocket_cli is closed !');
});

////////////////////////////////////////////////////////////////////////////
////////////////////////      SDN PART        //////////////////////////////
////////////////////////////////////////////////////////////////////////////

var udpsocket_sdn = dgram.createSocket('udp4');
udpsocket_sdn.bind(udp_sdn_port,host);

udpsocket_sdn.on('listening', function() {
    address_sdn = udpsocket_sdn.address();
    sdn_port= address_sdn.port;
    sdn_family = address_sdn.family;
    sdn_ipaddr = address_sdn.address;
    console.log("listening "+sdn_ipaddr+" port::"+sdn_port);    
});

udpsocket_sdn.on('message', function(msg, rinfo) {

    sdn_msg_port = rinfo.port;

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

//////////////////////////////////////////////////////////////////////////
//////////////////////////     END        ////////////////////////////////
//////////////////////////////////////////////////////////////////////////